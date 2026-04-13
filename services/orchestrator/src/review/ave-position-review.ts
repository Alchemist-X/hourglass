/**
 * AVE Claw position review.
 *
 * Adapts the Polymarket position-review module for DeFi token positions.
 * Instead of checking prediction market probabilities, this module
 * evaluates token positions against current market prices, stop-loss
 * thresholds, and profit targets.
 *
 * Key differences from position-review.ts:
 *   - Input: AvePosition[] + current prices (from AVE API batch price)
 *   - Checks stop-loss (default 30% loss) and optional profit target
 *   - Evaluates whether the position still has edge based on price momentum
 *   - Output: hold/reduce/close recommendations per position
 */

import type { TradeDecision } from "@autopoly/contracts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvePosition {
  /** Unique position identifier */
  id: string;
  /** Token contract address */
  tokenAddress: string;
  /** Chain the token lives on */
  chain: string;
  /** Composite token ID: `{address}-{chain}` */
  tokenId: string;
  /** Token symbol */
  tokenSymbol: string;
  /** Position direction */
  side: "BUY" | "SELL";
  /** Number of tokens held */
  size: number;
  /** Average entry price in USD */
  avgCostUsd: number;
  /** Current token price at the time of position opening */
  entryPriceUsd: number;
  /** Current value of the position in USD */
  currentValueUsd: number;
  /** Unrealized PnL as a decimal (e.g. -0.15 = -15%) */
  unrealizedPnlPct: number;
  /** Configured stop-loss percentage (0-1) */
  stopLossPct: number;
  /** When the position was opened */
  openedAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Original confidence at entry */
  entryConfidence?: number;
  /** Original edge at entry */
  entryEdge?: number;
}

export type AveReviewAction = "hold" | "reduce" | "close";

export interface AvePositionReview {
  /** The position being reviewed */
  position: AvePosition;
  /** Recommended action */
  action: AveReviewAction;
  /** Whether the position still has a positive edge */
  stillHasEdge: boolean;
  /** Current unrealized PnL percentage */
  currentPnlPct: number;
  /** Current token price */
  currentPriceUsd: number;
  /** Price change since entry */
  priceChangeSinceEntry: number;
  /** Whether the stop-loss threshold has been breached */
  stopLossBreached: boolean;
  /** Whether the profit target has been hit */
  targetHit: boolean;
  /** Whether this needs human review */
  humanReviewFlag: boolean;
  /** Confidence bucket */
  confidence: TradeDecision["confidence"];
  /** Explanation of the recommendation */
  reason: string;
  /** Conclusion summary */
  reviewConclusion: string;
  /** Suggested exit percentage (0 = hold fully, 1 = close fully) */
  suggestedExitPct: number;
  /** Classification basis */
  basis: AveReviewBasis;
  /** The fully formed TradeDecision for execution */
  decision: TradeDecision;
}

export type AveReviewBasis =
  | "stop-loss-breached"
  | "profit-target-hit"
  | "edge-gone-negative"
  | "edge-weakening"
  | "edge-positive"
  | "near-stop-loss"
  | "stable-hold";

