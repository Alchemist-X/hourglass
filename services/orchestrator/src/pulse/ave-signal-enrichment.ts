/**
 * AVE Signal Enrichment for Polymarket Prediction Markets.
 *
 * This module bridges the AVE Claw on-chain monitoring layer with the
 * Polymarket prediction market pipeline. It takes Polymarket pulse
 * candidates (from market-pulse.ts) and enriches each one with relevant
 * on-chain signals from AVE -- token prices, volume data, contract
 * security assessments, and detected anomalies.
 *
 * The enriched candidates give the AI decision engine a significant
 * informational edge: on-chain data that most prediction market
 * participants do not factor into their probability estimates.
 */

import type { PulseCandidate } from "./market-pulse.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AveSignal {
  /** The type of on-chain signal detected */
  type:
    | "price_movement"
    | "volume_spike"
    | "whale_activity"
    | "contract_risk"
    | "trending"
    | "anomaly";
  /** Human-readable description of the signal */
  description: string;
  /** Numeric strength of the signal (0 to 1) */
  strength: number;
  /** Which token this signal relates to */
  tokenSymbol: string;
  /** Which chain the signal was detected on */
  chain: string;
  /** ISO timestamp when the signal was detected */
  detectedAt: string;
  /** Raw data backing this signal */
  rawData?: Record<string, unknown>;
}

export interface AveContractRiskSummary {
  riskLevel: string;
  isHoneypot: boolean;
  hasMintFunction: boolean;
  isOpenSource: boolean;
  buyTax: number;
  sellTax: number;
  lpLocked: boolean;
}

export interface AvePriceContext {
  price: number;
  change24h: number;
  volume24h: number;
}

export interface EnrichedPulseCandidate extends PulseCandidate {
  /** Relevant on-chain signals from AVE */
  aveSignals: AveSignal[];
  /** Contract risk assessment for mentioned tokens */
  aveRiskAssessment?: AveContractRiskSummary;
  /** Price context from AVE for the primary related token */
  avePriceContext?: AvePriceContext;
  /** Detected on-chain anomalies relevant to this market */
  aveAnomalies?: string[];
}

export interface AveEnrichmentConfig {
  /** Chains to query for on-chain data */
  chains?: string[];
  /** Max number of AVE tokens to search per candidate */
  maxTokensPerCandidate?: number;
}

// ---------------------------------------------------------------------------
// AVE API interaction types (self-contained to avoid cross-package deps)
// ---------------------------------------------------------------------------

interface AveApiResponse<T> {
  status: number;
  msg: string;
  data: T;
}

interface AveSearchToken {
  token_address?: string;
  chain?: string;
  token_name?: string;
  token_symbol?: string;
  price_usd?: number;
  price_change_24h?: number;
  tx_volume_u_24h?: number;
  market_cap?: number;
  main_pair_tvl?: number;
}

interface AveContractRiskRaw {
  risk_level?: string;
  is_honeypot?: boolean;
  has_mint_function?: boolean;
  is_open_source?: boolean;
  buy_tax?: number;
  sell_tax?: number;
  lp_locked?: boolean;
}

// ---------------------------------------------------------------------------
// AVE client interface (decoupled from concrete implementation)
// ---------------------------------------------------------------------------

/**
 * Minimal interface for AVE API access needed by the enrichment module.
 * This can be satisfied by the full AveClient from @autopoly/ave-monitor
 * or by a lightweight adapter.
 */
export interface AveEnrichmentClient {
  searchTokens(params: {
    keyword?: string;
    chain?: string;
    limit?: number;
  }): Promise<AveSearchToken[]>;

  getContractSecurity?(tokenId: string): Promise<AveContractRiskRaw | null>;
}

// ---------------------------------------------------------------------------
// Crypto keyword extraction
// ---------------------------------------------------------------------------

/**
 * Well-known crypto token name-to-symbol mappings.
 * Used to extract relevant AVE search terms from prediction market
 * questions about crypto assets.
 */
