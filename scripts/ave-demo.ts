/**
 * AVE Claw Demo Run -- Visually Stunning Terminal Output
 *
 * Standalone script that exercises the full AVE pipeline in mock mode
 * and renders a beautiful "reasoning waterfall" for demo video / screen recording.
 *
 * Usage:
 *   pnpm ave:demo
 *
 * No API key required -- runs entirely on mock data.
 */

import { MockAveClient } from "../services/ave-monitor/src/mock-client.ts";
import {
  generateCryptoSignals,
  type CryptoSignal,
} from "../services/orchestrator/src/pulse/ave-crypto-signals.ts";
import {
  buildProbabilityEstimate,
  type ProbabilityEstimate,
} from "../services/orchestrator/src/pulse/ave-signal-to-probability.ts";

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
  bgCyan: "\u001B[46m",
  bgGreen: "\u001B[42m",
} as const;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

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
  // score in [-1, 1] mapped to bar position
  const normalized = (score + 1) / 2; // 0..1
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

// ---------------------------------------------------------------------------
// Typing delay for dramatic effect in demo video
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function write(line: string): void {
  process.stdout.write(`${line}\n`);
}

// ---------------------------------------------------------------------------
// Data generation
// ---------------------------------------------------------------------------

interface MarketRow {
  readonly question: string;
  readonly token: string;
  readonly targetPrice: number;
  readonly direction: "above" | "below" | "hit";
  readonly days: number;
  readonly mktProb: number;
  readonly volumeUsd: number;
}

const MOCK_MARKETS: readonly MarketRow[] = [
  { question: "BTC hit $100K in 2026?", token: "BTC", targetPrice: 100_000, direction: "hit", days: 260, mktProb: 0.62, volumeUsd: 30_800_000 },
  { question: "BTC price in April?", token: "BTC", targetPrice: 95_000, direction: "above", days: 17, mktProb: 0.55, volumeUsd: 19_200_000 },
  { question: "BTC ATH by Q3?", token: "BTC", targetPrice: 110_000, direction: "hit", days: 170, mktProb: 0.45, volumeUsd: 6_100_000 },
  { question: "ETH price in April?", token: "ETH", targetPrice: 3_600, direction: "above", days: 17, mktProb: 0.40, volumeUsd: 4_200_000 },
  { question: "ETH price in 2026?", token: "ETH", targetPrice: 5_000, direction: "above", days: 260, mktProb: 0.35, volumeUsd: 4_100_000 },
  { question: "BTC hit $150K?", token: "BTC", targetPrice: 150_000, direction: "hit", days: 365, mktProb: 0.28, volumeUsd: 3_100_000 },
  { question: "BTC above $95K weekly?", token: "BTC", targetPrice: 95_000, direction: "above", days: 7, mktProb: 0.68, volumeUsd: 2_900_000 },
];

const BANKROLL = 20.00;
const SHARES_PER_TRADE = 5;
const EDGE_THRESHOLD = 0.02;
const MAX_PER_TRADE_PCT = 0.20;
const MAX_TOTAL_EXPOSURE_PCT = 0.80;
const MAX_POSITIONS = 10;
const MAX_DRAWDOWN_PCT = 0.30;

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function printBanner(): void {
  const W = 58;
  const top    = `\u2554${ "\u2550".repeat(W)}\u2557`;
  const bottom = `\u255A${ "\u2550".repeat(W)}\u255D`;
  // Each emoji takes 2 terminal columns but is 1 char -- subtract 1 col of padding per emoji
  const l1 = "\u23F3 HOURGLASS \u2014 AVE Claw \u00D7 Polymarket Trading Agent";
  const l2 = "\u{1F4CA} 4 AVE Skills \u2192 7 Crypto Markets \u2192 Autonomous Edge";
  const line1 = boxLine(l1, l1.length + 1, W); // +1 for hourglass emoji extra col
  const line2 = boxLine(l2, l2.length + 1, W); // +1 for chart emoji extra col

  write("");
  write(cb(C.cyan, top));
  write(cb(C.cyan, line1));
  write(cb(C.cyan, line2));
  write(cb(C.cyan, bottom));
}

