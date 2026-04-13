/**
 * AVE Claw entry planner.
 *
 * Adapts the Polymarket pulse-entry-planner for DeFi token trading.
 * Instead of event probabilities and prediction markets, this module
 * uses price direction confidence and predicted returns to size entries
 * via Kelly criterion.
 *
 * Key differences from pulse-entry-planner:
 *   - Input: AvePulseCandidate[] (token data from AVE API)
 *   - Edge = predicted_return - risk_premium (not aiProb - marketProb)
 *   - Kelly sizing: kelly = edge / odds
 *   - Direction is buy/sell based on AI confidence in price movement
 *   - Monthly return = edge / holding_period_months
 */

import type { TradeDecision } from "@autopoly/contracts";
import type { AvePulseCandidate } from "../pulse/ave-market-pulse.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AveEntryPlan {
  /** Token contract address */
  tokenAddress: string;
  /** Chain the token lives on */
  chain: string;
  /** Composite token ID: `{address}-{chain}` */
  tokenId: string;
  /** Token symbol, e.g. "ETH" */
  tokenSymbol: string;
  /** Trade direction */
  direction: "buy" | "sell";
  /** Quarter-Kelly sized notional in USD */
  sizeUsd: number;
  /** AI confidence in the predicted direction (0-1) */
  confidence: number;
  /** Predicted return over the holding period */
  predictedReturn: number;
  /** Risk premium subtracted from predicted return */
  riskPremium: number;
  /** Net edge = predictedReturn - riskPremium */
  edge: number;
  /** Full Kelly fraction of bankroll */
  fullKellyPct: number;
  /** Quarter Kelly fraction of bankroll */
  quarterKellyPct: number;
  /** Monthly return = edge / holdingPeriodMonths */
  monthlyReturn: number;
  /** Estimated holding period in months */
  holdingPeriodMonths: number;
  /** Current token price in USD */
  currentPriceUsd: number;
  /** Liquidity available in the token's main pair */
  liquidityUsd: number;
  /** Risk assessment summary (if available) */
  riskLevel: string;
  /** Free-form thesis explaining the trade rationale */
  thesisMd: string;
  /** Normalized confidence bucket for the TradeDecision */
  confidenceBucket: TradeDecision["confidence"];
  /** The fully formed TradeDecision ready for composition */
  decision: TradeDecision;
}

export interface AvePortfolioContext {
  bankrollUsd: number;
  existingPositions: string[];
}

