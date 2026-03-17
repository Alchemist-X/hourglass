import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { OverviewResponse, PublicPosition, TradeDecisionSet } from "@autopoly/contracts";
import type { PulseSnapshot } from "../pulse/market-pulse.js";
import { buildEnglishMirrorRelativePath } from "./artifacts.js";
import {
  buildBacktestReportArtifact,
  buildPortfolioReportArtifacts
} from "./portfolio-report-artifacts.js";

function createOverview(): OverviewResponse {
  return {
    status: "running",
    cash_balance_usd: 18,
    total_equity_usd: 20,
    high_water_mark_usd: 20,
    drawdown_pct: 0.02,
    open_positions: 1,
    last_run_at: null,
    latest_risk_event: null,
    equity_curve: []
  };
}

function createPositions(): PublicPosition[] {
  return [
    {
      id: "position-1",
      event_slug: "demo-event",
      market_slug: "demo-market",
      token_id: "token-1",
      side: "BUY",
      outcome_label: "No",
      size: 3,
      avg_cost: 0.42,
      current_price: 0.38,
      current_value_usd: 1.14,
      unrealized_pnl_pct: -0.095238,
      stop_loss_pct: 0.3,
      opened_at: "2026-03-17T00:00:00.000Z",
      updated_at: "2026-03-17T00:00:00.000Z"
    }
  ];
}

function createPulse(): PulseSnapshot {
  return {
    id: "pulse-1",
    generatedAtUtc: "2026-03-17T00:00:00.000Z",
    title: "Daily Pulse",
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
    riskFlags: ["spread widened"],
    tradeable: true
  };
}

function createDecisionSet(): TradeDecisionSet {
  return {
    run_id: "11111111-1111-4111-8111-111111111111",
    runtime: "pulse-direct-runtime",
    generated_at_utc: "2026-03-17T00:00:00.000Z",
    bankroll_usd: 20,
    mode: "full",
    decisions: [
      {
        action: "open",
        event_slug: "demo-event",
        market_slug: "open-market",
        token_id: "token-open",
        side: "BUY",
        notional_usd: 2,
        order_type: "FOK",
        ai_prob: 0.61,
        market_prob: 0.52,
        edge: 0.09,
        confidence: "medium",
        thesis_md: "Positive edge.",
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
    ],
    artifacts: []
  };
}

describe("portfolio report artifacts", () => {
  it("writes review, monitor, and rebalance artifacts with English mirrors", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "autopoly-portfolio-reports-"));
    try {
      const artifacts = await buildPortfolioReportArtifacts({
        config: { artifactStorageRoot: tempDir },
        overview: createOverview(),
        positions: createPositions(),
        pulse: createPulse(),
        decisionSet: createDecisionSet(),
        promptSummary: "Prompt summary",
        reasoningMd: "Reasoning summary"
      });

      expect(artifacts.map((artifact) => artifact.kind)).toEqual([
        "review-report",
        "monitor-report",
        "rebalance-report"
      ]);

      const reviewPath = path.join(tempDir, artifacts[0]!.path);
      const reviewEnglishPath = path.join(tempDir, buildEnglishMirrorRelativePath(artifacts[0]!.path));
      const reviewContent = await readFile(reviewPath, "utf8");
      const reviewEnglishContent = await readFile(reviewEnglishPath, "utf8");

      expect(reviewContent).toContain("# 组合复盘报告");
      expect(reviewEnglishContent).toContain("# Portfolio Review Report");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("writes a bilingual backtest artifact", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "autopoly-backtest-report-"));
    try {
      const artifact = await buildBacktestReportArtifact({
        config: { artifactStorageRoot: tempDir },
        generatedAtUtc: "2026-03-17T00:00:00.000Z",
        runId: "22222222-2222-4222-8222-222222222222",
        overview: createOverview(),
        positions: createPositions()
      });

      const zhPath = path.join(tempDir, artifact.path);
      const enPath = path.join(tempDir, buildEnglishMirrorRelativePath(artifact.path));
      expect(await readFile(zhPath, "utf8")).toContain("# 回测报告");
      expect(await readFile(enPath, "utf8")).toContain("# Backtest Report");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
