---
name: ave-complete-agent
description: End-to-end autonomous DeFi trading agent combining monitoring and trading skills
version: 1.0.0
author: Alchemist-X
tags: [defi, autonomous, agent, complete]
---

# AVE Complete Agent Skill

## Overview

Complete Application Scenario -- combines the `ave-monitoring` and `ave-trading` skills into a fully autonomous DeFi trading pipeline. The agent runs unsupervised: it discovers tokens across 130+ chains, filters for quality and safety, generates entry signals with Kelly-criterion sizing, reviews existing positions through a 7-tier cascade, and enforces portfolio-level risk guards before any decision reaches execution.

## Architecture

```
+===========================================================================+
|                         AVE Complete Agent                                |
+===========================================================================+
|                                                                           |
|  Layer 1: Data Ingestion (ave-monitoring)                                 |
|  +-------------------------------------------------------------------+   |
|  |  AveClient (Zod-validated, retry + timeout)                       |   |
|  |                                                                   |   |
|  |  Token Search ----+                                               |   |
|  |  Trending     ----+-- Deduplicate -- Batch Price -- Risk Scan     |   |
|  |  Rankings     ----+                                               |   |
|  +-------------------------------------------------------------------+   |
|                              |                                           |
|  Layer 2: Filtering & Scoring                                            |
|  +-------------------------------------------------------------------+   |
|  |  Volume gate ($10k)  |  Liquidity gate ($5k)  |  Honeypot filter  |   |
|  |  Risk level filter   |  Tax cap (10%)         |  Chain filter     |   |
|  |                                                                   |   |
|  |  Composite Score = log10(vol) * log10(liq) * riskMultiplier       |   |
|  +-------------------------------------------------------------------+   |
|                              |                                           |
|  Layer 3: Decision Engine (ave-trading)                                   |
|  +-------------------------------------------------------------------+   |
|  |  Entry Planner            |  Position Reviewer                    |   |
|  |  ~~~~~~~~~~~~~~~~~~~~~~~~ |  ~~~~~~~~~~~~~~~~~~                   |   |
|  |  Momentum estimation      |  7-tier cascade:                     |   |
|  |  Dynamic risk premium     |    stop-loss / target / edge-gone /  |   |
|  |  Edge = return - premium  |    near-stop / edge-weak / edge-pos  |   |
|  |  Quarter-Kelly sizing     |    / stable-hold                     |   |
|  |  Monthly return ranking   |  Per-position TradeDecision          |   |
|  |  Batch cap enforcement    |                                      |   |
|  +-------------------------------------------------------------------+   |
|                              |                                           |
|  Layer 4: Risk & Execution                                               |
|  +-------------------------------------------------------------------+   |
|  |  Decision Composer: merge reviews + entries, deduplicate          |   |
|  |  Risk Guards: drawdown halt, exposure cap, position limit,        |   |
|  |               per-trade cap, liquidity cap, min trade floor       |   |
|  |  Artifact Writer: runtime logs, decision audit trail              |   |
|  +-------------------------------------------------------------------+   |
|                                                                           |
+===========================================================================+
```

## Pipeline

The full pipeline executes in a single call to `runAveDirectPipeline()`:

```
Step 1  FETCH         Parallel multi-chain market data from Ave.ai API
                      (token search + trending + rankings per chain)
                      
Step 2  DEDUPLICATE   Merge results across sources, keep highest-volume entry
                      per token ID

Step 3  ENRICH        Batch price update for all unique tokens (up to 200/batch)
                      Contract risk scan for top 20 by volume

Step 4  FILTER        Apply pulse filters: volume, liquidity, risk level,
                      honeypot, tax cap, chain whitelist

Step 5  SCORE         Composite ranking: log10(vol) * log10(liq) * riskMult
                      Select top N candidates

Step 6  PLAN          For each candidate: estimate predicted return,
                      compute risk premium, calculate edge,
                      size via quarter-Kelly, rank by monthly return,
                      enforce batch cap (20% of bankroll)

Step 7  REVIEW        For each open position: fetch current price,
                      evaluate against 7-tier cascade,
                      produce hold/reduce/close decision

Step 8  COMPOSE       Merge review decisions + entry plans,
                      skip duplicate token IDs,
                      prevent entry into already-held tokens

Step 9  GUARD         Apply portfolio-level risk guards:
                      - Max total exposure (80%)
                      - Max per-trade (15%)
                      - Max positions (22)
                      - Liquidity cap (5% of pair TVL)
                      - Min trade floor ($5)

Step 10 EMIT          Output TradeDecisionSet with full audit trail,
                      write runtime log artifact to disk
```