export interface AveEntryPlannerConfig {
  maxNewEntries?: number;
  batchCapPct?: number;
  /** Default holding period assumption in months when none is known */
  defaultHoldingPeriodMonths?: number;
  /** Base risk premium subtracted from predicted returns */
  baseRiskPremium?: number;
  /** Minimum edge required to consider an entry */
  minEdge?: number;
  /** Stop-loss percentage for new positions */
  stopLossPct?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ENTRIES = 4;
const DEFAULT_BATCH_CAP_PCT = 0.2;
const DEFAULT_HOLDING_PERIOD_MONTHS = 1;
const DEFAULT_BASE_RISK_PREMIUM = 0.02;
const DEFAULT_MIN_EDGE = 0.005;
const DEFAULT_STOP_LOSS_PCT = 0.3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundCurrency(value: number): number {
  return Number(value.toFixed(4));
}

function roundPct(value: number): number {
  return Number(value.toFixed(6));
}

/**
 * Estimate predicted return from the candidate's 24h price change and
 * confidence level. In a production system this would come from an AI
 * model; here we use momentum as a proxy.
 */
function estimatePredictedReturn(candidate: AvePulseCandidate): {
  predictedReturn: number;
  direction: "buy" | "sell";
  confidence: number;
} {
  const absChange = Math.abs(candidate.priceChange24h);
  // Momentum-based heuristic: stronger recent moves suggest continuation
  // Confidence scales with the magnitude of the move, capped at 0.9
  const rawConfidence = Math.min(0.9, 0.5 + absChange * 2);

  // Direction follows momentum: positive change = buy, negative = sell
  const direction: "buy" | "sell" = candidate.priceChange24h >= 0 ? "buy" : "sell";

  // Predicted return: extrapolate the 24h move with decaying confidence
  const predictedReturn = absChange * rawConfidence;

  return {
    predictedReturn,
    direction,
    confidence: rawConfidence,
  };
}

/**
 * Compute the risk premium for a candidate. Tokens with higher risk
 * assessments, lower liquidity, or higher tax burdens carry a larger
 * premium.
 */
function computeRiskPremium(
  candidate: AvePulseCandidate,
  baseRiskPremium: number
): number {
  let premium = baseRiskPremium;

  // Adjust for risk level
  if (candidate.riskAssessment) {
    const level = candidate.riskAssessment.riskLevel.toLowerCase();
    if (level === "medium") {
      premium += 0.01;
    }
    if (level === "high" || level === "critical") {
      premium += 0.05;
    }
    // Add tax burden
    const totalTax = candidate.riskAssessment.buyTax + candidate.riskAssessment.sellTax;
    premium += totalTax / 100;
  }

  // Low-liquidity penalty
  if (candidate.liquidityUsd < 50_000) {
    premium += 0.02;
  } else if (candidate.liquidityUsd < 200_000) {
    premium += 0.005;
  }

  return premium;
}

/**
 * Kelly criterion adapted for directional token trading.
 *
 * For a binary-style bet:
 *   full_kelly = edge / odds
 *
 * where odds represent the potential payoff ratio. For token trading
 * we approximate odds as 1 (symmetrical upside/downside) and use
 * quarter Kelly for safety.
 */
function calculateAveKelly(input: {
  edge: number;
  confidence: number;
  bankrollUsd: number;
}): {
  fullKellyPct: number;
  quarterKellyPct: number;
  quarterKellyUsd: number;
} {
  if (input.edge <= 0) {
    return { fullKellyPct: 0, quarterKellyPct: 0, quarterKellyUsd: 0 };
  }

  // Odds approximated as 1 for token trades (symmetric payoff)
  // Adjusted by confidence to reduce sizing on low-conviction trades
  const odds = 1;
  const fullKellyPct = Math.max(0, (input.edge * input.confidence) / odds);
  const quarterKellyPct = fullKellyPct / 4;

  return {
    fullKellyPct,
    quarterKellyPct,
    quarterKellyUsd: input.bankrollUsd * quarterKellyPct,
  };
}

/**
 * Map a numeric confidence value (0-1) into the TradeDecision confidence
 * enum buckets.
 */
function toConfidenceBucket(confidence: number): TradeDecision["confidence"] {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.65) return "medium-high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

/**
 * Build a TradeDecision from an AVE entry plan. This bridges the AVE
 * domain model into the shared contract type used by downstream
 * execution and risk modules.
 */
function buildAveOpenDecision(input: {
  tokenAddress: string;
  chain: string;
  tokenId: string;
  tokenSymbol: string;
  direction: "buy" | "sell";
  quarterKellyUsd: number;
  fullKellyPct: number;
  quarterKellyPct: number;
  edge: number;
  confidence: number;
  confidenceBucket: TradeDecision["confidence"];
  currentPriceUsd: number;
  thesisMd: string;
  stopLossPct: number;
  liquidityUsd: number;
}): TradeDecision {
  // Map direction to the TradeDecision side field
  const side: TradeDecision["side"] = input.direction === "buy" ? "BUY" : "SELL";

  // For AVE tokens we re-use event_slug/market_slug/token_id to carry
  // the chain / composite-ID / address information through the pipeline.
  return {
    action: "open",
    event_slug: input.chain,
    market_slug: input.tokenId,
    token_id: input.tokenId,
    token_address: input.tokenAddress,
    chain: input.chain,
    token_symbol: input.tokenSymbol,
    side,
    notional_usd: roundCurrency(input.quarterKellyUsd),
    order_type: "FOK",
    ai_prob: roundPct(input.confidence),
    market_prob: roundPct(0.5),
    edge: roundCurrency(input.edge),
    confidence: input.confidenceBucket,
    thesis_md: input.thesisMd,
    sources: [
      {
        title: `AVE token data for ${input.tokenSymbol}`,
        url: `https://ave.ai/token/${input.tokenId}`,
        retrieved_at_utc: new Date().toISOString(),
      },
    ],
    full_kelly_pct: roundPct(input.fullKellyPct),
    quarter_kelly_pct: roundPct(input.quarterKellyPct),
    liquidity_cap_usd: input.liquidityUsd > 0 ? roundCurrency(input.liquidityUsd * 0.05) : null,
    stop_loss_pct: input.stopLossPct,
    resolution_track_required: false,
  };
}

// ---------------------------------------------------------------------------
// Ranking and batch cap (mirroring pulse-entry-planner patterns)
// ---------------------------------------------------------------------------

export function calculateAveMonthlyReturn(input: {
  edge: number;
  holdingPeriodMonths: number;
}): number {
  if (input.holdingPeriodMonths <= 0) {
    return 0;
  }
  return input.edge / input.holdingPeriodMonths;
}

export function rankByMonthlyReturn(
  plans: readonly AveEntryPlan[],
  maxPlans: number = DEFAULT_MAX_ENTRIES
): AveEntryPlan[] {
  return [...plans]
    .sort((a, b) => b.monthlyReturn - a.monthlyReturn)
    .slice(0, maxPlans);
}

export function applyBatchCap(
  plans: readonly AveEntryPlan[],
  bankrollUsd: number,
  batchCapPct: number = DEFAULT_BATCH_CAP_PCT
): AveEntryPlan[] {
  const cap = bankrollUsd * batchCapPct;
  const totalNotional = plans.reduce((sum, plan) => sum + plan.sizeUsd, 0);
  if (totalNotional <= cap) {
    return [...plans];
  }
  const scaleFactor = cap / totalNotional;
  return plans.map((plan) => {
    const scaledSize = roundCurrency(plan.sizeUsd * scaleFactor);
    return {
      ...plan,
      sizeUsd: scaledSize,
      decision: {
        ...plan.decision,
        notional_usd: scaledSize,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Plan entries for AVE DeFi tokens.
 *
 * Takes filtered candidates from the AVE market pulse, computes edge
 * and Kelly sizing for each, ranks by monthly return, and returns the
 * top N entry plans capped at a fraction of the bankroll.
 */
export function planAveEntries(
  candidates: AvePulseCandidate[],
  portfolioContext: AvePortfolioContext,
  config: AveEntryPlannerConfig = {}
): AveEntryPlan[] {
  const {
    maxNewEntries = DEFAULT_MAX_ENTRIES,
    batchCapPct = DEFAULT_BATCH_CAP_PCT,
    defaultHoldingPeriodMonths = DEFAULT_HOLDING_PERIOD_MONTHS,
    baseRiskPremium = DEFAULT_BASE_RISK_PREMIUM,
    minEdge = DEFAULT_MIN_EDGE,
    stopLossPct = DEFAULT_STOP_LOSS_PCT,
  } = config;

  const existingSet = new Set(portfolioContext.existingPositions);
  const plans: AveEntryPlan[] = [];

  for (const candidate of candidates) {
    // Skip tokens already in the portfolio
    if (existingSet.has(candidate.tokenId)) {
      continue;
    }

    // Skip tokens with zero or negative price
    if (candidate.priceUsd <= 0) {
      continue;
    }

    const { predictedReturn, direction, confidence } = estimatePredictedReturn(candidate);
    const riskPremium = computeRiskPremium(candidate, baseRiskPremium);
    const edge = predictedReturn - riskPremium;

    // Only plan entries with a positive edge above the threshold
    if (edge < minEdge) {
      continue;
    }

    const kellySizing = calculateAveKelly({
      edge,
      confidence,
      bankrollUsd: portfolioContext.bankrollUsd,
    });

    if (kellySizing.quarterKellyUsd <= 0) {
      continue;
    }

    const holdingPeriodMonths = defaultHoldingPeriodMonths;
    const monthlyReturn = calculateAveMonthlyReturn({ edge, holdingPeriodMonths });
    const confidenceBucket = toConfidenceBucket(confidence);
    const riskLevel = candidate.riskAssessment?.riskLevel ?? "unknown";

    const thesisMd = [
      `**${candidate.symbol}** on ${candidate.chain}:`,
      `Price $${candidate.priceUsd.toFixed(6)}, 24h change ${(candidate.priceChange24h * 100).toFixed(2)}%.`,
      `Direction: ${direction.toUpperCase()} with ${(confidence * 100).toFixed(1)}% confidence.`,
      `Edge: ${(edge * 100).toFixed(2)}% (predicted return ${(predictedReturn * 100).toFixed(2)}% - risk premium ${(riskPremium * 100).toFixed(2)}%).`,
      `Quarter Kelly size: $${kellySizing.quarterKellyUsd.toFixed(2)} (${(kellySizing.quarterKellyPct * 100).toFixed(2)}% of bankroll).`,
      `Risk level: ${riskLevel}. Liquidity: $${candidate.liquidityUsd.toFixed(0)}.`,
    ].join(" ");

    const decision = buildAveOpenDecision({
      tokenAddress: candidate.tokenAddress,
      chain: candidate.chain,
      tokenId: candidate.tokenId,
      tokenSymbol: candidate.symbol,
      direction,
      quarterKellyUsd: kellySizing.quarterKellyUsd,
      fullKellyPct: kellySizing.fullKellyPct,
      quarterKellyPct: kellySizing.quarterKellyPct,
      edge,
      confidence,
      confidenceBucket,
      currentPriceUsd: candidate.priceUsd,
      thesisMd,
      stopLossPct,
      liquidityUsd: candidate.liquidityUsd,
    });

    plans.push({
      tokenAddress: candidate.tokenAddress,
      chain: candidate.chain,
      tokenId: candidate.tokenId,
      tokenSymbol: candidate.symbol,
      direction,
      sizeUsd: roundCurrency(kellySizing.quarterKellyUsd),
      confidence,
      predictedReturn,
      riskPremium,
      edge,
      fullKellyPct: kellySizing.fullKellyPct,
      quarterKellyPct: kellySizing.quarterKellyPct,
      monthlyReturn,
      holdingPeriodMonths,
      currentPriceUsd: candidate.priceUsd,
      liquidityUsd: candidate.liquidityUsd,
      riskLevel,
      thesisMd,
      confidenceBucket,
      decision,
    });
  }

  const ranked = rankByMonthlyReturn(plans, maxNewEntries);
  return applyBatchCap(ranked, portfolioContext.bankrollUsd, batchCapPct);
}
