/**
 * AVE Claw Demo Run
 *
 * Standalone script that exercises the full AVE pipeline in mock mode:
 *   1. Create a MockAveClient and fetch market data
 *   2. Transform to AvePulseCandidate format
 *   3. Filter candidates with selectTopAveCandidates()
 *   4. Plan entries with planAveEntries()
 *   5. Review mock positions with reviewAvePositions()
 *   6. Print a formatted terminal summary
 *
 * Usage:
 *   pnpm ave:demo
 *
 * No API key required -- runs entirely on mock data.
 */

import { createTerminalPrinter } from "@autopoly/terminal-ui";
import { MockAveClient } from "../services/ave-monitor/src/mock-client.ts";
import { TOKEN_POOL, createRng, seedToContractRisk } from "../services/ave-monitor/src/mock-data.ts";
import type { AvePulseCandidate, AveContractRisk } from "../services/orchestrator/src/pulse/ave-market-pulse.ts";
import {
  selectTopAveCandidates,
  defaultAvePulseFilterArgs,
  applyAvePulseFilters,
  calculateAveScore,
} from "../services/orchestrator/src/pulse/ave-pulse-filters.ts";
import {
  planAveEntries,
  type AveEntryPlan,
} from "../services/orchestrator/src/runtime/ave-entry-planner.ts";
import {
  reviewAvePositions,
  type AvePosition,
  type AvePositionReview,
} from "../services/orchestrator/src/review/ave-position-review.ts";

// ---------------------------------------------------------------------------
// ANSI helpers (lightweight -- no dependency on terminal-ui internals)
// ---------------------------------------------------------------------------

const C = {
  reset: "\u001B[0m",
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  red: "\u001B[31m",
  green: "\u001B[32m",
  yellow: "\u001B[33m",
  blue: "\u001B[34m",
  magenta: "\u001B[35m",
  cyan: "\u001B[36m",
  gray: "\u001B[90m",
  white: "\u001B[37m",
  bgCyan: "\u001B[46m",
  bgBlue: "\u001B[44m",
  bgMagenta: "\u001B[45m",
  bgGreen: "\u001B[42m",
  bgYellow: "\u001B[43m",
  bgRed: "\u001B[41m",
} as const;

function bold(s: string): string {
  return `${C.bold}${s}${C.reset}`;
}

function dim(s: string): string {
  return `${C.dim}${s}${C.reset}`;
}

