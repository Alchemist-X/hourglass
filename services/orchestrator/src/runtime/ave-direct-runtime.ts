/**
 * AVE Claw direct runtime.
 *
 * Wires together the full AVE trading pipeline:
 *   1. Fetch AVE market data (ave-market-pulse)
 *   2. Filter candidates (ave-pulse-filters)
 *   3. Plan entries (ave-entry-planner)
 *   4. Review existing positions (ave-position-review)
 *   5. Compose final decisions
 *   6. Apply risk guards
 *
 * This is the AVE analog of `pulse-direct-runtime.ts` and can be
 * called by the main scheduler as a drop-in runtime alternative.
 */

import type { Artifact, TradeDecision, TradeDecisionSet } from "@autopoly/contracts";
import type { OrchestratorConfig } from "../config.js";
import { buildArtifactRelativePath, writeStoredArtifact } from "../lib/artifacts.js";
import { applyTradeGuardsDetailed } from "../lib/risk.js";
import {
  fetchAveMarkets,
  type AvePulseCandidate,
} from "../pulse/ave-market-pulse.js";
import {
  applyAvePulseFilters,
  defaultAvePulseFilterArgs,
  sortAveCandidatesByScore,
} from "../pulse/ave-pulse-filters.js";
import {
  planAveEntries,
  type AveEntryPlan,
} from "./ave-entry-planner.js";
import {
  reviewAvePositions,
  type AvePosition,
  type AvePositionReview,
} from "../review/ave-position-review.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AveRuntimeContext {
  /** Unique run identifier */
  runId: string;
  /** Run mode */
  mode: "review" | "scan" | "full";
  /** Portfolio overview */
  bankrollUsd: number;
  /** Total equity for risk calculations */
  totalEquityUsd: number;
  /** Current open positions (AVE-specific format) */
  positions: AvePosition[];
  /** Number of open positions for guard checks */
  openPositionCount: number;
}

export interface AveRuntimeResult {
  /** The final decision set */
  decisionSet: TradeDecisionSet;
  /** Human-readable summary of what happened */
  promptSummary: string;
  /** Reasoning markdown */
  reasoningMd: string;
  /** Detailed logs as JSON markdown */
  logsMd: string;
  /** Position reviews performed */
  positionReviews: AvePositionReview[];
  /** Entry plans generated */
  entryPlans: AveEntryPlan[];
  /** Candidates that were fetched */
  candidateCount: number;
  /** Candidates that passed filters */
  filteredCandidateCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars
    ? text
    : `${text.slice(0, maxChars - 24)}\n\n... truncated ...\n`;
}

function summarizeReviewActions(reviews: AvePositionReview[]): {
  hold: number;
  reduce: number;
  close: number;
} {
  return reviews.reduce(
    (counts, review) => {
      counts[review.action] += 1;
      return counts;
    },
    { hold: 0, reduce: 0, close: 0 }
  );
}

/**
 * Compose AVE decisions by merging position reviews with new entry plans.
 * Prevents duplicate token entries and handles add-on logic.
 */
function composeAveDecisions(input: {
  reviewResults: AvePositionReview[];
  entryPlans: AveEntryPlan[];
}): {
  decisions: TradeDecision[];
  skippedEntries: Array<{ tokenId: string; reason: string }>;
} {
  const decisions: TradeDecision[] = input.reviewResults.map(
    (review) => review.decision
  );
  const existingTokenIds = new Set(
    input.reviewResults.map((review) => review.position.tokenId)
  );
  const queuedTokenIds = new Set(decisions.map((d) => d.token_id));
  const skippedEntries: Array<{ tokenId: string; reason: string }> = [];

  for (const plan of input.entryPlans) {
    if (existingTokenIds.has(plan.tokenId)) {
      skippedEntries.push({
        tokenId: plan.tokenId,
        reason: "entry plan targets an already-held token",
      });
      continue;
    }

    if (queuedTokenIds.has(plan.tokenId)) {
      skippedEntries.push({
        tokenId: plan.tokenId,
        reason: "entry plan duplicated an already-queued token",
      });
      continue;
    }

    decisions.push(plan.decision);
    queuedTokenIds.add(plan.tokenId);
  }

  return { decisions, skippedEntries };
}

/**
 * Apply portfolio-level risk guards to the composed decisions.
 * Filters out decisions that would breach risk limits.
 */