## Module Map

| Module | Path | Role |
|---|---|---|
| AveClient | `services/ave-monitor/src/client.ts` | Zod-validated API client with retry |
| Type Schemas | `services/ave-monitor/src/types.ts` | 12 Zod schemas covering all API shapes |
| Market Pulse | `services/orchestrator/src/pulse/ave-market-pulse.ts` | Multi-source fetch + dedupe + enrich |
| Pulse Filters | `services/orchestrator/src/pulse/ave-pulse-filters.ts` | Volume/liquidity/risk filtering + scoring |
| Entry Planner | `services/orchestrator/src/runtime/ave-entry-planner.ts` | Kelly sizing + monthly return ranking |
| Position Review | `services/orchestrator/src/review/ave-position-review.ts` | 7-tier position evaluation cascade |
| Direct Runtime | `services/orchestrator/src/runtime/ave-direct-runtime.ts` | Full pipeline orchestration |
| Config | `services/orchestrator/src/config.ts` | Environment-driven configuration |

## Demo

```bash
# Install dependencies
pnpm install

# Set your Ave.ai API key
export AVE_API_KEY="your-api-key"

# Run the full autonomous pipeline
pnpm ave:demo

# Or run via the daily pulse entry point with AVE strategy
AGENT_DECISION_STRATEGY=ave-direct pnpm daily:pulse
```

### Programmatic Invocation

```typescript
import { runAveDirectPipeline } from "services/orchestrator/src/runtime/ave-direct-runtime.js";
import { loadConfig } from "services/orchestrator/src/config.js";

const config = loadConfig();
const result = await runAveDirectPipeline(
  {
    runId: crypto.randomUUID(),
    mode: "full",
    bankrollUsd: 10_000,
    totalEquityUsd: 10_000,
    positions: [],
    openPositionCount: 0,
  },
  config
);

console.log(`Fetched ${result.candidateCount} candidates`);
console.log(`Filtered to ${result.filteredCandidateCount}`);
console.log(`Generated ${result.entryPlans.length} entry plans`);
console.log(`Reviewed ${result.positionReviews.length} positions`);
console.log(`Final decisions: ${result.decisionSet.decisions.length}`);
```

## AVE API Coverage

This agent uses **8 distinct Ave.ai API endpoints** in production:

| # | Endpoint | Pipeline Step | Purpose |
|---|---|---|---|
| 1 | `GET /v2/tokens` | Fetch | Multi-chain token search ordered by volume |
| 2 | `GET /v2/tokens/trending` | Fetch | Chain-specific trending token discovery |
| 3 | `GET /v2/ranks` | Fetch | Global hot rankings |
| 4 | `POST /v2/tokens/price` | Enrich | Batch price update (200 tokens/request) |
| 5 | `GET /v2/contracts/{id}` | Enrich | Contract security + honeypot detection |
| 6 | `GET /v2/tokens/{id}` | Detail | Deep token metadata on demand |
| 7 | `GET /v2/klines/token/{id}` | Analyze | K-line data for technical analysis |
| 8 | `GET /v2/supported_chains` | Init | Enumerate all 130+ supported chains |

## Risk Philosophy

The agent operates under a conservative risk regime:

- **Quarter Kelly sizing** reduces bet-of-ruin risk by 4x vs. full Kelly
- **Dynamic risk premiums** penalize low-liquidity, high-tax, and high-risk-score tokens
- **7-tier position review** ensures no position drifts without evaluation
- **Portfolio-level hard limits** prevent catastrophic concentration or overexposure
- **Human review flags** surface edge cases for manual oversight
- **Graceful degradation** ensures partial API failures do not crash the pipeline

## Artifacts

Each run produces:

```
runtime-artifacts/
  pulse-live/<timestamp>-<runId>/
    runtime-log.md          # Full pipeline audit trail
    decisions.json          # TradeDecisionSet
    entry-plans.json        # AveEntryPlan[]
    position-reviews.json   # AvePositionReview[]
```

## Integration Depth Summary

| Dimension | Coverage |
|---|---|
| AVE API endpoints used | 8 / 12 documented endpoints |
| Chains supported | 130+ (configurable subset) |
| Zod schemas | 12 type-safe schemas |
| Risk controls | 6 portfolio-level guards + 7-tier position review |
| Sizing model | Kelly criterion with confidence-weighted edge |
| Error handling | Retry + backoff + timeout + graceful degradation |
| Output format | TradeDecisionSet (shared contract type) |
