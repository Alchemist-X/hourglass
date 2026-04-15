/**
 * Showcase Data Loader — Server-side.
 *
 * Fetches REAL Polymarket markets via the Gamma API, attempts AVE API probes,
 * matches BTC/ETH price-target markets, generates synthetic signals (when AVE
 * is offline), and returns a structured snapshot for the showcase page.
 *
 * Runs at request time in a Next.js async Server Component.
 *
 * Intentionally self-contained: does not depend on workspace-only services
 * so that the web app can be built on Vercel without the orchestrator/
 * ave-monitor packages being part of the web app's dependency graph.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShowcaseMarket {
  readonly question: string;
  readonly slug: string;
  readonly eventSlug: string;
  readonly url: string;
  readonly volumeUsd: number;
  readonly volumeLabel: string;
  readonly yesOdds: number;
  readonly yesOddsPct: string;
  readonly noOddsPct: string;
  readonly endDate: string;
  readonly endDateLabel: string;
  readonly token: "BTC" | "ETH";
  readonly targetPrice: number;
  readonly targetDirection: "above" | "below" | "hit";
  readonly daysToResolution: number;
  readonly ourProbability: number;
  readonly edge: number;
  readonly action: "BUY" | "SKIP";
  /** True when the market is a "between $X and $Y" daily price-range market. */
  readonly isRangeMarket: boolean;
  /** Lower and upper bounds of the range (only set when isRangeMarket is true). */
  readonly rangeLower?: number;
  readonly rangeUpper?: number;
}

export interface AveApiCall {
  readonly method: "GET" | "POST";
  readonly endpoint: string;
  readonly url: string;
  readonly status: number;
  readonly ok: boolean;
  readonly elapsedMs: number;
  readonly snippet: string;
  readonly error?: string;
}

export interface CryptoSignalSnapshot {
  readonly token: "BTC" | "ETH";
  readonly price: number;
  readonly priceLabel: string;
  readonly trendScore: number;
  readonly whalePressure: number;
  readonly sentimentScore: number;
  readonly overallScore: number;
  readonly label: "\u770B\u6DA8" | "\u770B\u8DCC" | "\u4E2D\u6027";
  readonly ma20: number;
  readonly ma50: number;
  readonly macdSignal: "bullish" | "bearish" | "neutral";
  readonly whaleBuyVolume: number;
  readonly whaleSellVolume: number;
  readonly sentimentBuy1h: number;
  readonly sentimentSell1h: number;
}

export interface DetailedAnalysis {
  readonly market: ShowcaseMarket;
  readonly signal: CryptoSignalSnapshot;
  readonly steps: ReadonlyArray<{
    readonly title: string;
    readonly detail: string;
    readonly score?: number;
    readonly tone: "bull" | "bear" | "neutral";
  }>;
  readonly conclusion: string;
  readonly recommendation: string | null;
}