const CRYPTO_KEYWORD_MAP: ReadonlyMap<string, string[]> = new Map([
  ["bitcoin", ["BTC", "WBTC"]],
  ["btc", ["BTC", "WBTC"]],
  ["ethereum", ["ETH", "WETH"]],
  ["eth", ["ETH", "WETH"]],
  ["solana", ["SOL"]],
  ["sol", ["SOL"]],
  ["cardano", ["ADA"]],
  ["ada", ["ADA"]],
  ["polygon", ["MATIC", "POL"]],
  ["matic", ["MATIC", "POL"]],
  ["avalanche", ["AVAX"]],
  ["avax", ["AVAX"]],
  ["chainlink", ["LINK"]],
  ["link", ["LINK"]],
  ["dogecoin", ["DOGE"]],
  ["doge", ["DOGE"]],
  ["shiba", ["SHIB"]],
  ["shib", ["SHIB"]],
  ["xrp", ["XRP"]],
  ["ripple", ["XRP"]],
  ["polkadot", ["DOT"]],
  ["dot", ["DOT"]],
  ["uniswap", ["UNI"]],
  ["uni", ["UNI"]],
  ["aave", ["AAVE"]],
  ["maker", ["MKR"]],
  ["mkr", ["MKR"]],
  ["curve", ["CRV"]],
  ["crv", ["CRV"]],
  ["arbitrum", ["ARB"]],
  ["arb", ["ARB"]],
  ["optimism", ["OP"]],
  ["pepe", ["PEPE"]],
  ["worldcoin", ["WLD"]],
  ["wld", ["WLD"]],
  ["render", ["RNDR"]],
  ["rndr", ["RNDR"]],
  ["fetch", ["FET"]],
  ["fet", ["FET"]],
  ["bnb", ["BNB"]],
  ["binance", ["BNB"]],
  ["tron", ["TRX"]],
  ["trx", ["TRX"]],
  ["cosmos", ["ATOM"]],
  ["atom", ["ATOM"]],
  ["near", ["NEAR"]],
  ["sui", ["SUI"]],
  ["aptos", ["APT"]],
  ["apt", ["APT"]],
]);

/**
 * Crypto-related topic keywords that indicate a market may benefit from
 * on-chain data enrichment, even if no specific token is mentioned.
 */
const CRYPTO_TOPIC_KEYWORDS: readonly string[] = [
  "crypto",
  "defi",
  "nft",
  "blockchain",
  "on-chain",
  "onchain",
  "tvl",
  "total value locked",
  "staking",
  "yield",
  "liquidity",
  "dex",
  "cex",
  "exchange",
  "etf",
  "spot etf",
  "mining",
  "halving",
  "gas fees",
  "layer 2",
  "l2",
  "rollup",
  "bridge",
  "token",
  "coin",
  "wallet",
  "whale",
];

/**
 * Extract crypto-related keywords from a prediction market question.
 *
 * Returns an array of token symbols to search for on AVE, plus a
 * boolean indicating whether the question is crypto-related at all.
 */
export function extractCryptoKeywords(question: string): {
  tokenSymbols: string[];
  isCryptoRelated: boolean;
} {
  const lowerQuestion = question.toLowerCase();
  const foundSymbols = new Set<string>();

  // Check for direct token name/symbol mentions
  for (const [keyword, symbols] of CRYPTO_KEYWORD_MAP) {
    // Match as whole word to avoid false positives
    const pattern = new RegExp(`\\b${keyword}\\b`, "i");
    if (pattern.test(lowerQuestion)) {
      for (const symbol of symbols) {
        foundSymbols.add(symbol);
      }
    }
  }

  // Check for ticker-style mentions like $BTC, $ETH
  const tickerPattern = /\$([A-Z]{2,10})/g;
  let tickerMatch: RegExpExecArray | null;
  while ((tickerMatch = tickerPattern.exec(question)) !== null) {
    const ticker = tickerMatch[1];
    if (ticker) {
      foundSymbols.add(ticker);
    }
  }

  // Determine if the question is crypto-related
  const isCryptoRelated =
    foundSymbols.size > 0 ||
    CRYPTO_TOPIC_KEYWORDS.some((keyword) =>
      lowerQuestion.includes(keyword)
    );

  return {
    tokenSymbols: Array.from(foundSymbols),
    isCryptoRelated,
  };
}

// ---------------------------------------------------------------------------
// AVE data fetching helpers
// ---------------------------------------------------------------------------

const SEARCH_TIMEOUT_MS = 15_000;
const DEFAULT_CHAINS = ["ethereum", "bsc", "polygon", "base", "solana"];

async function searchAveForSymbol(
  client: AveEnrichmentClient,
  symbol: string,
  chains: string[]
): Promise<AveSearchToken[]> {
  const results: AveSearchToken[] = [];

  const chainResults = await Promise.allSettled(
    chains.map(async (chain) => {
      try {
        const tokens = await client.searchTokens({
          keyword: symbol,
          chain,
          limit: 5,
        });
        return tokens;
      } catch {
        return [];
      }
    })
  );

  for (const result of chainResults) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    }
  }

  return results;
}

