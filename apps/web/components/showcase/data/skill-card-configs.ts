/**
 * Static data configs for the 4 AVE Skill cards.
 *
 * Based on realistic ETH data around April 2026 for the showcase market
 * "Will the price of Ethereum be between $2,400 and $2,500 on April 16?"
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
// OHLC candle generation — 30 realistic ETH daily candles approaching the
// $2,400-$2,500 range from below
// ---------------------------------------------------------------------------

function generateKlineCandles(): readonly OhlcCandle[] {
  const basePrice = 2_200;
  const baseDate = new Date("2026-03-15T00:00:00Z");

  // Daily close prices: gradual uptrend from ~$2,200 to ~$2,320
  const closePrices = [
    2205, 2218, 2199, 2224, 2241, 2236, 2252, 2248, 2265, 2258,
    2271, 2283, 2276, 2290, 2285, 2296, 2302, 2295, 2307, 2314,
    2308, 2296, 2305, 2312, 2308, 2317, 2311, 2320, 2316, 2319,
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
  const baseDate = new Date("2026-04-14T08:00:00Z");

  // ETH whale flows — realistic scale for a single token's 1h net buy +$1.8M
  return [
    { hash: "0xa1b2c3d4e5f6", side: "buy", amountUsd: 820_000, source: "Binance", timestamp: offsetDate(baseDate, 0) },
    { hash: "0xb2c3d4e5f6a1", side: "buy", amountUsd: 540_000, source: "Coinbase", timestamp: offsetDate(baseDate, 1) },
    { hash: "0xc3d4e5f6a1b2", side: "sell", amountUsd: 310_000, source: "Unknown", timestamp: offsetDate(baseDate, 2) },
    { hash: "0xd4e5f6a1b2c3", side: "buy", amountUsd: 680_000, source: "OKX", timestamp: offsetDate(baseDate, 3) },
    { hash: "0xe5f6a1b2c3d4", side: "buy", amountUsd: 420_000, source: "Aave", timestamp: offsetDate(baseDate, 4) },
    { hash: "0xf6a1b2c3d4e5", side: "sell", amountUsd: 290_000, source: "Binance", timestamp: offsetDate(baseDate, 5) },
    { hash: "0xa7b8c9d0e1f2", side: "buy", amountUsd: 750_000, source: "New Wallet", timestamp: offsetDate(baseDate, 6) },
    { hash: "0xb8c9d0e1f2a7", side: "buy", amountUsd: 380_000, source: "Coinbase", timestamp: offsetDate(baseDate, 7) },
    { hash: "0xc9d0e1f2a7b8", side: "sell", amountUsd: 240_000, source: "DeFi", timestamp: offsetDate(baseDate, 8) },
    { hash: "0xd0e1f2a7b8c9", side: "buy", amountUsd: 390_000, source: "Binance", timestamp: offsetDate(baseDate, 9) },
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
      currentPrice: 2_319.43,
      targetPrice: 2_450,
      changeNeeded: "+3.5% \u5230\u533A\u95F4\u4E0B\u6CBF",
      priceHistory: [2_290, 2_305, 2_298, 2_311, 2_320, 2_316, 2_319],
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
      ma20: 2_305,
      ma50: 2_240,
      macdSignal: "bullish",
      volatility: 0.028,
      klineData: generateKlineCandles(),
    },
    signalValue: 0.55,
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
      buyVolume: 3_200_000,
      sellVolume: 1_400_000,
      netRatio: 0.39,
      largeTradeCount: 18,
      transactions: generateWhaleTransactions(),
    },
    signalValue: 0.32,
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
        { label: "5m", buyCount: 168, sellCount: 120, ratio: 1.4 },
        { label: "1h", buyCount: 720, sellCount: 576, ratio: 1.25 },
        { label: "6h", buyCount: 3_100, sellCount: 2_818, ratio: 1.1 },
        { label: "24h", buyCount: 9_400, sellCount: 8_500, ratio: 1.11 },
      ],
    },
    signalValue: 0.28,
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