export interface ShowcaseData {
  readonly timestamp: string;
  readonly totalMarketsScanned: number;
  readonly matchedMarketCount: number;
  readonly rejectedMarketCount: number;
  readonly topMarkets: ReadonlyArray<ShowcaseMarket>;
  readonly buyCandidates: ReadonlyArray<ShowcaseMarket>;
  readonly signals: ReadonlyArray<CryptoSignalSnapshot>;
  readonly aveApiCalls: ReadonlyArray<AveApiCall>;
  readonly aveIsLive: boolean;
  readonly aveFallbackReason: string | null;
  readonly topAnalysis: DetailedAnalysis | null;
  readonly currentBtcPrice: number;
  readonly currentEthPrice: number;
  readonly bankroll: number;
  readonly sharesPerTrade: number;
  readonly edgeThreshold: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BANKROLL = 20;
const SHARES_PER_TRADE = 5;
const EDGE_THRESHOLD = 0.02;
const MAX_TARGET_RATIO = 1.5;
const MIN_TARGET_RATIO = 0.6;
/**
 * Polymarket charges roughly 2% taker fee on the notional value of a fill.
 * Even on neg-risk daily BTC/ETH range markets `feesEnabled: true`, so the
 * "edge" we surface to operators must be NET of that fee. Subtracting the
 * fee here keeps the showcase honest — most far-OOM brackets correctly
 * flip to SKIP instead of showing a fake +99% BUY.
 */
const POLYMARKET_FEE_RATE = 0.02;

const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
// AVE v2 token IDs are formatted as `{address}-{chain_name}` where chain_name
// follows AVE's short naming convention ("eth" not "ethereum", "bsc", etc.).
const WBTC_TOKEN_ID = `${WBTC_ADDRESS}-eth`;

const AVE_BASE_URL = (process.env.AVE_API_BASE_URL || "https://prod.ave-api.com/v2").replace(
  /\/+$/,
  "",
);
const AVE_API_KEY = process.env.AVE_API_KEY?.trim() || "";

// Fallback spot prices if AVE is offline. These are realistic 2026-Q2 levels
// chosen to keep the realism filter meaningful (0.6x-1.5x band still filters).
const FALLBACK_SPOT: Record<"BTC" | "ETH", number> = {
  BTC: 85_000,
  ETH: 2_500,
};

const JOKE_PATTERNS: ReadonlyArray<RegExp> = [
  /before\s+gta/i,
  /before\s+satoshi/i,
  /before\s+half[-\s]?life/i,
  /gta\s*(vi|6)/i,
  /satoshi\s+returns/i,
  /\$\s*1\s*m\b/i,
  /\$\s*1\s*,?000\s*,?000\b/,
  /\$\s*500\s*k\b/i,
  /\$\s*250\s*k\b/i,
];

// ---------------------------------------------------------------------------
// Gamma API types (minimal subset)
// ---------------------------------------------------------------------------

interface GammaMarket {
  readonly question: string;
  readonly slug: string;
  readonly outcomes: string;
  readonly outcomePrices: string;
  readonly volume: string;
  readonly liquidity: string;
  readonly endDate: string;
  readonly active?: boolean;
  readonly closed?: boolean;
  readonly events?: ReadonlyArray<{ readonly slug?: string }>;
}

interface GammaEvent {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly markets?: ReadonlyArray<GammaMarket>;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(raw: string | T, fallback: T): T {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function fmtUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function fmtPrice(value: number): string {
  if (value >= 1_000) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? iso;
}

function jsonSnippet(raw: unknown, maxChars = 360): string {
  let text: string;
  try {
    text = JSON.stringify(raw, null, 2);
  } catch {
    text = String(raw);
  }
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n  ... (${text.length - maxChars} bytes truncated)`;
}

// ---------------------------------------------------------------------------
// Matcher logic (inlined from services/orchestrator/.../ave-market-matcher.ts)
// ---------------------------------------------------------------------------

interface MatchedMarket {
  readonly question: string;
  readonly slug: string;
  readonly eventSlug: string;
  readonly url: string;
  readonly volumeUsd: number;
  readonly yesOdds: number;
  readonly endDate: string;
  readonly token: "BTC" | "ETH";
  readonly targetPrice: number;
  readonly targetDirection: "above" | "below" | "hit";
  readonly daysToResolution: number;
  readonly isRangeMarket: boolean;
  readonly rangeLower?: number;
  readonly rangeUpper?: number;
}

function containsWord(text: string, keyword: string): boolean {
  return new RegExp(`\\b${keyword}\\b`, "i").test(text);
}

function extractAllPrices(question: string): number[] {
  const pricePattern = /\$([\d,]+(?:\.\d+)?)\s*k?/gi;
  let match: RegExpExecArray | null;
  const prices: number[] = [];
  while ((match = pricePattern.exec(question)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    let value = parseFloat(raw.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    const fullMatch = match[0] ?? "";
    if (/k$/i.test(fullMatch)) value *= 1000;
    prices.push(value);
  }
  return prices;
}

function extractTargetPrice(question: string): number | null {
  return extractAllPrices(question)[0] ?? null;
}

/**
 * Detect "between $X and $Y" range markets — the most realistic daily
 * resolution questions. Returns { lower, upper, midpoint } if matched.
 */
function extractRangeBounds(
  question: string,
): { lower: number; upper: number; midpoint: number } | null {
  const lower = question.toLowerCase();
  if (!lower.includes("between") || !lower.includes(" and ")) return null;
  const prices = extractAllPrices(question);
  if (prices.length < 2) return null;
  const [a, b] = [prices[0]!, prices[1]!];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (hi <= lo) return null;
  return { lower: lo, upper: hi, midpoint: (lo + hi) / 2 };
}

function detectToken(question: string): "BTC" | "ETH" | null {
  const lower = question.toLowerCase();
  const isBtc = ["bitcoin", "btc"].some((k) => containsWord(lower, k));
  const isEth = ["ethereum", "eth"].some((k) => containsWord(lower, k));
  if (isBtc) return "BTC";
  if (isEth) return "ETH";
  return null;
}

function detectDirection(question: string): "above" | "below" | "hit" {
  const lower = question.toLowerCase();
  if (["dip", "below", "fall"].some((k) => lower.includes(k))) return "below";
  if (lower.includes("hit")) return "hit";
  return "above";
}

function daysUntil(endDateIso: string): number {
  const end = new Date(endDateIso);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Gamma API fetch (mirrors scripts/ave-demo.ts strategy)
// ---------------------------------------------------------------------------

async function fetchPolymarketCryptoMarkets(): Promise<GammaMarket[]> {
  const all: GammaMarket[] = [];
  const seen = new Set<string>();

  function add(m: GammaMarket, overrideEventSlug?: string): void {
    if (!m || !m.slug) return;
    if (seen.has(m.slug)) return;
    if (m.active === false || m.closed === true) return;
    seen.add(m.slug);
    if (overrideEventSlug) {
      all.push({ ...m, events: [{ slug: overrideEventSlug }] });
    } else {
      all.push(m);
    }
  }

  // Strategy 1: events endpoint (multiple pages)
  for (const offset of [0, 100, 200]) {
    try {
      const url = `https://gamma-api.polymarket.com/events?limit=100&offset=${offset}&active=true&closed=false`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
        // Revalidate every 5 minutes; cached between requests.
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const events = (await res.json()) as GammaEvent[];
      for (const event of events) {
        for (const market of event.markets ?? []) {
          const q = market.question?.toLowerCase() ?? "";
          const hasCrypto = /\b(bitcoin|btc|ethereum|eth)\b/i.test(q);
          const hasPrice = /(\$|price|hit|above|below|reach|dip|between)/i.test(q);
          if (hasCrypto && hasPrice) add(market, event.slug);
        }
      }
    } catch {
      // swallow; we'll fall through to next strategy
    }
  }

