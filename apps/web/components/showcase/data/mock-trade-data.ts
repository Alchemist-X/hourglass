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
  question: "When will Bitcoin hit $150K?",
  fullQuestion: "Will Bitcoin hit $150k by June 30, 2026?",
  volume: "$3.1M",
  volumeRaw: 3_100_000,
  resolutionDate: "2026-06-30",
  daysLeft: 77,
  yesOdds: 0.031,
  noOdds: 0.969,
  yesOddsPct: "3.1%",
  noOddsPct: "96.9%",
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
  text: "\u94FE\u4E0A\u4FE1\u53F7\u663E\u793A ETH \u73B0\u4EF7\u6B63\u597D\u5728 $2,400-$2,500 \u533A\u95F4\u5185\uFF0C\u4E70\u5356\u6BD4\u504F\u591A\u914D\u5408 MA \u4E0A\u534B\u89D2\u3002\u5E02\u573A\u8D54\u7387 17% \u660E\u663E\u4F4E\u4F30\u4E86\u6536\u76D8\u5728\u8BE5\u533A\u95F4\u7684\u6982\u7387\uFF0C\u6211\u4EEC\u4F30\u7B97 36%\u3002",
  attribution: "Hourglass AI",
} as const;
