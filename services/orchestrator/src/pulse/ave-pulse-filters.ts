/**
 * Filters and sorting for AVE pulse candidates.
 *
 * Operates on `AvePulseCandidate` objects produced by `ave-market-pulse.ts`.
 * Filters by volume, liquidity, risk level; sorts by configurable criteria;
 * returns the top N candidates.
 */

import type { AvePulseCandidate, AveContractRisk } from "./ave-market-pulse.js";

// ---------------------------------------------------------------------------
// Filter configuration
// ---------------------------------------------------------------------------

export interface AvePulseFilterArgs {
  /** Minimum 24h volume in USD. Candidates below this are excluded. */
  minVolume: number | null;
  /** Minimum liquidity (TVL) in USD. Candidates below this are excluded. */
  minLiquidity: number | null;
  /** Exclude candidates with these risk levels (e.g. ["high", "critical"]). */
  excludeRiskLevels: string[];
  /** Exclude honeypot contracts. Default: true. */
  excludeHoneypots: boolean;
  /** Maximum buy+sell tax percentage (0-100). Candidates above this are excluded. */
  maxTaxPercent: number | null;
  /** Only include candidates from these chains. Null = all chains. */
  chains: string[] | null;
  /** Only include candidates from these discovery sources. Null = all sources. */
  sources: string[] | null;
}

export function defaultAvePulseFilterArgs(): AvePulseFilterArgs {
  return {
    minVolume: 10_000,
    minLiquidity: 5_000,
    excludeRiskLevels: ["high", "critical"],
    excludeHoneypots: true,
    maxTaxPercent: 10,
    chains: null,
    sources: null,
  };
}

export function hasAvePulseFilters(filters: AvePulseFilterArgs): boolean {
  return (
    filters.minVolume != null ||
    filters.minLiquidity != null ||
    filters.excludeRiskLevels.length > 0 ||
    filters.excludeHoneypots ||
    filters.maxTaxPercent != null ||
    filters.chains != null ||
    filters.sources != null
  );
}

// ---------------------------------------------------------------------------
// Filter implementation
// ---------------------------------------------------------------------------

function isRiskExcluded(
  risk: AveContractRisk | undefined,
  filters: AvePulseFilterArgs
): boolean {
  if (!risk) return false;

  if (filters.excludeHoneypots && risk.isHoneypot) return true;

  if (filters.excludeRiskLevels.length > 0) {
    const level = risk.riskLevel.toLowerCase();
    if (filters.excludeRiskLevels.some((excluded) => excluded.toLowerCase() === level)) {
      return true;
    }
  }

  if (filters.maxTaxPercent != null) {
    const totalTax = risk.buyTax + risk.sellTax;
    if (totalTax > filters.maxTaxPercent) return true;
  }

  return false;
}

export function applyAvePulseFilters(
  candidates: readonly AvePulseCandidate[],
  filters: AvePulseFilterArgs
): AvePulseCandidate[] {
  return candidates.filter((candidate) => {
    // Volume filter
    if (filters.minVolume != null && candidate.volume24hUsd < filters.minVolume) {
      return false;
    }

    // Liquidity filter
    if (filters.minLiquidity != null && candidate.liquidityUsd < filters.minLiquidity) {
      return false;
    }

    // Chain filter
    if (filters.chains != null && filters.chains.length > 0) {
      if (!filters.chains.some((chain) => chain.toLowerCase() === candidate.chain.toLowerCase())) {
        return false;
      }
    }

    // Source filter
    if (filters.sources != null && filters.sources.length > 0) {
      if (!filters.sources.some((source) => source.toLowerCase() === candidate.discoverySource.toLowerCase())) {
        return false;
      }
    }

    // Risk-based filters
    if (isRiskExcluded(candidate.riskAssessment, filters)) {
      return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export type AveSortCriterion = "volume" | "priceChange" | "liquidity" | "marketCap" | "fdv";

function getSortValue(
  candidate: AvePulseCandidate,
  criterion: AveSortCriterion
): number {
  switch (criterion) {
    case "volume":
      return candidate.volume24hUsd;
    case "priceChange":
      return Math.abs(candidate.priceChange24h);
    case "liquidity":
      return candidate.liquidityUsd;
    case "marketCap":
      return candidate.marketCap;
    case "fdv":
      return candidate.fdv;
  }
}

/**
 * Sort candidates by a given criterion in descending order.
 * Returns a new array; does not mutate the input.
 */
export function sortAveCandidates(
  candidates: readonly AvePulseCandidate[],
  criterion: AveSortCriterion = "volume"
): AvePulseCandidate[] {
  return [...candidates].sort(
    (a, b) => getSortValue(b, criterion) - getSortValue(a, criterion)
  );
}

/**
 * Composite score for ranking AVE candidates.
 *
 * score = log10(volume + 1) * log10(liquidity + 1) * riskMultiplier
 *
 * riskMultiplier:
 *   - 1.0 for low/unknown risk
 *   - 0.5 for medium risk
 *   - 0.1 for high risk (should usually be filtered out)
 */
export function calculateAveScore(candidate: AvePulseCandidate): number {
  const volumeScore = Math.log10(candidate.volume24hUsd + 1);
  const liquidityScore = Math.log10(candidate.liquidityUsd + 1);

  let riskMultiplier = 1.0;
  if (candidate.riskAssessment) {
    const level = candidate.riskAssessment.riskLevel.toLowerCase();
    if (level === "medium") riskMultiplier = 0.5;
    if (level === "high" || level === "critical") riskMultiplier = 0.1;
  }

  return volumeScore * liquidityScore * riskMultiplier;
}

/**
 * Sort candidates by composite score (descending).
 * Returns a new array; does not mutate the input.
 */
export function sortAveCandidatesByScore(
  candidates: readonly AvePulseCandidate[]
): AvePulseCandidate[] {
  return [...candidates].sort(
    (a, b) => calculateAveScore(b) - calculateAveScore(a)
  );
}

// ---------------------------------------------------------------------------
// Top N selection
// ---------------------------------------------------------------------------

/**
 * Apply filters, sort by composite score, and return the top N candidates.
 */
export function selectTopAveCandidates(
  candidates: readonly AvePulseCandidate[],
  filters: AvePulseFilterArgs,
  topN: number,
  sortBy: AveSortCriterion = "volume"
): AvePulseCandidate[] {
  const filtered = applyAvePulseFilters(candidates, filters);
  const sorted = sortBy === "volume"
    ? sortAveCandidatesByScore(filtered)
    : sortAveCandidates(filtered, sortBy);
  return sorted.slice(0, topN);
}
