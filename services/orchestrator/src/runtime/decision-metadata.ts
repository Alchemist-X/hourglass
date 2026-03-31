import type {
  PublicPosition,
  TradeDecision,
  TradeDecisionSet
} from "@autopoly/contracts";

export type EdgeAssessment = "yes" | "no";
export type PulseCoverage = "supporting" | "opposing" | "none";
export type PositionReviewBasis =
  | "pulse-supports-current"
  | "pulse-supports-current-weak-edge"
  | "pulse-supports-current-negative-edge"
  | "pulse-opposes-current"
  | "stop-loss-breached"
  | "no-fresh-signal"
  | "near-stop-loss-without-fresh-signal";

export interface PositionReviewResult {
  position: PublicPosition;
  action: "hold" | "close" | "reduce";
  stillHasEdge: boolean;
  edgeAssessment: EdgeAssessment;
  edgeValue: number;
  pulseCoverage: PulseCoverage;
  humanReviewFlag: boolean;
  confidence: TradeDecision["confidence"];
  reason: string;
  reviewConclusion: string;
  suggestedExitPct: number;
  basis: PositionReviewBasis;
  decision: TradeDecision;
}

export interface PulseEntryPlan {
  eventSlug: string;
  marketSlug: string;
  tokenId: string;
  outcomeLabel: string;
  side: "BUY";
  suggestedPct: number;
  fullKellyPct: number;
  quarterKellyPct: number;
  reportedSuggestedPct: number | null;
  liquidityCapUsd: number | null;
  aiProb: number;
  marketProb: number;
  monthlyReturn: number;
  daysToResolution: number;
  resolutionSource: "market" | "estimated";
  entryFeePct: number;
  roundTripFeePct: number;
  netEdge: number;
  categorySlug: string | null;
  confidence: TradeDecision["confidence"];
  thesisMd: string;
  sources: TradeDecision["sources"];
  decision: TradeDecision;
}

export interface DecisionCompositionResult {
  decisions: TradeDecisionSet["decisions"];
  skippedEntries: Array<{
    marketSlug: string;
    tokenId: string;
    reason: string;
  }>;
}