function applyRiskGuards(input: {
  decisions: TradeDecision[];
  config: OrchestratorConfig;
  totalEquityUsd: number;
  openPositionCount: number;
  positions: AvePosition[];
}): {
  guarded: TradeDecision[];
  blocked: Array<{ tokenId: string; reason: string }>;
} {
  const guarded: TradeDecision[] = [];
  const blocked: Array<{ tokenId: string; reason: string }> = [];

  let projectedExposure = input.positions.reduce(
    (sum, pos) => sum + pos.currentValueUsd,
    0
  );
  let projectedPositionCount = input.openPositionCount;

  for (const decision of input.decisions) {
    // Pass through non-open actions (hold, close, reduce) without guard checks
    if (decision.action !== "open") {
      guarded.push(decision);
      continue;
    }

    const guardResult = applyTradeGuardsDetailed({
      requestedUsd: decision.notional_usd,
      bankrollUsd: input.totalEquityUsd,
      minTradeUsd: input.config.minTradeUsd,
      maxTradePct: input.config.maxTradePct,
      liquidityCapUsd: decision.liquidity_cap_usd ?? decision.notional_usd,
      totalExposureUsd: projectedExposure,
      maxTotalExposurePct: input.config.maxTotalExposurePct,
      openPositions: projectedPositionCount,
      maxPositions: input.config.maxPositions,
    });

    if (guardResult.amount <= 0) {
      blocked.push({
        tokenId: decision.token_id,
        reason: `blocked by risk guard: ${guardResult.bindingConstraint}`,
      });
      continue;
    }

    // Scale the decision to the guarded amount
    const guardedDecision: TradeDecision = {
      ...decision,
      notional_usd: Number(guardResult.amount.toFixed(4)),
    };
    guarded.push(guardedDecision);
    projectedExposure += guardResult.amount;
    projectedPositionCount += 1;
  }

  return { guarded, blocked };
}

/**
 * Build a fallback skip decision when the pipeline produces no actions.
 */
function buildFallbackSkipDecision(): TradeDecision {
  return {
    action: "skip",
    event_slug: "ave-claw",
    market_slug: "ave-claw-runtime",
    token_id: "ave-claw-no-action",
    side: "BUY",
    notional_usd: 0.01,
    order_type: "FOK",
    ai_prob: 0.5,
    market_prob: 0.5,
    edge: 0,
    confidence: "low",
    thesis_md: "AVE direct runtime could not produce any executable decisions from the current market data.",
    sources: [
      {
        title: "AVE runtime fallback",
        url: "https://ave.ai",
        retrieved_at_utc: new Date().toISOString(),
      },
    ],
    stop_loss_pct: 0,
    resolution_track_required: false,
  };
}

async function buildRuntimeLogArtifact(input: {
  config: OrchestratorConfig;
  context: AveRuntimeContext;
  decisions: TradeDecision[];
  candidateCount: number;
  filteredCandidateCount: number;
  reviewCount: number;
  entryCount: number;
  skippedEntryCount: number;
  blockedByRiskCount: number;
}): Promise<Artifact> {
  const publishedAtUtc = new Date().toISOString();
  const relativePath = buildArtifactRelativePath({
    kind: "runtime-log",
    publishedAtUtc,
    runtime: "ave-direct",
    mode: input.context.mode,
    runId: input.context.runId,
    extension: "md",
  });

  const content = truncate(
    [
      "# AVE Claw Direct Runtime Log",
      "",
      "## Pipeline",
      "",
      "1. Fetch AVE market data (token search, trending, rankings)",
      "2. Apply pulse filters (volume, liquidity, risk)",
      "3. Plan entries via Kelly criterion",
      "4. Review existing positions against current prices",
      "5. Compose decisions (merge reviews + entries)",
      "6. Apply portfolio risk guards",
      "",
      "## Statistics",
      "",
      `- Raw candidates fetched: ${input.candidateCount}`,
      `- Candidates after filtering: ${input.filteredCandidateCount}`,
      `- Current positions reviewed: ${input.reviewCount}`,
      `- New entry plans: ${input.entryCount}`,
      `- Entries skipped (dedup): ${input.skippedEntryCount}`,
      `- Entries blocked (risk): ${input.blockedByRiskCount}`,
      `- Final decisions: ${input.decisions.length}`,
      "",
      "## Final Decisions",
      "",
      "```json",
      JSON.stringify(input.decisions, null, 2),
      "```",
    ].join("\n"),
    input.config.pulse.maxMarkdownChars
  );

  await writeStoredArtifact(
    input.config.artifactStorageRoot,
    relativePath,
    content
  );

  return {
    kind: "runtime-log",
    title: `AVE direct runtime log ${publishedAtUtc}`,
    path: relativePath,
    content,
    published_at_utc: publishedAtUtc,
  };
}

// ---------------------------------------------------------------------------
// Main runtime
// ---------------------------------------------------------------------------

/**
 * Execute the full AVE Claw trading pipeline.
 *
 * This is the top-level orchestration function that the main scheduler
 * can call to produce a set of trading decisions based on AVE market data.
 */
