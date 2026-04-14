/**
 * AVE Crypto Signal Aggregation Module
 *
 * Combines 4 AVE Skills (real-time price, K-line analysis, whale tracking,
 * buy/sell ratio) into a single composite trading signal for BTC and ETH.
 *
 * Each component produces a score in the range [-1, +1]:
 *   - trendScore:     MA20/MA50 cross + price position analysis
 *   - whalePressure:  net buy/sell ratio from large (>$100K) transactions
 *   - sentimentScore: weighted buy/sell count ratio across 5m/1h/6h windows
 *
 * The overall score is a weighted combination:
 *   overallScore = trendScore * 0.4 + whalePressure * 0.3 + sentimentScore * 0.3
 *
 * When an AVE call fails, that component scores 0 (neutral) and the
 * remaining components are re-weighted proportionally so the result
 * is always a valid CryptoSignal.
 */

import type { AveClient } from "@autopoly/ave-monitor";
import type { MockAveClient } from "@autopoly/ave-monitor";
import type { AveKline, AveTransaction, AveTokenDetail } from "@autopoly/ave-monitor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KlineDetails {
  readonly ma20: number;
  readonly ma50: number;
  readonly macdSignal: string;
  readonly volatility: number;
}

export interface WhaleDetails {
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly netRatio: number;
  readonly largeTradeCount: number;
}

export interface SentimentDetails {
  readonly buy5m: number;
  readonly sell5m: number;
  readonly buy1h: number;
  readonly sell1h: number;
  readonly buy6h: number;
  readonly sell6h: number;
}

export interface CryptoSignalDetails {
  readonly klines: KlineDetails;
  readonly whales: WhaleDetails;
  readonly sentiment: SentimentDetails;
}

export interface CryptoSignal {
  readonly token: string;
  readonly tokenId: string;
  readonly price: number;
  readonly trendScore: number;
  readonly whalePressure: number;
  readonly sentimentScore: number;
  readonly overallScore: number;
  readonly details: CryptoSignalDetails;
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Token registry -- maps human-readable names to AVE identifiers
// ---------------------------------------------------------------------------

interface TokenConfig {
  readonly symbol: string;
  readonly tokenId: string;
  readonly pairId: string;
}

const TOKEN_REGISTRY: ReadonlyMap<string, TokenConfig> = new Map([
  [
    "BTC",
    {
      symbol: "BTC",
      // WBTC on Ethereum -- the primary BTC representation tracked by AVE
      tokenId: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      pairId: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    },
  ],
  [
    "ETH",
    {
      symbol: "ETH",
      // WETH on Ethereum
      tokenId: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      pairId: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    },
  ],
]);

const DEFAULT_TOKENS = ["BTC", "ETH"];

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function safeRatio(a: number, b: number): number {
  const total = a + b;
  if (total === 0) return 0;
  return (a - b) / total;
}

// ---------------------------------------------------------------------------
// Component weights (for re-weighting on partial failure)
// ---------------------------------------------------------------------------

interface ComponentWeights {
  readonly trend: number;
  readonly whale: number;
  readonly sentiment: number;
}

const BASE_WEIGHTS: ComponentWeights = {
  trend: 0.4,
  whale: 0.3,
  sentiment: 0.3,
};

function reweightForFailures(
  trendOk: boolean,
  whaleOk: boolean,
  sentimentOk: boolean
): ComponentWeights {
  const active = {
    trend: trendOk ? BASE_WEIGHTS.trend : 0,
    whale: whaleOk ? BASE_WEIGHTS.whale : 0,
    sentiment: sentimentOk ? BASE_WEIGHTS.sentiment : 0,
  };

  const totalActive = active.trend + active.whale + active.sentiment;

  if (totalActive === 0) {
    return { trend: 0, whale: 0, sentiment: 0 };
  }

  return {
    trend: active.trend / totalActive,
    whale: active.whale / totalActive,
    sentiment: active.sentiment / totalActive,
  };
}

// ---------------------------------------------------------------------------
// K-line analysis (trendScore)
// ---------------------------------------------------------------------------

interface TrendResult {
  readonly score: number;
  readonly details: KlineDetails;
}

function computeTrendScore(
  klines: readonly AveKline[],
  currentPrice: number
): TrendResult {
  if (klines.length === 0) {
    return {
      score: 0,
      details: { ma20: 0, ma50: 0, macdSignal: "neutral", volatility: 0 },
    };
  }

  const closes = klines.map((k) => k.close);

  // MA20: average of last 20 closes
  const last20 = closes.slice(-20);
  const ma20 = average(last20);

  // MA50: average of last 50 closes (or all available)
  const last50 = closes.slice(-50);
  const ma50 = average(last50);

  // Volatility: standard deviation of returns
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev !== undefined && curr !== undefined && prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }
  const avgReturn = average(returns);
  const variance =
    returns.length > 0
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        returns.length
      : 0;
  const volatility = Math.sqrt(variance);

