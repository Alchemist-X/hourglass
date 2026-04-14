/**
 * Static data configs for the 4 AVE Skill cards.
 *
 * Based on realistic BTC data around April 2026.
 * Signal values and weights match ave-crypto-signals.ts:
 *   overallScore = trendScore * 0.4 + whalePressure * 0.3 + sentimentScore * 0.3
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OhlcCandle {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly timestamp: string;
}

export interface WhaleTransaction {
  readonly hash: string;
  readonly side: "buy" | "sell";
  readonly amountUsd: number;
  readonly source: string;
  readonly timestamp: string;
}

export interface BuySellTimeframe {
  readonly label: string;
  readonly buyCount: number;
  readonly sellCount: number;
  readonly ratio: number;
}

export interface PriceCardData {
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly changeNeeded: string;
  readonly priceHistory: readonly number[];
}

export interface KlineCardData {
  readonly ma20: number;
  readonly ma50: number;
  readonly macdSignal: string;
  readonly volatility: number;
  readonly klineData: readonly OhlcCandle[];
}

export interface WhaleCardData {
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly netRatio: number;
  readonly largeTradeCount: number;
  readonly transactions: readonly WhaleTransaction[];
}

export interface RatioCardData {
  readonly timeframes: readonly BuySellTimeframe[];
}

export type SkillCardType = "data" | "signal";

export interface SkillCardConfig<T = unknown> {
  readonly id: string;
  readonly title: string;
  readonly type: SkillCardType;
  readonly emoji: string;
  readonly apiEndpoint: string;
  readonly data: T;
  readonly signalValue: number;
  readonly signalLabel: string;
  readonly weight: number;
}

// ---------------------------------------------------------------------------
// OHLC candle generation — 30 realistic BTC daily candles
// ---------------------------------------------------------------------------

function generateKlineCandles(): readonly OhlcCandle[] {
  const basePrice = 91_000;
  const baseDate = new Date("2026-03-15T00:00:00Z");

  // Daily close prices with a gradual uptrend + noise
  const closePrices = [
    91200, 91800, 90900, 91500, 92100, 92800, 91900, 92400, 93100, 92600,
    93200, 93800, 93100, 93600, 92900, 93500, 94100, 93400, 93900, 94500,
    93700, 94200, 94800, 93900, 94300, 93800, 94600, 95100, 94200, 94200,
  ];

  return closePrices.map((close, i) => {
    const volatilityRange = basePrice * 0.015;
    const open = i === 0 ? basePrice : (closePrices[i - 1] ?? basePrice);
    const high = Math.max(open, close) + Math.random() * volatilityRange;
    const low = Math.min(open, close) - Math.random() * volatilityRange;
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    return {
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      timestamp: date.toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Whale transaction generation — 10 large trades
// ---------------------------------------------------------------------------

function generateWhaleTransactions(): readonly WhaleTransaction[] {
  const baseDate = new Date("2026-04-13T08:00:00Z");

  return [
    { hash: "0xa1b2c3d4e5f6", side: "buy", amountUsd: 8_200_000, source: "Binance", timestamp: offsetDate(baseDate, 0) },
    { hash: "0xb2c3d4e5f6a1", side: "buy", amountUsd: 5_400_000, source: "Coinbase", timestamp: offsetDate(baseDate, 1) },
    { hash: "0xc3d4e5f6a1b2", side: "sell", amountUsd: 3_100_000, source: "Unknown", timestamp: offsetDate(baseDate, 2) },
    { hash: "0xd4e5f6a1b2c3", side: "buy", amountUsd: 6_800_000, source: "OKX", timestamp: offsetDate(baseDate, 3) },
    { hash: "0xe5f6a1b2c3d4", side: "buy", amountUsd: 4_200_000, source: "Aave", timestamp: offsetDate(baseDate, 4) },
    { hash: "0xf6a1b2c3d4e5", side: "sell", amountUsd: 2_900_000, source: "Binance", timestamp: offsetDate(baseDate, 5) },
    { hash: "0xa7b8c9d0e1f2", side: "buy", amountUsd: 7_500_000, source: "New Wallet", timestamp: offsetDate(baseDate, 6) },
    { hash: "0xb8c9d0e1f2a7", side: "buy", amountUsd: 3_800_000, source: "Coinbase", timestamp: offsetDate(baseDate, 7) },
    { hash: "0xc9d0e1f2a7b8", side: "sell", amountUsd: 2_400_000, source: "DeFi", timestamp: offsetDate(baseDate, 8) },
    { hash: "0xd0e1f2a7b8c9", side: "buy", amountUsd: 3_900_000, source: "Binance", timestamp: offsetDate(baseDate, 9) },
  ] as const;
}

function offsetDate(base: Date, hoursOffset: number): string {
  const d = new Date(base);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Skill card configs
// ---------------------------------------------------------------------------

export const skillCardConfigs: readonly [
  SkillCardConfig<PriceCardData>,
  SkillCardConfig<KlineCardData>,
  SkillCardConfig<WhaleCardData>,
  SkillCardConfig<RatioCardData>,
] = [
  {
    id: "price",
    title: "\u5B9E\u65F6\u4EF7\u683C",
    type: "data",
    emoji: "\u{1F4CA}",
    apiEndpoint: "POST /v2/tokens/price",
    data: {
      currentPrice: 94_200,
      targetPrice: 150_000,
      changeNeeded: "+59.2%",
      priceHistory: [91_200, 92_400, 91_800, 93_500, 94_200, 93_800, 94_200],
    },
    signalValue: 0.0,
    signalLabel: "\u4E2D\u6027",
    weight: 0.1,
  },
  {
    id: "kline",
    title: "K\u7EBF\u8D8B\u52BF\u5206\u6790",
    type: "signal",
    emoji: "\u{1F4C8}",
    apiEndpoint: "GET /v2/klines/token/{id}",
    data: {
      ma20: 93_800,
      ma50: 91_200,
      macdSignal: "bullish",
      volatility: 0.032,
      klineData: generateKlineCandles(),
    },
    signalValue: 0.73,
    signalLabel: "\u770B\u6DA8",
    weight: 0.4,
  },
  {
    id: "whale",
    title: "\u9CB8\u9C7C\u884C\u4E3A\u8FFD\u8E2A",
    type: "signal",
    emoji: "\u{1F40B}",
    apiEndpoint: "GET /v2/txs/{pair-id}",
    data: {
      buyVolume: 42_000_000,
      sellVolume: 18_000_000,
      netRatio: 0.4,
      largeTradeCount: 47,
      transactions: generateWhaleTransactions(),
    },
    signalValue: 0.40,
    signalLabel: "\u770B\u6DA8",
    weight: 0.3,
  },
  {
    id: "ratio",
    title: "\u94FE\u4E0A\u4E70\u5356\u6BD4",
    type: "data",
    emoji: "\u{1F4C9}",
    apiEndpoint: "GET /v2/tokens/{id}",
    data: {
      timeframes: [
        { label: "5m", buyCount: 182, sellCount: 98, ratio: 1.86 },
        { label: "1h", buyCount: 890, sellCount: 560, ratio: 1.59 },
        { label: "6h", buyCount: 3_200, sellCount: 2_800, ratio: 1.14 },
        { label: "24h", buyCount: 9_800, sellCount: 8_200, ratio: 1.20 },
      ],
    },
    signalValue: 0.31,
    signalLabel: "\u504F\u591A",
    weight: 0.3,
  },
] as const;

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

/** Weighted overall score: PRICE*0.1 + KLINE*0.4 + WHALE*0.3 + RATIO*0.3 */
export const OVERALL_SCORE = +(
  skillCardConfigs[0].signalValue * skillCardConfigs[0].weight +
  skillCardConfigs[1].signalValue * skillCardConfigs[1].weight +
  skillCardConfigs[2].signalValue * skillCardConfigs[2].weight +
  skillCardConfigs[3].signalValue * skillCardConfigs[3].weight
).toFixed(2);

export const OVERALL_LABEL = OVERALL_SCORE > 0.3 ? "\u770B\u6DA8" : OVERALL_SCORE < -0.3 ? "\u770B\u8DCC" : "\u4E2D\u6027";
