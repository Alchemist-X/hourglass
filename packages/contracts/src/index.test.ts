import { describe, expect, it } from "vitest";
import {
  applyPaperTradeDecision,
  avePulseCandidateSchema,
  aveAlertSchema,
  aveTradingSignalSchema,
  roughLoopRunRecordSchema,
  roughLoopTaskSchema,
  tradeDecisionSetSchema
} from "./index.js";

describe("tradeDecisionSetSchema", () => {
  it("accepts a valid decision set", () => {
    const parsed = tradeDecisionSetSchema.parse({
      run_id: "47a9e19f-7352-4c7a-a41e-3d18c4487bb9",
      runtime: "codex-skill-runtime",
      generated_at_utc: "2026-03-13T10:00:00.000Z",
      bankroll_usd: 10000,
      mode: "full",
      decisions: [
        {
          action: "open",
          event_slug: "event",
          market_slug: "market",
          token_id: "token",
          side: "BUY",
          notional_usd: 50,
          order_type: "FOK",
          ai_prob: 0.6,
          market_prob: 0.42,
          edge: 0.18,
          confidence: "high",
          thesis_md: "Edge is positive.",
          sources: [
            {
              title: "Source",
              url: "https://example.com",
              retrieved_at_utc: "2026-03-13T10:00:00.000Z"
            }
          ],
          stop_loss_pct: 0.3,
          resolution_track_required: true
        }
      ],
      artifacts: []
    });

    expect(parsed.runtime).toBe("codex-skill-runtime");
  });

  it("rejects decisions without sources", () => {
    expect(() =>
      tradeDecisionSetSchema.parse({
        run_id: "47a9e19f-7352-4c7a-a41e-3d18c4487bb9",
        runtime: "codex-skill-runtime",
        generated_at_utc: "2026-03-13T10:00:00.000Z",
        bankroll_usd: 10000,
        mode: "full",
        decisions: [
          {
            action: "open",
            event_slug: "event",
            market_slug: "market",
            token_id: "token",
            side: "BUY",
            notional_usd: 50,
            order_type: "FOK",
            ai_prob: 0.6,
            market_prob: 0.42,
            edge: 0.18,
            confidence: "high",
            thesis_md: "Edge is positive.",
            sources: [],
            stop_loss_pct: 0.3,
            resolution_track_required: true
          }
        ],
        artifacts: []
      })
    ).toThrow();
  });
});

describe("roughLoopTaskSchema", () => {
  it("accepts a valid rough loop task", () => {
    const parsed = roughLoopTaskSchema.parse({
      id: "RL-001",
      title: "Implement rough loop parser",
      status: "todo",
      priority: "P1",
      dependsOn: [],
      allowedPaths: ["services/rough-loop"],
      definitionOfDone: ["Parser can round-trip markdown tasks."],
      verification: ["pnpm test"],
      context: ["Start from the rough-loop guide template."],
      latestResult: ["Not started."],
      attempts: 0,
      section: "queue",
      createdOrder: 0
    });

    expect(parsed.status).toBe("todo");
  });
});

describe("roughLoopRunRecordSchema", () => {
  it("accepts a run record with verification results", () => {
    const parsed = roughLoopRunRecordSchema.parse({
      runId: "run-123",
      taskId: "RL-001",
      provider: "codex",
      status: "done",
      attempt: 1,
      startedAtUtc: "2026-03-14T08:00:00.000Z",
      finishedAtUtc: "2026-03-14T08:05:00.000Z",
      summary: "Task completed.",
      changedFiles: ["services/rough-loop/src/lib/markdown.ts"],
      artifactsDir: "runtime-artifacts/rough-loop/runs/2026/03/14/run-123",
      verification: {
        passed: true,
        summary: "All verification commands passed.",
        commandResults: [
          {
            command: "pnpm test",
            exitCode: 0,
            passed: true,
            stdout: "",
            stderr: ""
          }
        ]
      }
    });

    expect(parsed.verification?.passed).toBe(true);
  });
});