  // Score components
  let score = 0;

  // Price vs MA20
  if (currentPrice > ma20 && ma20 > 0) {
    score += 0.5;
  } else if (currentPrice < ma20 && ma20 > 0) {
    score -= 0.5;
  }

  // Price vs MA50
  if (currentPrice > ma50 && ma50 > 0) {
    score += 0.3;
  } else if (currentPrice < ma50 && ma50 > 0) {
    score -= 0.3;
  }

  // MA20 vs MA50 (golden cross / death cross trend)
  if (ma20 > ma50 && ma50 > 0) {
    score += 0.2;
  } else if (ma20 < ma50 && ma50 > 0) {
    score -= 0.2;
  }

  // MACD signal determination
  const macdSignal =
    score > 0.3 ? "bullish" : score < -0.3 ? "bearish" : "neutral";

  return {
    score: clamp(score, -1, 1),
    details: {
      ma20: Math.round(ma20 * 100) / 100,
      ma50: Math.round(ma50 * 100) / 100,
      macdSignal,
      volatility: Math.round(volatility * 10000) / 10000,
    },
  };
}

// ---------------------------------------------------------------------------
// Whale tracking (whalePressure)
// ---------------------------------------------------------------------------

const WHALE_THRESHOLD_USD = 100_000;

interface WhaleResult {
  readonly score: number;
  readonly details: WhaleDetails;
}