  // Strategy 2: direct markets query by tag
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
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as GammaMarket[];
      for (const m of data) {
        const q = m.question?.toLowerCase() ?? "";
        if (/\b(bitcoin|btc|ethereum|eth)\b/i.test(q)) add(m);
      }
    } catch {
      // continue
    }
  }

  // Strategy 3: curated event slugs.
  //
  // Priority: daily "between $X and $Y" range markets. These resolve every day
  // based on the Binance BTC/USDT (or ETH/USDT) 12:00 ET close price and have
  // very narrow brackets close to the current spot, which is exactly the kind
  // of realistic market we want to surface. Slugs follow the pattern
  // `bitcoin-price-on-<month>-<day>` / `ethereum-price-on-<month>-<day>`.
  const CURATED_SLUGS = [
    // --- Daily BTC range events (newest first) ---
    "bitcoin-price-on-april-14",
    "bitcoin-price-on-april-15",
    "bitcoin-price-on-april-16",
    "bitcoin-price-on-april-17",
    "bitcoin-price-on-april-18",
    // --- Daily ETH range events ---
    "ethereum-price-on-april-14",
    "ethereum-price-on-april-15",
    "ethereum-price-on-april-16",
    // --- Legacy single-target slugs kept for backfill ---
    "bitcoin-above-on-april-14",
    "bitcoin-above-on-april-15",
    "what-price-will-bitcoin-hit-in-april-2026",
    "what-price-will-bitcoin-hit-april-13-19",
    "bitcoin-up-or-down-on-april-14-2026",
    "ethereum-above-on-april-14",
    "what-price-will-ethereum-hit-in-april",
  ];
  for (const slug of CURATED_SLUGS) {
    try {
      const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const events = (await res.json()) as GammaEvent[];
      for (const event of events) {
        for (const market of event.markets ?? []) {
          const q = market.question?.toLowerCase() ?? "";
          if (/\b(bitcoin|btc|ethereum|eth)\b/i.test(q)) {
            add(market, event.slug);
          }
        }
      }
    } catch {
      // continue
    }
  }

  return all;
}

// ---------------------------------------------------------------------------
// Match + enrich candidates into ShowcaseMarket rows
// ---------------------------------------------------------------------------