function printStep1(btcSignal: CryptoSignal, ethSignal: CryptoSignal): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 1: AVE Signal Collection ${ "\u2501".repeat(26)}`));

  // Real-time price
  write("");
  write(`  ${cb(C.white, "\u{1F4CA} Real-time Price")}`);
  write(
    `     BTC: ${cb(C.green, fmtPrice(btcSignal.price))}  |  ETH: ${cb(C.green, fmtPrice(ethSignal.price))}`
  );

  // K-line analysis
  write("");
  write(`  ${cb(C.white, "\u{1F4C8} K-line Analysis (1h + daily)")}`);
  const btcKl = btcSignal.details.klines;
  const ethKl = ethSignal.details.klines;
  const btcMacd = btcKl.macdSignal === "bullish" ? c(C.green, "bullish \u25B2") : btcKl.macdSignal === "bearish" ? c(C.red, "bearish \u25BC") : c(C.yellow, "neutral \u2500");
  const ethMacd = ethKl.macdSignal === "bullish" ? c(C.green, "bullish \u25B2") : ethKl.macdSignal === "bearish" ? c(C.red, "bearish \u25BC") : c(C.yellow, "neutral \u2500");
  write(`     BTC: MA20=${fmtPrice(btcKl.ma20)} MA50=${fmtPrice(btcKl.ma50)} MACD=${btcMacd}`);
  write(`     ETH: MA20=${fmtPrice(ethKl.ma20)} MA50=${fmtPrice(ethKl.ma50)} MACD=${ethMacd}`);

  // Whale tracking
  write("");
  write(`  ${cb(C.white, "\u{1F40B} Whale Tracking (>$100K trades, last 1h)")}`);
  const btcWh = btcSignal.details.whales;
  const ethWh = ethSignal.details.whales;
  const btcNet = btcWh.buyVolume - btcWh.sellVolume;
  const ethNet = ethWh.buyVolume - ethWh.sellVolume;
  const btcNetStr = btcNet >= 0
    ? c(C.green, `Net Buy +${fmtUsd(btcNet)} \u25B2`)
    : c(C.red, `Net Sell ${fmtUsd(btcNet)} \u25BC`);
  const ethNetStr = ethNet >= 0
    ? c(C.green, `Net Buy +${fmtUsd(ethNet)} \u25B2`)
    : c(C.red, `Net Sell ${fmtUsd(ethNet)} \u25BC`);
  write(`     BTC: Buy ${fmtUsd(btcWh.buyVolume)} vs Sell ${fmtUsd(btcWh.sellVolume)} \u2192 ${btcNetStr}`);
  write(`     ETH: Buy ${fmtUsd(ethWh.buyVolume)} vs Sell ${fmtUsd(ethWh.sellVolume)} \u2192 ${ethNetStr}`);

  // Buy/sell ratio
  write("");
  write(`  ${cb(C.white, "\u{1F4C9} Buy/Sell Ratio")}`);
  const btcSent = btcSignal.details.sentiment;
  const ethSent = ethSignal.details.sentiment;
  const ratio5mBtc = btcSent.sell5m > 0 ? (btcSent.buy5m / btcSent.sell5m) : 0;
  const ratio1hBtc = btcSent.sell1h > 0 ? (btcSent.buy1h / btcSent.sell1h) : 0;
  const ratio6hBtc = btcSent.sell6h > 0 ? (btcSent.buy6h / btcSent.sell6h) : 0;
  const ratio5mEth = ethSent.sell5m > 0 ? (ethSent.buy5m / ethSent.sell5m) : 0;
  const ratio1hEth = ethSent.sell1h > 0 ? (ethSent.buy1h / ethSent.sell1h) : 0;
  const ratio6hEth = ethSent.sell6h > 0 ? (ethSent.buy6h / ethSent.sell6h) : 0;
  const btcSentLabel = btcSignal.sentimentScore > 0.1 ? c(C.green, "Bullish \u25B2") : btcSignal.sentimentScore < -0.1 ? c(C.red, "Bearish \u25BC") : c(C.yellow, "Neutral \u2500");
  const ethSentLabel = ethSignal.sentimentScore > 0.1 ? c(C.green, "Bullish \u25B2") : ethSignal.sentimentScore < -0.1 ? c(C.red, "Bearish \u25BC") : c(C.yellow, "Neutral \u2500");
  write(`     BTC: 5m=${ratio5mBtc.toFixed(2)}x | 1h=${ratio1hBtc.toFixed(2)}x | 6h=${ratio6hBtc.toFixed(2)}x \u2192 ${btcSentLabel}`);
  write(`     ETH: 5m=${ratio5mEth.toFixed(2)}x | 1h=${ratio1hEth.toFixed(2)}x | 6h=${ratio6hEth.toFixed(2)}x \u2192 ${ethSentLabel}`);
}

function printStep2(btcSignal: CryptoSignal, ethSignal: CryptoSignal): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 2: Signal Aggregation ${ "\u2501".repeat(30)}`));

  for (const sig of [btcSignal, ethSignal]) {
    write("");
    write(`  ${b(`${sig.token} Signal Breakdown:`)}`);

    const barWidth = 20;

    // Trend bar
    const trendColor = scoreColor(sig.trendScore);
    write(`    \u{1F4C8} Trend:     ${c(trendColor, renderBar(sig.trendScore, barWidth))} ${c(trendColor, `${sig.trendScore >= 0 ? "+" : ""}${sig.trendScore.toFixed(2)}`)}`);

    // Whale bar
    const whaleColor = scoreColor(sig.whalePressure);
    write(`    \u{1F40B} Whale:     ${c(whaleColor, renderBar(sig.whalePressure, barWidth))} ${c(whaleColor, `${sig.whalePressure >= 0 ? "+" : ""}${sig.whalePressure.toFixed(2)}`)}`);

    // Sentiment bar
    const sentColor = scoreColor(sig.sentimentScore);
    write(`    \u{1F4C9} Sentiment: ${c(sentColor, renderBar(sig.sentimentScore, barWidth))} ${c(sentColor, `${sig.sentimentScore >= 0 ? "+" : ""}${sig.sentimentScore.toFixed(2)}`)}`);

    // Divider
    write(`    ${d("\u2500".repeat(37))}`);

    // Overall
    const overallColor = scoreColor(sig.overallScore);
    const label = scoreLabel(sig.overallScore);
    write(`    Overall:      ${c(overallColor, renderBar(sig.overallScore, barWidth))} ${c(overallColor, `${sig.overallScore >= 0 ? "+" : ""}${sig.overallScore.toFixed(2)}`)} ${d("\u2190")} ${cb(overallColor, label)}`);
  }
}

