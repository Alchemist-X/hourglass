---
name: ave-monitoring
description: Multi-chain DeFi asset monitoring with anomaly detection and risk alerts via Ave.ai API
version: 1.0.0
author: Alchemist-X
tags: [defi, monitoring, alerts, risk, on-chain]
---

# AVE Monitoring Skill

## Overview

Monitors on-chain assets across 130+ blockchains using the Ave.ai API. Discovers tokens via multi-source aggregation (search, trending, rankings), tracks real-time prices and volumes, detects anomalous transaction patterns, and assesses smart contract security risk -- all through a unified, Zod-validated TypeScript client.

## Capabilities

| Capability | Description | AVE Endpoint |
|---|---|---|
| **Asset Discovery** | Search, trending, and ranked token discovery across all supported chains | `GET /v2/tokens`, `GET /v2/tokens/trending`, `GET /v2/ranks` |
| **Real-time Pricing** | Batch price queries for up to 200 tokens per request with 24h change tracking | `POST /v2/tokens/price` |
| **Token Deep-dive** | Detailed token metadata including holder count, pair info, and multi-timeframe volume | `GET /v2/tokens/{token-id}` |
| **Transaction Monitoring** | Per-pair swap history with maker addresses, amounts, and liquidity snapshots | `GET /v2/txs/{pair-id}` |
| **Contract Security** | Smart contract risk scoring: honeypot detection, mint functions, ownership analysis, tax rates, LP lock status | `GET /v2/contracts/{token-id}` |
| **Chain Coverage** | Query all 130+ supported blockchains | `GET /v2/supported_chains` |

## API Endpoints Used

```
Base URL: https://openapi.avedata.org/api/v1
Auth:     X-API-KEY header

GET  /v2/tokens?keyword={kw}&chain={chain}&limit={n}&orderby={field}
GET  /v2/tokens/{token-id}
POST /v2/tokens/price              body: { token_ids: [...], tvl_min, tx_24h_volume_min }
GET  /v2/tokens/trending?chain={chain}
GET  /v2/tokens/main?chain={chain}
GET  /v2/txs/{pair-id}?limit={n}&from_time={t}&to_time={t}
GET  /v2/contracts/{token-id}
GET  /v2/supported_chains
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `AVE_API_KEY` | Yes | -- | API key from Ave.ai (contact sephana@ave.ai) |
| `AVE_API_BASE_URL` | No | `https://openapi.avedata.org/api/v1` | API base URL |
| `AVE_MONITORING_CHAINS` | No | `ethereum,bsc,polygon,base,solana` | Comma-separated chains to monitor |
| `AVE_PULSE_TOKEN_LIMIT` | No | `300` | Max tokens per chain search |
| `AVE_PULSE_TRENDING_LIMIT` | No | `50` | Max trending/ranked tokens |

## Usage

```typescript
import { AveClient } from "services/ave-monitor/src/client.js";

const client = new AveClient({
  apiKey: process.env.AVE_API_KEY!,
});

// Discover trending tokens on Solana
const trending = await client.getTrendingTokens("solana");

// Batch price check across chains
const prices = await client.getTokenPrices([
  "0x...abc-ethereum",
  "So11...xyz-solana",
]);

// Contract security assessment
const risk = await client.getContractSecurity("0x...abc-ethereum");
if (risk.is_honeypot) {
  console.warn("Honeypot detected -- skip this token");
}

// Transaction monitoring for a trading pair
const txs = await client.getTransactions("0x...pair-ethereum", {
  limit: 100,
  from_time: Math.floor(Date.now() / 1000) - 3600,
});
```

### Multi-source Market Pulse

```typescript
import { fetchAveMarkets } from "services/orchestrator/src/pulse/ave-market-pulse.js";

const candidates = await fetchAveMarkets({
  apiKey: process.env.AVE_API_KEY!,
  chains: ["ethereum", "bsc", "solana"],
  tokenLimit: 300,
  trendingLimit: 50,
});

// Each candidate includes:
//   symbol, chain, priceUsd, priceChange24h, volume24hUsd,
//   liquidityUsd, holderCount, discoverySource, riskAssessment
```

### Candidate Filtering

```typescript
import {
  applyAvePulseFilters,
  defaultAvePulseFilterArgs,
  sortAveCandidatesByScore,
} from "services/orchestrator/src/pulse/ave-pulse-filters.js";

const filters = defaultAvePulseFilterArgs();
// filters.minVolume       = 10_000   (USD)
// filters.minLiquidity    = 5_000    (USD)
// filters.excludeRiskLevels = ["high", "critical"]
// filters.excludeHoneypots  = true
// filters.maxTaxPercent     = 10

const safe = applyAvePulseFilters(candidates, filters);
const ranked = sortAveCandidatesByScore(safe);
```

## Output Format

### AvePulseCandidate (per-token monitoring output)

```json
{
  "symbol": "PEPE",
  "name": "Pepe",
  "tokenAddress": "0x6982508...a011",
  "chain": "ethereum",
  "tokenId": "0x6982508...a011-ethereum",
  "priceUsd": 0.00001234,
  "priceChange24h": 0.085,
  "volume24hUsd": 42500000,
  "fdv": 5200000000,
  "marketCap": 4900000000,
  "liquidityUsd": 18500000,
  "holderCount": 245000,
  "mainPairId": "0xabc...123-ethereum",
  "discoverySource": "trending",
  "riskAssessment": {
    "riskLevel": "low",
    "isHoneypot": false,
    "hasMintFunction": false,
    "ownerCanChangeBalance": false,
    "isOpenSource": true,
    "buyTax": 0,
    "sellTax": 0,
    "lpLocked": true,
    "lpLockRatio": 0.95
  }
}
```

### AveContractRisk (security output)

```json
{
  "token_address": "0x6982508...a011",
  "chain": "ethereum",
  "is_open_source": true,
  "is_honeypot": false,
  "is_mintable": false,
  "owner_change_balance": false,
  "buy_tax": 0,
  "sell_tax": 0,
  "is_anti_whale": false,
  "risk_level": "low",
  "risk_score": 12,
  "risk_items": [
    { "name": "no_anti_whale", "severity": "info" }
  ]
}
```

## Architecture

```
                        AVE Monitoring Skill
                        ====================

  +------------------+    +------------------+    +------------------+
  | Token Search     |    | Trending Tokens  |    | Hot Rankings     |
  | (per chain)      |    | (per chain)      |    | (global)         |
  +--------+---------+    +--------+---------+    +--------+---------+
           |                       |                       |
           +----------+------------+-----------+-----------+
                      |                        |
               Deduplicate by tokenId    Batch Price Enrichment
                      |                        |
                      +----------+-------------+
                                 |
                    Contract Risk Assessment (top 20)
                                 |
                    Pulse Filter Pipeline
                    (volume, liquidity, risk, tax)
                                 |
                    Composite Score Ranking
                    log10(vol) * log10(liq) * riskMult
                                 |
                         AvePulseCandidate[]
```

## Error Handling

- **Retry with backoff**: All API calls retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Graceful degradation**: Individual chain/endpoint failures do not block the overall pulse
- **Zod validation**: All responses are schema-validated; malformed data falls back to raw with a warning
- **Timeout protection**: 30-second per-request timeout with AbortController

## Integration Depth

This skill wraps **8 distinct Ave.ai API endpoints** through a type-safe client with full Zod schema validation, exponential retry, and timeout handling. The monitoring pipeline performs parallel multi-chain fetches, cross-source deduplication, batch price enrichment, and automated contract security screening -- producing risk-annotated candidates ready for downstream trading decisions.