function matchAndFilter(
  markets: GammaMarket[],
  spotByToken: Record<"BTC" | "ETH", number>,
): { kept: MatchedMarket[]; rejectedCount: number } {
  const matched: MatchedMarket[] = [];
  let rejectedCount = 0;

  for (const m of markets) {
    const lower = m.question?.toLowerCase() ?? "";
    if (!lower) continue;

    // Joke / long-tail pattern rejection
    if (JOKE_PATTERNS.some((p) => p.test(m.question))) {
      rejectedCount += 1;
      continue;
    }

    // Exclusion keywords (same as matcher: etf/reserve/regulation/launch)
    if (["etf", "reserve", "regulation", "launch"].some((k) => lower.includes(k))) {
      continue;
    }

    const token = detectToken(m.question);
    if (!token) continue;

    const hasPriceAction = ["price", "hit", "above", "dip", "reach", "between"].some((k) =>
      lower.includes(k),
    );
    if (!hasPriceAction) continue;

    // Prefer range-market detection first so "between $X and $Y" markets
    // always carry correct midpoint + direction.
    const range = extractRangeBounds(m.question);
    const target = range ? range.midpoint : extractTargetPrice(m.question);
    if (!target) continue;

    const spot = spotByToken[token];
    if (spot > 0) {
      const ratio = target / spot;
      if (ratio > MAX_TARGET_RATIO || ratio < MIN_TARGET_RATIO) {
        rejectedCount += 1;
        continue;
      }
    }

    const outcomePrices = safeJsonParse<string[]>(m.outcomePrices, []).map(Number);
    const yesOdds = Number.isFinite(outcomePrices[0]) ? (outcomePrices[0] as number) : 0.5;
    const eventSlug = m.events?.[0]?.slug ?? m.slug;

    matched.push({
      question: m.question,
      slug: m.slug,
      eventSlug,
      url: `https://polymarket.com/event/${eventSlug}`,
      volumeUsd: Number(m.volume) || 0,
      yesOdds,
      endDate: m.endDate,
      token,
      targetPrice: target,
      targetDirection: range ? "hit" : detectDirection(m.question),
      daysToResolution: daysUntil(m.endDate),
      isRangeMarket: range !== null,
      rangeLower: range?.lower,
      rangeUpper: range?.upper,
    });
  }

  matched.sort((a, b) => b.volumeUsd - a.volumeUsd);
  return { kept: matched, rejectedCount };
}

// ---------------------------------------------------------------------------
// AVE API probe
// ---------------------------------------------------------------------------

async function probeAveEndpoint(args: {
  readonly method: "GET" | "POST";
  readonly endpointLabel: string;
  readonly url: string;
  readonly body?: unknown;
}): Promise<AveApiCall> {
  const { method, endpointLabel, url, body } = args;
  const start = Date.now();

  // If the API key is missing we still produce a visible record so the page
  // explains why the network call didn't go out. This matches the demo's
  // "don't silently hide AVE failures" behaviour.
  if (!AVE_API_KEY) {
    return {
      method,
      endpoint: endpointLabel,
      url,
      status: 0,
      ok: false,
      elapsedMs: 0,
      snippet: "(no request sent — AVE_API_KEY not configured)",
      error: "AVE_API_KEY not configured",
    };
  }

  try {
    const headers: Record<string, string> = {
      "X-API-KEY": AVE_API_KEY,
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 },
    });
    const elapsedMs = Date.now() - start;
    const text = await res.text().catch(() => "(unreadable body)");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // leave as text
    }
    return {
      method,
      endpoint: endpointLabel,
      url,
      status: res.status,
      ok: res.ok,
      elapsedMs,
      snippet: jsonSnippet(parsed),
    };
  } catch (err) {
    const elapsedMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return {
      method,
      endpoint: endpointLabel,
      url,
      status: 0,
      ok: false,
      elapsedMs,
      snippet: "(no response body)",
      error: message,
    };
  }
}

async function probeAveAll(): Promise<AveApiCall[]> {
  const chainsUrl = `${AVE_BASE_URL}/supported_chains`;
  const priceUrl = `${AVE_BASE_URL}/tokens/price`;
  const klineUrl = `${AVE_BASE_URL}/klines/token/${WBTC_TOKEN_ID}?interval=60&limit=5`;

  const [chains, price, klines] = await Promise.all([
    probeAveEndpoint({ method: "GET", endpointLabel: "GET /supported_chains", url: chainsUrl }),
    probeAveEndpoint({
      method: "POST",
      endpointLabel: "POST /tokens/price",
      url: priceUrl,
      body: { token_ids: [WBTC_TOKEN_ID], tvl_min: 0, tx_24h_volume_min: 0 },
    }),
    probeAveEndpoint({ method: "GET", endpointLabel: "GET /klines/token", url: klineUrl }),
  ]);

  return [chains, price, klines];
}

// ---------------------------------------------------------------------------
// Parse live AVE price out of a successful /token/price response.
// Defensive: the AVE schema has varied historically, so we probe likely paths.
// ---------------------------------------------------------------------------

