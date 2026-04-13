---
name: ave-trading
description: AI-driven DeFi trading signal generation with Kelly-criterion position sizing and multi-layer risk controls
version: 1.0.0
author: Alchemist-X
tags: [defi, trading, ai, signals, risk-management]
---

# AVE Trading Skill

## Overview

Generates trading signals from AVE monitoring data, sizes positions using quarter-Kelly criterion, and manages the full position lifecycle through a 7-tier review system. Applies hard service-layer risk guards (drawdown halt, exposure caps, per-trade limits) to every decision before execution.

## Capabilities

| Capability | Description |
|---|---|
| **Signal Generation** | Momentum-based heuristic analysis of on-chain price data producing buy/sell direction with confidence scoring |
| **Position Sizing** | 1/4 Kelly criterion: `quarterKelly = (edge * confidence) / (4 * odds)` with edge = predictedReturn - riskPremium |
| **Risk Premium Computation** | Dynamic premium based on contract risk level, tax burden, and liquidity depth |
| **Entry Planning** | Rank candidates by monthly return, cap batch exposure at 20% of bankroll, limit to top N entries |
| **Position Review** | 7-tier review cascade evaluating every open position against current market prices |
| **Risk Guards** | Portfolio-level hard limits enforced at the service layer before any decision reaches execution |

## Decision Pipeline

```
  AVE Market Pulse                         AVE Entry Planner
  ================                         ==================

  AvePulseCandidate[]                      For each candidate:
        |                                    1. estimatePredictedReturn()
        |                                       - direction (buy/sell)
  Pulse Filters                                 - confidence (0.5 + |change| * 2, cap 0.9)
  (vol > $10k, liq > $5k,                      - predictedReturn = |change| * confidence
   no honeypots, tax < 10%)                  2. computeRiskPremium()
        |                                       - base: 2%
  Composite Score Sort                          - medium risk: +1%
  log10(vol) * log10(liq) * risk                - high/critical risk: +5%
        |                                       - low liquidity (<$50k): +2%
  Top N candidates                              - tax burden: +totalTax/100
        |                                    3. edge = predictedReturn - riskPremium
        v                                    4. calculateAveKelly({ edge, confidence })
  +------------------+                      5. Monthly return = edge / holdingPeriod
  | Entry Planner    | ------+
  +------------------+       |           AVE Position Review
        |                    |           ====================
  +------------------+       |
  | Position Review  | ------+--- composeAveDecisions() ---+
  +------------------+                                     |
                                                    applyRiskGuards()
                                                           |
                                                   TradeDecisionSet
```

## Position Review: 7-Tier Cascade

Every open position is evaluated in priority order. The first matching tier determines the action.

| Tier | Basis | Action | Exit % | Confidence |
|---|---|---|---|---|
| 1 | **Stop-loss breached** | `close` | 100% | medium |
| 2 | **Profit target hit** | `close` | 100% | high |
| 3 | **Edge gone negative** (< -5%) | `close` | 100% | medium |
| 4 | **Near stop-loss** (within 30% of threshold) | `reduce` | 50% | low |
| 5 | **Edge weakening** (0% to -5%) | `reduce` | 50% | low |
| 6 | **Edge positive** (> +2%) | `hold` | 0% | medium |
| 7 | **Stable hold** (edge near zero) | `hold` | 0% | low |

Tiers 3, 4, 5, and 7 set `humanReviewFlag: true` for manual oversight.

## Risk Parameters

### Service-Layer Hard Limits

| Parameter | Default | Env Variable | Description |
|---|---|---|---|
| Drawdown stop | 30% | `DRAWDOWN_STOP_PCT` | Halt all trading if portfolio drawdown exceeds threshold |
| Per-position stop-loss | 30% | `POSITION_STOP_LOSS_PCT` | Close position if unrealized loss exceeds threshold |
| Max total exposure | 80% | `MAX_TOTAL_EXPOSURE_PCT` | Cap total deployed capital as % of bankroll |
| Max per-trade size | 15% | `MAX_TRADE_PCT` | Cap any single trade as % of bankroll |
| Max open positions | 22 | `MAX_POSITIONS` | Hard limit on concurrent positions |
| Min trade size | $5 | `MIN_TRADE_USD` | Floor for trade notional |
| Liquidity cap | 5% of pair TVL | -- | Max trade size relative to pair liquidity |

### Entry Planner Defaults