function buildSignalsFromSearchResults(
  tokens: AveSearchToken[],
  searchSymbol: string
): AveSignal[] {
  const signals: AveSignal[] = [];
  const now = new Date().toISOString();

  for (const token of tokens) {
    const symbol = token.token_symbol ?? searchSymbol;
    const chain = token.chain ?? "unknown";
    const price = token.price_usd ?? 0;
    const change24h = token.price_change_24h ?? 0;
    const volume = token.tx_volume_u_24h ?? 0;

    // Price movement signal
    if (Math.abs(change24h) > 0.05) {
      signals.push({
        type: "price_movement",
        description: `${symbol} on ${chain}: ${change24h > 0 ? "+" : ""}${(change24h * 100).toFixed(1)}% in 24h (price: $${price.toFixed(4)})`,
        strength: Math.min(1, Math.abs(change24h) / 0.5),
        tokenSymbol: symbol,
        chain,
        detectedAt: now,
        rawData: { price, change24h, volume },
      });
    }

    // Volume spike signal (high volume relative to market cap)
    if (volume > 1_000_000) {
      const volumeStrength = Math.min(1, volume / 100_000_000);
      signals.push({
        type: "volume_spike",
        description: `${symbol} on ${chain}: $${(volume / 1_000_000).toFixed(1)}M 24h volume`,
        strength: volumeStrength,
        tokenSymbol: symbol,
        chain,
        detectedAt: now,
        rawData: { volume, marketCap: token.market_cap },
      });
    }
  }

  return signals;
}

function buildPriceContext(
  tokens: AveSearchToken[]
): AvePriceContext | undefined {
  // Use the token with the highest volume as the primary price context
  const sorted = [...tokens]
    .filter((t) => (t.price_usd ?? 0) > 0)
    .sort((a, b) => (b.tx_volume_u_24h ?? 0) - (a.tx_volume_u_24h ?? 0));

  const primary = sorted[0];
  if (!primary) return undefined;

  return {
    price: primary.price_usd ?? 0,
    change24h: primary.price_change_24h ?? 0,
    volume24h: primary.tx_volume_u_24h ?? 0,
  };
}

function detectAnomalies(
  tokens: AveSearchToken[],
  riskData?: AveContractRiskRaw | null
): string[] {
  const anomalies: string[] = [];

  for (const token of tokens) {
    const change = token.price_change_24h ?? 0;
    const symbol = token.token_symbol ?? "UNKNOWN";

    // Extreme price movement
    if (Math.abs(change) > 0.2) {
      anomalies.push(
        `${symbol}: Extreme ${change > 0 ? "pump" : "dump"} of ${(change * 100).toFixed(1)}% in 24h`
      );
    }

    // Suspiciously low liquidity relative to volume
    const volume = token.tx_volume_u_24h ?? 0;
    const liquidity = token.main_pair_tvl ?? 0;
    if (volume > 0 && liquidity > 0 && volume / liquidity > 50) {
      anomalies.push(
        `${symbol}: Volume/liquidity ratio is ${(volume / liquidity).toFixed(0)}x (potential wash trading)`
      );
    }
  }

  // Contract risk anomalies
  if (riskData) {
    if (riskData.is_honeypot === true) {
      anomalies.push("CRITICAL: Token identified as honeypot by AVE contract analysis");
    }
    if (riskData.has_mint_function === true) {
      anomalies.push("WARNING: Token contract has mint function (inflation risk)");
    }
    if ((riskData.buy_tax ?? 0) + (riskData.sell_tax ?? 0) > 0.1) {
      anomalies.push(
        `WARNING: High transaction taxes (buy: ${((riskData.buy_tax ?? 0) * 100).toFixed(1)}%, sell: ${((riskData.sell_tax ?? 0) * 100).toFixed(1)}%)`
      );
    }
  }

  return anomalies;
}

function transformContractRisk(
  raw: AveContractRiskRaw
): AveContractRiskSummary {
  return {
    riskLevel: raw.risk_level ?? "unknown",
    isHoneypot: raw.is_honeypot === true,
    hasMintFunction: raw.has_mint_function === true,
    isOpenSource: raw.is_open_source === true,
    buyTax: raw.buy_tax ?? 0,
    sellTax: raw.sell_tax ?? 0,
    lpLocked: raw.lp_locked === true,
  };
}

// ---------------------------------------------------------------------------
// Main enrichment function
// ---------------------------------------------------------------------------

/**
 * Enrich Polymarket pulse candidates with AVE on-chain signals.
 *
 * For each prediction market candidate, this function:
 * 1. Extracts crypto-related keywords from the market question
 * 2. Queries AVE for matching on-chain token data
 * 3. Fetches contract risk assessments for relevant tokens
 * 4. Detects on-chain anomalies (price spikes, wash trading, honeypots)
 * 5. Returns enriched candidates with AVE signal context
 *
 * Non-crypto markets pass through unchanged (with empty signals array).
 */
