/**
 * AVE Signal-to-Probability Converter.
 *
 * Converts the CryptoSignal overall score (-1 to +1) into a probability
 * estimate for Polymarket price-target markets (BTC/ETH).
 *
 * Pipeline position:
 *   AVE CryptoSignal.overallScore  -->  ProbabilityEstimate  -->  edge calculation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProbabilityEstimate {
  /** The Polymarket question text */
  marketQuestion: string;
  /** BTC or ETH */
  token: string;
  /** The price target extracted from the market question */
  targetPrice: number;
  /** Direction the market is asking about */
  targetDirection: "above" | "below" | "hit";
  /** Current spot price from AVE */
  currentPrice: number;
  /** Composite AVE score, -1 (strong bearish) to +1 (strong bullish) */
  aveScore: number;
  /** Our estimated probability (0 to 1) */
  estimatedProbability: number;
  /** Probability implied by Polymarket odds (0 to 1) */
  marketImpliedProbability: number;
  /** Our estimate minus market implied */
  edge: number;
  /** Confidence in our estimate (0 to 1) */
  confidence: number;
}

export interface EstimateProbabilityParams {
  currentPrice: number;
  targetPrice: number;
  targetDirection: "above" | "below" | "hit";
  /** Composite AVE score, -1 to +1 */
  aveScore: number;
  /** Calendar days until market resolution */
  daysToResolution: number;
  /** Daily volatility as a decimal, default 0.03 (3%) */
  volatilityDaily?: number;
  /** Number of AVE signal components that contributed to aveScore */
  signalCount?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Core probability estimation
// ---------------------------------------------------------------------------

/**
 * Step 1 -- Base probability from price distance.
 *
 * For "above" / "hit" direction:
 *   - If current price already exceeds target: high base (0.8)
 *   - If current price is within 10% of target: neutral base (0.5)
 *   - If current price is 10-30% below target: moderate base (0.35)
 *   - If current price is >30% below target: low base (0.2)
 *
 * For "below" direction the logic is mirrored.
 *
 * Time adjustment: more days to resolution pushes the base toward 0.5
 * (more time = more uncertainty).
 */
function computeBaseProbability(
  currentPrice: number,
  targetPrice: number,
  direction: "above" | "below" | "hit",
  daysToResolution: number,
  _volatilityDaily: number,
): number {
  const priceRatio = targetPrice / currentPrice;

  let rawBase: number;

  if (direction === "above" || direction === "hit") {
    if (priceRatio <= 1.0) {
      // Current price already at or above target
      rawBase = 0.8;
    } else if (priceRatio <= 1.10) {
      // Within 10% -- could go either way
      rawBase = 0.5;
    } else if (priceRatio <= 1.30) {
      // 10-30% away
      rawBase = 0.35;
    } else {
      // More than 30% away
      rawBase = 0.2;
    }
  } else {
    // "below" -- mirror logic
    const invertedRatio = currentPrice / targetPrice;
    if (invertedRatio <= 1.0) {
      // Current price already below target
      rawBase = 0.8;
    } else if (invertedRatio <= 1.10) {
      rawBase = 0.5;
    } else if (invertedRatio <= 1.30) {
      rawBase = 0.35;
    } else {
      rawBase = 0.2;
    }
  }

  // Time adjustment: pull toward 0.5 as days increase.
  // At 0 days the raw base stands; at 365 days it is halfway to 0.5.
  const timeFactor = Math.min(1, daysToResolution / 365);
  const timeAdjusted = rawBase + (0.5 - rawBase) * timeFactor * 0.5;

  return timeAdjusted;
}

/**
 * Step 2 -- AVE score adjustment.
 *
 * A positive aveScore means the on-chain signals are bullish.
 * - For "above" / "hit" markets, bullish signals increase probability.
 * - For "below" markets, bullish signals decrease probability.
 *
 * Max adjustment magnitude: aveScore * 0.15 (i.e. 15% shift at full score).
 */
function computeAveAdjustment(
  aveScore: number,
  direction: "above" | "below" | "hit",
): number {
  const maxShift = 0.15;

  if (direction === "above" || direction === "hit") {
    // Bullish signal helps "above" probability
    return aveScore * maxShift;
  }
  // Bullish signal hurts "below" probability
  return -aveScore * maxShift;
}

/**
 * Step 5 -- Confidence metric.
 *
 * confidence = |aveScore| * min(1, signalCount / 3)
 *
 * Higher when more AVE signal components agree in the same direction
 * and when the composite score is strong.
 */
function computeConfidence(aveScore: number, signalCount: number): number {
  const scoreMagnitude = Math.abs(aveScore);
  const signalFactor = Math.min(1, signalCount / 3);
  return clamp(scoreMagnitude * signalFactor, 0, 1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert an AVE CryptoSignal overall score into a probability estimate
 * for a Polymarket price-target market.
 *
 * Returns a partial ProbabilityEstimate (without marketQuestion, token,
 * or marketImpliedProbability which are filled in by the caller).
 */
export function estimateProbability(
  params: EstimateProbabilityParams,
): Omit<ProbabilityEstimate, "marketQuestion" | "token" | "marketImpliedProbability" | "edge"> & {
  estimatedProbability: number;
  confidence: number;
} {
  const {
    currentPrice,
    targetPrice,
    targetDirection,
    aveScore,
    daysToResolution,
    volatilityDaily = 0.03,
    signalCount = 3,
  } = params;

  // Step 1: base probability from price distance + time
  const baseProbability = computeBaseProbability(
    currentPrice,
    targetPrice,
    targetDirection,
    daysToResolution,
    volatilityDaily,
  );

  // Step 2: AVE score adjustment
  const aveAdjustment = computeAveAdjustment(aveScore, targetDirection);

  // Step 3: final estimated probability, clamped to [0.05, 0.95]
  const estimatedProbability = clamp(baseProbability + aveAdjustment, 0.05, 0.95);

  // Step 5: confidence
  const confidence = computeConfidence(aveScore, signalCount);

  return {
    targetPrice,
    targetDirection,
    currentPrice,
    aveScore,
    estimatedProbability,
    confidence,
  };
}

/**
 * Build a full ProbabilityEstimate with edge calculation.
 *
 * This is the high-level entry point used by the trading pipeline.
 */
export function buildProbabilityEstimate(params: {
  marketQuestion: string;
  token: string;
  currentPrice: number;
  targetPrice: number;
  targetDirection: "above" | "below" | "hit";
  aveScore: number;
  daysToResolution: number;
  marketImpliedProbability: number;
  volatilityDaily?: number;
  signalCount?: number;
}): ProbabilityEstimate {
  const partial = estimateProbability({
    currentPrice: params.currentPrice,
    targetPrice: params.targetPrice,
    targetDirection: params.targetDirection,
    aveScore: params.aveScore,
    daysToResolution: params.daysToResolution,
    volatilityDaily: params.volatilityDaily,
    signalCount: params.signalCount,
  });

  // Step 4: edge = our estimate - market implied
  const edge = partial.estimatedProbability - params.marketImpliedProbability;

  return {
    marketQuestion: params.marketQuestion,
    token: params.token,
    targetPrice: partial.targetPrice,
    targetDirection: partial.targetDirection,
    currentPrice: partial.currentPrice,
    aveScore: partial.aveScore,
    estimatedProbability: partial.estimatedProbability,
    marketImpliedProbability: params.marketImpliedProbability,
    edge,
    confidence: partial.confidence,
  };
}
