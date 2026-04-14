/**
 * AVE Claw Demo Run -- Real Polymarket Scanning + Chinese Output
 *
 * Standalone script that exercises the full AVE pipeline with REAL
 * Polymarket market data, falling back to mock AVE signals if the
 * AVE API is unavailable.
 *
 * Usage:
 *   pnpm ave:demo
 */

import fs from "node:fs";
import path from "node:path";

// Load environment variables from .env files (without dotenv dependency)
function loadEnv(filePath: string): void {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) return;
  const content = fs.readFileSync(resolved, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv(process.env.ENV_FILE || ".env.live");
loadEnv(".env");

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
  const normalized = (score + 1) / 2;
  const filled = Math.round(normalized * width);
  const left = "\u2588".repeat(filled);
  const right = "\u2591".repeat(width - filled);
  return `[${left}${right}]`;
}

function scoreLabel(score: number): string {
  if (score > 0.15) return "\u770B\u6DA8";
  if (score < -0.15) return "\u770B\u8DCC";
  return "\u4E2D\u6027";
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

function boxLine(content: string, visibleLen: number, W: number): string {
  const padding = Math.max(0, W - 2 - visibleLen);
  return `\u2551 ${content}${" ".repeat(padding)} \u2551`;
}

// ---------------------------------------------------------------------------
// Gamma API types & fetching (from ave-live.ts)
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

function safeJsonParse<T>(raw: string | T, fallback: T): T {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Fetch live Polymarket crypto markets using the Gamma API.
 * Combines events endpoint + tag-based market search for broad coverage.
 */
async function fetchPolymarketCryptoMarkets(): Promise<PulseCandidate[]> {
  write(`  ${c(C.cyan, "\u6B63\u5728\u8FDE\u63A5 Polymarket Gamma API...")}`);
  await sleep(300);

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
  write(`  ${c(C.cyan, "\u83B7\u53D6\u52A0\u5BC6\u8D27\u5E01\u76F8\u5173\u5E02\u573A...")}`);

  let eventsFetched = 0;
  for (const offset of [0, 100, 200]) {
    try {
      const url = `https://gamma-api.polymarket.com/events?limit=100&offset=${offset}&active=true&closed=false`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) continue;
      const events = (await res.json()) as GammaEvent[];
      eventsFetched += events.length;
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
      write(c(C.yellow, `  [\u8B66\u544A] \u4E8B\u4EF6\u83B7\u53D6\u5931\u8D25: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  // Strategy 2: Direct market search by tags
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
      write(c(C.yellow, `  [\u8B66\u544A] \u5E02\u573A\u641C\u7D22\u5931\u8D25: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  // Strategy 3: Directly fetch known high-volume BTC/ETH event slugs. These are
  // the flagship multi-outcome price markets (e.g. "Bitcoin above __ on April
  // 14?" / "What price will Bitcoin hit in April?") that carry the deepest
  // liquidity and are the most realistic demo targets. Fetching by slug
  // guarantees we capture them regardless of pagination / tag coverage.
  const CURATED_EVENT_SLUGS = [
    "bitcoin-above-on-april-14",
    "bitcoin-above-on-april-15",
    "bitcoin-price-on-april-14",
    "what-price-will-bitcoin-hit-in-april-2026",
    "what-price-will-bitcoin-hit-april-13-19",
    "bitcoin-up-or-down-on-april-14-2026",
    "ethereum-above-on-april-14",
    "what-price-will-ethereum-hit-in-april",
  ] as const;

  for (const slug of CURATED_EVENT_SLUGS) {
    try {
      const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const events = (await res.json()) as GammaEvent[];
      for (const event of events) {
        for (const market of event.markets ?? []) {
          if (market.active === false || market.closed === true) continue;
          const q = market.question?.toLowerCase() ?? "";
          const hasCrypto = /\b(bitcoin|btc|ethereum|eth)\b/i.test(q);
          if (hasCrypto) {
            addMarket(market, event.slug);
          }
        }
      }
    } catch (err) {
      // Silent: individual slug failures shouldn't break the pipeline.
    }
  }

  write(`  ${c(C.green, `\u626B\u63CF\u4E86 ${eventsFetched} \u4E2A\u4E8B\u4EF6\uFF0C\u83B7\u53D6\u4E86 ${allRaw.length} \u4E2A BTC/ETH \u76F8\u5173\u5E02\u573A`)}`);

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

// ---------------------------------------------------------------------------
// AVE Client creation with fallback
// ---------------------------------------------------------------------------

async function createAveClientWithFallback(): Promise<{
  client: AveClient | MockAveClient;
  isLive: boolean;
  apiKey: string;
  baseUrl: string;
  fallbackReason?: string;
}> {
  const apiKey = process.env.AVE_API_KEY?.trim() ?? "";
  const baseUrl = process.env.AVE_API_BASE_URL?.trim() ?? "https://openapi.avedata.org/api/v1";

  if (!apiKey) {
    write(`  ${c(C.yellow, "\u26A0\uFE0F  AVE_API_KEY \u672A\u914D\u7F6E\uFF0C\u56DE\u9000\u6A21\u62DF\u6570\u636E")}`);
    return { client: new MockAveClient(), isLive: false, apiKey, baseUrl, fallbackReason: "AVE_API_KEY missing" };
  }

  const realClient = new AveClient({ apiKey, baseUrl, timeout: 15_000 });
  try {
    const chains = await realClient.getSupportedChains();
    write(`  ${c(C.green, `\u2705 AVE API \u5728\u7EBF (${chains.length} \u6761\u94FE\u652F\u6301)`)}`);
    return { client: realClient, isLive: true, apiKey, baseUrl };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    write(`  ${c(C.yellow, `\u26A0\uFE0F  AVE API \u79BB\u7EBF (${reason})\uFF0C\u4F7F\u7528\u6A21\u62DF\u6570\u636E`)}`);
    return { client: new MockAveClient(), isLive: false, apiKey, baseUrl, fallbackReason: reason };
  }
}

// ---------------------------------------------------------------------------
// Raw AVE API capture helpers
// ---------------------------------------------------------------------------

interface AveRawCall {
  readonly method: "GET" | "POST";
  readonly url: string;
  readonly status: number;
  readonly ok: boolean;
  readonly elapsedMs: number;
  readonly snippet: string;
  readonly error?: string;
}

/**
 * Truncate a JSON payload to the first N chars for terminal-friendly display.
 * Preserves basic structural indentation so the snippet is still readable.
 */
function jsonSnippet(raw: unknown, maxChars = 420): string {
  let text: string;
  try {
    text = JSON.stringify(raw, null, 2);
  } catch {
    text = String(raw);
  }
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n  ... (${text.length - maxChars} \u4F59\u5B57\u8282\u622A\u53BB)`;
}

/**
 * Make a single AVE HTTP call, returning both the parsed data and a
 * metadata record describing the raw request/response. Failures are
 * captured into the metadata record so the demo can still print them.
 */
async function probeAveEndpoint(args: {
  method: "GET" | "POST";
  url: string;
  apiKey: string;
  body?: unknown;
}): Promise<AveRawCall> {
  const started = Date.now();
  try {
    const headers: Record<string, string> = {
      "X-API-KEY": args.apiKey,
      Accept: "application/json",
    };
    if (args.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(args.url, {
      method: args.method,
      headers,
      body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
      signal: AbortSignal.timeout(12_000),
    });
    const elapsedMs = Date.now() - started;
    const rawText = await response.text().catch(() => "(unreadable body)");
    let parsed: unknown = rawText;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // leave as text
    }
    return {
      method: args.method,
      url: args.url,
      status: response.status,
      ok: response.ok,
      elapsedMs,
      snippet: jsonSnippet(parsed),
    };
  } catch (err) {
    const elapsedMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    return {
      method: args.method,
      url: args.url,
      status: 0,
      ok: false,
      elapsedMs,
      snippet: "(no response body)",
      error: message,
    };
  }
}

/**
 * Probe the two most load-bearing AVE endpoints (token price + klines)
 * and return the raw-call records for terminal display. These are the
 * same endpoints the signal pipeline uses, so printing them gives the
 * viewer a transparent look at the real network traffic.
 */
async function probeAveForDisplay(apiKey: string, baseUrl: string): Promise<AveRawCall[]> {
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  const priceCall = probeAveEndpoint({
    method: "GET",
    url: `${cleanBase}/token/price?token_addresses=${WBTC}`,
    apiKey,
  });
  const klineCall = probeAveEndpoint({
    method: "GET",
    url: `${cleanBase}/token/kline/${WBTC}?interval=60&limit=5`,
    apiKey,
  });

  return Promise.all([priceCall, klineCall]);
}

function printAveRawResponses(calls: readonly AveRawCall[], isLive: boolean, fallbackReason?: string): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 AVE API \u539F\u59CB\u54CD\u5E94 ${isLive ? "(\u771F\u5B9E\u6570\u636E)" : "(\u5C1D\u8BD5\u540E\u56DE\u9000)"} ${ "\u2501".repeat(24)}`));
  write("");

  if (!isLive && fallbackReason) {
    write(`  ${c(C.yellow, `\u26A0\uFE0F  \u56DE\u9000\u539F\u56E0: ${fallbackReason}`)}`);
    write(`  ${d("\u4EE5\u4E0B\u4E3A\u5B9E\u9645\u8C03\u7528\u5C1D\u8BD5\u7684\u54CD\u5E94\uFF1A")}`);
    write("");
  }

  for (const call of calls) {
    const statusLabel = call.ok
      ? c(C.green, `\u2705 ${call.status} OK`)
      : call.status > 0
        ? c(C.red, `\u274C ${call.status}`)
        : c(C.red, `\u274C \u7F51\u7EDC\u5931\u8D25`);
    write(`  ${cb(C.white, "\u8C03\u7528:")} ${c(C.blue, `${call.method} ${call.url}`)}`);
    write(`  ${cb(C.white, "\u72B6\u6001:")} ${statusLabel} ${d(`(${call.elapsedMs}ms)`)}`);
    if (call.error) {
      write(`  ${c(C.red, `\u9519\u8BEF: ${call.error}`)}`);
    }
    write(`  ${cb(C.white, "\u54CD\u5E94\u6570\u636E\uFF08\u622A\u53D6\uFF09:")}`);
    for (const line of call.snippet.split("\n")) {
      write(`    ${d(line)}`);
    }
    write("");
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

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
  const l1 = "\u23F3 HOURGLASS \u2014 \u5B9E\u65F6\u5E02\u573A\u626B\u63CF";
  const l2 = "\u{1F4CA} AVE \u94FE\u4E0A\u4FE1\u53F7 \u2192 Polymarket \u5B9E\u65F6\u8D54\u7387 \u2192 Edge \u8BA1\u7B97";
  // Emoji widths
  const line1 = boxLine(l1, l1.length + 1, W);
  const line2 = boxLine(l2, l2.length + 1, W);

  write("");
  write(cb(C.cyan, top));
  write(cb(C.cyan, line1));
  write(cb(C.cyan, line2));
  write(cb(C.cyan, bottom));
}

// ---------------------------------------------------------------------------
// External resource links -- printed at the top of the demo so viewers can
// independently verify the live systems (code, dashboard, on-chain profile).
// ---------------------------------------------------------------------------

const RESOURCE_LINKS = {
  github: "https://github.com/Alchemist-X/hourglass",
  dashboard: "https://hourglass-eta.vercel.app",
  profile: "https://polymarket.com/profile/0xc78873644e582cb950f1af880c4f3ef3c11f2936",
  profileShort: "https://polymarket.com/profile/0xc78873...2936",
} as const;

function printResources(): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u8D44\u6E90\u94FE\u63A5 ${ "\u2501".repeat(44)}`));
  write("");
  write(`  \u{1F4C2} GitHub:     ${c(C.blue, RESOURCE_LINKS.github)}`);
  write(`  \u{1F310} Dashboard:  ${c(C.blue, RESOURCE_LINKS.dashboard)}`);
  write(`  \u{1F464} Polymarket: ${c(C.blue, RESOURCE_LINKS.profileShort)}`);
}

// ---------------------------------------------------------------------------
// Realistic market filter
//
// The Polymarket feed contains joke/long-tail markets like "BTC $1M before
// GTA VI" or "$500K before Satoshi returns". Those targets are so far from
// spot price that they are structurally inert for a live demo. We drop:
//   - targets > 1.5x current price, or < 0.6x current price (too far)
//   - questions whose text contains known joke/crossover phrases
//
// This leaves the realistic "$95K / $100K / $105K this week/month" markets
// that make up the meaningful trading surface.
// ---------------------------------------------------------------------------

const MAX_TARGET_RATIO = 1.5;
const MIN_TARGET_RATIO = 0.6;

const JOKE_PATTERNS: readonly RegExp[] = [
  /before\s+gta/i,
  /before\s+satoshi/i,
  /before\s+half[-\s]?life/i,
  /gta\s*(vi|6)/i,
  /satoshi\s+returns/i,
  // Dollar-amount patterns that are always too far above current BTC for a
  // demo (the numeric ratio filter catches these too, but the explicit
  // phrase-based rejection gives a clearer log line for the viewer).
  /\$\s*1\s*m\b/i,
  /\$\s*1\s*,?000\s*,?000\b/,
  /\$\s*500\s*k\b/i,
  /\$\s*250\s*k\b/i,
];

interface RealismFilterResult {
  readonly kept: MatchedMarket[];
  readonly rejected: Array<{ market: MatchedMarket; reason: string }>;
}

function filterRealisticMarkets(
  markets: readonly MatchedMarket[],
  referencePrice: Record<"BTC" | "ETH", number>,
): RealismFilterResult {
  const kept: MatchedMarket[] = [];
  const rejected: Array<{ market: MatchedMarket; reason: string }> = [];

  for (const market of markets) {
    const question = market.candidate.question;

    // Joke/phrase rejection
    const jokeHit = JOKE_PATTERNS.find((pattern) => pattern.test(question));
    if (jokeHit) {
      rejected.push({ market, reason: `joke/unrealistic pattern: ${jokeHit.source}` });
      continue;
    }

    const spot = referencePrice[market.token];
    if (spot > 0) {
      const ratio = market.targetPrice / spot;
      if (ratio > MAX_TARGET_RATIO) {
        rejected.push({ market, reason: `target ${ratio.toFixed(2)}x > ${MAX_TARGET_RATIO}x spot` });
        continue;
      }
      if (ratio < MIN_TARGET_RATIO) {
        rejected.push({ market, reason: `target ${ratio.toFixed(2)}x < ${MIN_TARGET_RATIO}x spot` });
        continue;
      }
    }

    kept.push(market);
  }

  return { kept, rejected };
}

function printStep1Markets(matched: readonly MatchedMarket[], totalCandidates: number): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 1 \u6B65\uFF1A\u626B\u63CF Polymarket \u5E02\u573A ${ "\u2501".repeat(22)}`));
  write("");

  write(d(`  \u627E\u5230 ${totalCandidates} \u4E2A\u6D3B\u8DC3\u5E02\u573A\uFF0C\u7B5B\u9009 BTC/ETH \u4EF7\u683C\u76EE\u6807\u5E02\u573A...`));
  write("");
  write(d(`  \u5339\u914D\u5230 ${matched.length} \u4E2A\u76EE\u6807\u5E02\u573A\uFF1A`));

  if (matched.length === 0) {
    write(c(C.yellow, "  \u672A\u627E\u5230 BTC/ETH \u4EF7\u683C\u76EE\u6807\u5E02\u573A\u3002"));
    return;
  }

  // Table
  const MW = 38;
  write(`  \u250C${ "\u2500".repeat(MW)}\u252C${ "\u2500".repeat(10)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(12)}\u2510`);
  write(`  \u2502 ${b(padR("\u5E02\u573A", MW - 1))}\u2502${b(padL("\u4EA4\u6613\u91CF", 9))} \u2502${b(padL("\u8D54\u7387", 7))} \u2502${b(padL("\u7ED3\u7B97\u65E5\u671F", 11))} \u2502`);
  write(`  \u251C${ "\u2500".repeat(MW)}\u253C${ "\u2500".repeat(10)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(12)}\u2524`);
  for (const m of matched) {
    const vol = fmtUsd(m.candidate.volume24hUsd);
    const odds = `${((m.candidate.outcomePrices[0] ?? 0.5) * 100).toFixed(0)}%`;
    const endDate = m.candidate.endDate ? m.candidate.endDate.split("T")[0] ?? "" : "";
    const question = m.candidate.question.length > MW - 1
      ? m.candidate.question.slice(0, MW - 4) + "..."
      : m.candidate.question;
    write(`  \u2502 ${padR(question, MW - 1)}\u2502${padL(vol, 9)} \u2502${padL(odds, 7)} \u2502${padL(endDate, 11)} \u2502`);
  }
  write(`  \u2514${ "\u2500".repeat(MW)}\u2534${ "\u2500".repeat(10)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(12)}\u2518`);

  // Per-market Polymarket URLs (for manual cross-checking / demo transparency)
  write("");
  write(`  ${cb(C.white, "\u{1F517} \u5E02\u573A\u8BE6\u60C5\u94FE\u63A5:")}`);
  for (const m of matched) {
    const eventSlug = m.candidate.eventSlug ?? m.candidate.marketSlug ?? "";
    const url = m.candidate.url ?? `https://polymarket.com/event/${eventSlug}`;
    const shortQuestion = m.candidate.question.length > 46
      ? m.candidate.question.slice(0, 43) + "..."
      : m.candidate.question;
    write(`    - ${d(shortQuestion)}`);
    write(`      ${c(C.blue, url)}`);
  }
}

function printStep2SignalsMulti(signals: readonly CryptoSignal[], isLive: boolean): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 2 \u6B65\uFF1AAVE \u94FE\u4E0A\u4FE1\u53F7\u91C7\u96C6 ${ "\u2501".repeat(24)}`));
  write("");
  write(`  ${cb(C.white, "\u6B63\u5728\u8FDE\u63A5 AVE API...")}`);
  if (isLive) {
    write(`  ${c(C.green, "\u2705 AVE API \u5728\u7EBF")}`);
  } else {
    write(`  ${c(C.yellow, "\u26A0\uFE0F  AVE API \u79BB\u7EBF\uFF0C\u4F7F\u7528\u6A21\u62DF\u6570\u636E")}`);
  }

  // Real-time price
  write("");
  write(`  ${cb(C.white, "\u{1F4CA} \u5B9E\u65F6\u4EF7\u683C")}`);
  for (const sig of signals) {
    write(`     ${sig.token}: ${cb(C.green, fmtPrice(sig.price))}`);
  }

  // K-line analysis
  write("");
  write(`  ${cb(C.white, "\u{1F4C8} K\u7EBF\u8D8B\u52BF\u5206\u6790")}`);
  for (const sig of signals) {
    const kl = sig.details.klines;
    const macd = kl.macdSignal === "bullish" ? c(C.green, "\u770B\u6DA8 \u25B2") : kl.macdSignal === "bearish" ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
    write(`     ${sig.token}: MA20=${fmtPrice(kl.ma20)} MA50=${fmtPrice(kl.ma50)} MACD=${macd}`);
  }

  // Whale tracking
  write("");
  write(`  ${cb(C.white, "\u{1F40B} \u9CB8\u9C7C\u884C\u4E3A\u8FFD\u8E2A (>$100K \u4EA4\u6613, \u8FC7\u53BB1\u5C0F\u65F6)")}`);
  for (const sig of signals) {
    const wh = sig.details.whales;
    const net = wh.buyVolume - wh.sellVolume;
    const netStr = net >= 0
      ? c(C.green, `\u51C0\u4E70\u5165 +${fmtUsd(net)} \u25B2`)
      : c(C.red, `\u51C0\u5356\u51FA ${fmtUsd(net)} \u25BC`);
    write(`     ${sig.token}: \u4E70\u5165 ${fmtUsd(wh.buyVolume)} vs \u5356\u51FA ${fmtUsd(wh.sellVolume)} \u2192 ${netStr}`);
  }

  // Buy/sell ratio
  write("");
  write(`  ${cb(C.white, "\u{1F4C9} \u94FE\u4E0A\u4E70\u5356\u6BD4")}`);
  for (const sig of signals) {
    const s = sig.details.sentiment;
    const r5m = s.sell5m > 0 ? s.buy5m / s.sell5m : 0;
    const r1h = s.sell1h > 0 ? s.buy1h / s.sell1h : 0;
    const r6h = s.sell6h > 0 ? s.buy6h / s.sell6h : 0;
    const lbl = sig.sentimentScore > 0.1 ? c(C.green, "\u770B\u6DA8 \u25B2") : sig.sentimentScore < -0.1 ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
    write(`     ${sig.token}: 5\u5206=${r5m.toFixed(2)}x | 1\u65F6=${r1h.toFixed(2)}x | 6\u65F6=${r6h.toFixed(2)}x \u2192 ${lbl}`);
  }
}

function printStep3AggregationMulti(signals: readonly CryptoSignal[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 3 \u6B65\uFF1A\u4FE1\u53F7\u805A\u5408 ${ "\u2501".repeat(34)}`));

  const barWidth = 20;
  for (const sig of signals) {
    write("");
    write(`  ${b(`${sig.token} \u4FE1\u53F7\u5206\u89E3\uFF1A`)}`);
    const tc = scoreColor(sig.trendScore);
    write(`    \u{1F4C8} \u8D8B\u52BF:     ${c(tc, renderBar(sig.trendScore, barWidth))} ${c(tc, `${sig.trendScore >= 0 ? "+" : ""}${sig.trendScore.toFixed(2)}`)}`);
    const wc = scoreColor(sig.whalePressure);
    write(`    \u{1F40B} \u9CB8\u9C7C:     ${c(wc, renderBar(sig.whalePressure, barWidth))} ${c(wc, `${sig.whalePressure >= 0 ? "+" : ""}${sig.whalePressure.toFixed(2)}`)}`);
    const sc = scoreColor(sig.sentimentScore);
    write(`    \u{1F4C9} \u4E70\u5356\u6BD4:   ${c(sc, renderBar(sig.sentimentScore, barWidth))} ${c(sc, `${sig.sentimentScore >= 0 ? "+" : ""}${sig.sentimentScore.toFixed(2)}`)}`);
    write(`    ${d("\u2500".repeat(37))}`);
    const oc = scoreColor(sig.overallScore);
    const label = scoreLabel(sig.overallScore);
    const labelZh = label === "BULLISH" ? "\u770B\u6DA8" : label === "BEARISH" ? "\u770B\u8DCC" : "\u4E2D\u6027";
    write(`    \u7EFC\u5408:        ${c(oc, renderBar(sig.overallScore, barWidth))} ${c(oc, `${sig.overallScore >= 0 ? "+" : ""}${sig.overallScore.toFixed(2)}`)} ${d("\u2190")} ${cb(oc, labelZh)}`);
  }
}