export interface AvePositionReviewConfig {
  /** Stop-loss threshold (0-1). Position is closed if loss exceeds this. Default: 0.3 */
  stopLossPct: number;
  /** Optional profit target (0-1). Position is closed if gain exceeds this. */
  targetProfitPct?: number;
  /** Ratio of stop-loss at which to flag "near stop loss". Default: 0.7 */
  nearStopLossRatio?: number;
  /** Edge threshold below which the position is considered weakening. Default: -0.05 */
  negativeEdgeThreshold?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_NEAR_STOP_LOSS_RATIO = 0.7;
const DEFAULT_NEGATIVE_EDGE_THRESHOLD = -0.05;

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
 * Compute the current PnL percentage given entry price and current price.
 */
function computePnlPct(side: "BUY" | "SELL", avgCostUsd: number, currentPriceUsd: number): number {
  if (avgCostUsd <= 0) return 0;
  if (side === "BUY") {
    return (currentPriceUsd - avgCostUsd) / avgCostUsd;
  }
  // For short positions, profit is inverted
  return (avgCostUsd - currentPriceUsd) / avgCostUsd;
}

/**
 * Estimate remaining edge for a position. A simple momentum-based
 * heuristic: if the price is moving in the position's favor, edge
 * is positive; if against, edge is negative.
 */
function estimateRemainingEdge(
  side: "BUY" | "SELL",
  priceChangeSinceEntry: number,
  entryEdge: number | undefined
): number {
  // If we know the original entry edge, decay it by the adverse price move
  if (entryEdge !== undefined) {
    const favorableMove = side === "BUY" ? priceChangeSinceEntry : -priceChangeSinceEntry;
    // Edge decays as the price moves against us, grows as it moves in our favor
    return entryEdge + favorableMove * 0.5;
  }
  // Fallback: use price change as a rough edge proxy
  return side === "BUY" ? priceChangeSinceEntry : -priceChangeSinceEntry;
}

function buildPositionSource(position: AvePosition): TradeDecision["sources"][number] {
  return {
    title: `Current position: ${position.tokenSymbol} on ${position.chain}`,
    url: `https://ave.ai/token/${position.tokenId}`,
    retrieved_at_utc: new Date().toISOString(),
  };
}

function buildReviewDecision(input: {
  position: AvePosition;
  action: AveReviewAction;
  currentPriceUsd: number;
  pnlPct: number;
  confidence: TradeDecision["confidence"];
  thesisMd: string;
  notionalUsd?: number;
}): TradeDecision {
  const side: TradeDecision["side"] =
    input.action === "hold" ? input.position.side : "SELL";

  const notionalUsd = input.notionalUsd ?? input.position.currentValueUsd;

  return {
    action: input.action,
    event_slug: input.position.chain,
    market_slug: input.position.tokenId,
    token_id: input.position.tokenId,
    token_address: input.position.tokenAddress,
    chain: input.position.chain,
    token_symbol: input.position.tokenSymbol,
    side,
    notional_usd: roundCurrency(Math.max(0.01, notionalUsd)),
    order_type: "FOK",
    ai_prob: roundPct(Math.max(0, Math.min(1, 0.5 + input.pnlPct))),
    market_prob: 0.5,
    edge: roundCurrency(input.pnlPct),
    confidence: input.confidence,
    thesis_md: input.thesisMd,
    sources: [buildPositionSource(input.position)],
    stop_loss_pct: input.position.stopLossPct,
    resolution_track_required: false,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Review current AVE token positions against latest prices.
 *
 * For each position, checks:
 *   1. Stop-loss breach (close immediately)
 *   2. Profit target hit (close to lock gains)
 *   3. Edge assessment (hold, reduce, or close based on remaining edge)
 *   4. Near stop-loss warning (reduce + flag for human review)
 */
export function reviewAvePositions(
  positions: AvePosition[],
  currentPrices: Map<string, number>,
  config: AvePositionReviewConfig
): AvePositionReview[] {
  const {
    stopLossPct,
    targetProfitPct,
    nearStopLossRatio = DEFAULT_NEAR_STOP_LOSS_RATIO,
    negativeEdgeThreshold = DEFAULT_NEGATIVE_EDGE_THRESHOLD,
  } = config;

  const reviews: AvePositionReview[] = [];

  for (const position of positions) {
    const currentPriceUsd = currentPrices.get(position.tokenId) ?? position.entryPriceUsd;
    const pnlPct = computePnlPct(position.side, position.avgCostUsd, currentPriceUsd);
    const priceChangeSinceEntry = position.avgCostUsd > 0
      ? (currentPriceUsd - position.avgCostUsd) / position.avgCostUsd
      : 0;
    const remainingEdge = estimateRemainingEdge(
      position.side,
      priceChangeSinceEntry,
      position.entryEdge
    );

    // 1. Stop-loss breached
    if (pnlPct <= -stopLossPct) {
      const decision = buildReviewDecision({
        position,
        action: "close",
        currentPriceUsd,
        pnlPct,
        confidence: "medium",
        thesisMd: `Position breached the configured stop-loss threshold (${(stopLossPct * 100).toFixed(1)}% loss). Current PnL: ${(pnlPct * 100).toFixed(2)}%. Closing to prevent further losses.`,
      });
      reviews.push({
        position,
        action: "close",
        stillHasEdge: false,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: true,
        targetHit: false,
        humanReviewFlag: false,
        confidence: "medium",
        reason: `Stop-loss breached: position is down ${(Math.abs(pnlPct) * 100).toFixed(2)}%, exceeding the ${(stopLossPct * 100).toFixed(1)}% threshold.`,
        reviewConclusion: "Close the position immediately to respect the stop-loss discipline.",
        suggestedExitPct: 1,
        basis: "stop-loss-breached",
        decision,
      });
      continue;
    }

    // 2. Profit target hit
    if (targetProfitPct !== undefined && pnlPct >= targetProfitPct) {
      const decision = buildReviewDecision({
        position,
        action: "close",
        currentPriceUsd,
        pnlPct,
        confidence: "high",
        thesisMd: `Position hit the profit target (${(targetProfitPct * 100).toFixed(1)}% gain). Current PnL: ${(pnlPct * 100).toFixed(2)}%. Closing to lock in gains.`,
      });
      reviews.push({
        position,
        action: "close",
        stillHasEdge: false,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: false,
        targetHit: true,
        humanReviewFlag: false,
        confidence: "high",
        reason: `Profit target hit: position is up ${(pnlPct * 100).toFixed(2)}%, exceeding the ${(targetProfitPct * 100).toFixed(1)}% target.`,
        reviewConclusion: "Close the position to lock in profits at the target level.",
        suggestedExitPct: 1,
        basis: "profit-target-hit",
        decision,
      });
      continue;
    }

    // 3. Edge has turned materially negative
    if (remainingEdge <= negativeEdgeThreshold) {
      const decision = buildReviewDecision({
        position,
        action: "close",
        currentPriceUsd,
        pnlPct,
        confidence: "medium",
        thesisMd: `The remaining edge for ${position.tokenSymbol} has turned materially negative (${(remainingEdge * 100).toFixed(2)}%). The original thesis no longer holds. Closing the position.`,
      });
      reviews.push({
        position,
        action: "close",
        stillHasEdge: false,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: false,
        targetHit: false,
        humanReviewFlag: true,
        confidence: "medium",
        reason: `Edge gone negative: estimated remaining edge is ${(remainingEdge * 100).toFixed(2)}%, below the ${(negativeEdgeThreshold * 100).toFixed(2)}% threshold.`,
        reviewConclusion: "Close the position because the edge has deteriorated beyond the acceptable threshold.",
        suggestedExitPct: 1,
        basis: "edge-gone-negative",
        decision,
      });
      continue;
    }

    // 4. Near stop-loss warning
    const nearStopLoss = pnlPct <= -(stopLossPct * nearStopLossRatio);
    if (nearStopLoss) {
      const reduceNotional = roundCurrency(Math.max(position.currentValueUsd / 2, 0.01));
      const decision = buildReviewDecision({
        position,
        action: "reduce",
        currentPriceUsd,
        pnlPct,
        confidence: "low",
        thesisMd: `Position for ${position.tokenSymbol} is approaching the stop-loss threshold (PnL: ${(pnlPct * 100).toFixed(2)}%, threshold: ${(stopLossPct * 100).toFixed(1)}%). Reducing size by 50% as a precaution.`,
        notionalUsd: reduceNotional,
      });
      reviews.push({
        position,
        action: "reduce",
        stillHasEdge: remainingEdge > 0,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: false,
        targetHit: false,
        humanReviewFlag: true,
        confidence: "low",
        reason: `Near stop-loss: position is down ${(Math.abs(pnlPct) * 100).toFixed(2)}%, within ${((1 - nearStopLossRatio) * 100).toFixed(0)}% of the stop-loss threshold.`,
        reviewConclusion: "Reduce the position size because downside buffer is thin. Flag for human review.",
        suggestedExitPct: 0.5,
        basis: "near-stop-loss",
        decision,
      });
      continue;
    }

    // 5. Edge weakening but not negative
    if (remainingEdge < 0 && remainingEdge > negativeEdgeThreshold) {
      const reduceNotional = roundCurrency(Math.max(position.currentValueUsd / 2, 0.01));
      const decision = buildReviewDecision({
        position,
        action: "reduce",
        currentPriceUsd,
        pnlPct,
        confidence: "low",
        thesisMd: `Edge for ${position.tokenSymbol} is weakening (${(remainingEdge * 100).toFixed(2)}%) but not yet material. Trimming position size as a precaution.`,
        notionalUsd: reduceNotional,
      });
      reviews.push({
        position,
        action: "reduce",
        stillHasEdge: false,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: false,
        targetHit: false,
        humanReviewFlag: true,
        confidence: "low",
        reason: `Edge weakening: estimated remaining edge is slightly negative (${(remainingEdge * 100).toFixed(2)}%). Not bad enough to close, but position should be trimmed.`,
        reviewConclusion: "Reduce position size because edge is weakening. Keep remainder under review.",
        suggestedExitPct: 0.5,
        basis: "edge-weakening",
        decision,
      });
      continue;
    }

    // 6. Edge is positive - hold
    if (remainingEdge > 0.02) {
      const decision = buildReviewDecision({
        position,
        action: "hold",
        currentPriceUsd,
        pnlPct,
        confidence: "medium",
        thesisMd: `Position for ${position.tokenSymbol} retains a positive edge (${(remainingEdge * 100).toFixed(2)}%). PnL: ${(pnlPct * 100).toFixed(2)}%. Holding.`,
      });
      reviews.push({
        position,
        action: "hold",
        stillHasEdge: true,
        currentPnlPct: roundPct(pnlPct),
        currentPriceUsd,
        priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
        stopLossBreached: false,
        targetHit: false,
        humanReviewFlag: false,
        confidence: "medium",
        reason: `Edge positive: estimated remaining edge is ${(remainingEdge * 100).toFixed(2)}%. Position continues to be justified.`,
        reviewConclusion: "Hold the position because the edge remains positive and no stop-loss or target thresholds are breached.",
        suggestedExitPct: 0,
        basis: "edge-positive",
        decision,
      });
      continue;
    }

    // 7. Default: stable hold with low confidence
    const decision = buildReviewDecision({
      position,
      action: "hold",
      currentPriceUsd,
      pnlPct,
      confidence: "low",
      thesisMd: `Position for ${position.tokenSymbol} is in a neutral state. Edge is near zero (${(remainingEdge * 100).toFixed(2)}%). No clear signal to act. Holding with human review flag.`,
    });
    reviews.push({
      position,
      action: "hold",
      stillHasEdge: remainingEdge >= 0,
      currentPnlPct: roundPct(pnlPct),
      currentPriceUsd,
      priceChangeSinceEntry: roundPct(priceChangeSinceEntry),
      stopLossBreached: false,
      targetHit: false,
      humanReviewFlag: true,
      confidence: "low",
      reason: `Stable position with near-zero edge (${(remainingEdge * 100).toFixed(2)}%). No actionable signal.`,
      reviewConclusion: "Hold the position unchanged, but flag for human review because no strong edge signal exists.",
      suggestedExitPct: 0,
      basis: "stable-hold",
      decision,
    });
  }

  return reviews;
}
