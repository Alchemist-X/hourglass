import { describe, expect, it } from "vitest";
import type { RuntimeExecutionContext } from "../runtime/agent-runtime.js";
import type { PulseEntryPlan } from "../runtime/decision-metadata.js";
import { reviewCurrentPositions } from "./position-review.js";

function createContext(): RuntimeExecutionContext {
  return {
    runId: "11111111-1111-4111-8111-111111111111",
    mode: "full",
    overview: {
      status: "running",
      cash_balance_usd: 18,
      total_equity_usd: 20,
      high_water_mark_usd: 20,
      drawdown_pct: 0,
      open_positions: 1,
      last_run_at: null,
      latest_risk_event: null,
      equity_curve: []
    },
    positions: [
      {
        id: "position-1",
        event_slug: "demo-event",
        market_slug: "demo-market",
        token_id: "token-no",
        side: "BUY",
        outcome_label: "No",
        size: 4,
        avg_cost: 0.4,
        current_price: 0.44,
        current_value_usd: 1.76,
        unrealized_pnl_pct: 0.1,
        stop_loss_pct: 0.3,
        opened_at: "2026-03-17T00:00:00.000Z",
        updated_at: "2026-03-17T00:00:00.000Z"
      }
    ],
    pulse: {
      id: "pulse-1",
      generatedAtUtc: "2026-03-17T00:00:00.000Z",
      title: "Pulse",
      relativeMarkdownPath: "reports/pulse/demo.md",
      absoluteMarkdownPath: "/tmp/reports/pulse/demo.md",
      relativeJsonPath: "reports/pulse/demo.json",
      absoluteJsonPath: "/tmp/reports/pulse/demo.json",
      markdown: "# Pulse",
      totalFetched: 10,
      totalFiltered: 5,
      selectedCandidates: 2,
      minLiquidityUsd: 5000,
      candidates: [],
      riskFlags: [],
      tradeable: true
    }
  };
}

function createNearStopLossContext(): RuntimeExecutionContext {
  const context = createContext();
  return {
    ...context,
    positions: [
      {
        ...context.positions[0]!,
        current_value_usd: 12,
        current_price: 0.31,
        unrealized_pnl_pct: -0.22
      }
    ]
  };
}

function createEntryPlan(input: {
  tokenId: string;
  outcomeLabel: string;
  aiProb: number;
  marketProb: number;
  confidence?: "low" | "medium" | "medium-high" | "high";
}): PulseEntryPlan {
  return {
    eventSlug: "demo-event",
    marketSlug: "demo-market",
    tokenId: input.tokenId,
    outcomeLabel: input.outcomeLabel,
    side: "BUY",
    suggestedPct: 0.1,
    aiProb: input.aiProb,
    marketProb: input.marketProb,
    confidence: input.confidence ?? "medium",
    thesisMd: "Pulse thesis",
    sources: [
      {
        title: "Pulse",
        url: "https://example.com/pulse",
        retrieved_at_utc: "2026-03-17T00:00:00.000Z"
      }
    ],
    decision: {
      action: "open",
      event_slug: "demo-event",
      market_slug: "demo-market",
      token_id: input.tokenId,
      side: "BUY",
      notional_usd: 2,
      order_type: "FOK",
      ai_prob: input.aiProb,
      market_prob: input.marketProb,
      edge: input.aiProb - input.marketProb,
      confidence: input.confidence ?? "medium",
      thesis_md: "Pulse thesis",
      sources: [
        {
          title: "Pulse",
          url: "https://example.com/pulse",
          retrieved_at_utc: "2026-03-17T00:00:00.000Z"
        }
      ],
      stop_loss_pct: 0.3,
      resolution_track_required: true
    }
  };
}

describe("position review", () => {
  it("holds when pulse still supports the current outcome", () => {
    const [result] = reviewCurrentPositions({
      context: createContext(),
      entryPlans: [createEntryPlan({ tokenId: "token-no", outcomeLabel: "No", aiProb: 0.62, marketProb: 0.55 })]
    });

    expect(result?.action).toBe("hold");
    expect(result?.stillHasEdge).toBe(true);
    expect(result?.humanReviewFlag).toBe(false);
    expect(result?.basis).toBe("pulse-supports-current");
  });

  it("keeps the position but flags human review when pulse support only leaves a weak edge", () => {
    const [result] = reviewCurrentPositions({
      context: createContext(),
      entryPlans: [createEntryPlan({ tokenId: "token-no", outcomeLabel: "No", aiProb: 0.57, marketProb: 0.55 })]
    });

    expect(result?.action).toBe("hold");
    expect(result?.humanReviewFlag).toBe(true);
    expect(result?.basis).toBe("pulse-supports-current-weak-edge");
    expect(result?.reviewConclusion).toContain("flag it for human review");
  });

  it("reduces when pulse still references the held side but the refreshed edge turns slightly negative", () => {
    const [result] = reviewCurrentPositions({
      context: createNearStopLossContext(),
      entryPlans: [createEntryPlan({ tokenId: "token-no", outcomeLabel: "No", aiProb: 0.52, marketProb: 0.55 })]
    });

    expect(result?.action).toBe("reduce");
    expect(result?.stillHasEdge).toBe(false);
    expect(result?.decision.side).toBe("SELL");
    expect(result?.decision.notional_usd).toBe(6);
    expect(result?.basis).toBe("pulse-supports-current-negative-edge");
  });

  it("closes when pulse favors the opposite outcome", () => {
    const [result] = reviewCurrentPositions({
      context: createContext(),
      entryPlans: [createEntryPlan({ tokenId: "token-yes", outcomeLabel: "Yes", aiProb: 0.64, marketProb: 0.52 })]
    });

    expect(result?.action).toBe("close");
    expect(result?.stillHasEdge).toBe(false);
    expect(result?.decision.side).toBe("SELL");
  });

  it("keeps the position but flags human review when there is no fresh pulse coverage", () => {
    const [result] = reviewCurrentPositions({
      context: createContext(),
      entryPlans: []
    });

    expect(result?.action).toBe("hold");
    expect(result?.humanReviewFlag).toBe(true);
    expect(result?.basis).toBe("no-fresh-signal");
  });

  it("reduces near-stop-loss positions when there is no fresh pulse coverage", () => {
    const [result] = reviewCurrentPositions({
      context: createNearStopLossContext(),
      entryPlans: []
    });

    expect(result?.action).toBe("reduce");
    expect(result?.basis).toBe("near-stop-loss-without-fresh-signal");
    expect(result?.humanReviewFlag).toBe(true);
    expect(result?.decision.notional_usd).toBe(6);
  });
});