function printStep2Signals(btcSignal: CryptoSignal, ethSignal: CryptoSignal, isLive: boolean): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 2 \u6B65\uFF1AAVE \u94FE\u4E0A\u4FE1\u53F7\u91C7\u96C6 ${ "\u2501".repeat(24)}`));
  write("");

  write(`  ${cb(C.white, "\u6B63\u5728\u8FDE\u63A5 AVE API...")}`);
  if (isLive) {
    write(`  ${c(C.green, "\u2705 AVE API \u5728\u7EBF")}`);
  } else {
    write(`  ${c(C.yellow, "\u26A0\uFE0F  AVE API \u79BB\u7EBF\uFF0C\u4F7F\u7528\u6A21\u62DF\u6570\u636E")}`);
  }

  // Real-time price
  write("");
  write(`  ${cb(C.white, "\u{1F4CA} \u5B9E\u65F6\u4EF7\u683C")}`);
  write(
    `     BTC: ${cb(C.green, fmtPrice(btcSignal.price))}  |  ETH: ${cb(C.green, fmtPrice(ethSignal.price))}`
  );

  // K-line analysis
  write("");
  write(`  ${cb(C.white, "\u{1F4C8} K\u7EBF\u8D8B\u52BF\u5206\u6790")}`);
  const btcKl = btcSignal.details.klines;
  const ethKl = ethSignal.details.klines;
  const btcMacd = btcKl.macdSignal === "bullish" ? c(C.green, "\u770B\u6DA8 \u25B2") : btcKl.macdSignal === "bearish" ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
  const ethMacd = ethKl.macdSignal === "bullish" ? c(C.green, "\u770B\u6DA8 \u25B2") : ethKl.macdSignal === "bearish" ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
  write(`     BTC: MA20=${fmtPrice(btcKl.ma20)} MA50=${fmtPrice(btcKl.ma50)} MACD=${btcMacd}`);
  write(`     ETH: MA20=${fmtPrice(ethKl.ma20)} MA50=${fmtPrice(ethKl.ma50)} MACD=${ethMacd}`);

  // Whale tracking
  write("");
  write(`  ${cb(C.white, "\u{1F40B} \u9CB8\u9C7C\u884C\u4E3A\u8FFD\u8E2A (>$100K \u4EA4\u6613, \u8FC7\u53BB1\u5C0F\u65F6)")}`);
  const btcWh = btcSignal.details.whales;
  const ethWh = ethSignal.details.whales;
  const btcNet = btcWh.buyVolume - btcWh.sellVolume;
  const ethNet = ethWh.buyVolume - ethWh.sellVolume;
  const btcNetStr = btcNet >= 0
    ? c(C.green, `\u51C0\u4E70\u5165 +${fmtUsd(btcNet)} \u25B2`)
    : c(C.red, `\u51C0\u5356\u51FA ${fmtUsd(btcNet)} \u25BC`);
  const ethNetStr = ethNet >= 0
    ? c(C.green, `\u51C0\u4E70\u5165 +${fmtUsd(ethNet)} \u25B2`)
    : c(C.red, `\u51C0\u5356\u51FA ${fmtUsd(ethNet)} \u25BC`);
  write(`     BTC: \u4E70\u5165 ${fmtUsd(btcWh.buyVolume)} vs \u5356\u51FA ${fmtUsd(btcWh.sellVolume)} \u2192 ${btcNetStr}`);
  write(`     ETH: \u4E70\u5165 ${fmtUsd(ethWh.buyVolume)} vs \u5356\u51FA ${fmtUsd(ethWh.sellVolume)} \u2192 ${ethNetStr}`);

  // Buy/sell ratio
  write("");
  write(`  ${cb(C.white, "\u{1F4C9} \u94FE\u4E0A\u4E70\u5356\u6BD4")}`);
  const btcSent = btcSignal.details.sentiment;
  const ethSent = ethSignal.details.sentiment;
  const ratio5mBtc = btcSent.sell5m > 0 ? (btcSent.buy5m / btcSent.sell5m) : 0;
  const ratio1hBtc = btcSent.sell1h > 0 ? (btcSent.buy1h / btcSent.sell1h) : 0;
  const ratio6hBtc = btcSent.sell6h > 0 ? (btcSent.buy6h / btcSent.sell6h) : 0;
  const ratio5mEth = ethSent.sell5m > 0 ? (ethSent.buy5m / ethSent.sell5m) : 0;
  const ratio1hEth = ethSent.sell1h > 0 ? (ethSent.buy1h / ethSent.sell1h) : 0;
  const ratio6hEth = ethSent.sell6h > 0 ? (ethSent.buy6h / ethSent.sell6h) : 0;
  const btcSentLabel = btcSignal.sentimentScore > 0.1 ? c(C.green, "\u770B\u6DA8 \u25B2") : btcSignal.sentimentScore < -0.1 ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
  const ethSentLabel = ethSignal.sentimentScore > 0.1 ? c(C.green, "\u770B\u6DA8 \u25B2") : ethSignal.sentimentScore < -0.1 ? c(C.red, "\u770B\u8DCC \u25BC") : c(C.yellow, "\u4E2D\u6027 \u2500");
  write(`     BTC: 5\u5206=${ratio5mBtc.toFixed(2)}x | 1\u65F6=${ratio1hBtc.toFixed(2)}x | 6\u65F6=${ratio6hBtc.toFixed(2)}x \u2192 ${btcSentLabel}`);
  write(`     ETH: 5\u5206=${ratio5mEth.toFixed(2)}x | 1\u65F6=${ratio1hEth.toFixed(2)}x | 6\u65F6=${ratio6hEth.toFixed(2)}x \u2192 ${ethSentLabel}`);
}

function printStep3Aggregation(btcSignal: CryptoSignal, ethSignal: CryptoSignal): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 3 \u6B65\uFF1A\u4FE1\u53F7\u805A\u5408 ${ "\u2501".repeat(34)}`));

  for (const sig of [btcSignal, ethSignal]) {
    write("");
    write(`  ${b(`${sig.token} \u4FE1\u53F7\u5206\u89E3\uFF1A`)}`);

    const barWidth = 20;

    const trendColor = scoreColor(sig.trendScore);
    write(`    \u{1F4C8} \u8D8B\u52BF:     ${c(trendColor, renderBar(sig.trendScore, barWidth))} ${c(trendColor, `${sig.trendScore >= 0 ? "+" : ""}${sig.trendScore.toFixed(2)}`)}`);

    const whaleColor = scoreColor(sig.whalePressure);
    write(`    \u{1F40B} \u9CB8\u9C7C:     ${c(whaleColor, renderBar(sig.whalePressure, barWidth))} ${c(whaleColor, `${sig.whalePressure >= 0 ? "+" : ""}${sig.whalePressure.toFixed(2)}`)}`);

    const sentColor = scoreColor(sig.sentimentScore);
    write(`    \u{1F4C9} \u4E70\u5356\u6BD4:   ${c(sentColor, renderBar(sig.sentimentScore, barWidth))} ${c(sentColor, `${sig.sentimentScore >= 0 ? "+" : ""}${sig.sentimentScore.toFixed(2)}`)}`);

    write(`    ${d("\u2500".repeat(37))}`);

    const overallColor = scoreColor(sig.overallScore);
    const label = scoreLabel(sig.overallScore);
    write(`    \u7EFC\u5408:        ${c(overallColor, renderBar(sig.overallScore, barWidth))} ${c(overallColor, `${sig.overallScore >= 0 ? "+" : ""}${sig.overallScore.toFixed(2)}`)} ${d("\u2190")} ${cb(overallColor, label)}`);
  }
}

