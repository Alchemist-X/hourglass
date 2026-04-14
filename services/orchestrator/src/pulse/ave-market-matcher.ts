/**
 * AVE Market Matcher.
 *
 * Filters Polymarket pulse candidates down to only the BTC/ETH
 * price-target markets that our focused pipeline trades on.
 *
 * Pipeline position:
 *   PulseCandidate[]  -->  matchCryptoMarkets()  -->  MatchedMarket[]
 *   (all Polymarket)       (filter + extract)         (7 target markets)
 */

import type { PulseCandidate } from "./market-pulse.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchedMarket {
  /** Original Polymarket candidate data */
  candidate: PulseCandidate;
  /** Which crypto asset this market tracks */
  token: "BTC" | "ETH";
  /** The dollar price target extracted from the question */
  targetPrice: number;
  /** Whether the market asks about price going above, below, or hitting a level */
  targetDirection: "above" | "below" | "hit";
  /** Calendar days until market resolution */
  daysToResolution: number;
}

// ---------------------------------------------------------------------------
// Keyword lists
// ---------------------------------------------------------------------------

/** Token identification keywords (case-insensitive) */
const BTC_KEYWORDS = ["bitcoin", "btc"] as const;
const ETH_KEYWORDS = ["ethereum", "eth"] as const;

/** The market question must contain at least one of these */
const PRICE_ACTION_KEYWORDS = ["price", "hit", "above", "dip", "reach"] as const;

/** Markets containing any of these are excluded (non-price-target markets) */
const EXCLUSION_KEYWORDS = ["etf", "reserve", "regulation", "launch"] as const;

// ---------------------------------------------------------------------------
// Direction keywords
// ---------------------------------------------------------------------------

const ABOVE_KEYWORDS = ["above", "hit", "reach"] as const;
const BELOW_KEYWORDS = ["dip", "below", "fall"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether `text` contains `keyword` as a whole word (case-insensitive).
 * Uses word-boundary matching to avoid false positives like "ethereum" inside
 * "ethereuming".
 */
function containsWord(text: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${keyword}\\b`, "i");
  return pattern.test(text);
}

/**
 * Extract a dollar-denominated price from a market question.
 *
 * Handles formats:
 *   $100,000   $100k   $5,000   $150K   $1.5k
 */
function extractTargetPrice(question: string): number | null {
  // Match patterns like $100,000 or $100k or $1.5k
  const pricePattern = /\$([\d,]+(?:\.\d+)?)\s*k?/gi;
  let match: RegExpExecArray | null;
  const prices: number[] = [];

  while ((match = pricePattern.exec(question)) !== null) {
    const rawNumber = match[1];
    if (!rawNumber) continue;

    // Remove commas
    const cleaned = rawNumber.replace(/,/g, "");
    let value = parseFloat(cleaned);

    if (Number.isNaN(value) || value <= 0) continue;

    // Check if followed by 'k' (case-insensitive)
    const fullMatch = match[0] ?? "";
    if (/k$/i.test(fullMatch)) {
      value *= 1000;
    }

    prices.push(value);
  }

  // Return the first price found (most likely the target)
  return prices[0] ?? null;
}

/**
 * Determine whether the market is asking about price going above, below,
 * or hitting a specific level.
 */
function detectDirection(question: string): "above" | "below" | "hit" {
  const lower = question.toLowerCase();

  for (const kw of BELOW_KEYWORDS) {
    if (lower.includes(kw)) return "below";
  }

  for (const kw of ABOVE_KEYWORDS) {
    if (lower.includes(kw)) {
      // "hit" in the question maps to the 'hit' direction if it is the
      // primary action word rather than just "above".
      if (kw === "hit") return "hit";
      return "above";
    }
  }

  // Default to "above" if no direction keyword is found but the market
  // passed the price-action filter.
  return "above";
}

/**
 * Calculate calendar days between now and the market end date.
 * Returns 0 if the end date is in the past.
 */
function daysUntil(endDateIso: string): number {
  const end = new Date(endDateIso);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Identify which token (BTC or ETH) the market question refers to.
 * Returns null if neither is detected.
 */
function detectToken(question: string): "BTC" | "ETH" | null {
  const lower = question.toLowerCase();

  const isBtc = BTC_KEYWORDS.some((kw) => containsWord(lower, kw));
  const isEth = ETH_KEYWORDS.some((kw) => containsWord(lower, kw));

  if (isBtc && !isEth) return "BTC";
  if (isEth && !isBtc) return "ETH";
  // If both are mentioned, prefer BTC (higher volume markets)
  if (isBtc && isEth) return "BTC";

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Filter and transform Polymarket pulse candidates into matched
 * BTC/ETH price-target markets.
 *
 * Filtering rules:
 * 1. Must mention Bitcoin/BTC or Ethereum/ETH
 * 2. Must contain a price-action keyword (price, hit, above, dip, reach)
 * 3. Must NOT contain exclusion keywords (ETF, reserve, regulation, launch)
 * 4. Must have an extractable dollar target price
 *
 * Results are sorted by 24h volume descending.
 */
export function matchCryptoMarkets(
  candidates: ReadonlyArray<PulseCandidate>,
): MatchedMarket[] {
  const matched: MatchedMarket[] = [];

  for (const candidate of candidates) {
    const question = candidate.question;
    const lower = question.toLowerCase();

    // --- Exclusion filter ---
    const excluded = EXCLUSION_KEYWORDS.some((kw) => lower.includes(kw));
    if (excluded) continue;

    // --- Token identification ---
    const token = detectToken(question);
    if (token === null) continue;

    // --- Price-action keyword filter ---
    const hasPriceAction = PRICE_ACTION_KEYWORDS.some((kw) =>
      lower.includes(kw),
    );
    if (!hasPriceAction) continue;

    // --- Extract target price ---
    const targetPrice = extractTargetPrice(question);
    if (targetPrice === null) continue;

    // --- Direction ---
    const targetDirection = detectDirection(question);

    // --- Days to resolution ---
    const daysToResolution = daysUntil(candidate.endDate);

    matched.push({
      candidate,
      token,
      targetPrice,
      targetDirection,
      daysToResolution,
    });
  }

  // Sort by volume descending (highest volume first)
  return [...matched].sort(
    (a, b) => b.candidate.volume24hUsd - a.candidate.volume24hUsd,
  );
}

/**
 * Convenience: return only BTC markets from a matched set.
 */
export function filterBtcMarkets(
  markets: ReadonlyArray<MatchedMarket>,
): MatchedMarket[] {
  return markets.filter((m) => m.token === "BTC");
}

/**
 * Convenience: return only ETH markets from a matched set.
 */
export function filterEthMarkets(
  markets: ReadonlyArray<MatchedMarket>,
): MatchedMarket[] {
  return markets.filter((m) => m.token === "ETH");
}