describe("applyPaperTradeDecision", () => {
  it("opens a new paper position from a BUY decision", () => {
    const result = applyPaperTradeDecision({
      position: null,
      avgPrice: 0.5,
      timestampUtc: "2026-03-16T10:00:00.000Z",
      decision: {
        action: "open",
        event_slug: "event",
        market_slug: "market",
        token_id: "token",
        side: "BUY",
        notional_usd: 25,
        order_type: "FOK",
        ai_prob: 0.6,
        market_prob: 0.45,
        edge: 0.15,
        confidence: "high",
        thesis_md: "Open a paper position.",
        sources: [
          {
            title: "Source",
            url: "https://example.com",
            retrieved_at_utc: "2026-03-16T10:00:00.000Z"
          }
        ],
        stop_loss_pct: 0.3,
        resolution_track_required: true
      }
    });

    expect(result.status).toBe("filled");
    expect(result.filledNotionalUsd).toBe(25);
    expect(result.nextPosition?.size).toBeCloseTo(50);
  });

  it("rejects a SELL decision when no paper position exists", () => {
    const result = applyPaperTradeDecision({
      position: null,
      avgPrice: 0.48,
      timestampUtc: "2026-03-16T10:00:00.000Z",
      decision: {
        action: "close",
        event_slug: "event",
        market_slug: "market",
        token_id: "token",
        side: "SELL",
        notional_usd: 25,
        order_type: "FOK",
        ai_prob: 0.6,
        market_prob: 0.45,
        edge: 0.15,
        confidence: "high",
        thesis_md: "Close a missing paper position.",
        sources: [
          {
            title: "Source",
            url: "https://example.com",
            retrieved_at_utc: "2026-03-16T10:00:00.000Z"
          }
        ],
        stop_loss_pct: 0.3,
        resolution_track_required: true
      }
    });

    expect(result.status).toBe("rejected");
    expect(result.rejectionReason).toContain("no open position");
  });
});