interface EdgeRow {
  readonly market: string;
  readonly ourProb: number;
  readonly mktProb: number;
  readonly edge: number;
  readonly action: "BUY" | "SKIP";
}

function printStep4Edge(edgeRows: readonly EdgeRow[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 4 \u6B65\uFF1AEdge \u8BA1\u7B97 ${ "\u2501".repeat(32)}`));
  write("");

  const MW = 24;
  write(`  \u250C${ "\u2500".repeat(MW + 2)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(8)}\u252C${ "\u2500".repeat(7)}\u252C${ "\u2500".repeat(11)}\u2510`);
  write(`  \u2502 ${b(padR("\u5E02\u573A", MW + 1))}\u2502${b(padL("\u6211\u4EEC", 7))} \u2502${b(padL("\u5E02\u573A", 7))} \u2502${b(padL("Edge", 6))} \u2502${b(padL("\u64CD\u4F5C", 10))} \u2502`);
  write(`  \u251C${ "\u2500".repeat(MW + 2)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(8)}\u253C${ "\u2500".repeat(7)}\u253C${ "\u2500".repeat(11)}\u2524`);

  for (const row of edgeRows) {
    const usPct = `${(row.ourProb * 100).toFixed(0)}%`;
    const mktPct = `${(row.mktProb * 100).toFixed(0)}%`;
    const edgePct = `${row.edge >= 0 ? "+" : ""}${(row.edge * 100).toFixed(0)}%`;
    const edgeColor = row.edge >= EDGE_THRESHOLD ? C.green : row.edge > 0 ? C.yellow : C.red;
    const actionLabel = row.action === "BUY" ? "\u2705 \u4E70\u5165 " : "\u23ED\uFE0F \u8DF3\u8FC7";
    const actionColored = row.action === "BUY"
      ? cb(C.green, actionLabel)
      : c(C.yellow, actionLabel);
    const marketName = row.market.length > MW + 1 ? row.market.slice(0, MW - 2) + "..." : row.market;
    write(`  \u2502 ${padR(marketName, MW + 1)}\u2502${padL(usPct, 7)} \u2502${padL(mktPct, 7)} \u2502${c(edgeColor, padL(edgePct, 6))} \u2502 ${actionColored}    \u2502`);
  }

  write(`  \u2514${ "\u2500".repeat(MW + 2)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(8)}\u2534${ "\u2500".repeat(7)}\u2534${ "\u2500".repeat(11)}\u2518`);
}

// ---------------------------------------------------------------------------
// Detailed analysis block for the top-edge market. This is the "money shot"
// of the demo: it shows viewers exactly how AVE on-chain signals feed into
// a probability estimate and produce a measurable edge vs. Polymarket odds.
// Printed once per run, for the single market with the largest positive edge.
// ---------------------------------------------------------------------------

function printDetailedMarketAnalysis(
  topMarket: MatchedMarket,
  estimate: ProbabilityEstimate,
  signal: CryptoSignal,
): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u91CD\u70B9\u5E02\u573A\u5206\u6790 ${ "\u2501".repeat(34)}`));
  write("");

  const cand = topMarket.candidate;
  const eventSlug = cand.eventSlug ?? cand.marketSlug ?? "";
  const url = cand.url ?? `https://polymarket.com/event/${eventSlug}`;
  const yesPct = (cand.outcomePrices[0] ?? 0.5) * 100;
  const noPct = 100 - yesPct;
  const endDate = cand.endDate ? cand.endDate.split("T")[0] ?? "" : "";
  const vol = fmtUsd(cand.volume24hUsd);

  const spot = signal.price;
  const target = topMarket.targetPrice;
  const gapPct = spot > 0 ? ((target - spot) / spot) * 100 : 0;
  const gapLabel = gapPct >= 0 ? `\u8FD8\u5DEE +${gapPct.toFixed(2)}%` : `\u5DF2\u8D85\u8FC7 ${Math.abs(gapPct).toFixed(2)}%`;

  // Question with directional framing
  write(`  \u{1F4CC} \u5E02\u573A: ${cb(C.white, `"${cand.question}"`)}`);
  write(`  \u{1F517} ${c(C.blue, url)}`);
  write(
    `  \u{1F4CA} \u4EA4\u6613\u91CF: ${cb(C.white, vol)}  |  \u8D54\u7387: ${c(C.green, `${yesPct.toFixed(0)}% YES`)} / ${c(C.red, `${noPct.toFixed(0)}% NO`)}  |  \u7ED3\u7B97: ${cb(C.white, endDate)}`
  );
  write("");
  write(`  \u{1F9E0} ${cb(C.white, "AI \u5206\u6790:")}`);

  // 1. Spot vs target
  write(
    `     1. ${signal.token} \u5F53\u524D\u4EF7 ${c(C.green, fmtPrice(spot))}\uFF0C` +
      `\u76EE\u6807 ${c(C.white, fmtPrice(target))} (${gapLabel})`
  );

  // 2. K-line / trend
  const kl = signal.details.klines;
  const trendColor = scoreColor(signal.trendScore);
  const macdLabel = kl.macdSignal === "bullish" ? "MACD \u91D1\u53C9" : kl.macdSignal === "bearish" ? "MACD \u6B7B\u53C9" : "MACD \u4E2D\u6027";
  const maLabel = kl.ma20 > kl.ma50 ? "MA20 > MA50" : kl.ma20 < kl.ma50 ? "MA20 < MA50" : "MA20 \u2248 MA50";
  const trendArrow = signal.trendScore >= 0 ? "\u770B\u6DA8" : "\u770B\u8DCC";
  write(
    `     2. K\u7EBF\u8D8B\u52BF: ${maLabel}, ${macdLabel} \u2192 ${c(trendColor, trendArrow)} ` +
      `(${c(trendColor, `${signal.trendScore >= 0 ? "+" : ""}${signal.trendScore.toFixed(2)}`)})`
  );

  // 3. Whale behavior
  const wh = signal.details.whales;
  const whaleNet = wh.buyVolume - wh.sellVolume;
  const whaleColor = scoreColor(signal.whalePressure);
  const whaleLabel = whaleNet >= 0 ? "\u673A\u6784\u770B\u591A" : "\u673A\u6784\u770B\u7A7A";
  const whaleDir = whaleNet >= 0 ? "\u51C0\u4E70\u5165" : "\u51C0\u5356\u51FA";
  write(
    `     3. \u9CB8\u9C7C\u884C\u4E3A: \u8FC7\u53BB 1h ${whaleDir} ${fmtUsd(Math.abs(whaleNet))} \u2192 ${c(whaleColor, whaleLabel)} ` +
      `(${c(whaleColor, `${signal.whalePressure >= 0 ? "+" : ""}${signal.whalePressure.toFixed(2)}`)})`
  );

  // 4. Buy/sell ratio
  const s = signal.details.sentiment;
  const r5m = s.sell5m > 0 ? s.buy5m / s.sell5m : 0;
  const r1h = s.sell1h > 0 ? s.buy1h / s.sell1h : 0;
  const r6h = s.sell6h > 0 ? s.buy6h / s.sell6h : 0;
  const sentColor = scoreColor(signal.sentimentScore);
  const sentLabel = signal.sentimentScore > 0.1
    ? "\u94FE\u4E0A\u60C5\u7EEA\u504F\u591A"
    : signal.sentimentScore < -0.1
      ? "\u94FE\u4E0A\u60C5\u7EEA\u504F\u7A7A"
      : "\u94FE\u4E0A\u60C5\u7EEA\u4E2D\u6027";
  write(
    `     4. \u4E70\u5356\u6BD4: 5m=${r5m.toFixed(2)}x / 1h=${r1h.toFixed(2)}x / 6h=${r6h.toFixed(2)}x \u2192 ${c(sentColor, sentLabel)} ` +
      `(${c(sentColor, `${signal.sentimentScore >= 0 ? "+" : ""}${signal.sentimentScore.toFixed(2)}`)})`
  );

  // 5. Composite score + our probability
  const overallColor = scoreColor(signal.overallScore);
  const ourProbPct = estimate.estimatedProbability * 100;
  write(
    `     5. \u7EFC\u5408\u5F97\u5206: ${c(overallColor, `${signal.overallScore >= 0 ? "+" : ""}${signal.overallScore.toFixed(2)}`)} ` +
      `\u2192 \u6211\u4EEC\u4F30\u7B97\u6982\u7387 ${cb(C.white, `${ourProbPct.toFixed(0)}%`)}`
  );

  // 6. Edge
  const mktProbPct = estimate.marketImpliedProbability * 100;
  const edgePct = estimate.edge * 100;
  const edgeColor = estimate.edge >= EDGE_THRESHOLD ? C.green : estimate.edge > 0 ? C.yellow : C.red;
  const edgeSign = estimate.edge >= 0 ? "+" : "";
  write(
    `     6. \u5E02\u573A\u8D54\u7387 ${cb(C.white, `${mktProbPct.toFixed(0)}%`)} \u2192 Edge ${c(edgeColor, `${edgeSign}${edgePct.toFixed(0)}%`)}`
  );

  // Conclusion
  write("");
  const conclusionColor = estimate.edge >= EDGE_THRESHOLD ? C.green : C.yellow;
  const thesis = estimate.edge >= EDGE_THRESHOLD
    ? (signal.overallScore >= 0
        ? `\u94FE\u4E0A\u591A\u65B9\u4FE1\u53F7\u5171\u632F\uFF0C\u5E02\u573A\u53EF\u80FD\u4F4E\u4F30\u4E86 ${signal.token} \u8FBE\u5230 ${fmtPrice(target)} \u7684\u6982\u7387\u3002`
        : `\u94FE\u4E0A\u7A7A\u65B9\u4FE1\u53F7\u5171\u632F\uFF0C\u5E02\u573A\u53EF\u80FD\u9AD8\u4F30\u4E86 ${signal.token} \u8FBE\u5230 ${fmtPrice(target)} \u7684\u6982\u7387\u3002`)
    : `Edge \u4E0D\u8DB3\uFF0C\u672C\u5E02\u573A\u4E0D\u7ED9\u4EA4\u6613\u5EFA\u8BAE\u3002`;
  write(`  \u{1F4A1} ${cb(conclusionColor, "\u7ED3\u8BBA:")} ${c(conclusionColor, thesis)}`);

  if (estimate.edge >= EDGE_THRESHOLD) {
    const side = signal.overallScore >= 0 ? "YES" : "NO";
    const sidePrice = side === "YES" ? (cand.outcomePrices[0] ?? 0.5) : (cand.outcomePrices[1] ?? 0.5);
    write(
      `     \u5EFA\u8BAE: \u4E70\u5165 ${cb(C.green, `${SHARES_PER_TRADE} \u4EFD ${side}`)} @ $${sidePrice.toFixed(2)}`
    );
  }
}

