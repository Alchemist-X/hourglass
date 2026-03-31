/**
 * Shared pulse filter types and logic.
 *
 * Lives in the orchestrator so that both `services/orchestrator/` and `scripts/`
 * can import it without creating circular dependencies (scripts already import
 * from the orchestrator; the reverse is not allowed).
 */

export interface PulseFilterArgs {
  category: string | null;
  tag: string | null;
  minProb: number | null;
  maxProb: number | null;
  minLiquidity: number | null;
}

export function hasPulseFilters(filters: PulseFilterArgs): boolean {
  return (
    filters.category != null ||
    filters.tag != null ||
    filters.minProb != null ||
    filters.maxProb != null ||
    filters.minLiquidity != null
  );
}

export function applyPulseFilters<
  T extends {
    categorySlug?: string | null;
    tags?: Array<{ slug: string }>;
    outcomePrices: number[];
    liquidityUsd: number;
  }
>(candidates: readonly T[], filters: PulseFilterArgs): T[] {
  return candidates.filter((candidate) => {
    if (filters.category != null && candidate.categorySlug !== filters.category) return false;
    if (filters.tag != null && !(candidate.tags ?? []).some((t) => t.slug === filters.tag)) return false;
    if (filters.minLiquidity != null && candidate.liquidityUsd < filters.minLiquidity) return false;
    if (candidate.outcomePrices.length > 0) {
      const maxPrice = Math.max(...candidate.outcomePrices);
      const minPrice = Math.min(...candidate.outcomePrices);
      if (filters.minProb != null && maxPrice < filters.minProb) return false;
      if (filters.maxProb != null && minPrice > filters.maxProb) return false;
    }
    return true;
  });
}