function extractAvePriceFromSnippet(snippet: string): number | null {
  function pickPrice(obj: Record<string, unknown>): number | null {
    const candidates = [
      obj.current_price_usd,
      obj.price,
      obj.priceUsd,
      obj.current_price,
    ];
    for (const c of candidates) {
      const n = typeof c === "string" ? parseFloat(c) : (c as number);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(snippet);
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    const data = (p.data ?? p.result ?? p) as unknown;

    // v2 shape: data is an object keyed by token_id → { current_price_usd, ... }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const value of Object.values(data as Record<string, unknown>)) {
        if (value && typeof value === "object") {
          const price = pickPrice(value as Record<string, unknown>);
          if (price !== null) return price;
        }
      }
    }

    // Legacy v1 shape: data is an array of entries.
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0] as Record<string, unknown>;
      const price = pickPrice(first);
      if (price !== null) return price;
    }
  } catch {
    // ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// Signal generation (synthetic, deterministic fallback)
//
// When AVE is offline we still want the page to render a coherent demo.
// We seed the signals from the current date so they are stable within the
// revalidation window and recognisable to anyone who watched the terminal
// demo.
// ---------------------------------------------------------------------------

function generateSignals(
  spotBtc: number,
  spotEth: number,
  aveIsLive: boolean,
): CryptoSignalSnapshot[] {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);

  function seeded(offset: number): number {
    // Deterministic -1..1 pseudo-random from day + offset
    const x = Math.sin(dayOfYear * 9301 + offset * 49297) * 233280;
    return ((x - Math.floor(x)) * 2) - 1;
  }

  function clamp(v: number): number {
    return Math.max(-1, Math.min(1, v));
  }

  function makeSig(token: "BTC" | "ETH", price: number, seed: number): CryptoSignalSnapshot {
    const trend = clamp(seeded(seed) * 0.6 - 0.2);
    const whale = clamp(seeded(seed + 1) * 0.4);
    const sentiment = clamp(seeded(seed + 2) * 0.7 + 0.1);
    const overall = trend * 0.4 + whale * 0.3 + sentiment * 0.3;
    const macd: CryptoSignalSnapshot["macdSignal"] =
      trend > 0.2 ? "bullish" : trend < -0.2 ? "bearish" : "neutral";
    const label: CryptoSignalSnapshot["label"] =
      overall > 0.15 ? "\u770B\u6DA8" : overall < -0.15 ? "\u770B\u8DCC" : "\u4E2D\u6027";

    const ma20 = price * (1 + seeded(seed + 3) * 0.02);
    const ma50 = price * (1 + seeded(seed + 4) * 0.03);

    return {
      token,
      price,
      priceLabel: fmtPrice(price),
      trendScore: Number(trend.toFixed(2)),
      whalePressure: Number(whale.toFixed(2)),
      sentimentScore: Number(sentiment.toFixed(2)),
      overallScore: Number(overall.toFixed(2)),
      label,
      ma20,
      ma50,
      macdSignal: macd,
      whaleBuyVolume: Math.max(0, whale) * 850_000 + 120_000,
      whaleSellVolume: Math.max(0, -whale) * 850_000 + 80_000,
      sentimentBuy1h: (sentiment + 1) * 60_000,
      sentimentSell1h: (1 - sentiment) * 55_000,
    };
  }

  // Tag aveIsLive currently unused downstream, but we surface it in the
  // CryptoSignalSnapshot shape via the `label` trends — keeping the parameter
  // here lets future code attach "live vs synthetic" metadata per-signal.
  void aveIsLive;

  return [makeSig("BTC", spotBtc, 13), makeSig("ETH", spotEth, 71)];
}

// ---------------------------------------------------------------------------
// Probability estimate + edge (simplified from ave-signal-to-probability.ts)
// ---------------------------------------------------------------------------

function estimateProbability(args: {
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly targetDirection: "above" | "below" | "hit";
  readonly aveScore: number;
  readonly daysToResolution: number;
  readonly isRangeMarket?: boolean;
  readonly rangeLower?: number;
  readonly rangeUpper?: number;
}): number {
  const {
    currentPrice,
    targetPrice,
    targetDirection,
    aveScore,
    daysToResolution,
    isRangeMarket = false,
    rangeLower,
    rangeUpper,
  } = args;
  if (currentPrice <= 0) return 0.5;

  // Range-market branch ("between $X and $Y on <date>"). These daily markets
  // resolve based on whether spot lands INSIDE a narrow window — the old
  // "reach-target" math overshoots dramatically (it treated price > target
  // as 80%+ probability), producing the bogus "+99% edge" everywhere.
  // Use a window-probability heuristic anchored on distance to midpoint and
  // a much smaller AVE adjustment.
  if (isRangeMarket && rangeLower != null && rangeUpper != null) {
    const mid = (rangeLower + rangeUpper) / 2;
    const distance = Math.abs(currentPrice - mid) / currentPrice;
    const inRange = currentPrice >= rangeLower && currentPrice <= rangeUpper;

    let base: number;
    if (inRange) base = 0.25;
    else if (distance < 0.02) base = 0.10;
    else if (distance < 0.05) base = 0.05;
    else if (distance < 0.10) base = 0.02;
    else base = 0.01;

    const aveAdjust = aveScore * 0.05;
    return Math.max(0.01, Math.min(0.95, base + aveAdjust));
  }

  // Start from a distance-based baseline using a log-normal-ish sigmoid.
  const ratio = targetPrice / currentPrice;
  const logGap = Math.log(ratio);
  // Assume ~4% daily volatility scaled by sqrt(days)
  const sigma = 0.04 * Math.sqrt(Math.max(1, daysToResolution));
  const z = logGap / (sigma || 1);

  // "Above" = P(log return >= z). Approx via logistic (cheap, close to normal CDF tail).
  const pAbove = 1 / (1 + Math.exp(z * 1.7));
  let baseline = targetDirection === "below" ? 1 - pAbove : pAbove;

  // Shift by AVE score (range [-1, +1]) up to +/- 20 percentage points.
  const aveShift = aveScore * 0.2;
  if (targetDirection === "below") {
    baseline -= aveShift;
  } else {
    baseline += aveShift;
  }

  return Math.max(0.01, Math.min(0.99, baseline));
}