function color(code: string, s: string): string {
  return `${code}${s}${C.reset}`;
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function padLeft(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : " ".repeat(n - s.length) + s;
}

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
  if (Math.abs(value) >= 0.001) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(8)}`;
}

function formatPct(value: number): string {
  const pct = value * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function colorPct(value: number): string {
  const formatted = formatPct(value);
  if (value > 0) return color(C.green, formatted);
  if (value < 0) return color(C.red, formatted);
  return color(C.gray, formatted);
}

function hr(char = "-", width = 80): string {
  return dim(char.repeat(width));
}

function sectionHeader(title: string): void {
  console.log("");
  console.log(hr("="));
  console.log(bold(color(C.cyan, `  ${title}`)));
  console.log(hr("="));
}

function subHeader(title: string): void {
  console.log("");
  console.log(bold(color(C.blue, `  ${title}`)));
  console.log(hr("-"));
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BANKROLL_USD = 10_000;
const TOP_N_CANDIDATES = 10;
const MAX_ENTRIES = 4;

// ---------------------------------------------------------------------------
// Step 1: Create mock client and fetch market data
// ---------------------------------------------------------------------------

async function fetchMockMarketData(): Promise<AvePulseCandidate[]> {
  const client = new MockAveClient({ volatility: 0.005, seed: 42 });

  // Fetch tokens across multiple chains
  const chains = ["ethereum", "bsc", "polygon", "base", "solana"];

  const allTokens = await Promise.all(
    chains.map((chain) =>
      client.searchTokens({ chain, limit: 20, orderby: "volume_24h" })
    )
  );

  const trendingTokens = await Promise.all(
    chains.map((chain) => client.getTrendingTokens(chain))
  );

  // Fetch contract risk for the first batch of tokens
  const rng = createRng(42);

  // Transform to AvePulseCandidate format
  const candidates: AvePulseCandidate[] = [];
  const seen = new Set<string>();

  for (const batch of allTokens) {
    for (const token of batch) {
      const tokenId = `${token.token_address}-${token.chain}`;
      if (seen.has(tokenId)) continue;
      seen.add(tokenId);

      // Build risk assessment from mock data
      const seed = TOKEN_POOL.find(
        (t) => t.address.toLowerCase() === token.token_address.toLowerCase()
      );
      const riskRaw = seed ? seedToContractRisk(seed, rng) : undefined;

      const riskAssessment: AveContractRisk | undefined = riskRaw
        ? {
            riskLevel: riskRaw.risk_level ?? "unknown",
            isHoneypot: riskRaw.is_honeypot ?? false,
            hasMintFunction: riskRaw.has_mint_function ?? false,
            ownerCanChangeBalance: riskRaw.owner_can_change_balance ?? false,
            isOpenSource: riskRaw.is_open_source ?? true,
            buyTax: riskRaw.buy_tax ?? 0,
            sellTax: riskRaw.sell_tax ?? 0,
            lpLocked: riskRaw.lp_locked ?? false,
            lpLockRatio: riskRaw.lp_lock_ratio ?? 0,
          }
        : undefined;

      candidates.push({
        symbol: token.token_symbol,
        name: token.token_name,
        tokenAddress: token.token_address,
        chain: token.chain,
        tokenId,
        priceUsd: token.price ?? 0,
        priceChange24h: token.price_change_24h ?? 0,
        volume24hUsd: token.volume_24h ?? 0,
        fdv: token.market_cap ?? 0,
        marketCap: token.market_cap ?? 0,
        liquidityUsd: token.liquidity ?? 0,
        holderCount: token.holder_count ?? 0,
        mainPairId: token.pair_address ?? "",
        createdAt: token.created_at ? String(token.created_at) : "",
        logoUrl: token.logo ?? "",
        discoverySource: "search",
        riskAssessment,
      });
    }
  }

  // Also add trending tokens
  for (const batch of trendingTokens) {
    for (const token of batch) {
      const tokenId = `${token.token_address}-${token.chain}`;
      if (seen.has(tokenId)) continue;
      seen.add(tokenId);

      candidates.push({
        symbol: token.token_symbol,
        name: token.token_name,
        tokenAddress: token.token_address,
        chain: token.chain,
        tokenId,
        priceUsd: token.price ?? 0,
        priceChange24h: token.price_change_24h ?? 0,
        volume24hUsd: token.volume_24h ?? 0,
        fdv: token.market_cap ?? 0,
        marketCap: token.market_cap ?? 0,
        liquidityUsd: token.liquidity ?? 0,
        holderCount: 0,
        mainPairId: "",
        createdAt: "",
        logoUrl: token.logo ?? "",
        discoverySource: "trending",
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Step 5: Build mock positions for review
// ---------------------------------------------------------------------------

function buildMockPositions(): AvePosition[] {
  const now = new Date().toISOString();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "pos-001",
      tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      chain: "ethereum",
      tokenId: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2-ethereum",
      tokenSymbol: "ETH",
      side: "BUY",
      size: 0.5,
      avgCostUsd: 3200.0,
      entryPriceUsd: 3200.0,
      currentValueUsd: 1710.28,
      unrealizedPnlPct: 0.069,
      stopLossPct: 0.3,
      openedAt: oneWeekAgo,
      updatedAt: now,
      entryConfidence: 0.72,
      entryEdge: 0.04,
    },
    {
      id: "pos-002",
      tokenAddress: "So11111111111111111111111111111111111111112",
      chain: "solana",
      tokenId: "So11111111111111111111111111111111111111112-solana",
      tokenSymbol: "SOL",
      side: "BUY",
      size: 8,
      avgCostUsd: 190.0,
      entryPriceUsd: 190.0,
      currentValueUsd: 1426.4,
      unrealizedPnlPct: -0.062,
      stopLossPct: 0.3,
      openedAt: oneWeekAgo,
      updatedAt: now,
      entryConfidence: 0.68,
      entryEdge: 0.035,
    },
    {
      id: "pos-003",
      tokenAddress: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      chain: "ethereum",
      tokenId: "0x6982508145454Ce325dDbE47a25d4ec3d2311933-ethereum",
      tokenSymbol: "PEPE",
      side: "BUY",
      size: 42_000_000,
      avgCostUsd: 0.000010,
      entryPriceUsd: 0.000010,
      currentValueUsd: 495.60,
      unrealizedPnlPct: 0.18,
      stopLossPct: 0.3,
      openedAt: oneWeekAgo,
      updatedAt: now,
      entryConfidence: 0.55,
      entryEdge: 0.06,
    },
  ];
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

function printHeader(): void {
  console.log("");
  console.log(color(C.bgCyan, `${C.bold}${C.white}                                                                                `));
  console.log(color(C.bgCyan, `${C.bold}${C.white}     HOURGLASS -- AVE Claw Demo Run                                              `));
  console.log(color(C.bgCyan, `${C.bold}${C.white}     Full Pipeline E2E Test (Mock Mode)                                          `));
  console.log(color(C.bgCyan, `${C.bold}${C.white}                                                                                `));
  console.log("");
  console.log(dim(`  Timestamp : ${new Date().toISOString()}`));
  console.log(dim(`  Bankroll  : ${formatUsd(BANKROLL_USD)}`));
  console.log(dim(`  Mode      : Mock (no API key required)`));
}

function printMonitoring(
  totalScanned: number,
  filtered: number,
  topN: number
): void {
  sectionHeader("1. Market Monitoring");
  console.log(`  ${dim("Tokens scanned:")}  ${bold(String(totalScanned))}`);
  console.log(`  ${dim("Passed filters:")}  ${bold(color(C.green, String(filtered)))}`);
  console.log(`  ${dim("Top candidates:")}  ${bold(color(C.cyan, String(topN)))}`);
}

function printCandidatesTable(candidates: AvePulseCandidate[]): void {
  subHeader("2. Top Candidates");

  // Table header
  const header = [
    padRight("Symbol", 8),
    padRight("Chain", 10),
    padLeft("Price", 14),
    padLeft("24h Change", 12),
    padLeft("Volume 24h", 12),
    padLeft("Risk", 8),
    padLeft("Score", 8),
  ].join("  ");
  console.log(`  ${bold(header)}`);
  console.log(`  ${hr("-", header.length)}`);

  for (const c of candidates) {
    const score = calculateAveScore(c);
    const riskLevel = c.riskAssessment?.riskLevel ?? "unknown";
    const riskColor =
      riskLevel === "low" ? C.green :
      riskLevel === "medium" ? C.yellow :
      riskLevel === "high" ? C.red : C.gray;

    const row = [
      bold(padRight(c.symbol, 8)),
      color(C.gray, padRight(c.chain, 10)),
      padLeft(formatUsd(c.priceUsd), 14),
      padLeft(colorPct(c.priceChange24h), 12 + 9), // +9 for ANSI codes in colorPct
      padLeft(formatUsd(c.volume24hUsd), 12),
      padLeft(color(riskColor, riskLevel), 8 + 9),
      padLeft(score.toFixed(2), 8),
    ].join("  ");
    console.log(`  ${row}`);
  }
}

function printEntryPlans(plans: AveEntryPlan[]): void {
  subHeader("3. Entry Plans (Kelly Criterion)");

  if (plans.length === 0) {
    console.log(color(C.yellow, "  No entry plans generated (insufficient edge)."));
    return;
  }

  const header = [
    padRight("Token", 8),
    padRight("Dir", 5),
    padLeft("Size USD", 12),
    padLeft("Confidence", 12),
    padLeft("Edge", 10),
    padLeft("Monthly Ret", 12),
  ].join("  ");
  console.log(`  ${bold(header)}`);
  console.log(`  ${hr("-", header.length)}`);

  for (const plan of plans) {
    const dirColor = plan.direction === "buy" ? C.green : C.red;
    const row = [
      bold(padRight(plan.tokenSymbol, 8)),
      color(dirColor, padRight(plan.direction.toUpperCase(), 5)),
      padLeft(formatUsd(plan.sizeUsd), 12),
      padLeft(formatPct(plan.confidence - 0.5), 12),
      padLeft(colorPct(plan.edge), 10 + 9),
      padLeft(colorPct(plan.monthlyReturn), 12 + 9),
    ].join("  ");
    console.log(`  ${row}`);
  }

  const totalSize = plans.reduce((sum, p) => sum + p.sizeUsd, 0);
  console.log(`  ${hr("-", 65)}`);
  console.log(`  ${dim("Total deployment:")} ${bold(formatUsd(totalSize))} ${dim(`(${formatPct(totalSize / BANKROLL_USD)} of bankroll)`)}`);
}

function printPositionReviews(reviews: AvePositionReview[]): void {
  subHeader("4. Position Reviews");

  if (reviews.length === 0) {
    console.log(color(C.gray, "  No positions to review."));
    return;
  }

  const header = [
    padRight("Token", 8),
    padRight("Action", 8),
    padLeft("Current PnL", 12),
    padLeft("Price", 14),
    padRight("Basis", 22),
  ].join("  ");
  console.log(`  ${bold(header)}`);
  console.log(`  ${hr("-", header.length)}`);

  for (const review of reviews) {
    const actionColor =
      review.action === "hold" ? C.green :
      review.action === "reduce" ? C.yellow :
      C.red;
    const flagStr = review.humanReviewFlag ? color(C.yellow, " [!]") : "";

    const row = [
      bold(padRight(review.position.tokenSymbol, 8)),
      color(actionColor, padRight(review.action.toUpperCase(), 8)),
      padLeft(colorPct(review.currentPnlPct), 12 + 9),
      padLeft(formatUsd(review.currentPriceUsd), 14),
      padRight(review.basis, 22),
    ].join("  ");
    console.log(`  ${row}${flagStr}`);
  }
}

function printSignals(
  plans: AveEntryPlan[],
  reviews: AvePositionReview[]
): void {
  subHeader("5. Trading Signals Generated");

  const signals: Array<{ type: string; token: string; detail: string }> = [];

  for (const plan of plans) {
    signals.push({
      type: "ENTRY",
      token: plan.tokenSymbol,
      detail: `${plan.direction.toUpperCase()} ${formatUsd(plan.sizeUsd)} on ${plan.chain}`,
    });
  }

  for (const review of reviews) {
    if (review.action !== "hold") {
      signals.push({
        type: review.action === "close" ? "EXIT" : "TRIM",
        token: review.position.tokenSymbol,
        detail: `${review.action.toUpperCase()} position (PnL: ${formatPct(review.currentPnlPct)})`,
      });
    } else {
      signals.push({
        type: "HOLD",
        token: review.position.tokenSymbol,
        detail: `maintain position (PnL: ${formatPct(review.currentPnlPct)})`,
      });
    }
  }

  for (const sig of signals) {
    const typeColor =
      sig.type === "ENTRY" ? C.cyan :
      sig.type === "EXIT" ? C.red :
      sig.type === "TRIM" ? C.yellow :
      C.green;
    console.log(
      `  ${color(typeColor, bold(padRight(`[${sig.type}]`, 8)))} ${bold(padRight(sig.token, 6))} ${dim(sig.detail)}`
    );
  }
}

function printRiskSummary(
  plans: AveEntryPlan[],
  reviews: AvePositionReview[],
  positions: AvePosition[]
): void {
  subHeader("6. Risk Summary");

  const totalNewExposure = plans.reduce((sum, p) => sum + p.sizeUsd, 0);
  const existingExposure = positions.reduce((sum, p) => sum + p.currentValueUsd, 0);
  const totalExposure = totalNewExposure + existingExposure;
  const exposurePct = totalExposure / BANKROLL_USD;

  const holdCount = reviews.filter((r) => r.action === "hold").length;
  const reduceCount = reviews.filter((r) => r.action === "reduce").length;
  const closeCount = reviews.filter((r) => r.action === "close").length;
  const humanFlags = reviews.filter((r) => r.humanReviewFlag).length;

  const rows: Array<[string, string]> = [
    ["Bankroll", formatUsd(BANKROLL_USD)],
    ["Existing exposure", formatUsd(existingExposure)],
    ["New planned exposure", formatUsd(totalNewExposure)],
    ["Total projected exposure", formatUsd(totalExposure)],
    ["Exposure / Bankroll", formatPct(exposurePct)],
    ["", ""],
    ["Positions: hold", String(holdCount)],
    ["Positions: reduce", String(reduceCount)],
    ["Positions: close", String(closeCount)],
    ["Human review flags", String(humanFlags)],
    ["New entries planned", String(plans.length)],
  ];

  const labelWidth = rows.reduce((max, [label]) => Math.max(max, label.length), 0);
  for (const [label, value] of rows) {
    if (label === "") {
      continue;
    }
    const valueColor =
      label.includes("Human review") && Number(value) > 0 ? C.yellow :
      label.includes("close") && Number(value) > 0 ? C.red :
      label.includes("Exposure / Bankroll") ? (exposurePct > 0.5 ? C.yellow : C.green) :
      C.white;
    console.log(`  ${dim(padRight(label + ":", labelWidth + 1))} ${color(valueColor, bold(value))}`);
  }
}

function printFooter(durationMs: number): void {
  console.log("");
  console.log(hr("="));
  console.log(
    `  ${dim("Pipeline completed in")} ${bold(color(C.green, `${durationMs}ms`))} ${dim("-- all stages passed")}`
  );
  console.log(hr("="));
  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startMs = Date.now();

  printHeader();

  // Step 1: Fetch mock market data
  const allCandidates = await fetchMockMarketData();

  // Step 2: Apply filters
  const filters = defaultAvePulseFilterArgs();
  const filtered = applyAvePulseFilters(allCandidates, filters);

  // Step 3: Select top candidates
  const topCandidates = selectTopAveCandidates(
    allCandidates,
    filters,
    TOP_N_CANDIDATES
  );

  printMonitoring(allCandidates.length, filtered.length, topCandidates.length);
  printCandidatesTable(topCandidates);

  // Step 4: Plan entries
  const positions = buildMockPositions();
  const existingTokenIds = positions.map((p) => p.tokenId);

  const entryPlans = planAveEntries(
    topCandidates,
    {
      bankrollUsd: BANKROLL_USD,
      existingPositions: existingTokenIds,
    },
    {
      maxNewEntries: MAX_ENTRIES,
      batchCapPct: 0.2,
      stopLossPct: 0.3,
    }
  );

  printEntryPlans(entryPlans);

  // Step 5: Review existing positions
  // Build current price map from fetched candidates
  const currentPrices = new Map<string, number>();
  for (const c of allCandidates) {
    if (c.priceUsd > 0) {
      currentPrices.set(c.tokenId, c.priceUsd);
    }
  }

  const reviews = reviewAvePositions(positions, currentPrices, {
    stopLossPct: 0.3,
    targetProfitPct: 0.5,
  });

  printPositionReviews(reviews);

  // Step 6: Print signals and risk summary
  printSignals(entryPlans, reviews);
  printRiskSummary(entryPlans, reviews, positions);

  const durationMs = Date.now() - startMs;
  printFooter(durationMs);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n${C.red}[ave-demo] Fatal error: ${message}${C.reset}\n`);
  if (error instanceof Error && error.stack) {
    console.error(dim(error.stack));
  }
  process.exit(1);
});
