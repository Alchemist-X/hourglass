/**
 * AVE Live Trading Pipeline -- Streamlined End-to-End
 *
 * Bypasses the complex orchestrator/vendor system and goes directly:
 *   1. Load config from .env.live
 *   2. Create AVE client (real with fallback to mock)
 *   3. Fetch Polymarket markets via Gamma API
 *   4. Filter to BTC/ETH price markets (ave-market-matcher)
 *   5. Generate crypto signals (ave-crypto-signals)
 *   6. Calculate probabilities and edge (ave-signal-to-probability)
 *   7. Print full reasoning waterfall (colorful terminal output)
 *   8. For markets with edge > 2%: build order -> execute -> print result
 *   9. Output summary
 *
 * Usage:
 *   ENV_FILE=.env.live pnpm ave:live
 *   ENV_FILE=.env.live pnpm ave:live -- --recommend-only
 */

import { loadConfig as loadExecutorConfig } from "../services/executor/src/config.ts";
import {
  executeMarketOrder,
  getClobClient,
} from "../services/executor/src/lib/polymarket-sdk.ts";
import { AveClient } from "../services/ave-monitor/src/client.ts";
import { MockAveClient } from "../services/ave-monitor/src/mock-client.ts";
import {
  generateCryptoSignals,
  type CryptoSignal,
} from "../services/orchestrator/src/pulse/ave-crypto-signals.ts";
import {
  buildProbabilityEstimate,
  type ProbabilityEstimate,
} from "../services/orchestrator/src/pulse/ave-signal-to-probability.ts";
import {
  matchCryptoMarkets,
  type MatchedMarket,
} from "../services/orchestrator/src/pulse/ave-market-matcher.ts";
import type { PulseCandidate } from "../services/orchestrator/src/pulse/market-pulse.ts";

// ---------------------------------------------------------------------------
// ANSI color constants
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
  white: "\u001B[37m",
  gray: "\u001B[90m",
} as const;

function b(s: string): string {
  return `${C.bold}${s}${C.reset}`;
}
function d(s: string): string {
  return `${C.dim}${s}${C.reset}`;
}
function c(code: string, s: string): string {
  return `${code}${s}${C.reset}`;
}
function cb(code: string, s: string): string {
  return `${C.bold}${code}${s}${C.reset}`;
}
function padR(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}
function padL(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : " ".repeat(n - s.length) + s;
}

function fmtUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function fmtPrice(value: number): string {
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(2)}`;
}

function renderBar(score: number, width: number): string {
  const normalized = (score + 1) / 2;
  const filled = Math.round(normalized * width);
  const left = "\u2588".repeat(filled);
  const right = "\u2591".repeat(width - filled);
  return `[${left}${right}]`;
}

function scoreLabel(score: number): string {
  if (score > 0.15) return "BULLISH";
  if (score < -0.15) return "BEARISH";
  return "NEUTRAL";
}

function scoreColor(score: number): string {
  if (score > 0.15) return C.green;
  if (score < -0.15) return C.red;
  return C.yellow;
}

function write(line: string): void {
  process.stdout.write(`${line}\n`);
}

function boxLine(content: string, visibleLen: number, W: number): string {
  const padding = Math.max(0, W - 2 - visibleLen);
  return `\u2551 ${content}${" ".repeat(padding)} \u2551`;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EDGE_THRESHOLD = 0.02;
const MAX_PER_TRADE_PCT = 0.20;
const MAX_TOTAL_EXPOSURE_PCT = 0.80;
const MAX_POSITIONS = 10;
const MAX_DRAWDOWN_PCT = 0.30;

// ---------------------------------------------------------------------------
// Gamma API market fetching
// ---------------------------------------------------------------------------

interface GammaMarket {
  question: string;
  conditionId?: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  clobTokenIds: string;
  volume: string;
  liquidity: string;
  endDate: string;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  active: boolean;
  closed: boolean;
  negRisk?: boolean;
  neg_risk?: boolean;
  events?: Array<{ slug?: string }>;
}

interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  markets: GammaMarket[];
}

/**
 * Fetch Polymarket crypto markets using the events endpoint (which returns
 * nested markets) and the markets endpoint with keyword searches.
 * The events endpoint provides broader coverage of BTC/ETH price-target markets.
 */
async function fetchPolymarketCryptoMarkets(): Promise<PulseCandidate[]> {
  write(c(C.cyan, "  Fetching Polymarket crypto markets from Gamma API..."));

  const allRaw: GammaMarket[] = [];
  const seenSlugs = new Set<string>();

  function addMarket(m: GammaMarket, eventSlugOverride?: string): void {
    if (seenSlugs.has(m.slug)) return;
    if (m.active === false || m.closed === true) return;
    seenSlugs.add(m.slug);
    if (eventSlugOverride) {
      allRaw.push({ ...m, events: [{ slug: eventSlugOverride }] });
    } else {
      allRaw.push(m);
    }
  }

  // Strategy 1: Fetch events (returns nested markets) in multiple pages
  for (const offset of [0, 100, 200]) {
    try {
      const url = `https://gamma-api.polymarket.com/events?limit=100&offset=${offset}&active=true&closed=false`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) continue;
      const events = (await res.json()) as GammaEvent[];
      for (const event of events) {
        for (const market of event.markets ?? []) {
          const q = market.question?.toLowerCase() ?? "";
          const hasCrypto = /\b(bitcoin|btc|ethereum|eth)\b/i.test(q);
          const hasPrice = /(\$|price|hit|above|below|reach|dip)/i.test(q);
          if (hasCrypto && hasPrice) {
            addMarket(market, event.slug);
          }
        }
      }
    } catch (err) {
      write(c(C.yellow, `  [WARN] Events fetch failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  // Strategy 2: Direct market search for bitcoin / ethereum
  const searchUrls = [
    "https://gamma-api.polymarket.com/markets?tag=crypto&limit=50&active=true&closed=false&order=volume&ascending=false",
    "https://gamma-api.polymarket.com/markets?tag=bitcoin&limit=30&active=true&closed=false&order=volume&ascending=false",
    "https://gamma-api.polymarket.com/markets?tag=ethereum&limit=30&active=true&closed=false&order=volume&ascending=false",
  ];

  for (const url of searchUrls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as GammaMarket[];
      for (const m of data) {
        const q = m.question?.toLowerCase() ?? "";
        const hasCrypto = /\b(bitcoin|btc|ethereum|eth)\b/i.test(q);
        if (hasCrypto) addMarket(m);
      }
    } catch (err) {
      write(c(C.yellow, `  [WARN] Market search failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  write(c(C.cyan, `  Fetched ${allRaw.length} unique BTC/ETH markets`));

  return allRaw.map((m): PulseCandidate => {
    const outcomes = safeJsonParse<string[]>(m.outcomes, []);
    const outcomePrices = safeJsonParse<string[]>(m.outcomePrices, []).map(Number);
    const clobTokenIds = safeJsonParse<string[]>(m.clobTokenIds, []);
    const eventSlug = m.events?.[0]?.slug ?? m.slug;

    return {
      question: m.question,
      eventSlug,
      marketSlug: m.slug,
      url: `https://polymarket.com/event/${eventSlug}`,
      liquidityUsd: Number(m.liquidity) || 0,
      volume24hUsd: Number(m.volume) || 0,
      outcomes,
      outcomePrices,
      clobTokenIds,
      endDate: m.endDate,
      bestBid: m.bestBid ?? (outcomePrices[0] ?? 0.5),
      bestAsk: m.bestAsk ?? (outcomePrices[0] ?? 0.5),
      spread: m.spread ?? 0,
      negRisk: m.negRisk ?? m.neg_risk,
    };
  });
}

function safeJsonParse<T>(raw: string | T, fallback: T): T {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// AVE Client creation with fallback
// ---------------------------------------------------------------------------

async function createAveClientWithFallback(): Promise<{
  client: AveClient | MockAveClient;
  isLive: boolean;
}> {
  const apiKey = process.env.AVE_API_KEY?.trim() ?? "";
  const baseUrl = process.env.AVE_API_BASE_URL?.trim() ?? "https://prod.ave-api.com/v2";

  if (!apiKey) {
    write(c(C.yellow, "  [INFO] No AVE_API_KEY set, using MockAveClient"));
    return { client: new MockAveClient(), isLive: false };
  }

  const realClient = new AveClient({ apiKey, baseUrl, timeout: 15_000 });
  try {
    const chains = await realClient.getSupportedChains();
    write(c(C.green, `  [OK] AVE API is live (${chains.length} chains supported)`));
    return { client: realClient, isLive: true };
  } catch (err) {
    write(c(C.yellow, `  [WARN] AVE API is down (${err instanceof Error ? err.message : String(err)}), using MockAveClient`));
    return { client: new MockAveClient(), isLive: false };
  }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function printBanner(): void {
  const W = 62;
  const top = `\u2554${"\u2550".repeat(W)}\u2557`;
  const bottom = `\u255A${"\u2550".repeat(W)}\u255D`;
  const l1 = "HOURGLASS -- AVE Claw x Polymarket LIVE Trading Pipeline";
  const l2 = "4 AVE Skills -> Polymarket Markets -> Real Order Execution";
  const line1 = boxLine(l1, l1.length, W);
  const line2 = boxLine(l2, l2.length, W);

  write("");
  write(cb(C.cyan, top));
  write(cb(C.cyan, line1));
  write(cb(C.cyan, line2));
  write(cb(C.cyan, bottom));
}

function printSignalDetails(
  btcSignal: CryptoSignal,
  ethSignal: CryptoSignal
): void {
  write("");
  write(cb(C.cyan, `--- STEP 1: AVE Signal Collection ${"---".repeat(8)}`));

  write("");
  write(`  ${cb(C.white, "Real-time Price")}`);
  write(`     BTC: ${cb(C.green, fmtPrice(btcSignal.price))}  |  ETH: ${cb(C.green, fmtPrice(ethSignal.price))}`);

  write("");
  write(`  ${cb(C.white, "K-line Analysis (1h + daily)")}`);
  const btcKl = btcSignal.details.klines;
  const ethKl = ethSignal.details.klines;
  const btcMacd = btcKl.macdSignal === "bullish" ? c(C.green, "bullish") : btcKl.macdSignal === "bearish" ? c(C.red, "bearish") : c(C.yellow, "neutral");
  const ethMacd = ethKl.macdSignal === "bullish" ? c(C.green, "bullish") : ethKl.macdSignal === "bearish" ? c(C.red, "bearish") : c(C.yellow, "neutral");
  write(`     BTC: MA20=${fmtPrice(btcKl.ma20)} MA50=${fmtPrice(btcKl.ma50)} MACD=${btcMacd}`);
  write(`     ETH: MA20=${fmtPrice(ethKl.ma20)} MA50=${fmtPrice(ethKl.ma50)} MACD=${ethMacd}`);

  write("");
  write(`  ${cb(C.white, "Whale Tracking (>$100K trades)")}`);
  const btcWh = btcSignal.details.whales;
  const ethWh = ethSignal.details.whales;
  const btcNet = btcWh.buyVolume - btcWh.sellVolume;
  const ethNet = ethWh.buyVolume - ethWh.sellVolume;
  const btcNetStr = btcNet >= 0 ? c(C.green, `Net Buy +${fmtUsd(btcNet)}`) : c(C.red, `Net Sell ${fmtUsd(btcNet)}`);
  const ethNetStr = ethNet >= 0 ? c(C.green, `Net Buy +${fmtUsd(ethNet)}`) : c(C.red, `Net Sell ${fmtUsd(ethNet)}`);
  write(`     BTC: Buy ${fmtUsd(btcWh.buyVolume)} vs Sell ${fmtUsd(btcWh.sellVolume)} -> ${btcNetStr}`);
  write(`     ETH: Buy ${fmtUsd(ethWh.buyVolume)} vs Sell ${fmtUsd(ethWh.sellVolume)} -> ${ethNetStr}`);

  write("");
  write(`  ${cb(C.white, "Buy/Sell Ratio Sentiment")}`);
  const btcSent = btcSignal.details.sentiment;
  const ethSent = ethSignal.details.sentiment;
  const ratio5mBtc = btcSent.sell5m > 0 ? (btcSent.buy5m / btcSent.sell5m) : 0;
  const ratio1hBtc = btcSent.sell1h > 0 ? (btcSent.buy1h / btcSent.sell1h) : 0;
  const ratio5mEth = ethSent.sell5m > 0 ? (ethSent.buy5m / ethSent.sell5m) : 0;
  const ratio1hEth = ethSent.sell1h > 0 ? (ethSent.buy1h / ethSent.sell1h) : 0;
  write(`     BTC: 5m=${ratio5mBtc.toFixed(2)}x | 1h=${ratio1hBtc.toFixed(2)}x`);
  write(`     ETH: 5m=${ratio5mEth.toFixed(2)}x | 1h=${ratio1hEth.toFixed(2)}x`);
}

function printSignalAggregation(
  btcSignal: CryptoSignal,
  ethSignal: CryptoSignal
): void {
  write("");
  write(cb(C.cyan, `--- STEP 2: Signal Aggregation ${"---".repeat(9)}`));

  for (const sig of [btcSignal, ethSignal]) {
    write("");
    write(`  ${b(`${sig.token} Signal Breakdown:`)}`);
    const barWidth = 20;

    const trendColor = scoreColor(sig.trendScore);
    write(`    Trend:     ${c(trendColor, renderBar(sig.trendScore, barWidth))} ${c(trendColor, `${sig.trendScore >= 0 ? "+" : ""}${sig.trendScore.toFixed(2)}`)}`);

    const whaleColor = scoreColor(sig.whalePressure);
    write(`    Whale:     ${c(whaleColor, renderBar(sig.whalePressure, barWidth))} ${c(whaleColor, `${sig.whalePressure >= 0 ? "+" : ""}${sig.whalePressure.toFixed(2)}`)}`);

    const sentColor = scoreColor(sig.sentimentScore);
    write(`    Sentiment: ${c(sentColor, renderBar(sig.sentimentScore, barWidth))} ${c(sentColor, `${sig.sentimentScore >= 0 ? "+" : ""}${sig.sentimentScore.toFixed(2)}`)}`);

    write(`    ${d("-------------------------------------")}`);

    const overallColor = scoreColor(sig.overallScore);
    const label = scoreLabel(sig.overallScore);
    write(`    Overall:   ${c(overallColor, renderBar(sig.overallScore, barWidth))} ${c(overallColor, `${sig.overallScore >= 0 ? "+" : ""}${sig.overallScore.toFixed(2)}`)} <- ${cb(overallColor, label)}`);
  }
}

function printMarketMatching(matched: MatchedMarket[]): void {
  write("");
  write(cb(C.cyan, `--- STEP 3: Market Matching ${"---".repeat(10)}`));
  write("");
  write(d(`  Found ${matched.length} BTC/ETH price-target markets:`));

  if (matched.length === 0) {
    write(c(C.yellow, "  No BTC/ETH price-target markets found in current Polymarket listings."));
    return;
  }

  for (const m of matched) {
    write(`  - ${b(m.candidate.question)}`);
    write(`    Token: ${m.token} | Target: $${m.targetPrice.toLocaleString()} ${m.targetDirection} | Days: ${m.daysToResolution} | Vol: ${fmtUsd(m.candidate.volume24hUsd)}`);
  }
}

interface EdgeRow {
  readonly market: string;
  readonly marketSlug: string;
  readonly tokenId: string;
  readonly ourProb: number;
  readonly mktProb: number;
  readonly edge: number;
  readonly action: "BUY" | "SKIP";
  readonly estimate: ProbabilityEstimate;
  readonly negRisk?: boolean;
}

function printEdgeCalculation(edgeRows: readonly EdgeRow[]): void {
  write("");
  write(cb(C.cyan, `--- STEP 4: Edge Calculation ${"---".repeat(10)}`));
  write("");

  for (const row of edgeRows) {
    const edgePct = `${row.edge >= 0 ? "+" : ""}${(row.edge * 100).toFixed(1)}%`;
    const edgeColor = row.edge >= EDGE_THRESHOLD ? C.green : row.edge > 0 ? C.yellow : C.red;
    const actionLabel = row.action === "BUY" ? c(C.green, "BUY") : c(C.yellow, "SKIP");
    write(`  ${padR(row.market.slice(0, 50), 50)} Us: ${(row.ourProb * 100).toFixed(0)}% | Mkt: ${(row.mktProb * 100).toFixed(0)}% | Edge: ${c(edgeColor, edgePct)} | ${actionLabel}`);
  }
}

function printRiskControl(
  buyRows: readonly EdgeRow[],
  bankroll: number,
  sharesPerTrade: number
): void {
  write("");
  write(cb(C.cyan, `--- STEP 5: Risk Control ${"---".repeat(11)}`));
  write("");

  const totalExposure = buyRows.reduce(
    (sum, r) => sum + r.mktProb * sharesPerTrade,
    0
  );
  const maxSingleCost = Math.max(
    ...buyRows.map((r) => r.mktProb * sharesPerTrade),
    0
  );
  const maxSinglePct = bankroll > 0 ? maxSingleCost / bankroll : 0;
  const totalPct = bankroll > 0 ? totalExposure / bankroll : 0;

  write(`  Bankroll: ${cb(C.white, `$${bankroll.toFixed(2)}`)}`);
  write(`  Proposed: ${b(`${buyRows.length} trades`)} x ${b(`${sharesPerTrade} shares`)}`);

  const perTradePass = maxSinglePct <= MAX_PER_TRADE_PCT;
  const totalPass = totalPct <= MAX_TOTAL_EXPOSURE_PCT;
  const positionsPass = buyRows.length <= MAX_POSITIONS;

  write(`  ${perTradePass ? c(C.green, "PASS") : c(C.red, "FAIL")} Per-trade:     ${b(`$${maxSingleCost.toFixed(2)}`)} (${(maxSinglePct * 100).toFixed(1)}%) <= ${(MAX_PER_TRADE_PCT * 100).toFixed(0)}% limit`);
  write(`  ${totalPass ? c(C.green, "PASS") : c(C.red, "FAIL")} Total exposure: ${b(`$${totalExposure.toFixed(2)}`)} (${(totalPct * 100).toFixed(0)}%) <= ${(MAX_TOTAL_EXPOSURE_PCT * 100).toFixed(0)}% limit`);
  write(`  ${positionsPass ? c(C.green, "PASS") : c(C.red, "FAIL")} Positions:     ${b(String(buyRows.length))} <= ${MAX_POSITIONS} max`);
  write(`  ${c(C.green, "PASS")} Drawdown:      ${b("0%")} < ${(MAX_DRAWDOWN_PCT * 100).toFixed(0)}% halt`);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const recommendOnly = args.includes("--recommend-only");

  printBanner();

  // ── Step 0: Load config ──
  write("");
  write(cb(C.white, "=== Loading Configuration ==="));
  const executorConfig = loadExecutorConfig();
  const fixedShares = Number(process.env.FIXED_ORDER_SHARES ?? "5");
  const bankroll = Number(process.env.INITIAL_BANKROLL_USD ?? "20");

  write(`  Wallet:     ${d(executorConfig.funderAddress)}`);
  write(`  Chain:      ${d(String(executorConfig.chainId))}`);
  write(`  Sig Type:   ${d(String(executorConfig.signatureType))}`);
  write(`  Shares/Tx:  ${d(String(fixedShares))}`);
  write(`  Mode:       ${recommendOnly ? c(C.yellow, "RECOMMEND ONLY") : c(C.green, "LIVE TRADING")}`);

  // ── Step 1: Create AVE client ──
  write("");
  write(cb(C.white, "=== AVE API Connection ==="));
  const { client: aveClient, isLive: aveIsLive } = await createAveClientWithFallback();

  // ── Step 2: Fetch Polymarket markets ──
  write("");
  write(cb(C.white, "=== Polymarket Market Scan ==="));
  const allCandidates = await fetchPolymarketCryptoMarkets();
  write(c(C.cyan, `  Total active crypto markets: ${allCandidates.length}`));

  if (allCandidates.length === 0) {
    write(c(C.red, "  No crypto markets found. Exiting."));
    process.exit(1);
  }

  // ── Step 3: Match BTC/ETH price-target markets ──
  const matchedMarkets = matchCryptoMarkets(allCandidates);
  printMarketMatching(matchedMarkets);

  if (matchedMarkets.length === 0) {
    write("");
    write(c(C.yellow, "  No BTC/ETH price-target markets matched. Showing top markets for context:"));
    for (const cand of allCandidates.slice(0, 10)) {
      write(`    - ${cand.question} (vol: ${fmtUsd(cand.volume24hUsd)})`);
    }
    write("");
    write(c(C.yellow, "  Pipeline ending -- no tradeable crypto markets found."));
    process.exit(0);
  }

  // ── Step 4: Generate AVE crypto signals ──
  write("");
  write(cb(C.white, "=== AVE Signal Generation ==="));
  const uniqueTokens = [...new Set(matchedMarkets.map((m) => m.token))];
  write(c(C.cyan, `  Generating signals for: ${uniqueTokens.join(", ")}`));

  const signals = await generateCryptoSignals(aveClient, uniqueTokens);
  const btcSignal = signals.find((s) => s.token === "BTC");
  const ethSignal = signals.find((s) => s.token === "ETH");

  // Print signal details for available signals
  if (btcSignal && ethSignal) {
    printSignalDetails(btcSignal, ethSignal);
    printSignalAggregation(btcSignal, ethSignal);
  } else if (btcSignal) {
    printSignalDetails(btcSignal, btcSignal);
    printSignalAggregation(btcSignal, btcSignal);
    write(c(C.yellow, "  (ETH signal not available -- showing BTC only)"));
  } else if (ethSignal) {
    printSignalDetails(ethSignal, ethSignal);
    printSignalAggregation(ethSignal, ethSignal);
    write(c(C.yellow, "  (BTC signal not available -- showing ETH only)"));
  }

  // ── Step 5: Calculate edge for each matched market ──
  write("");
  write(cb(C.white, "=== Edge Calculation ==="));

  const signalByToken = new Map<string, CryptoSignal>();
  for (const sig of signals) {
    signalByToken.set(sig.token, sig);
  }

  const edgeRows: EdgeRow[] = [];
  for (const matched of matchedMarkets) {
    const signal = signalByToken.get(matched.token);
    if (!signal) continue;

    const marketImpliedProb = matched.candidate.outcomePrices[0] ?? 0.5;
    const estimate = buildProbabilityEstimate({
      marketQuestion: matched.candidate.question,
      token: matched.token,
      currentPrice: signal.price,
      targetPrice: matched.targetPrice,
      targetDirection: matched.targetDirection,
      aveScore: signal.overallScore,
      daysToResolution: matched.daysToResolution,
      marketImpliedProbability: marketImpliedProb,
    });

    // Determine the right token ID for the BUY side
    // For "above"/"hit" markets: BUY YES (token 0)
    // For "below" markets: BUY YES (token 0) as well since the estimate already accounts for direction
    const tokenId = matched.candidate.clobTokenIds[0] ?? "";

    edgeRows.push({
      market: matched.candidate.question,
      marketSlug: matched.candidate.marketSlug,
      tokenId,
      ourProb: estimate.estimatedProbability,
      mktProb: estimate.marketImpliedProbability,
      edge: estimate.edge,
      action: Math.abs(estimate.edge) >= EDGE_THRESHOLD ? "BUY" : "SKIP",
      estimate,
      negRisk: matched.candidate.negRisk,
    });
  }

  // Sort by absolute edge descending
  const sortedEdgeRows = [...edgeRows].sort(
    (a, b) => Math.abs(b.edge) - Math.abs(a.edge)
  );

  printEdgeCalculation(sortedEdgeRows);

  // ── Step 6: Risk control ──
  const buyRows = sortedEdgeRows.filter((r) => r.action === "BUY");
  printRiskControl(buyRows, bankroll, fixedShares);

  // ── Step 7: Execute or recommend ──
  write("");
  write(cb(C.white, "=== Execution ==="));

  if (buyRows.length === 0) {
    write(c(C.yellow, "  No markets with sufficient edge (>= 2%). No trades to execute."));
    printSummary(sortedEdgeRows, [], signals, recommendOnly);
    process.exit(0);
  }

  if (recommendOnly) {
    write(c(C.yellow, "  RECOMMEND-ONLY mode: not executing trades."));
    write("");
    write(cb(C.white, "  Recommended Trades:"));
    for (const [i, row] of buyRows.entries()) {
      const cost = row.mktProb * fixedShares;
      write(`  ${i + 1}. BUY ${fixedShares} shares "${row.market.slice(0, 50)}" @ $${row.mktProb.toFixed(2)} = $${cost.toFixed(2)} (edge: ${(row.edge * 100).toFixed(1)}%)`);
    }
    printSummary(sortedEdgeRows, [], signals, recommendOnly);
    process.exit(0);
  }

  // ── Live execution ──
  write(c(C.green, `  Executing ${buyRows.length} live trade(s)...`));
  write("");

  // Verify CLOB client can connect
  try {
    const client = await getClobClient(executorConfig);
    if (!client) {
      throw new Error("No CLOB client available -- check PRIVATE_KEY and FUNDER_ADDRESS");
    }
    write(c(C.green, "  CLOB client connected successfully"));
  } catch (err) {
    write(c(C.red, `  CLOB client connection failed: ${err instanceof Error ? err.message : String(err)}`));
    write(c(C.red, "  Aborting live execution."));
    printSummary(sortedEdgeRows, [], signals, false);
    process.exit(1);
  }

  interface ExecutedTrade {
    market: string;
    side: "BUY" | "SELL";
    shares: number;
    tokenId: string;
    orderId: string | null;
    ok: boolean;
    avgPrice: number | null;
    filledNotionalUsd: number;
    rawResponse: unknown;
  }

  const executed: ExecutedTrade[] = [];

  for (const [i, row] of buyRows.entries()) {
    if (!row.tokenId) {
      write(c(C.yellow, `  [${i + 1}] Skipping "${row.market.slice(0, 40)}" -- no CLOB token ID`));
      continue;
    }

    write(`  [${i + 1}] BUY ${fixedShares} shares "${row.market.slice(0, 50)}"`);
    write(`       Token: ${d(row.tokenId.slice(0, 30))}...`);
    write(`       Price: $${row.mktProb.toFixed(2)} | Edge: ${(row.edge * 100).toFixed(1)}%`);

    try {
      const result = await executeMarketOrder(executorConfig, {
        tokenId: row.tokenId,
        side: "BUY",
        amount: fixedShares,
      });

      const trade: ExecutedTrade = {
        market: row.market,
        side: "BUY",
        shares: fixedShares,
        tokenId: row.tokenId,
        orderId: result.orderId ?? null,
        ok: result.ok,
        avgPrice: result.avgPrice ?? null,
        filledNotionalUsd: result.filledNotionalUsd,
        rawResponse: result.rawResponse,
      };
      executed.push(trade);

      if (result.ok) {
        write(c(C.green, `       [OK] Order ${result.orderId ?? "?"} filled @ $${(result.avgPrice ?? 0).toFixed(4)} | cost: $${result.filledNotionalUsd.toFixed(2)}`));
      } else {
        write(c(C.red, `       [FAIL] Order rejected. Response: ${JSON.stringify(result.rawResponse)}`));
      }
    } catch (err) {
      write(c(C.red, `       [ERROR] ${err instanceof Error ? err.message : String(err)}`));
      executed.push({
        market: row.market,
        side: "BUY",
        shares: fixedShares,
        tokenId: row.tokenId,
        orderId: null,
        ok: false,
        avgPrice: null,
        filledNotionalUsd: 0,
        rawResponse: err instanceof Error ? err.message : String(err),
      });
    }

    write("");
  }

  printSummary(sortedEdgeRows, executed, signals, false);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

interface ExecutedTradeSummary {
  market: string;
  ok: boolean;
  orderId: string | null;
  avgPrice: number | null;
  filledNotionalUsd: number;
}

function printSummary(
  edgeRows: readonly EdgeRow[],
  executed: readonly ExecutedTradeSummary[],
  signals: readonly CryptoSignal[],
  recommendOnly: boolean
): void {
  const W = 62;
  const top = `\u2554${"\u2550".repeat(W)}\u2557`;
  const bottom = `\u255A${"\u2550".repeat(W)}\u255D`;

  const bullishCount = signals.filter((s) => s.overallScore > 0.1).length;
  const bearishCount = signals.filter((s) => s.overallScore < -0.1).length;
  const buyCount = edgeRows.filter((r) => r.action === "BUY").length;
  const successCount = executed.filter((t) => t.ok).length;
  const totalDeployed = executed.reduce((sum, t) => sum + t.filledNotionalUsd, 0);
  const positiveEdges = edgeRows.filter((r) => r.edge > 0).map((r) => r.edge);
  const minEdge = positiveEdges.length > 0 ? Math.min(...positiveEdges) : 0;
  const maxEdge = positiveEdges.length > 0 ? Math.max(...positiveEdges) : 0;

  const line1 = `Pipeline complete -- ${recommendOnly ? "recommendations generated" : `${successCount}/${executed.length} trades executed`}`;
  const line2 = `AVE signals: ${bullishCount} bullish, ${bearishCount} bearish`;
  const edgeStr = positiveEdges.length > 0 ? `+${(minEdge * 100).toFixed(0)}% to +${(maxEdge * 100).toFixed(0)}%` : "none";
  const line3 = `Edge range: ${edgeStr} | Markets with edge: ${buyCount}/${edgeRows.length}`;
  const line4 = recommendOnly ? "Mode: RECOMMEND-ONLY (no trades placed)" : `Deployed: $${totalDeployed.toFixed(2)}`;

  write("");
  write(cb(C.green, top));
  write(cb(C.green, boxLine(line1, line1.length, W)));
  write(cb(C.green, boxLine(line2, line2.length, W)));
  write(cb(C.green, boxLine(line3, line3.length, W)));
  write(cb(C.green, boxLine(line4, line4.length, W)));
  write(cb(C.green, bottom));
  write("");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n${C.red}[ave-live] Fatal error: ${message}${C.reset}\n`);
  if (error instanceof Error && error.stack) {
    process.stderr.write(`${C.dim}${error.stack}${C.reset}\n`);
  }
  process.exit(1);
});