export async function runAveDirectPipeline(
  context: AveRuntimeContext,
  config: OrchestratorConfig
): Promise<AveRuntimeResult> {
  // --- Step 1: Fetch AVE market data ---
  let allCandidates: AvePulseCandidate[];
  try {
    allCandidates = await fetchAveMarkets({
      apiKey: config.ave.apiKey,
      baseUrl: config.ave.apiBaseUrl,
      chains: config.ave.monitoringChains,
      tokenLimit: config.ave.pulseTokenLimit,
      trendingLimit: config.ave.pulseTrendingLimit,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    throw new Error(`AVE market data fetch failed: ${error}`);
  }

  // --- Step 2: Filter candidates ---
  const filterArgs = defaultAvePulseFilterArgs();
  const filtered = applyAvePulseFilters(allCandidates, filterArgs);
  const sorted = sortAveCandidatesByScore(filtered);
  const topCandidates = sorted.slice(0, config.pulse.maxCandidates);

  // --- Step 3: Build current price map for position reviews ---
  const currentPrices = new Map<string, number>();
  for (const candidate of allCandidates) {
    if (candidate.priceUsd > 0) {
      currentPrices.set(candidate.tokenId, candidate.priceUsd);
    }
  }

  // --- Step 4: Plan entries ---
  const entryPlans = planAveEntries(
    topCandidates,
    {
      bankrollUsd: context.totalEquityUsd,
      existingPositions: context.positions.map((p) => p.tokenId),
    },
    {
      maxNewEntries: config.pulse.reportCandidates,
      batchCapPct: 0.2,
      stopLossPct: config.positionStopLossPct,
    }
  );

  // --- Step 5: Review existing positions ---
  const positionReviews = reviewAvePositions(
    context.positions,
    currentPrices,
    {
      stopLossPct: config.positionStopLossPct,
      targetProfitPct: undefined,
    }
  );

  // --- Step 6: Compose decisions ---
  const composition = composeAveDecisions({
    reviewResults: positionReviews,
    entryPlans,
  });

  // --- Step 7: Apply risk guards ---
  const { guarded, blocked } = applyRiskGuards({
    decisions: composition.decisions,
    config,
    totalEquityUsd: context.totalEquityUsd,
    openPositionCount: context.openPositionCount,
    positions: context.positions,
  });

  const decisions = guarded.length > 0 ? guarded : [buildFallbackSkipDecision()];

  // --- Step 8: Build artifacts ---
  const runtimeLogArtifact = await buildRuntimeLogArtifact({
    config,
    context,
    decisions,
    candidateCount: allCandidates.length,
    filteredCandidateCount: filtered.length,
    reviewCount: positionReviews.length,
    entryCount: entryPlans.length,
    skippedEntryCount: composition.skippedEntries.length,
    blockedByRiskCount: blocked.length,
  });

  const reviewActionCounts = summarizeReviewActions(positionReviews);

  const reasoningMd = [
    "Decision strategy: ave-direct",
    "Structure: AVE Market Pulse + Entry Planner + Position Review + Risk Guards",
    `Raw candidates: ${allCandidates.length}`,
    `Filtered candidates: ${filtered.length}`,
    `Top candidates evaluated: ${topCandidates.length}`,
    `Position reviews: ${positionReviews.length}`,
    `Review actions: hold ${reviewActionCounts.hold} / reduce ${reviewActionCounts.reduce} / close ${reviewActionCounts.close}`,
    `Entry plans: ${entryPlans.length}`,
    `Skipped entries: ${composition.skippedEntries.length}`,
    `Blocked by risk guards: ${blocked.length}`,
    `Final decisions: ${decisions.length}`,
  ].join("\n");

  return {
    decisionSet: {
      run_id: context.runId,
      runtime: "ave-direct-runtime",
      generated_at_utc: new Date().toISOString(),
      bankroll_usd: context.totalEquityUsd,
      mode: context.mode,
      decisions,
      artifacts: [runtimeLogArtifact],
    },
    promptSummary:
      "AVE direct runtime fetched token data, filtered candidates, planned entries via Kelly criterion, reviewed existing positions, and composed decisions with risk guards.",
    reasoningMd,
    logsMd: JSON.stringify(
      {
        candidateCount: allCandidates.length,
        filteredCandidateCount: filtered.length,
        positionReviews,
        entryPlans,
        skippedEntries: composition.skippedEntries,
        blockedByRisk: blocked,
        decisions,
      },
      null,
      2
    ),
    positionReviews,
    entryPlans,
    candidateCount: allCandidates.length,
    filteredCandidateCount: filtered.length,
  };
}
