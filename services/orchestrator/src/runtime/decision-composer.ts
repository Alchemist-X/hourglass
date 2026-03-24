import type {
  DecisionCompositionResult,
  PositionReviewResult,
  PulseEntryPlan
} from "./decision-metadata.js";

export function composePulseDirectDecisions(input: {
  reviewResults: PositionReviewResult[];
  entryPlans: PulseEntryPlan[];
}): DecisionCompositionResult {
  const decisions = input.reviewResults.map((result) => result.decision);
  const existingTokenIds = new Set(input.reviewResults.map((result) => result.position.token_id));
  const queuedTokenIds = new Set(decisions.map((decision) => decision.token_id));
  const skippedEntries: DecisionCompositionResult["skippedEntries"] = [];

  for (const plan of input.entryPlans) {
    if (existingTokenIds.has(plan.tokenId)) {
      skippedEntries.push({
        marketSlug: plan.marketSlug,
        tokenId: plan.tokenId,
        reason: "entry plan targets an already-held token; portfolio review owns that position"
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