export async function enrichWithAveSignals(
  candidates: PulseCandidate[],
  aveClient: AveEnrichmentClient,
  config?: AveEnrichmentConfig
): Promise<EnrichedPulseCandidate[]> {
  const chains = config?.chains ?? DEFAULT_CHAINS;
  const maxTokensPerCandidate = config?.maxTokensPerCandidate ?? 3;

  const enrichmentResults = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const { tokenSymbols, isCryptoRelated } = extractCryptoKeywords(
        candidate.question
      );

      // Non-crypto markets get a pass-through with empty signals
      if (!isCryptoRelated || tokenSymbols.length === 0) {
        return {
          ...candidate,
          aveSignals: [],
        } satisfies EnrichedPulseCandidate;
      }

      // Limit the number of tokens we search for
      const searchSymbols = tokenSymbols.slice(0, maxTokensPerCandidate);

      // Search AVE for each relevant token symbol
      const allTokenResults: AveSearchToken[] = [];
      const searchResults = await Promise.allSettled(
        searchSymbols.map((symbol) =>
          searchAveForSymbol(aveClient, symbol, chains)
        )
      );

      for (const result of searchResults) {
        if (result.status === "fulfilled") {
          allTokenResults.push(...result.value);
        }
      }

      // Build signals from search results
      const signals: AveSignal[] = [];
      for (const symbol of searchSymbols) {
        const symbolTokens = allTokenResults.filter(
          (t) =>
            (t.token_symbol ?? "").toUpperCase() === symbol.toUpperCase()
        );
        signals.push(
          ...buildSignalsFromSearchResults(symbolTokens, symbol)
        );
      }

      // Fetch contract risk for the highest-volume token
      let riskData: AveContractRiskRaw | null = null;
      let riskAssessment: AveContractRiskSummary | undefined;

      const topToken = [...allTokenResults]
        .filter((t) => t.token_address && t.chain)
        .sort(
          (a, b) => (b.tx_volume_u_24h ?? 0) - (a.tx_volume_u_24h ?? 0)
        )[0];

      if (topToken?.token_address && topToken?.chain && aveClient.getContractSecurity) {
        const tokenId = `${topToken.token_address}-${topToken.chain}`;
        try {
          riskData = await aveClient.getContractSecurity(tokenId);
          if (riskData) {
            riskAssessment = transformContractRisk(riskData);

            // Add contract risk as a signal
            signals.push({
              type: "contract_risk",
              description: `Contract risk level: ${riskData.risk_level ?? "unknown"} (honeypot: ${riskData.is_honeypot ? "YES" : "no"}, mint: ${riskData.has_mint_function ? "YES" : "no"})`,
              strength: riskData.risk_level === "high" || riskData.risk_level === "critical" ? 0.9 : 0.3,
              tokenSymbol: topToken.token_symbol ?? searchSymbols[0] ?? "UNKNOWN",
              chain: topToken.chain ?? "unknown",
              detectedAt: new Date().toISOString(),
              rawData: riskData as unknown as Record<string, unknown>,
            });
          }
        } catch {
          // Contract security fetch failed -- continue without risk data
        }
      }

      // Build price context from search results
      const priceContext = buildPriceContext(allTokenResults);

      // Detect anomalies
      const anomalies = detectAnomalies(allTokenResults, riskData);

      return {
        ...candidate,
        aveSignals: signals,
        aveRiskAssessment: riskAssessment,
        avePriceContext: priceContext,
        aveAnomalies: anomalies.length > 0 ? anomalies : undefined,
      } satisfies EnrichedPulseCandidate;
    })
  );

  // Collect results, falling back to unenriched candidates on error
  return enrichmentResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // Enrichment failed for this candidate -- pass through unchanged
    return {
      ...candidates[index]!,
      aveSignals: [],
    };
  });
}

// ---------------------------------------------------------------------------
// Utility: summarize enrichment results for logging
// ---------------------------------------------------------------------------

export function summarizeEnrichment(
  enriched: EnrichedPulseCandidate[]
): {
  totalCandidates: number;
  cryptoRelated: number;
  withSignals: number;
  withRiskAssessment: number;
  withAnomalies: number;
  totalSignals: number;
} {
  return {
    totalCandidates: enriched.length,
    cryptoRelated: enriched.filter((c) => c.aveSignals.length > 0).length,
    withSignals: enriched.filter((c) => c.aveSignals.length > 0).length,
    withRiskAssessment: enriched.filter((c) => c.aveRiskAssessment != null).length,
    withAnomalies: enriched.filter((c) => c.aveAnomalies != null && c.aveAnomalies.length > 0).length,
    totalSignals: enriched.reduce((sum, c) => sum + c.aveSignals.length, 0),
  };
}