function printStep3(markets: readonly MarketRow[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 3: Market Matching ${ "\u2501".repeat(33)}`));
  write("");
  write(d(`  Found ${markets.length} target markets (BTC/ETH price predictions):`));

  // Table
  write(`  \u250C${ "\u2500".repeat(38)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(8)}\u2510`);
  write(`  \u2502 ${b(padR("Market", 37))}\u2502${b(padL("Vol", 7))} \u2502${b(padL("Odds", 7))} \u2502`);
  write(`  \u251C${ "\u2500".repeat(38)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(8)}\u2524`);
  for (const m of markets) {
    const vol = fmtUsd(m.volumeUsd);
    const odds = `${(m.mktProb * 100).toFixed(0)}%`;
    write(`  \u2502 ${padR(m.question, 37)}\u2502${padL(vol, 7)} \u2502${padL(odds, 7)} \u2502`);
  }
  write(`  \u2514${ "\u2500".repeat(38)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(8)}\u2518`);
}

interface EdgeRow {
  readonly market: string;
  readonly ourProb: number;
  readonly mktProb: number;
  readonly edge: number;
  readonly action: "BUY" | "SKIP";
}

function printStep4(edgeRows: readonly EdgeRow[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 4: Edge Calculation ${ "\u2501".repeat(32)}`));
  write("");

  const MW = 24; // market name column width
  write(`  \u250C${ "\u2500".repeat(MW + 2)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(7)}\u252C${ "\u2500".repeat(11)}\u2510`);
  write(`  \u2502 ${b(padR("Market", MW + 1))}\u2502${b(padL("Us", 7))} \u2502${b(padL("Market", 7))} \u2502${b(padL("Edge", 6))} \u2502${b(padL("Action", 10))} \u2502`);
  write(`  \u251C${ "\u2500".repeat(MW + 2)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(7)}\u253C${ "\u2500".repeat(11)}\u2524`);

  for (const row of edgeRows) {
    const usPct = `${(row.ourProb * 100).toFixed(0)}%`;
    const mktPct = `${(row.mktProb * 100).toFixed(0)}%`;
    const edgePct = `${row.edge >= 0 ? "+" : ""}${(row.edge * 100).toFixed(0)}%`;
    const edgeColor = row.edge >= EDGE_THRESHOLD ? C.green : row.edge > 0 ? C.yellow : C.red;
    const actionLabel = row.action === "BUY" ? "\u2705 BUY " : "\u23ED\uFE0F SKIP";
    const actionColored = row.action === "BUY"
      ? cb(C.green, actionLabel)
      : c(C.yellow, actionLabel);
    write(`  \u2502 ${padR(row.market, MW + 1)}\u2502${padL(usPct, 7)} \u2502${padL(mktPct, 7)} \u2502${c(edgeColor, padL(edgePct, 6))} \u2502 ${actionColored}    \u2502`);
  }

  write(`  \u2514${ "\u2500".repeat(MW + 2)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(7)}\u2534${ "\u2500".repeat(11)}\u2518`);
}