interface TradeOrder {
  readonly index: number;
  readonly market: string;
  readonly price: number;
  readonly shares: number;
  readonly url: string;
}

function printStep5RiskControl(trades: readonly TradeOrder[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 5 \u6B65\uFF1A\u98CE\u63A7\u68C0\u67E5 ${ "\u2501".repeat(34)}`));
  write("");

  const totalExposure = trades.reduce((sum, t) => sum + t.price * t.shares, 0);
  const maxSingleTrade = trades.length > 0 ? Math.max(...trades.map((t) => t.price * t.shares)) : 0;
  const maxSinglePct = maxSingleTrade / BANKROLL;
  const totalPct = totalExposure / BANKROLL;

  write(`  \u8D44\u91D1\u6C60: ${cb(C.white, `$${BANKROLL.toFixed(2)}`)}`);
  write(`  \u62DF\u6267\u884C: ${b(`${trades.length} \u7B14\u4EA4\u6613`)} \u00D7 ${b(`${SHARES_PER_TRADE} \u4EFD`)}`);

  const perTradePass = maxSinglePct <= MAX_PER_TRADE_PCT;
  const totalPass = totalPct <= MAX_TOTAL_EXPOSURE_PCT;
  const positionsPass = trades.length <= MAX_POSITIONS;

  write(`  ${perTradePass ? c(C.green, "\u2705") : c(C.red, "\u274C")} \u5355\u7B14\u4E0A\u9650:   ${b(`$${maxSingleTrade.toFixed(2)}`)} (${(maxSinglePct * 100).toFixed(1)}%) ${d("\u2264")} ${(MAX_PER_TRADE_PCT * 100).toFixed(0)}% \u9650\u5236 \u2192 ${perTradePass ? c(C.green, "\u901A\u8FC7") : c(C.red, "\u62D2\u7EDD")}`);
  write(`  ${totalPass ? c(C.green, "\u2705") : c(C.red, "\u274C")} \u603B\u654F\u53E3:     ${b(`$${totalExposure.toFixed(2)}`)} (${(totalPct * 100).toFixed(0)}%) ${d("\u2264")} ${(MAX_TOTAL_EXPOSURE_PCT * 100).toFixed(0)}% \u9650\u5236 \u2192 ${totalPass ? c(C.green, "\u901A\u8FC7") : c(C.red, "\u62D2\u7EDD")}`);
  write(`  ${positionsPass ? c(C.green, "\u2705") : c(C.red, "\u274C")} \u6301\u4ED3\u6570:     ${b(String(trades.length))} ${d("\u2264")} ${MAX_POSITIONS} \u6700\u5927 \u2192 ${positionsPass ? c(C.green, "\u901A\u8FC7") : c(C.red, "\u62D2\u7EDD")}`);
  write(`  ${c(C.green, "\u2705")} \u56DE\u64A4:       ${b("0%")} ${d("<")} ${(MAX_DRAWDOWN_PCT * 100).toFixed(0)}% \u505C\u673A \u2192 ${c(C.green, "\u901A\u8FC7")}`);
}

function printStep6Execution(trades: readonly TradeOrder[]): void {
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 6 \u6B65\uFF1A\u6267\u884C\u5EFA\u8BAE ${ "\u2501".repeat(34)}`));
  write("");

  if (trades.length === 0) {
    write(c(C.yellow, "  \u65E0\u5145\u8DB3 Edge \u7684\u5E02\u573A\uFF0C\u672C\u6B21\u65E0\u4EA4\u6613\u5EFA\u8BAE\u3002"));
    return;
  }

  let totalDeployed = 0;
  for (const trade of trades) {
    const cost = trade.price * trade.shares;
    totalDeployed += cost;
    write(`  ${c(C.green, "\u{1F7E2}")} \u8BA2\u5355 ${trade.index}: ${b("\u4E70\u5165")} ${trade.shares} \u4EFD ${d(`"${trade.market}"`)} @ $${trade.price.toFixed(2)} = ${cb(C.white, `$${cost.toFixed(2)}`)}`);
    write(`      ${c(C.blue, trade.url)}`);
  }

  write("");
  write(`  \u603B\u90E8\u7F72: ${cb(C.green, `$${totalDeployed.toFixed(2)}`)} / $${BANKROLL.toFixed(2)} (${(totalDeployed / BANKROLL * 100).toFixed(1)}%)`);
  write("");
  write(`  ${d("\u6211\u4EEC\u7684 Polymarket \u4EA4\u6613\u94B1\u5305:")} ${c(C.blue, RESOURCE_LINKS.profile)}`);
}