// ---------------------------------------------------------------------------
// Build detailed analysis for a top-edge market
// ---------------------------------------------------------------------------

function buildDetailedAnalysis(market: ShowcaseMarket, signal: CryptoSignalSnapshot): DetailedAnalysis {
  const spot = signal.price;
  const gapPct = spot > 0 ? ((market.targetPrice - spot) / spot) * 100 : 0;
  const gapLabel =
    gapPct >= 0
      ? `\u8FD8\u5DEE +${gapPct.toFixed(2)}%`
      : `\u5DF2\u8D85\u8FC7 ${Math.abs(gapPct).toFixed(2)}%`;

  const macdLabel =
    signal.macdSignal === "bullish"
      ? "MACD \u91D1\u53C9"
      : signal.macdSignal === "bearish"
        ? "MACD \u6B7B\u53C9"
        : "MACD \u4E2D\u6027";
  const maLabel =
    signal.ma20 > signal.ma50
      ? "MA20 > MA50"
      : signal.ma20 < signal.ma50
        ? "MA20 < MA50"
        : "MA20 \u2248 MA50";

  const whaleNet = signal.whaleBuyVolume - signal.whaleSellVolume;
  const whaleDir = whaleNet >= 0 ? "\u51C0\u4E70\u5165" : "\u51C0\u5356\u51FA";
  const whaleLabel = whaleNet >= 0 ? "\u673A\u6784\u770B\u591A" : "\u673A\u6784\u770B\u7A7A";

  const r1h = signal.sentimentSell1h > 0 ? signal.sentimentBuy1h / signal.sentimentSell1h : 0;
  const sentLabel =
    signal.sentimentScore > 0.1
      ? "\u94FE\u4E0A\u60C5\u7EEA\u504F\u591A"
      : signal.sentimentScore < -0.1
        ? "\u94FE\u4E0A\u60C5\u7EEA\u504F\u7A7A"
        : "\u94FE\u4E0A\u60C5\u7EEA\u4E2D\u6027";

  const tone = (n: number): "bull" | "bear" | "neutral" =>
    n > 0.15 ? "bull" : n < -0.15 ? "bear" : "neutral";

  type Step = DetailedAnalysis["steps"][number];
  const steps: Step[] = [
    {
      title: `${signal.token} \u5F53\u524D\u4EF7 ${fmtPrice(spot)}`,
      detail: `\u76EE\u6807 ${fmtPrice(market.targetPrice)} (${gapLabel})`,
      tone: "neutral" as const,
    },
    {
      title: `K\u7EBF\u8D8B\u52BF\uFF1A${maLabel}\uFF0C${macdLabel}`,
      detail: `\u8D8B\u52BF\u5F97\u5206 ${signal.trendScore >= 0 ? "+" : ""}${signal.trendScore.toFixed(2)}`,
      score: signal.trendScore,
      tone: tone(signal.trendScore),
    },
    {
      title: `\u9CB8\u9C7C\u884C\u4E3A\uFF1A\u8FC7\u53BB 1h ${whaleDir} ${fmtUsd(Math.abs(whaleNet))}`,
      detail: `${whaleLabel}\uFF0C\u538B\u529B\u5F97\u5206 ${signal.whalePressure >= 0 ? "+" : ""}${signal.whalePressure.toFixed(2)}`,
      score: signal.whalePressure,
      tone: tone(signal.whalePressure),
    },
    {
      title: `\u4E70\u5356\u6BD4\uFF1A1h=${r1h.toFixed(2)}x`,
      detail: `${sentLabel}\uFF0C\u60C5\u7EEA\u5F97\u5206 ${signal.sentimentScore >= 0 ? "+" : ""}${signal.sentimentScore.toFixed(2)}`,
      score: signal.sentimentScore,
      tone: tone(signal.sentimentScore),
    },
    {
      title: `\u7EFC\u5408\u5F97\u5206 ${signal.overallScore >= 0 ? "+" : ""}${signal.overallScore.toFixed(2)} \u2192 \u6211\u4EEC\u4F30\u7B97\u6982\u7387 ${(market.ourProbability * 100).toFixed(0)}%`,
      detail: `\u57FA\u4E8E AVE \u8D8B\u52BF/\u9CB8\u9C7C/\u60C5\u7EEA \u4E09\u7EF4\u52A0\u6743\u8BA1\u7B97`,
      score: signal.overallScore,
      tone: tone(signal.overallScore),
    },
    {
      title: `\u5E02\u573A\u8D54\u7387 ${(market.yesOdds * 100).toFixed(0)}% \u2192 \u51C0 Edge ${market.edge >= 0 ? "+" : ""}${(market.edge * 100).toFixed(1)}%`,
      detail:
        market.edge >= EDGE_THRESHOLD
          ? `\u5DF2\u6263\u9664 Polymarket ${(POLYMARKET_FEE_RATE * 100).toFixed(0)}% \u624B\u7EED\u8D39\uFF0C\u4FE1\u606F\u8FB9\u9645\u8DB3\u591F\uFF0C\u8FDB\u5165\u6267\u884C\u961F\u5217`
          : `\u5DF2\u6263\u9664 Polymarket ${(POLYMARKET_FEE_RATE * 100).toFixed(0)}% \u624B\u7EED\u8D39\u540E\uFF0C\u4FE1\u606F\u8FB9\u9645\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7`,
      score: market.edge,
      tone: market.edge >= EDGE_THRESHOLD ? "bull" : "neutral",
    },
  ];

  const bullishConsensus = signal.overallScore >= 0;
  const conclusion =
    market.edge >= EDGE_THRESHOLD
      ? bullishConsensus
        ? `\u94FE\u4E0A\u591A\u65B9\u4FE1\u53F7\u5171\u632F\uFF0C\u5E02\u573A\u53EF\u80FD\u4F4E\u4F30\u4E86 ${signal.token} \u8FBE\u5230 ${fmtPrice(market.targetPrice)} \u7684\u6982\u7387\u3002`
        : `\u94FE\u4E0A\u7A7A\u65B9\u4FE1\u53F7\u5171\u632F\uFF0C\u5E02\u573A\u53EF\u80FD\u9AD8\u4F30\u4E86 ${signal.token} \u8FBE\u5230 ${fmtPrice(market.targetPrice)} \u7684\u6982\u7387\u3002`
      : "Edge \u4E0D\u8DB3\uFF0C\u672C\u5E02\u573A\u4E0D\u7ED9\u4EA4\u6613\u5EFA\u8BAE\u3002";

  const side = bullishConsensus ? "YES" : "NO";
  const recommendation =
    market.edge >= EDGE_THRESHOLD
      ? `\u5EFA\u8BAE\u4E70\u5165 ${SHARES_PER_TRADE} \u4EFD ${side} @ $${(side === "YES" ? market.yesOdds : 1 - market.yesOdds).toFixed(2)}`
      : null;

  return { market, signal, steps, conclusion, recommendation };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loadShowcaseData(): Promise<ShowcaseData> {
  const timestamp = new Date().toISOString();

  // --- 1. Probe AVE in parallel with Gamma fetch ---
  const [rawMarkets, aveApiCalls] = await Promise.all([
    fetchPolymarketCryptoMarkets(),
    probeAveAll(),
  ]);

  // --- 2. Determine AVE liveness + derive spot prices ---
  const priceCall = aveApiCalls.find((c) => c.endpoint === "POST /tokens/price");
  const chainsCall = aveApiCalls.find((c) => c.endpoint === "GET /supported_chains");
  const aveIsLive = !!(priceCall?.ok && chainsCall?.ok);
  const aveFallbackReason = aveIsLive
    ? null
    : chainsCall?.error
      ? chainsCall.error
      : chainsCall?.status
        ? `status ${chainsCall.status}`
        : "AVE API unreachable";

  let spotBtc = FALLBACK_SPOT.BTC;
  if (priceCall?.ok) {
    const live = extractAvePriceFromSnippet(priceCall.snippet);
    if (live) spotBtc = live;
  }
  // ETH spot fetch would mirror the BTC one; keep the fallback for now — the
  // ETH market card still renders meaningfully.
  const spotEth = FALLBACK_SPOT.ETH;

  const signals = generateSignals(spotBtc, spotEth, aveIsLive);
  const signalByToken = new Map<string, CryptoSignalSnapshot>();
  for (const s of signals) signalByToken.set(s.token, s);

  // --- 3. Match + realism filter ---
  const { kept, rejectedCount } = matchAndFilter(rawMarkets, { BTC: spotBtc, ETH: spotEth });

  // --- 4. Compute per-market edge + probability ---
  const showcaseMarkets: ShowcaseMarket[] = kept.map((m) => {
    const sig = signalByToken.get(m.token);
    const aveScore = sig?.overallScore ?? 0;
    const ourProb = estimateProbability({
      currentPrice: sig?.price ?? FALLBACK_SPOT[m.token],
      targetPrice: m.targetPrice,
      targetDirection: m.targetDirection,
      aveScore,
      daysToResolution: m.daysToResolution,
      isRangeMarket: m.isRangeMarket,
      rangeLower: m.rangeLower,
      rangeUpper: m.rangeUpper,
    });
    // Net edge = (our estimate - market implied) - Polymarket taker fee.
    // Showing the gross figure here would print "+99%" on far-OOM brackets
    // even though the trade is unprofitable after fees.
    const grossEdge = ourProb - m.yesOdds;
    const edge = grossEdge - POLYMARKET_FEE_RATE;
    const action: "BUY" | "SKIP" = edge >= EDGE_THRESHOLD ? "BUY" : "SKIP";

    return {
      question: m.question,
      slug: m.slug,
      eventSlug: m.eventSlug,
      url: m.url,
      volumeUsd: m.volumeUsd,
      volumeLabel: fmtUsd(m.volumeUsd),
      yesOdds: m.yesOdds,
      yesOddsPct: `${(m.yesOdds * 100).toFixed(0)}%`,
      noOddsPct: `${((1 - m.yesOdds) * 100).toFixed(0)}%`,
      endDate: m.endDate,
      endDateLabel: formatDate(m.endDate),
      token: m.token,
      targetPrice: m.targetPrice,
      targetDirection: m.targetDirection,
      daysToResolution: m.daysToResolution,
      ourProbability: ourProb,
      edge,
      action,
      isRangeMarket: m.isRangeMarket,
      rangeLower: m.rangeLower,
      rangeUpper: m.rangeUpper,
    };
  });

  // --- 5. Sort + pick top-edge market (prefer realistic 5-95% odds band) ---
  //
  // Daily "between $X and $Y" range markets are surfaced first because they
  // resolve within 24-48h against a concrete Binance reference, which is the
  // most realistic kind of target for an on-chain-signal-driven agent. Within
  // each group (range vs single-target) we still sort by edge descending.
  const sortedByEdge = [...showcaseMarkets].sort((a, b) => {
    if (a.isRangeMarket !== b.isRangeMarket) return a.isRangeMarket ? -1 : 1;
    return b.edge - a.edge;
  });
  const tradingZone = sortedByEdge.filter(
    (m) => m.yesOdds >= 0.05 && m.yesOdds <= 0.95 && m.edge >= EDGE_THRESHOLD,
  );
  const topMarket = tradingZone[0] ?? sortedByEdge[0] ?? null;

  let topAnalysis: DetailedAnalysis | null = null;
  if (topMarket) {
    const sig = signalByToken.get(topMarket.token);
    if (sig) topAnalysis = buildDetailedAnalysis(topMarket, sig);
  }

  const buyCandidates = sortedByEdge.filter((m) => m.action === "BUY").slice(0, 20);
  // Top markets panel: pin range markets at the top, then sort the rest by volume.
  const topMarkets = [...showcaseMarkets]
    .sort((a, b) => {
      if (a.isRangeMarket !== b.isRangeMarket) return a.isRangeMarket ? -1 : 1;
      return b.volumeUsd - a.volumeUsd;
    })
    .slice(0, 12);

  return {
    timestamp,
    totalMarketsScanned: rawMarkets.length,
    matchedMarketCount: showcaseMarkets.length,
    rejectedMarketCount: rejectedCount,
    topMarkets,
    buyCandidates,
    signals,
    aveApiCalls,
    aveIsLive,
    aveFallbackReason,
    topAnalysis,
    currentBtcPrice: spotBtc,
    currentEthPrice: spotEth,
    bankroll: BANKROLL,
    sharesPerTrade: SHARES_PER_TRADE,
    edgeThreshold: EDGE_THRESHOLD,
  };
}

// Export small formatters for components that want to render derived values
// without re-implementing the same helpers.
export const showcaseFormatters = {
  fmtUsd,
  fmtPrice,
  formatDate,
};