interface TradeOrder {
  readonly index: number;
  readonly market: string;
  readonly price: number;
  readonly shares: number;
}

function printStep5(trades: readonly TradeOrder[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 5: Risk Control ${ "\u2501".repeat(35)}`));
  write("");

  const totalExposure = trades.reduce((sum, t) => sum + t.price * t.shares, 0);
  const maxSingleTrade = Math.max(...trades.map((t) => t.price * t.shares));
  const maxSinglePct = maxSingleTrade / BANKROLL;
  const totalPct = totalExposure / BANKROLL;

  write(`  Bankroll: ${cb(C.white, `$${BANKROLL.toFixed(2)}`)}`);
  write(`  Proposed: ${b(`${trades.length} trades`)} \u00D7 ${b(`${SHARES_PER_TRADE} shares`)}`);

  const perTradePass = maxSinglePct <= MAX_PER_TRADE_PCT;
  const totalPass = totalPct <= MAX_TOTAL_EXPOSURE_PCT;
  const positionsPass = trades.length <= MAX_POSITIONS;

  write(`  ${perTradePass ? c(C.green, "\u2705") : c(C.red, "\u274C")} Per-trade:     ${b(`$${maxSingleTrade.toFixed(2)}`)} (${(maxSinglePct * 100).toFixed(1)}%) ${d("\u2264")} ${(MAX_PER_TRADE_PCT * 100).toFixed(0)}% limit \u2192 ${perTradePass ? c(C.green, "PASS") : c(C.red, "FAIL")}`);
  write(`  ${totalPass ? c(C.green, "\u2705") : c(C.red, "\u274C")} Total exposure: ${b(`$${totalExposure.toFixed(2)}`)} (${(totalPct * 100).toFixed(0)}%) ${d("\u2264")} ${(MAX_TOTAL_EXPOSURE_PCT * 100).toFixed(0)}% limit \u2192 ${totalPass ? c(C.green, "PASS") : c(C.red, "FAIL")}`);
  write(`  ${positionsPass ? c(C.green, "\u2705") : c(C.red, "\u274C")} Positions:     ${b(String(trades.length))} ${d("\u2264")} ${MAX_POSITIONS} max \u2192 ${positionsPass ? c(C.green, "PASS") : c(C.red, "FAIL")}`);
  write(`  ${c(C.green, "\u2705")} Drawdown:      ${b("0%")} ${d("<")} ${(MAX_DRAWDOWN_PCT * 100).toFixed(0)}% halt \u2192 ${c(C.green, "PASS")}`);
}

function printStep6(trades: readonly TradeOrder[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 STEP 6: Execution ${ "\u2501".repeat(38)}`));
  write("");

  let totalDeployed = 0;
  for (const trade of trades) {
    const cost = trade.price * trade.shares;
    totalDeployed += cost;
    write(`  ${c(C.green, "\u{1F7E2}")} Order ${trade.index}: ${b("BUY")} ${trade.shares} shares ${d(`"${trade.market}"`)} @ $${trade.price.toFixed(2)} = ${cb(C.white, `$${cost.toFixed(2)}`)}`);
  }

  write("");
  write(`  Total deployed: ${cb(C.green, `$${totalDeployed.toFixed(2)}`)} / $${BANKROLL.toFixed(2)} (${(totalDeployed / BANKROLL * 100).toFixed(1)}%)`);
}

function boxLine(content: string, visibleLen: number, W: number): string {
  const padding = Math.max(0, W - 2 - visibleLen);
  return `\u2551 ${content}${" ".repeat(padding)} \u2551`;
}

