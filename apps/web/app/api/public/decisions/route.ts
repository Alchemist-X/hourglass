export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Types (matches the client component's DecisionReasoning interface)
// ---------------------------------------------------------------------------

interface SignalData {
  readonly value: number;
  readonly label: string;
  readonly detail: string;
}

interface DecisionReasoning {
  readonly id: string;
  readonly marketQuestion: string;
  readonly token: "BTC" | "ETH";
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly signals: {
    readonly price: SignalData;
    readonly trend: SignalData;
    readonly whale: SignalData;
    readonly sentiment: SignalData;
  };
  readonly overallScore: number;
  readonly ourProbability: number;
  readonly marketProbability: number;
  readonly edge: number;
  readonly action: "BUY" | "SELL" | "SKIP";
  readonly shares?: number;
  readonly status: "executed" | "pending" | "skipped";
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Deterministic seeded RNG (same approach as ave-alerts route)
// ---------------------------------------------------------------------------

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

// ---------------------------------------------------------------------------
// Mock decision generation with realistic data
// ---------------------------------------------------------------------------

function generateDecisions(): readonly DecisionReasoning[] {
  const hourSeed = Math.floor(Date.now() / 3_600_000);
  const rng = seededRng(hourSeed * 7 + 42);

  // Slightly vary base prices each hour for realism
  const btcBase = 94_000 + Math.floor(rng() * 2_000);
  const ethBase = 3_350 + Math.floor(rng() * 200);

  const decisions: DecisionReasoning[] = [
    // Decision 1: BTC -- Executed with positive edge
    {
      id: `dec-btc-${hourSeed}-1`,
      marketQuestion: `Will BTC exceed $${(Math.ceil(btcBase / 1000) * 1000 + 1000).toLocaleString("en-US")} by end of week?`,
      token: "BTC",
      currentPrice: btcBase + Math.floor(rng() * 500),
      targetPrice: Math.ceil(btcBase / 1000) * 1000 + 1000,
      signals: {
        price: {
          value: 0.62 + rng() * 0.2,
          label: "Price Analysis",
          detail: `BTC $${(btcBase + Math.floor(rng() * 500)).toLocaleString("en-US")} (target: $${(Math.ceil(btcBase / 1000) * 1000 + 1000).toLocaleString("en-US")}, +${(0.5 + rng() * 1.2).toFixed(1)}%)`,
        },
        trend: {
          value: 0.78 + rng() * 0.15,
          label: "Trend Score",
          detail: `MA20>MA50, MACD bullish (+${(0.5 + rng() * 0.5).toFixed(2)})`,
        },
        whale: {
          value: 0.35 + rng() * 0.15,
          label: "Whale Pressure",
          detail: `Net buy $${(18 + Math.floor(rng() * 12))}M (+${(0.3 + rng() * 0.2).toFixed(2)})`,
        },
        sentiment: {
          value: 0.25 + rng() * 0.15,
          label: "Sentiment",
          detail: `Buy/Sell ${(1.3 + rng() * 0.4).toFixed(1)}x (+${(0.2 + rng() * 0.2).toFixed(2)})`,
        },
      },
      overallScore: 0.48 + rng() * 0.12,
      ourProbability: 0.68 + rng() * 0.08,
      marketProbability: 0.58 + rng() * 0.06,
      edge: 0.07 + rng() * 0.06,
      action: "BUY",
      shares: 85 + Math.floor(rng() * 40),
      status: "executed",
      timestamp: minutesAgo(3 + Math.floor(rng() * 8)),
    },

    // Decision 2: ETH -- Executed with edge
    {
      id: `dec-eth-${hourSeed}-2`,
      marketQuestion: `Will ETH hold above $${(Math.floor(ethBase / 100) * 100).toLocaleString("en-US")} through Tuesday?`,
      token: "ETH",
      currentPrice: ethBase + Math.floor(rng() * 100),
      targetPrice: Math.floor(ethBase / 100) * 100,
      signals: {
        price: {
          value: 0.44 + rng() * 0.2,
          label: "Price Analysis",
          detail: `ETH $${(ethBase + Math.floor(rng() * 100)).toLocaleString("en-US")} (support: $${(Math.floor(ethBase / 100) * 100).toLocaleString("en-US")}, +${(1.0 + rng() * 1.5).toFixed(1)}%)`,
        },
        trend: {
          value: 0.55 + rng() * 0.2,
          label: "Trend Score",
          detail: `MA20>MA50, RSI ${(52 + Math.floor(rng() * 12))} neutral-bullish`,
        },
        whale: {
          value: 0.18 + rng() * 0.25,
          label: "Whale Pressure",
          detail: `Net buy $${(6 + Math.floor(rng() * 8))}M, ${(8 + Math.floor(rng() * 6))} large txs`,
        },
        sentiment: {
          value: 0.30 + rng() * 0.15,
          label: "Sentiment",
          detail: `Buy/Sell ${(1.1 + rng() * 0.3).toFixed(1)}x, OI rising`,
        },
      },
      overallScore: 0.36 + rng() * 0.12,
      ourProbability: 0.72 + rng() * 0.06,
      marketProbability: 0.64 + rng() * 0.05,
      edge: 0.05 + rng() * 0.05,
      action: "BUY",
      shares: 120 + Math.floor(rng() * 50),
      status: "executed",
      timestamp: minutesAgo(5 + Math.floor(rng() * 12)),
    },

    // Decision 3: BTC -- Pending analysis
    {
      id: `dec-btc-${hourSeed}-3`,
      marketQuestion: `Will BTC monthly close above $${(Math.ceil(btcBase / 5000) * 5000).toLocaleString("en-US")}?`,
      token: "BTC",
      currentPrice: btcBase + Math.floor(rng() * 800),
      targetPrice: Math.ceil(btcBase / 5000) * 5000,
      signals: {
        price: {
          value: 0.30 + rng() * 0.15,
          label: "Price Analysis",
          detail: `BTC $${(btcBase + Math.floor(rng() * 800)).toLocaleString("en-US")} vs $${(Math.ceil(btcBase / 5000) * 5000).toLocaleString("en-US")} target`,
        },
        trend: {
          value: 0.45 + rng() * 0.2,
          label: "Trend Score",
          detail: `Weekly MA bullish, daily consolidating`,
        },
        whale: {
          value: 0.10 + rng() * 0.2,
          label: "Whale Pressure",
          detail: `Monitoring... ${(4 + Math.floor(rng() * 6))} pending whale txs`,
        },
        sentiment: {
          value: 0.15 + rng() * 0.15,
          label: "Sentiment",
          detail: `Awaiting 6h window close for signal`,
        },
      },
      overallScore: 0.25 + rng() * 0.1,
      ourProbability: 0.55 + rng() * 0.08,
      marketProbability: 0.50 + rng() * 0.06,
      edge: 0.02 + rng() * 0.04,
      action: "BUY",
      status: "pending",
      timestamp: minutesAgo(1 + Math.floor(rng() * 3)),
    },

    // Decision 4: ETH -- Skipped (insufficient edge)
    {
      id: `dec-eth-${hourSeed}-4`,
      marketQuestion: `Will ETH flip $${(Math.ceil(ethBase / 100) * 100 + 200).toLocaleString("en-US")} this week?`,
      token: "ETH",
      currentPrice: ethBase + Math.floor(rng() * 60),
      targetPrice: Math.ceil(ethBase / 100) * 100 + 200,
      signals: {
        price: {
          value: -0.15 + rng() * 0.2,
          label: "Price Analysis",
          detail: `ETH $${(ethBase + Math.floor(rng() * 60)).toLocaleString("en-US")} far from $${(Math.ceil(ethBase / 100) * 100 + 200).toLocaleString("en-US")} target (-${(4 + rng() * 3).toFixed(1)}%)`,
        },
        trend: {
          value: 0.10 + rng() * 0.15,
          label: "Trend Score",
          detail: `Sideways pattern, no clear breakout signal`,
        },
        whale: {
          value: -0.08 + rng() * 0.1,
          label: "Whale Pressure",
          detail: `Mixed flow, net sell $${(1 + Math.floor(rng() * 4))}M`,
        },
        sentiment: {
          value: -0.05 + rng() * 0.15,
          label: "Sentiment",
          detail: `Buy/Sell ${(0.85 + rng() * 0.2).toFixed(2)}x, slightly bearish`,
        },
      },
      overallScore: -0.02 + rng() * 0.08,
      ourProbability: 0.32 + rng() * 0.08,
      marketProbability: 0.35 + rng() * 0.06,
      edge: -0.01 + rng() * 0.02,
      action: "SKIP",
      status: "skipped",
      timestamp: minutesAgo(8 + Math.floor(rng() * 15)),
    },
  ];

  // Sort by timestamp descending (most recent first)
  return [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const decisions = generateDecisions();
  return Response.json({ decisions });
}
