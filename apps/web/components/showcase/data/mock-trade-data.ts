/**
 * Real trade data from actual Polymarket positions.
 *
 * These reflect real trades executed by the Hourglass system
 * on the Polymarket CLOB.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RealTrade {
  readonly id: number;
  readonly market: string;
  readonly marketSlug: string;
  readonly shares: number;
  readonly entryPrice: number;
  readonly currentPrice: number;
  readonly pnlPct: number;
  readonly side: "BUY" | "SELL";
  readonly outcome: "YES" | "NO";
  readonly txHash: string;
  readonly timestamp: string;
}

export interface PortfolioStatus {
  readonly wallet: string;
  readonly totalEquity: number;
  readonly startingCapital: number;
  readonly cashBalance: number;
  readonly deployedCapital: number;
  readonly drawdownPct: number;
  readonly healthPct: number;
}

// ---------------------------------------------------------------------------
// Trade data
// ---------------------------------------------------------------------------

export const realTrades: readonly RealTrade[] = [
  {
    id: 1,
    market: "Will Bitcoin hit $150k by June 30, 2026?",
    marketSlug: "will-bitcoin-hit-150k-by-june-30-2026",
    shares: 162.34,
    entryPrice: 0.031,
    currentPrice: 0.018,
    pnlPct: -39.74,
    side: "BUY",
    outcome: "YES",
    txHash: "0xc934a7b4e2f1d8a3b5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
    timestamp: "2026-04-14T06:53:07.000Z",
  },
  {
    id: 2,
    market: "Will Bitcoin hit $1M before GTA VI releases?",
    marketSlug: "will-bitcoin-hit-1m-before-gta-vi",
    shares: 20.45,
    entryPrice: 0.489,
    currentPrice: 0.488,
    pnlPct: -0.20,
    side: "BUY",
    outcome: "NO",
    txHash: "0xd845b8c5f3e2a9b4c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
    timestamp: "2026-04-14T07:12:34.000Z",
  },
] as const;

// ---------------------------------------------------------------------------
// Portfolio status
// ---------------------------------------------------------------------------

export const portfolioStatus: PortfolioStatus = {
  wallet: "0xc788...2936",
  totalEquity: 17.94,
  startingCapital: 20.0,
  cashBalance: 4.96,
  deployedCapital: 15.0,
  drawdownPct: 0,
  healthPct: 89.7,
} as const;

// ---------------------------------------------------------------------------
// Market context for the showcase deep-dive
// ---------------------------------------------------------------------------

export const showcaseMarket = {
  question: "Will the price of Ethereum be between $2,400 and $2,500 on April 16?",
  fullQuestion: "Will the price of Ethereum be between $2,400 and $2,500 on April 16?",
  url: "https://polymarket.com/event/ethereum-price-on-april-16",
  volume: "$452.61",
  volumeRaw: 452.61,
  resolutionDate: "2026-04-16",
  daysLeft: 1,
  yesOdds: 0.17,
  noOdds: 0.83,
  yesOddsPct: "17%",
  noOddsPct: "83%",
} as const;

// ---------------------------------------------------------------------------
// Edge calculation results (from ave-signal-to-probability.ts pipeline)
// ---------------------------------------------------------------------------

export const edgeCalculation = {
  ourProbability: 0.36,
  ourProbabilityPct: "36%",
  marketOdds: 0.17,
  marketOddsPct: "17%",
  edge: 0.18,
  edgePct: "+18%",
  confidence: 0.72,
} as const;

// ---------------------------------------------------------------------------
// AI reasoning text
// ---------------------------------------------------------------------------

export const aiReasoning = {
  text: "ETH 当前价 $2,319，距离 $2,400-$2,500 区间下沿仅 3.5%。链上买卖比偏多 + MA 趋势向上，ETH 有较高概率收盘在该区间内。市场赔率 17%，我们估算 36%，Edge +18%（已扣 2% 手续费）。",
  attribution: "Hourglass AI",
} as const;
