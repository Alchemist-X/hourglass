import type {
  DecisionCompositionResult,
  PositionReviewResult,
  PulseEntryPlan
} from "./decision-metadata.js";

function canMergeAddOn(input: {
  reviewResult: PositionReviewResult;
  plan: PulseEntryPlan;
}) {
  return input.reviewResult.action === "hold" && input.reviewResult.decision.side === input.plan.side;
}

function mergeAddOnDecision(input: {
  reviewResult: PositionReviewResult;
  plan: PulseEntryPlan;
}) {
  const mergedSources = [...input.reviewResult.decision.sources];
  for (const source of input.plan.decision.sources) {
    if (!mergedSources.some((item) => item.url === source.url && item.title === source.title)) {
      mergedSources.push(source);
    }
  }

  return {
    ...input.plan.decision,
    thesis_md: [
      input.reviewResult.decision.thesis_md,
      "Add-on sizing is allowed for an already-held token when Pulse still supports the same side; final size must still pass the configured bankroll and event exposure caps.",
      input.plan.decision.thesis_md
    ].join(" "),
    sources: mergedSources
  };
}

export function composePulseDirectDecisions(input: {
  reviewResults: PositionReviewResult[];
  entryPlans: PulseEntryPlan[];
}): DecisionCompositionResult {
  const decisions = input.reviewResults.map((result) => result.decision);
  const reviewResultByTokenId = new Map(input.reviewResults.map((result) => [result.position.token_id, result]));
  const decisionIndexByTokenId = new Map(decisions.map((decision, index) => [decision.token_id, index]));
  const existingTokenIds = new Set(input.reviewResults.map((result) => result.position.token_id));
  const queuedTokenIds = new Set(decisions.map((decision) => decision.token_id));
  const skippedEntries: DecisionCompositionResult["skippedEntries"] = [];

  for (const plan of input.entryPlans) {
    if (existingTokenIds.has(plan.tokenId)) {
      const reviewResult = reviewResultByTokenId.get(plan.tokenId);
      const decisionIndex = decisionIndexByTokenId.get(plan.tokenId);
      if (reviewResult && decisionIndex != null && canMergeAddOn({ reviewResult, plan })) {
        decisions[decisionIndex] = mergeAddOnDecision({ reviewResult, plan });
        continue;
      }
      skippedEntries.push({
        marketSlug: plan.marketSlug,
        tokenId: plan.tokenId,
        reason: reviewResult?.action === "hold"
          ? "entry plan targets an already-held token, but the existing holding could not be merged into an add-on decision"
          : "entry plan targets an already-held token, but portfolio review already prefers reducing or closing it"
      });
      continue;
    }

    if (queuedTokenIds.has(plan.tokenId)) {
      skippedEntries.push({
        marketSlug: plan.marketSlug,
        tokenId: plan.tokenId,
        reason: "entry plan duplicated an already-queued token"
      });
      continue;
    }

    decisions.push(plan.decision);
    queuedTokenIds.add(plan.tokenId);
  }

  return {
    decisions,
    skippedEntries
  };
}