function computeWhalePressure(
  transactions: readonly AveTransaction[]
): WhaleResult {
  const largeTxs = transactions.filter(
    (tx) => (tx.amount_usd ?? 0) > WHALE_THRESHOLD_USD
  );

  if (largeTxs.length === 0) {
    return {
      score: 0,
      details: { buyVolume: 0, sellVolume: 0, netRatio: 0, largeTradeCount: 0 },
    };
  }

  let buyVolume = 0;
  let sellVolume = 0;

  for (const tx of largeTxs) {
    const amount = tx.amount_usd ?? 0;
    if (tx.side === "buy") {
      buyVolume += amount;
    } else if (tx.side === "sell") {
      sellVolume += amount;
    }
  }

  const netRatio = safeRatio(buyVolume, sellVolume);

  return {
    score: clamp(netRatio, -1, 1),
    details: {
      buyVolume: Math.round(buyVolume),
      sellVolume: Math.round(sellVolume),
      netRatio: Math.round(netRatio * 10000) / 10000,
      largeTradeCount: largeTxs.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Buy/sell ratio sentiment (sentimentScore)
// ---------------------------------------------------------------------------

interface SentimentResult {
  readonly score: number;
  readonly details: SentimentDetails;
}

function computeSentimentScore(detail: AveTokenDetail): SentimentResult {
  const buy5m = detail.buy_count_5m ?? 0;
  const sell5m = detail.sell_count_5m ?? 0;
  const buy1h = detail.buy_count_1h ?? 0;
  const sell1h = detail.sell_count_1h ?? 0;
  const buy6h = detail.buy_count_6h ?? 0;
  const sell6h = detail.sell_count_6h ?? 0;

  // Weighted score across time windows
  const score5m = safeRatio(buy5m, sell5m) * 0.3;
  const score1h = safeRatio(buy1h, sell1h) * 0.4;
  const score6h = safeRatio(buy6h, sell6h) * 0.3;

  const rawScore = score5m + score1h + score6h;

  return {
    score: clamp(rawScore, -1, 1),
    details: { buy5m, sell5m, buy1h, sell1h, buy6h, sell6h },
  };
}

// ---------------------------------------------------------------------------
// Single-token signal generation
// ---------------------------------------------------------------------------

type AveClientLike = AveClient | MockAveClient;

async function generateSignalForToken(
  client: AveClientLike,
  config: TokenConfig
): Promise<CryptoSignal> {
  const now = new Date().toISOString();

  // ----- 1. Fetch current price -----
  let price = 0;
  try {
    const prices = await client.getTokenPrices([config.tokenId]);
    const priceEntry = prices[0];
    if (priceEntry) {
      price = priceEntry.price;
    }
  } catch (err) {
    console.warn(
      `[ave-crypto-signals] Failed to fetch price for ${config.symbol}:`,
      err instanceof Error ? err.message : err
    );
  }

  // ----- 2. K-line analysis (trendScore) -----
  let trendOk = false;
  let trendResult: TrendResult = {
    score: 0,
    details: { ma20: 0, ma50: 0, macdSignal: "neutral", volatility: 0 },
  };

  try {
    // Fetch 1h candles (50 periods) for short-term trend
    const hourlyKlines = await client.getKlines(config.tokenId, {
      interval: 60,
      limit: 50,
    });

    // Fetch daily candles (50 periods) for long-term trend
    const dailyKlines = await client.getKlines(config.tokenId, {
      interval: 1440,
      limit: 50,
    });

    // Use the longer timeframe for MA calculations (more reliable),
    // falling back to hourly if daily is unavailable
    const klinesToAnalyze =
      dailyKlines.length >= 20 ? dailyKlines : hourlyKlines;

    const effectivePrice = price > 0 ? price : (klinesToAnalyze[klinesToAnalyze.length - 1]?.close ?? 0);
    trendResult = computeTrendScore(klinesToAnalyze, effectivePrice);
    trendOk = true;
  } catch (err) {
    console.warn(
      `[ave-crypto-signals] Failed to fetch klines for ${config.symbol}:`,
      err instanceof Error ? err.message : err
    );
  }

  // ----- 3. Whale tracking (whalePressure) -----
  let whaleOk = false;
  let whaleResult: WhaleResult = {
    score: 0,
    details: { buyVolume: 0, sellVolume: 0, netRatio: 0, largeTradeCount: 0 },
  };

  try {
    const transactions = await client.getTransactions(config.pairId, {
      limit: 100,
    });
    whaleResult = computeWhalePressure(transactions);
    whaleOk = true;
  } catch (err) {
    console.warn(
      `[ave-crypto-signals] Failed to fetch transactions for ${config.symbol}:`,
      err instanceof Error ? err.message : err
    );
  }

  // ----- 4. Buy/sell ratio sentiment -----
  let sentimentOk = false;
  let sentimentResult: SentimentResult = {
    score: 0,
    details: { buy5m: 0, sell5m: 0, buy1h: 0, sell1h: 0, buy6h: 0, sell6h: 0 },
  };

  try {
    const tokenDetail = await client.getTokenDetail(config.tokenId);
    sentimentResult = computeSentimentScore(tokenDetail);
    sentimentOk = true;

    // If price was not available from the price endpoint, use token detail
    if (price === 0 && tokenDetail.price != null) {
      price = tokenDetail.price;
    }
  } catch (err) {
    console.warn(
      `[ave-crypto-signals] Failed to fetch token detail for ${config.symbol}:`,
      err instanceof Error ? err.message : err
    );
  }

  // ----- 5. Compute overall score with re-weighting -----
  const weights = reweightForFailures(trendOk, whaleOk, sentimentOk);

  const overallScore = clamp(
    trendResult.score * weights.trend +
      whaleResult.score * weights.whale +
      sentimentResult.score * weights.sentiment,
    -1,
    1
  );

  return {
    token: config.symbol,
    tokenId: config.tokenId,
    price,
    trendScore: trendResult.score,
    whalePressure: whaleResult.score,
    sentimentScore: sentimentResult.score,
    overallScore: Math.round(overallScore * 10000) / 10000,
    details: {
      klines: trendResult.details,
      whales: whaleResult.details,
      sentiment: sentimentResult.details,
    },
    timestamp: now,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate aggregated crypto trading signals for the specified tokens
 * (defaults to BTC and ETH).
 *
 * Each signal combines 4 AVE Skills:
 *   1. Real-time price
 *   2. K-line technical analysis (MA20, MA50, MACD)
 *   3. Whale transaction tracking (>$100K trades)
 *   4. Buy/sell ratio sentiment (5m, 1h, 6h windows)
 *
 * If any AVE call fails for a token, that component scores 0 and the
 * remaining components are proportionally re-weighted. The function
 * always returns a valid CryptoSignal for each requested token.
 */
export async function generateCryptoSignals(
  client: AveClient | MockAveClient,
  tokens?: string[]
): Promise<CryptoSignal[]> {
  const requestedTokens = tokens ?? DEFAULT_TOKENS;

  const signalPromises = requestedTokens.map(async (tokenName) => {
    const config = TOKEN_REGISTRY.get(tokenName.toUpperCase());
    if (!config) {
      console.warn(
        `[ave-crypto-signals] Unknown token "${tokenName}", skipping`
      );
      return null;
    }
    return generateSignalForToken(client, config);
  });

  const results = await Promise.allSettled(signalPromises);

  const signals: CryptoSignal[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== null) {
      signals.push(result.value);
    } else if (result.status === "rejected") {
      console.warn(
        "[ave-crypto-signals] Signal generation failed for a token:",
        result.reason instanceof Error ? result.reason.message : result.reason
      );
    }
  }

  return signals;
}