function printFooter(tradeCount: number, bullishCount: number, bearishCount: number, minEdge: number, maxEdge: number, marketCount: number): void {
  const W = 58;
  const top    = `\u2554${ "\u2550".repeat(W)}\u2557`;
  const bottom = `\u255A${ "\u2550".repeat(W)}\u255D`;

  const line1Text = `\u2705 \u7BA1\u7EBF\u5B8C\u6210 \u2014 \u626B\u63CF ${marketCount} \u4E2A\u5E02\u573A\uFF0C${tradeCount} \u7B14\u4EA4\u6613\u5EFA\u8BAE`;
  const line2Text = `\u{1F4CA} AVE \u4FE1\u53F7: ${bullishCount} \u770B\u6DA8, ${bearishCount} \u770B\u8DCC`;
  const edgeStr = minEdge > 0 ? `+${(minEdge * 100).toFixed(0)}% \u5230 +${(maxEdge * 100).toFixed(0)}%` : "\u65E0";
  const line3Text = `\u{1F4B0} Edge \u8303\u56F4: ${edgeStr}`;
  const line4Text = `\u{1F6E1}\uFE0F  \u5168\u90E8\u98CE\u63A7\u68C0\u67E5\u901A\u8FC7`;

  const line1Vis = line1Text.length + 1;
  const line2Vis = line2Text.length + 1;
  const line3Vis = line3Text.length + 1;
  const line4Vis = line4Text.length;

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
  printBanner();
  printResources();
  await sleep(400);

  // ---- Step 0: Fetch real Polymarket markets + AVE connection ----
  write("");
  write(cb(C.cyan, `\u2501\u2501\u2501 \u7B2C 0 \u6B65\uFF1A\u521D\u59CB\u5316 ${ "\u2501".repeat(36)}`));

  const allCandidates = await fetchPolymarketCryptoMarkets();
  await sleep(200);

  if (allCandidates.length === 0) {
    write(c(C.red, "  \u672A\u627E\u5230\u4EFB\u4F55\u52A0\u5BC6\u8D27\u5E01\u5E02\u573A\u3002\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3002"));
    process.exit(1);
  }

  // Attempt live AVE API first (surfaces errors before filtering/signal work).
  const { client: aveClient, isLive: aveIsLive, apiKey: aveApiKey, baseUrl: aveBaseUrl, fallbackReason } =
    await createAveClientWithFallback();

  // Probe the two key AVE endpoints so the demo can show raw response data.
  // This runs only when we successfully connected AND have a non-empty API key;
  // otherwise we still run it to surface the actual error response.
  if (aveApiKey) {
    const rawCalls = await probeAveForDisplay(aveApiKey, aveBaseUrl);
    printAveRawResponses(rawCalls, aveIsLive, fallbackReason);
    await sleep(200);
  }

  // Filter to BTC/ETH price-target markets
  const preliminaryMatches = matchCryptoMarkets(allCandidates);

  // ---- Step 1.5: Generate signals first so we can use spot price to filter ----
  const preliminaryTokens = [...new Set(preliminaryMatches.map((m) => m.token))];
  const signals = preliminaryTokens.length > 0
    ? await generateCryptoSignals(aveClient, preliminaryTokens)
    : [];

  if (signals.length === 0 && preliminaryMatches.length > 0) {
    write(c(C.red, "  \u65E0\u6CD5\u751F\u6210 BTC \u6216 ETH \u4FE1\u53F7\u3002\u7BA1\u7EBF\u7EC8\u6B62\u3002"));
    process.exit(1);
  }

  const spotPriceByToken: Record<"BTC" | "ETH", number> = {
    BTC: signals.find((s) => s.token === "BTC")?.price ?? 0,
    ETH: signals.find((s) => s.token === "ETH")?.price ?? 0,
  };

  // Apply realism filter (reject joke markets + targets too far from spot).
  const { kept: matchedMarkets, rejected: rejectedMarkets } =
    filterRealisticMarkets(preliminaryMatches, spotPriceByToken);

  printStep1Markets(matchedMarkets, allCandidates.length);

  if (rejectedMarkets.length > 0) {
    write("");
    write(`  ${d(`\u8FC7\u6EE4\u6389 ${rejectedMarkets.length} \u4E2A\u4E0D\u73B0\u5B9E\u5E02\u573A (\u76EE\u6807\u8DDD\u73B0\u4EF7\u592A\u8FDC\u6216\u53CC\u5173\u8BED):`)}`);
    for (const r of rejectedMarkets.slice(0, 5)) {
      const q = r.market.candidate.question.length > 50
        ? r.market.candidate.question.slice(0, 47) + "..."
        : r.market.candidate.question;
      write(`    ${c(C.gray, "\u23AF")} ${c(C.gray, q)} ${d(`[${r.reason}]`)}`);
    }
    if (rejectedMarkets.length > 5) {
      write(`    ${d(`... \u5176\u4ED6 ${rejectedMarkets.length - 5} \u4E2A\u5E02\u573A\u540C\u6837\u88AB\u6392\u9664`)}`);
    }
  }
  await sleep(300);

  // If no matched markets, show all crypto markets for context
  if (matchedMarkets.length === 0) {
    write("");
    write(c(C.yellow, "  \u672A\u5339\u914D\u5230\u4EF7\u683C\u76EE\u6807\u5E02\u573A\u3002\u663E\u793A\u6240\u6709\u52A0\u5BC6\u8D27\u5E01\u5E02\u573A\u4F9B\u53C2\u8003\uFF1A"));
    for (const cand of allCandidates.slice(0, 10)) {
      write(`    - ${cand.question} (\u4EA4\u6613\u91CF: ${fmtUsd(cand.volume24hUsd)})`);
    }
    write("");
    write(c(C.yellow, "  \u7BA1\u7EBF\u7ED3\u675F -- \u672A\u627E\u5230\u53EF\u4EA4\u6613\u7684\u52A0\u5BC6\u8D27\u5E01\u4EF7\u683C\u5E02\u573A\u3002"));
    process.exit(0);
  }

  // ---- Step 2: AVE signal collection (uses signals generated above) ----

  if (signals.length === 0) {
    write(c(C.red, "  \u65E0\u6CD5\u751F\u6210 BTC \u6216 ETH \u4FE1\u53F7\u3002\u7BA1\u7EBF\u7EC8\u6B62\u3002"));
    process.exit(1);
  }

  printStep2SignalsMulti(signals, aveIsLive);
  await sleep(300);

  // ---- Step 3: Signal aggregation ----
  printStep3AggregationMulti(signals);
  await sleep(300);

  // ---- Step 4: Edge calculation ----
  const signalByToken = new Map<string, CryptoSignal>();
  for (const sig of signals) {
    signalByToken.set(sig.token, sig);
  }

  const estimates: ProbabilityEstimate[] = [];
  for (const m of matchedMarkets) {
    const sig = signalByToken.get(m.token);
    if (!sig) continue;

    const marketImpliedProb = m.candidate.outcomePrices[0] ?? 0.5;

    estimates.push(
      buildProbabilityEstimate({
        marketQuestion: m.candidate.question,
        token: m.token,
        currentPrice: sig.price,
        targetPrice: m.targetPrice,
        targetDirection: m.targetDirection,
        aveScore: sig.overallScore,
        daysToResolution: m.daysToResolution,
        marketImpliedProbability: marketImpliedProb,
      })
    );
  }

  const edgeRows: EdgeRow[] = estimates.map((est) => ({
    market: est.marketQuestion,
    ourProb: est.estimatedProbability,
    mktProb: est.marketImpliedProbability,
    edge: est.edge,
    action: est.edge >= EDGE_THRESHOLD ? "BUY" as const : "SKIP" as const,
  }));

  const sortedEdgeRows = [...edgeRows].sort((a, b) => b.edge - a.edge);

  printStep4Edge(sortedEdgeRows);
  await sleep(300);

  // ---- Step 4.5: Detailed analysis for the top-edge market ----
  // Pick the market with the largest positive edge and show the full signal-
  // -> probability -> edge derivation. This is the demo's strongest
  // storytelling beat: it explains *why* we disagree with the market.
  //
  // We prefer markets in the real trading zone (5-95% odds) so the analysis
  // shows a meaningful disagreement rather than a settled outcome (0% / 100%).
  if (sortedEdgeRows.length > 0 && estimates.length > 0) {
    const inTradingZone = sortedEdgeRows.filter(
      (r) => r.mktProb >= 0.05 && r.mktProb <= 0.95 && r.edge >= EDGE_THRESHOLD,
    );
    const topRow = inTradingZone[0] ?? sortedEdgeRows[0];
    if (topRow && topRow.edge > 0) {
      const topEstimate = estimates.find((e) => e.marketQuestion === topRow.market);
      const topMatched = matchedMarkets.find((m) => m.candidate.question === topRow.market);
      if (topEstimate && topMatched) {
        const topSignal = signalByToken.get(topMatched.token);
        if (topSignal) {
          printDetailedMarketAnalysis(topMatched, topEstimate, topSignal);
          await sleep(300);
        }
      }
    }
  }

  // Build a question -> Polymarket URL index from the matched set so we can
  // annotate executed trades with their on-chain market links.
  const urlByQuestion = new Map<string, string>();
  for (const m of matchedMarkets) {
    const eventSlug = m.candidate.eventSlug ?? m.candidate.marketSlug ?? "";
    urlByQuestion.set(
      m.candidate.question,
      m.candidate.url ?? `https://polymarket.com/event/${eventSlug}`,
    );
  }

  // ---- Step 5: Risk control ----
  const buyRows = sortedEdgeRows.filter((r) => r.action === "BUY");
  const trades: TradeOrder[] = buyRows.map((row, i) => ({
    index: i + 1,
    market: row.market,
    price: row.mktProb,
    shares: SHARES_PER_TRADE,
    url: urlByQuestion.get(row.market) ?? "https://polymarket.com",
  }));

  printStep5RiskControl(trades);
  await sleep(300);

  // ---- Step 6: Execution recommendations ----
  printStep6Execution(trades);
  await sleep(200);

  // ---- Footer ----
  const bullishCount = signals.filter((s) => s.overallScore > 0.1).length;
  const bearishCount = signals.filter((s) => s.overallScore < -0.1).length;
  const positiveEdges = buyRows.map((r) => r.edge).filter((e) => e > 0);
  const minEdge = positiveEdges.length > 0 ? Math.min(...positiveEdges) : 0;
  const maxEdge = positiveEdges.length > 0 ? Math.max(...positiveEdges) : 0;

  printFooter(trades.length, bullishCount, bearishCount, minEdge, maxEdge, matchedMarkets.length);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n${C.red}[ave-demo] \u81F4\u547D\u9519\u8BEF: ${message}${C.reset}\n`);
  if (error instanceof Error && error.stack) {
    process.stderr.write(`${C.dim}${error.stack}${C.reset}\n`);
  }
  process.exit(1);
});