describe("decisionSchema AVE extensions", () => {
  it("accepts a decision with optional AVE fields", () => {
    const parsed = tradeDecisionSetSchema.parse({
      run_id: "47a9e19f-7352-4c7a-a41e-3d18c4487bb9",
      runtime: "ave-claw-runtime",
      generated_at_utc: "2026-04-13T10:00:00.000Z",
      bankroll_usd: 5000,
      mode: "full",
      decisions: [
        {
          action: "open",
          event_slug: "eth-analysis",
          market_slug: "eth-usd",
          token_id: "token-eth",
          token_address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          chain: "ethereum",
          category: "defi",
          token_symbol: "ETH",
          side: "BUY",
          notional_usd: 100,
          order_type: "GTC",
          ai_prob: 0.7,
          market_prob: 0.5,
          edge: 0.2,
          confidence: "high",
          thesis_md: "Strong momentum.",
          sources: [
            {
              title: "On-chain data",
              url: "https://example.com/onchain",
              retrieved_at_utc: "2026-04-13T10:00:00.000Z"
            }
          ],
          stop_loss_pct: 0.25,
          resolution_track_required: false
        }
      ],
      artifacts: []
    });

    const first = parsed.decisions[0]!;
    expect(first.token_address).toBe("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    expect(first.chain).toBe("ethereum");
    expect(first.category).toBe("defi");
    expect(first.token_symbol).toBe("ETH");
  });

  it("accepts a decision without AVE fields (backward compatible)", () => {
    const parsed = tradeDecisionSetSchema.parse({
      run_id: "47a9e19f-7352-4c7a-a41e-3d18c4487bb9",
      runtime: "codex-skill-runtime",
      generated_at_utc: "2026-03-13T10:00:00.000Z",
      bankroll_usd: 10000,
      mode: "full",
      decisions: [
        {
          action: "open",
          event_slug: "event",
          market_slug: "market",
          token_id: "token",
          side: "BUY",
          notional_usd: 50,
          order_type: "FOK",
          ai_prob: 0.6,
          market_prob: 0.42,
          edge: 0.18,
          confidence: "high",
          thesis_md: "Edge is positive.",
          sources: [
            {
              title: "Source",
              url: "https://example.com",
              retrieved_at_utc: "2026-03-13T10:00:00.000Z"
            }
          ],
          stop_loss_pct: 0.3,
          resolution_track_required: true
        }
      ],
      artifacts: []
    });

    const first = parsed.decisions[0]!;
    expect(first.token_address).toBeUndefined();
    expect(first.chain).toBeUndefined();
  });
});

describe("avePulseCandidateSchema", () => {
  it("accepts a valid pulse candidate", () => {
    const parsed = avePulseCandidateSchema.parse({
      tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      chain: "ethereum",
      tokenSymbol: "ETH",
      currentPrice: 3200.5,
      priceChange24h: -2.3,
      volume24hUsd: 1500000,
      liquidityUsd: 8000000,
      riskLevel: "medium",
      categorySlug: "defi",
      question: "Will ETH break above $3500 this week?"
    });

    expect(parsed.tokenSymbol).toBe("ETH");
    expect(parsed.currentPrice).toBe(3200.5);
  });

  it("accepts a pulse candidate without optional fields", () => {
    const parsed = avePulseCandidateSchema.parse({
      tokenAddress: "0xSomeToken",
      chain: "base",
      tokenSymbol: "DEGEN",
      currentPrice: 0.012,
      priceChange24h: 15.4,
      volume24hUsd: 250000,
      liquidityUsd: 500000,
      question: "Is DEGEN showing signs of a breakout?"
    });

    expect(parsed.riskLevel).toBeUndefined();
    expect(parsed.categorySlug).toBeUndefined();
  });

  it("rejects a pulse candidate missing required fields", () => {
    expect(() =>
      avePulseCandidateSchema.parse({
        tokenAddress: "0xSomeToken",
        chain: "base",
        // missing tokenSymbol, currentPrice, etc.
      })
    ).toThrow();
  });
});

describe("aveAlertSchema", () => {
  it("accepts a valid alert", () => {
    const parsed = aveAlertSchema.parse({
      type: "whale_movement",
      tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      chain: "ethereum",
      tokenSymbol: "ETH",
      severity: "warning",
      message: "Large transfer of 5000 ETH detected",
      data: { amount: 5000, fromAddress: "0xABC" },
      timestamp: "2026-04-13T12:00:00.000Z"
    });

    expect(parsed.type).toBe("whale_movement");
    expect(parsed.severity).toBe("warning");
  });

  it("accepts an alert without optional data", () => {
    const parsed = aveAlertSchema.parse({
      type: "price_alert",
      tokenAddress: "0xSomeToken",
      chain: "base",
      tokenSymbol: "DEGEN",
      severity: "info",
      message: "DEGEN crossed $0.01",
      timestamp: "2026-04-13T12:00:00.000Z"
    });

    expect(parsed.data).toBeUndefined();
  });

  it("rejects an alert with invalid type", () => {
    expect(() =>
      aveAlertSchema.parse({
        type: "invalid_type",
        tokenAddress: "0xSomeToken",
        chain: "base",
        tokenSymbol: "DEGEN",
        severity: "info",
        message: "test",
        timestamp: "2026-04-13T12:00:00.000Z"
      })
    ).toThrow();
  });

  it("rejects an alert with invalid severity", () => {
    expect(() =>
      aveAlertSchema.parse({
        type: "price_alert",
        tokenAddress: "0xSomeToken",
        chain: "base",
        tokenSymbol: "DEGEN",
        severity: "extreme",
        message: "test",
        timestamp: "2026-04-13T12:00:00.000Z"
      })
    ).toThrow();
  });
});

describe("aveTradingSignalSchema", () => {
  it("accepts a valid trading signal", () => {
    const parsed = aveTradingSignalSchema.parse({
      tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      chain: "ethereum",
      tokenSymbol: "ETH",
      direction: "buy",
      confidence: 0.85,
      targetPrice: 3500,
      stopLoss: 2900,
      reasoning: "Multiple whale accumulations detected with rising volume",
      sourceAlerts: ["alert-001", "alert-002"],
      timestamp: "2026-04-13T12:30:00.000Z"
    });

    expect(parsed.direction).toBe("buy");
    expect(parsed.confidence).toBe(0.85);
    expect(parsed.sourceAlerts).toHaveLength(2);
  });

  it("accepts a signal without optional fields", () => {
    const parsed = aveTradingSignalSchema.parse({
      tokenAddress: "0xSomeToken",
      chain: "base",
      tokenSymbol: "DEGEN",
      direction: "hold",
      confidence: 0.5,
      reasoning: "Insufficient data for directional conviction",
      sourceAlerts: [],
      timestamp: "2026-04-13T12:30:00.000Z"
    });

    expect(parsed.targetPrice).toBeUndefined();
    expect(parsed.stopLoss).toBeUndefined();
  });

  it("rejects confidence outside [0, 1]", () => {
    expect(() =>
      aveTradingSignalSchema.parse({
        tokenAddress: "0xSomeToken",
        chain: "base",
        tokenSymbol: "DEGEN",
        direction: "buy",
        confidence: 1.5,
        reasoning: "test",
        sourceAlerts: [],
        timestamp: "2026-04-13T12:30:00.000Z"
      })
    ).toThrow();
  });

  it("rejects an invalid direction", () => {
    expect(() =>
      aveTradingSignalSchema.parse({
        tokenAddress: "0xSomeToken",
        chain: "base",
        tokenSymbol: "DEGEN",
        direction: "short",
        confidence: 0.7,
        reasoning: "test",
        sourceAlerts: [],
        timestamp: "2026-04-13T12:30:00.000Z"
      })
    ).toThrow();
  });
});