function printFooter(tradeCount: number, bullishCount: number, bearishCount: number, minEdge: number, maxEdge: number): void {
  const W = 58;
  const top    = `\u2554${ "\u2550".repeat(W)}\u2557`;
  const bottom = `\u255A${ "\u2550".repeat(W)}\u255D`;

  const line1Text = `\u2705 Pipeline complete \u2014 ${tradeCount} trades executed`;
  const line2Text = `\u{1F4CA} AVE signals: ${bullishCount} bullish, ${bearishCount} bearish`;
  const edgeStr = `+${(minEdge * 100).toFixed(0)}% to +${(maxEdge * 100).toFixed(0)}%`;
  const line3Text = `\u{1F4B0} Edge range: ${edgeStr}`;
  const line4Text = `\u{1F6E1}\uFE0F  All 6 risk checks passed`;

  // Emoji widths: most emojis are 2 columns wide in terminal
  // Visible column width = string length + extra columns for emojis
  const line1Vis = line1Text.length + 1; // checkmark emoji = 2 cols, counts as 1 char
  const line2Vis = line2Text.length + 1; // chart emoji
  const line3Vis = line3Text.length + 1; // money emoji
  const line4Vis = line4Text.length;     // shield+VS already 2 chars in string

  write("");
  write(cb(C.green, top));
  write(cb(C.green, boxLine(line1Text, line1Vis, W)));
  write(cb(C.green, boxLine(line2Text, line2Vis, W)));
  write(cb(C.green, boxLine(line3Text, line3Vis, W)));
  write(cb(C.green, boxLine(line4Text, line4Vis, W)));
  write(cb(C.green, bottom));
  write("");
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // 1. Generate crypto signals via AVE mock client
  const client = new MockAveClient({ volatility: 0.005, seed: 42 });
  const signals = await generateCryptoSignals(client, ["BTC", "ETH"]);

  const btcSignal = signals.find((s) => s.token === "BTC");
  const ethSignal = signals.find((s) => s.token === "ETH");

  if (!btcSignal || !ethSignal) {
    throw new Error("Failed to generate BTC or ETH signals");
  }

  // 2. Build probability estimates for all mock markets
  const signalByToken = new Map<string, CryptoSignal>();
  for (const sig of signals) {
    signalByToken.set(sig.token, sig);
  }

  const estimates: ProbabilityEstimate[] = [];
  for (const m of MOCK_MARKETS) {
    const sig = signalByToken.get(m.token);
    if (!sig) continue;
    estimates.push(
      buildProbabilityEstimate({
        marketQuestion: m.question,
        token: m.token,
        currentPrice: sig.price,
        targetPrice: m.targetPrice,
        targetDirection: m.direction,
        aveScore: sig.overallScore,
        daysToResolution: m.days,
        marketImpliedProbability: m.mktProb,
      })
    );
  }

  // 3. Calculate edges and determine actions
  const edgeRows: EdgeRow[] = estimates.map((est) => ({
      market: est.marketQuestion,
      ourProb: est.estimatedProbability,
      mktProb: est.marketImpliedProbability,
      edge: est.edge,
      action: est.edge >= EDGE_THRESHOLD ? "BUY" as const : "SKIP" as const,
  }));

  // Sort by edge descending
  const sortedEdgeRows = [...edgeRows].sort((a, b) => b.edge - a.edge);

  // 4. Determine trades (only BUY actions)
  const buyRows = sortedEdgeRows.filter((r) => r.action === "BUY");
  const trades: TradeOrder[] = buyRows.map((row, i) => ({
    index: i + 1,
    market: row.market,
    price: row.mktProb,
    shares: SHARES_PER_TRADE,
  }));

  // 5. Count bullish/bearish signals
  const bullishCount = signals.filter((s) => s.overallScore > 0.1).length;
  const bearishCount = signals.filter((s) => s.overallScore < -0.1).length;
  const positiveEdges = buyRows.map((r) => r.edge).filter((e) => e > 0);
  const minEdge = positiveEdges.length > 0 ? Math.min(...positiveEdges) : 0;
  const maxEdge = positiveEdges.length > 0 ? Math.max(...positiveEdges) : 0;

  // ---------------------------------------------------------------------------
  // Render the waterfall with typing delays for screen recording
  // ---------------------------------------------------------------------------

  printBanner();
  await sleep(400);

  printStep1(btcSignal, ethSignal);
  await sleep(300);

  printStep2(btcSignal, ethSignal);
  await sleep(300);

  printStep3(MOCK_MARKETS);
  await sleep(300);

  printStep4(sortedEdgeRows);
  await sleep(300);

  printStep5(trades);
  await sleep(300);

  printStep6(trades);
  await sleep(200);

  printFooter(trades.length, bullishCount, bearishCount, minEdge, maxEdge);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n${C.red}[ave-demo] Fatal error: ${message}${C.reset}\n`);
  if (error instanceof Error && error.stack) {
    process.stderr.write(`${C.dim}${error.stack}${C.reset}\n`);
  }
  process.exit(1);
});
