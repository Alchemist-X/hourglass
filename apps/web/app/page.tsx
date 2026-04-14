import type { AveAlert } from "@autopoly/contracts";
import { AveMonitoringPanel } from "../components/ave-monitoring-panel";
import { DashboardActivity } from "../components/dashboard-activity";
import { DashboardEquityChart } from "../components/dashboard-equity-chart";
import { DashboardHeader } from "../components/dashboard-header";
import { DashboardPnlSummary } from "../components/dashboard-pnl-summary";
import { DashboardPositions } from "../components/dashboard-positions";
import { DashboardThesis } from "../components/dashboard-thesis";
import { DecisionReasoningPanel } from "../components/decision-reasoning-panel";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorActivityData,
  getSpectatorClosedPositionsData
} from "../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Inline data generation (avoids self-referential fetch that fails on Vercel)
// ---------------------------------------------------------------------------

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function fmtUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Alert generation (copied from api route to avoid HTTP self-call)
// ---------------------------------------------------------------------------

interface TokenSeed {
  readonly symbol: string;
  readonly address: string;
  readonly chain: string;
  readonly basePrice: number;
}

const TOKENS: readonly TokenSeed[] = [
  { symbol: "ETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", chain: "ethereum", basePrice: 3420 },
  { symbol: "BTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", chain: "ethereum", basePrice: 97150 },
  { symbol: "SOL", address: "So11111111111111111111111111111111111111112", chain: "solana", basePrice: 178 },
  { symbol: "BNB", address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", chain: "bsc", basePrice: 605 },
  { symbol: "ARB", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", chain: "arbitrum", basePrice: 0.88 },
  { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", chain: "ethereum", basePrice: 15.85 },
  { symbol: "AAVE", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", chain: "ethereum", basePrice: 218.5 },
  { symbol: "PEPE", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", chain: "ethereum", basePrice: 0.0000118 },
  { symbol: "DOGE", address: "0x4206904396bB2dA87963d7289e3b7A3E7B50092C", chain: "ethereum", basePrice: 0.164 },
  { symbol: "RNDR", address: "0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24", chain: "ethereum", basePrice: 7.85 },
  { symbol: "FET", address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85", chain: "ethereum", basePrice: 2.32 },
  { symbol: "UNI", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", chain: "ethereum", basePrice: 7.42 },
  { symbol: "MATIC", address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", chain: "polygon", basePrice: 0.52 },
  { symbol: "OP", address: "0x4200000000000000000000000000000000000042", chain: "ethereum", basePrice: 1.62 },
  { symbol: "SHIB", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", chain: "ethereum", basePrice: 0.0000225 },
];

const EXCHANGES: readonly string[] = ["Binance", "Coinbase", "OKX", "Kraken", "Bybit"];
const DEX_NAMES: readonly string[] = ["Uniswap", "SushiSwap", "PancakeSwap", "Curve", "1inch", "Jupiter", "Raydium"];

function buildPriceThresholdAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const thresholds = [100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 50000, 60000, 70000, 80000, 90000, 100000];
  const changePct = 0.5 + rng() * 4.5;
  const timeframe = pick(["1h", "4h", "24h"] as const, rng);
  const threshold = token.basePrice > 1000
    ? pick(thresholds.filter((t) => Math.abs(t - token.basePrice) / token.basePrice < 0.2), rng) ?? Math.round(token.basePrice / 100) * 100
    : token.basePrice;
  const direction = rng() > 0.5 ? "crossed" : "approaching";
  const priceStr = token.basePrice >= 1 ? `$${fmtNumber(threshold)}` : `$${token.basePrice.toFixed(7)}`;
  return {
    type: "price_alert", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: "info", message: `${token.symbol} ${direction} ${priceStr} threshold (${fmtPct(changePct)} in ${timeframe})`,
    data: { changePct, timeframe, threshold }, timestamp: minutesAgo(Math.floor(rng() * 120)),
  };
}

function buildWhaleTransferAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS.filter((t) => t.basePrice > 1), rng);
  const exchange = pick(EXCHANGES, rng);
  const amount = Math.floor(100 + rng() * 5000);
  const valueUsd = amount * token.basePrice;
  const direction = rng() > 0.5 ? `to ${exchange}` : `from ${exchange}`;
  return {
    type: "whale_movement", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: "warning", message: `Whale transferred ${fmtNumber(amount)} ${token.symbol} ${direction} (${fmtUsd(valueUsd)})`,
    data: { amount, exchange, valueUsd }, timestamp: minutesAgo(Math.floor(rng() * 150)),
  };
}

function buildSmartMoneyAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const amount = Math.floor(500 + rng() * 50000);
  const dexCount = 2 + Math.floor(rng() * 4);
  const dexes = Array.from({ length: dexCount }, () => pick(DEX_NAMES, rng));
  const uniqueDexes = [...new Set(dexes)];
  return {
    type: "whale_movement", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: "info", message: `Smart money accumulated ${fmtNumber(amount)} ${token.symbol} across ${uniqueDexes.length} DEXs`,
    data: { amount, dexes: uniqueDexes }, timestamp: minutesAgo(Math.floor(rng() * 100)),
  };
}

function buildVolumeSpikeAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const spikePct = 100 + Math.floor(rng() * 500);
  const avgPeriod = pick(["7-day", "14-day", "30-day"] as const, rng);
  return {
    type: "anomaly", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: "warning", message: `${token.symbol} 24h volume spike: +${spikePct}% vs ${avgPeriod} average`,
    data: { spikePct, avgPeriod }, timestamp: minutesAgo(Math.floor(rng() * 60)),
  };
}

function buildUnusualActivityAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const metric = pick(["large buy orders", "new wallet inflows", "DEX liquidity additions", "contract interactions"] as const, rng);
  const multiplier = (2 + rng() * 8).toFixed(1);
  return {
    type: "anomaly", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: rng() > 0.7 ? "warning" : "info",
    message: `Unusual ${metric} detected for ${token.symbol}: ${multiplier}x normal rate`,
    data: { metric, multiplier }, timestamp: minutesAgo(Math.floor(rng() * 80)),
  };
}

function buildContractRiskAlert(rng: () => number): AveAlert {
  const riskyTokens = TOKENS.filter((t) => ["PEPE", "SHIB", "DOGE"].includes(t.symbol));
  const token = pick(riskyTokens.length > 0 ? riskyTokens : TOKENS, rng);
  const flags = pick(["mint function detected", "proxy contract with upgradeable logic", "ownership not renounced", "high sell tax (8.2%)"] as const, rng);
  const holderConcentration = 40 + Math.floor(rng() * 45);
  return {
    type: "risk_alert", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: "critical", message: `${token.symbol} contract flagged: ${flags}, holder concentration ${holderConcentration}%`,
    data: { flags, holderConcentration }, timestamp: minutesAgo(Math.floor(rng() * 180)),
  };
}

function buildLiquidityAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const changePct = -(10 + Math.floor(rng() * 40));
  const timeframe = pick(["1h", "4h", "24h"] as const, rng);
  return {
    type: "risk_alert", tokenAddress: token.address, chain: token.chain, tokenSymbol: token.symbol,
    severity: rng() > 0.5 ? "critical" : "warning",
    message: `${token.symbol} liquidity dropped ${changePct}% in ${timeframe} -- potential rug risk`,
    data: { changePct, timeframe }, timestamp: minutesAgo(Math.floor(rng() * 120)),
  };
}

function buildDominanceShiftAlert(rng: () => number): AveAlert {
  const dominance = 48 + rng() * 10;
  const shift = 0.3 + rng() * 2.0;
  return {
    type: "price_alert", tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    chain: "ethereum", tokenSymbol: "BTC", severity: "info",
    message: `BTC dominance shifted to ${dominance.toFixed(1)}% (${fmtPct(shift)} today)`,
    data: { dominance, shift }, timestamp: minutesAgo(Math.floor(rng() * 90)),
  };
}

type AlertBuilder = (rng: () => number) => AveAlert;

const ALERT_GENERATORS: readonly AlertBuilder[] = [
  buildPriceThresholdAlert, buildPriceThresholdAlert, buildDominanceShiftAlert,
  buildWhaleTransferAlert, buildWhaleTransferAlert, buildSmartMoneyAlert,
  buildVolumeSpikeAlert, buildUnusualActivityAlert, buildContractRiskAlert, buildLiquidityAlert,
];

function generateAlerts(): readonly AveAlert[] {
  const hourSeed = Math.floor(Date.now() / 3_600_000);
  const rng = seededRng(hourSeed);
  const alertCount = 8 + Math.floor(rng() * 5);
  const alerts: AveAlert[] = [];
  for (let i = 0; i < alertCount; i++) {
    const generator = pick(ALERT_GENERATORS, rng);
    alerts.push(generator(rng));
  }
  return [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---------------------------------------------------------------------------
// Decision generation (copied from api route to avoid HTTP self-call)
// ---------------------------------------------------------------------------

interface SignalData {
  readonly value: number;
  readonly label: string;
  readonly detail: string;
}

interface DecisionReasoningData {
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

function generateDecisions(): readonly DecisionReasoningData[] {
  const hourSeed = Math.floor(Date.now() / 3_600_000);
  const rng = seededRng(hourSeed * 7 + 42);
  const btcBase = 94_000 + Math.floor(rng() * 2_000);
  const ethBase = 3_350 + Math.floor(rng() * 200);

  const decisions: DecisionReasoningData[] = [
    {
      id: `dec-btc-${hourSeed}-1`,
      marketQuestion: `Will BTC exceed $${(Math.ceil(btcBase / 1000) * 1000 + 1000).toLocaleString("en-US")} by end of week?`,
      token: "BTC", currentPrice: btcBase + Math.floor(rng() * 500),
      targetPrice: Math.ceil(btcBase / 1000) * 1000 + 1000,
      signals: {
        price: { value: 0.62 + rng() * 0.2, label: "Price Analysis", detail: `BTC $${(btcBase + Math.floor(rng() * 500)).toLocaleString("en-US")} (target: $${(Math.ceil(btcBase / 1000) * 1000 + 1000).toLocaleString("en-US")}, +${(0.5 + rng() * 1.2).toFixed(1)}%)` },
        trend: { value: 0.78 + rng() * 0.15, label: "Trend Score", detail: `MA20>MA50, MACD bullish (+${(0.5 + rng() * 0.5).toFixed(2)})` },
        whale: { value: 0.35 + rng() * 0.15, label: "Whale Pressure", detail: `Net buy $${(18 + Math.floor(rng() * 12))}M (+${(0.3 + rng() * 0.2).toFixed(2)})` },
        sentiment: { value: 0.25 + rng() * 0.15, label: "Sentiment", detail: `Buy/Sell ${(1.3 + rng() * 0.4).toFixed(1)}x (+${(0.2 + rng() * 0.2).toFixed(2)})` },
      },
      overallScore: 0.48 + rng() * 0.12, ourProbability: 0.68 + rng() * 0.08,
      marketProbability: 0.58 + rng() * 0.06, edge: 0.07 + rng() * 0.06,
      action: "BUY", shares: 85 + Math.floor(rng() * 40), status: "executed",
      timestamp: minutesAgo(3 + Math.floor(rng() * 8)),
    },
    {
      id: `dec-eth-${hourSeed}-2`,
      marketQuestion: `Will ETH hold above $${(Math.floor(ethBase / 100) * 100).toLocaleString("en-US")} through Tuesday?`,
      token: "ETH", currentPrice: ethBase + Math.floor(rng() * 100),
      targetPrice: Math.floor(ethBase / 100) * 100,
      signals: {
        price: { value: 0.44 + rng() * 0.2, label: "Price Analysis", detail: `ETH $${(ethBase + Math.floor(rng() * 100)).toLocaleString("en-US")} (support: $${(Math.floor(ethBase / 100) * 100).toLocaleString("en-US")}, +${(1.0 + rng() * 1.5).toFixed(1)}%)` },
        trend: { value: 0.55 + rng() * 0.2, label: "Trend Score", detail: `MA20>MA50, RSI ${(52 + Math.floor(rng() * 12))} neutral-bullish` },
        whale: { value: 0.18 + rng() * 0.25, label: "Whale Pressure", detail: `Net buy $${(6 + Math.floor(rng() * 8))}M, ${(8 + Math.floor(rng() * 6))} large txs` },
        sentiment: { value: 0.30 + rng() * 0.15, label: "Sentiment", detail: `Buy/Sell ${(1.1 + rng() * 0.3).toFixed(1)}x, OI rising` },
      },
      overallScore: 0.36 + rng() * 0.12, ourProbability: 0.72 + rng() * 0.06,
      marketProbability: 0.64 + rng() * 0.05, edge: 0.05 + rng() * 0.05,
      action: "BUY", shares: 120 + Math.floor(rng() * 50), status: "executed",
      timestamp: minutesAgo(5 + Math.floor(rng() * 12)),
    },
    {
      id: `dec-btc-${hourSeed}-3`,
      marketQuestion: `Will BTC monthly close above $${(Math.ceil(btcBase / 5000) * 5000).toLocaleString("en-US")}?`,
      token: "BTC", currentPrice: btcBase + Math.floor(rng() * 800),
      targetPrice: Math.ceil(btcBase / 5000) * 5000,
      signals: {
        price: { value: 0.30 + rng() * 0.15, label: "Price Analysis", detail: `BTC $${(btcBase + Math.floor(rng() * 800)).toLocaleString("en-US")} vs $${(Math.ceil(btcBase / 5000) * 5000).toLocaleString("en-US")} target` },
        trend: { value: 0.45 + rng() * 0.2, label: "Trend Score", detail: `Weekly MA bullish, daily consolidating` },
        whale: { value: 0.10 + rng() * 0.2, label: "Whale Pressure", detail: `Monitoring... ${(4 + Math.floor(rng() * 6))} pending whale txs` },
        sentiment: { value: 0.15 + rng() * 0.15, label: "Sentiment", detail: `Awaiting 6h window close for signal` },
      },
      overallScore: 0.25 + rng() * 0.1, ourProbability: 0.55 + rng() * 0.08,
      marketProbability: 0.50 + rng() * 0.06, edge: 0.02 + rng() * 0.04,
      action: "BUY", status: "pending",
      timestamp: minutesAgo(1 + Math.floor(rng() * 3)),
    },
    {
      id: `dec-eth-${hourSeed}-4`,
      marketQuestion: `Will ETH flip $${(Math.ceil(ethBase / 100) * 100 + 200).toLocaleString("en-US")} this week?`,
      token: "ETH", currentPrice: ethBase + Math.floor(rng() * 60),
      targetPrice: Math.ceil(ethBase / 100) * 100 + 200,
      signals: {
        price: { value: -0.15 + rng() * 0.2, label: "Price Analysis", detail: `ETH $${(ethBase + Math.floor(rng() * 60)).toLocaleString("en-US")} far from $${(Math.ceil(ethBase / 100) * 100 + 200).toLocaleString("en-US")} target (-${(4 + rng() * 3).toFixed(1)}%)` },
        trend: { value: 0.10 + rng() * 0.15, label: "Trend Score", detail: `Sideways pattern, no clear breakout signal` },
        whale: { value: -0.08 + rng() * 0.1, label: "Whale Pressure", detail: `Mixed flow, net sell $${(1 + Math.floor(rng() * 4))}M` },
        sentiment: { value: -0.05 + rng() * 0.15, label: "Sentiment", detail: `Buy/Sell ${(0.85 + rng() * 0.2).toFixed(2)}x, slightly bearish` },
      },
      overallScore: -0.02 + rng() * 0.08, ourProbability: 0.32 + rng() * 0.08,
      marketProbability: 0.35 + rng() * 0.06, edge: -0.01 + rng() * 0.02,
      action: "SKIP", status: "skipped",
      timestamp: minutesAgo(8 + Math.floor(rng() * 15)),
    },
  ];

  return [...decisions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const [overview, positions, trades, closedPositions, activities] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData(),
    getSpectatorActivityData(),
  ]);

  const alerts = generateAlerts();
  const decisions = generateDecisions();

  return (
    <div className="dash-page">
      <DashboardHeader initialData={overview} />

      <DecisionReasoningPanel decisions={decisions} />

      <div className="dash-split">
        <DashboardPositions
          initialData={positions}
          totalEquityUsd={overview.total_equity_usd}
        />
        <AveMonitoringPanel alerts={alerts} />
      </div>

      <div className="dash-split">
        <DashboardPnlSummary
          initialPositions={positions}
          initialClosedPositions={closedPositions}
        />
        <DashboardActivity initialData={trades} />
      </div>

      <DashboardEquityChart
        initialActivities={activities}
        initialPositions={positions}
      />

      <DashboardThesis />
    </div>
  );
}
