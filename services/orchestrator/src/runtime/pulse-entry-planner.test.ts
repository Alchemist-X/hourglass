import { describe, expect, it } from "vitest";
import type { RuntimeExecutionContext } from "./agent-runtime.js";
import { buildPulseEntryPlans } from "./pulse-entry-planner.js";

function createContext(markdown: string): RuntimeExecutionContext {
  return {
    runId: "11111111-1111-4111-8111-111111111111",
    mode: "full",
    overview: {
      status: "running",
      cash_balance_usd: 20,
      total_equity_usd: 20,
      high_water_mark_usd: 20,
      drawdown_pct: 0,
      open_positions: 0,
      last_run_at: null,
      latest_risk_event: null,
      equity_curve: []
    },
    positions: [],
    pulse: {
      id: "pulse-1",
      generatedAtUtc: "2026-03-17T00:00:00.000Z",
      title: "Pulse",
      relativeMarkdownPath: "reports/pulse/demo.md",
      absoluteMarkdownPath: "/tmp/reports/pulse/demo.md",
      relativeJsonPath: "reports/pulse/demo.json",
      absoluteJsonPath: "/tmp/reports/pulse/demo.json",
      markdown,
      totalFetched: 10,
      totalFiltered: 5,
      selectedCandidates: 1,
      minLiquidityUsd: 5000,
      fetchConfig: {
        pagesPerDimension: 5,
        eventsPerPage: 50,
        minFetchedMarkets: 5000,
        dimensions: ["volume24hr", "liquidity", "startDate", "competitive"]
      },
      categoryStats: { fetched: [], filtered: [] },
      tagStats: { fetched: [], filtered: [] },
      candidates: [
        {
          question: "Demo market question",
          eventSlug: "demo-event",
          marketSlug: "demo-market",
          url: "https://example.com/demo-market",
          liquidityUsd: 10000,
          volume24hUsd: 1000,
          outcomes: ["Yes", "No"],
          outcomePrices: [0.42, 0.58],
          clobTokenIds: ["token-yes", "token-no"],
          endDate: "2026-12-31T00:00:00Z",
          bestBid: 0.41,
          bestAsk: 0.43,
          spread: 0.02,
          categorySlug: null,
          categoryLabel: null,
          categorySource: null,
          tags: []
        }
      ],
      riskFlags: [],
      tradeable: true
    }
  };
}

describe("pulse entry planner", () => {
  it("parses open plans from pulse markdown", () => {
    const markdown = [
      "## 1. Demo market question",
      "",
      "**链接：** https://example.com/demo-market",
      "",
      "| 方向 | 买入 No |",
      "| 建议仓位 | 10% |",
      "| **置信度：** 中 |",
      "",
      "| No | 58% | 63% |",
      "",
      "### 推理逻辑",
      "Because the No side still has edge."
    ].join("\n");

    const plans = buildPulseEntryPlans({
      context: createContext(markdown),
      positionStopLossPct: 0.3
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]?.marketSlug).toBe("demo-market");
    expect(plans[0]?.decision.action).toBe("open");
    expect(plans[0]?.decision.notional_usd).toBeCloseTo(0.5952, 4);
    expect(plans[0]?.quarterKellyPct).toBeCloseTo(0.029762, 6);
    expect(plans[0]?.decision.reported_suggested_pct).toBe(0.1);
  });

  it("accepts english labels and unnumbered sections", () => {
    const markdown = [
      "## Demo market question",
      "",
      "**Link:** https://example.com/demo-market",
      "",
      "| Direction | Buy Yes |",
      "| Suggested Size | 5% |",
      "| Confidence | medium-high |",
      "",
      "| Yes | 42% | 48% |",
      "",
      "### Reasoning",
      "The Yes side still has a modest edge."
    ].join("\n");

    const plans = buildPulseEntryPlans({
      context: createContext(markdown),
      positionStopLossPct: 0.3
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]?.outcomeLabel).toBe("Yes");
    expect(plans[0]?.decision.notional_usd).toBeCloseTo(0.5172, 4);
    expect(plans[0]?.confidence).toBe("medium-high");
    expect(plans[0]?.sources[0]?.url).toBe("https://example.com/demo-market");
  });

  it("parses deterministic fallback-style open tables", () => {
    const markdown = [
      "## 1. Demo market question",
      "",
      "**链接：** https://example.com/demo-market",
      "**Fallback 状态：** 本地 provisional 开仓候选",
      "**置信度：** 中",
      "",
      "| 方向 | 买入 No |",
      "| 建议仓位 | 10% |",
      "",
      "| Outcome | Market | AI |",
      "| --- | --- | --- |",
      "| Yes | 42.0% | 32.0% |",
      "| No | 58.0% | 68.0% |",
      "",
      "### 推理逻辑",
      "Fallback generated one provisional open candidate."
    ].join("\n");

    const plans = buildPulseEntryPlans({
      context: createContext(markdown),
      positionStopLossPct: 0.3
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]?.outcomeLabel).toBe("No");
    expect(plans[0]?.decision.edge).toBeCloseTo(0.1);
    expect(plans[0]?.decision.notional_usd).toBeCloseTo(1.1905, 4);
    expect(plans[0]?.sources[0]?.url).toBe("https://example.com/demo-market");
  });

  it("keeps raw quarter Kelly as the decision target and stores liquidity cap separately", () => {
    const markdown = [
      "## 1. Demo market question",
      "",
      "**链接：** https://example.com/demo-market",
      "| 方向 | 买入 No |",
      "| 建议仓位 | 4% |",
      "| 流动性上限 | $0.80 |",
      "| 置信度 | 中 |",
      "",
      "| No | 58% | 68% |",
      "",
      "### 推理逻辑",
      "Raw Kelly stays in the decision, while liquidity is stored as a separate cap."
    ].join("\n");

    const plans = buildPulseEntryPlans({
      context: createContext(markdown),
      positionStopLossPct: 0.3
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]?.quarterKellyPct).toBeCloseTo(0.059524, 6);
    expect(plans[0]?.suggestedPct).toBeCloseTo(0.059524, 6);
    expect(plans[0]?.liquidityCapUsd).toBe(0.8);
    expect(plans[0]?.decision.notional_usd).toBeCloseTo(1.1905, 4);
    expect(plans[0]?.decision.liquidity_cap_usd).toBe(0.8);
    expect(plans[0]?.decision.execution_amount).toBeUndefined();
  });
});