| Parameter | Default | Description |
|---|---|---|
| Kelly fraction | 1/4 (quarter Kelly) | Conservative sizing to limit variance |
| Base risk premium | 2% | Minimum hurdle subtracted from predicted return |
| Minimum edge | 0.5% | Entries below this edge are skipped |
| Holding period | 1 month | Assumed holding period for monthly return calculation |
| Max new entries per batch | 4 | Limit on new positions opened per cycle |
| Batch cap | 20% of bankroll | Total capital allocated across all new entries in one cycle |

## Usage

### Generate Entry Plans

```typescript
import { planAveEntries } from "services/orchestrator/src/runtime/ave-entry-planner.js";

const plans = planAveEntries(
  filteredCandidates,
  {
    bankrollUsd: 10_000,
    existingPositions: ["0x...abc-ethereum"],
  },
  {
    maxNewEntries: 4,
    batchCapPct: 0.2,
    stopLossPct: 0.3,
    minEdge: 0.005,
  }
);

// plans: AveEntryPlan[] sorted by monthly return, batch-capped
```

### Review Open Positions

```typescript
import { reviewAvePositions } from "services/orchestrator/src/review/ave-position-review.js";

const reviews = reviewAvePositions(
  currentPositions,
  currentPriceMap,    // Map<tokenId, priceUsd>
  {
    stopLossPct: 0.3,
    targetProfitPct: 0.5,  // optional
  }
);

for (const review of reviews) {
  // review.action: "hold" | "reduce" | "close"
  // review.basis:  "stop-loss-breached" | "profit-target-hit" | ...
  // review.decision: TradeDecision (ready for execution)
}
```

### Full Pipeline Execution

```typescript
import { runAveDirectPipeline } from "services/orchestrator/src/runtime/ave-direct-runtime.js";

const result = await runAveDirectPipeline(
  {
    runId: crypto.randomUUID(),
    mode: "full",
    bankrollUsd: 10_000,
    totalEquityUsd: 10_000,
    positions: [],
    openPositionCount: 0,
  },
  orchestratorConfig
);

// result.decisionSet: TradeDecisionSet with all decisions
// result.entryPlans: new positions planned
// result.positionReviews: existing position evaluations
```

## Output Format

### AveEntryPlan

```json
{
  "tokenAddress": "0x6982508...a011",
  "chain": "ethereum",
  "tokenId": "0x6982508...a011-ethereum",
  "tokenSymbol": "PEPE",
  "direction": "buy",
  "sizeUsd": 142.50,
  "confidence": 0.67,
  "predictedReturn": 0.057,
  "riskPremium": 0.02,
  "edge": 0.037,
  "fullKellyPct": 0.02479,
  "quarterKellyPct": 0.00620,
  "monthlyReturn": 0.037,
  "holdingPeriodMonths": 1,
  "currentPriceUsd": 0.00001234,
  "liquidityUsd": 18500000,
  "riskLevel": "low",
  "confidenceBucket": "medium-high"
}
```

### TradeDecisionSet (final output)

```json
{
  "run_id": "a1b2c3d4-...",
  "runtime": "ave-direct-runtime",
  "generated_at_utc": "2026-04-13T12:00:00.000Z",
  "bankroll_usd": 10000,
  "mode": "full",
  "decisions": [
    {
      "action": "open",
      "event_slug": "ethereum",
      "market_slug": "0x698...a011-ethereum",
      "token_id": "0x698...a011-ethereum",
      "token_symbol": "PEPE",
      "side": "BUY",
      "notional_usd": 142.50,
      "order_type": "FOK",
      "ai_prob": 0.67,
      "market_prob": 0.50,
      "edge": 0.037,
      "confidence": "medium-high",
      "thesis_md": "**PEPE** on ethereum: Price $0.000012, 24h change +8.50%. Direction: BUY with 67.0% confidence. Edge: 3.70%. Quarter Kelly size: $142.50.",
      "sources": [
        {
          "title": "AVE token data for PEPE",
          "url": "https://ave.ai/token/0x698...a011-ethereum",
          "retrieved_at_utc": "2026-04-13T12:00:00.000Z"
        }
      ],
      "full_kelly_pct": 0.02479,
      "quarter_kelly_pct": 0.00620,
      "liquidity_cap_usd": 925000,
      "stop_loss_pct": 0.3,
      "resolution_track_required": false
    }
  ],
  "artifacts": []
}
```

## Integration Depth

The trading skill consumes every monitoring output (price, volume, liquidity, risk assessment) and transforms it through a quantitative pipeline: momentum estimation, dynamic risk premium, Kelly sizing, 7-tier position review, decision composition with deduplication, and portfolio-level risk guards. Every TradeDecision carries a full audit trail including thesis markdown, source URLs, and Kelly fractions.
