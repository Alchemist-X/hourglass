import type { AveAlert } from "@autopoly/contracts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Deterministic-ish alert generation seeded from the current hour so the
// data looks "live" but stays stable within a given clock-hour.
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
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
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
// Template pools
// ---------------------------------------------------------------------------

interface AlertTemplate {
  readonly build: (rng: () => number) => AveAlert;
}

const CHAINS: readonly string[] = [
  "ethereum",
  "solana",
  "base",
  "arbitrum",
  "bsc",
  "polygon",
];

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

const EXCHANGES: readonly string[] = [
  "Binance",
  "Coinbase",
  "OKX",
  "Kraken",
  "Bybit",
];

const DEX_NAMES: readonly string[] = [
  "Uniswap",
  "SushiSwap",
  "PancakeSwap",
  "Curve",
  "1inch",
  "Jupiter",
  "Raydium",
];

function buildPriceThresholdAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const thresholds = [100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 50000, 60000, 70000, 80000, 90000, 100000];
  const changePct = 0.5 + rng() * 4.5;
  const timeframe = pick(["1h", "4h", "24h"] as const, rng);
  const threshold = token.basePrice > 1000
    ? pick(thresholds.filter((t) => Math.abs(t - token.basePrice) / token.basePrice < 0.2), rng) ?? Math.round(token.basePrice / 100) * 100
    : token.basePrice;
  const direction = rng() > 0.5 ? "crossed" : "approaching";
  const priceStr = token.basePrice >= 1
    ? `$${fmtNumber(threshold)}`
    : `$${token.basePrice.toFixed(7)}`;

  return {
    type: "price_alert",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: "info",
    message: `${token.symbol} ${direction} ${priceStr} threshold (${fmtPct(changePct)} in ${timeframe})`,
    data: { changePct, timeframe, threshold },
    timestamp: minutesAgo(Math.floor(rng() * 120)),
  };
}

function buildDominanceShiftAlert(rng: () => number): AveAlert {
  const dominance = 48 + rng() * 10;
  const shift = 0.3 + rng() * 2.0;

  return {
    type: "price_alert",
    tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    chain: "ethereum",
    tokenSymbol: "BTC",
    severity: "info",
    message: `BTC dominance shifted to ${dominance.toFixed(1)}% (${fmtPct(shift)} today)`,
    data: { dominance, shift },
    timestamp: minutesAgo(Math.floor(rng() * 90)),
  };
}

function buildWhaleTransferAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS.filter((t) => t.basePrice > 1), rng);
  const exchange = pick(EXCHANGES, rng);
  const amount = Math.floor(100 + rng() * 5000);
  const valueUsd = amount * token.basePrice;
  const direction = rng() > 0.5 ? `to ${exchange}` : `from ${exchange}`;

  return {
    type: "whale_movement",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: "warning",
    message: `Whale transferred ${fmtNumber(amount)} ${token.symbol} ${direction} (${fmtUsd(valueUsd)})`,
    data: { amount, exchange, valueUsd },
    timestamp: minutesAgo(Math.floor(rng() * 150)),
  };
}

function buildSmartMoneyAccumulationAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const amount = Math.floor(500 + rng() * 50000);
  const dexCount = 2 + Math.floor(rng() * 4);
  const dexes = Array.from({ length: dexCount }, () => pick(DEX_NAMES, rng));
  const uniqueDexes = [...new Set(dexes)];

  return {
    type: "whale_movement",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: "info",
    message: `Smart money accumulated ${fmtNumber(amount)} ${token.symbol} across ${uniqueDexes.length} DEXs`,
    data: { amount, dexes: uniqueDexes },
    timestamp: minutesAgo(Math.floor(rng() * 100)),
  };
}

function buildVolumeSpikeAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const spikePct = 100 + Math.floor(rng() * 500);
  const avgPeriod = pick(["7-day", "14-day", "30-day"] as const, rng);

  return {
    type: "anomaly",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: "warning",
    message: `${token.symbol} 24h volume spike: +${spikePct}% vs ${avgPeriod} average`,
    data: { spikePct, avgPeriod },
    timestamp: minutesAgo(Math.floor(rng() * 60)),
  };
}

function buildUnusualActivityAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const metric = pick([
    "large buy orders",
    "new wallet inflows",
    "DEX liquidity additions",
    "contract interactions",
  ] as const, rng);
  const multiplier = (2 + rng() * 8).toFixed(1);

  return {
    type: "anomaly",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: rng() > 0.7 ? "warning" : "info",
    message: `Unusual ${metric} detected for ${token.symbol}: ${multiplier}x normal rate`,
    data: { metric, multiplier },
    timestamp: minutesAgo(Math.floor(rng() * 80)),
  };
}

function buildContractRiskAlert(rng: () => number): AveAlert {
  const riskyTokens = TOKENS.filter((t) =>
    ["PEPE", "SHIB", "DOGE"].includes(t.symbol)
  );
  const token = pick(riskyTokens.length > 0 ? riskyTokens : TOKENS, rng);
  const flags = pick([
    "mint function detected",
    "proxy contract with upgradeable logic",
    "ownership not renounced",
    "high sell tax (8.2%)",
  ] as const, rng);
  const holderConcentration = 40 + Math.floor(rng() * 45);

  return {
    type: "risk_alert",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: "critical",
    message: `${token.symbol} contract flagged: ${flags}, holder concentration ${holderConcentration}%`,
    data: { flags, holderConcentration },
    timestamp: minutesAgo(Math.floor(rng() * 180)),
  };
}

function buildLiquidityAlert(rng: () => number): AveAlert {
  const token = pick(TOKENS, rng);
  const changePct = -(10 + Math.floor(rng() * 40));
  const timeframe = pick(["1h", "4h", "24h"] as const, rng);

  return {
    type: "risk_alert",
    tokenAddress: token.address,
    chain: token.chain,
    tokenSymbol: token.symbol,
    severity: rng() > 0.5 ? "critical" : "warning",
    message: `${token.symbol} liquidity dropped ${changePct}% in ${timeframe} -- potential rug risk`,
    data: { changePct, timeframe },
    timestamp: minutesAgo(Math.floor(rng() * 120)),
  };
}

// ---------------------------------------------------------------------------
// Alert generators array
// ---------------------------------------------------------------------------

const ALERT_GENERATORS: readonly AlertTemplate[] = [
  { build: buildPriceThresholdAlert },
  { build: buildPriceThresholdAlert },
  { build: buildDominanceShiftAlert },
  { build: buildWhaleTransferAlert },
  { build: buildWhaleTransferAlert },
  { build: buildSmartMoneyAccumulationAlert },
  { build: buildVolumeSpikeAlert },
  { build: buildUnusualActivityAlert },
  { build: buildContractRiskAlert },
  { build: buildLiquidityAlert },
];

// ---------------------------------------------------------------------------
// Main generation
// ---------------------------------------------------------------------------

function generateAlerts(): readonly AveAlert[] {
  const hourSeed = Math.floor(Date.now() / 3_600_000);
  const rng = seededRng(hourSeed);

  const alertCount = 8 + Math.floor(rng() * 5); // 8-12 alerts
  const alerts: AveAlert[] = [];

  for (let i = 0; i < alertCount; i++) {
    const template = pick(ALERT_GENERATORS, rng);
    alerts.push(template.build(rng));
  }

  // Sort by timestamp descending (most recent first)
  return [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function GET() {
  const alerts = generateAlerts();
  return Response.json({ alerts });
}
