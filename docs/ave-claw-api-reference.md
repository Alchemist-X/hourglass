# AVE Claw API Reference

## Base URL
```
https://openapi.avedata.org/api/v1/
```

## Authentication
```
Header: X-API-KEY: YOUR_API_KEY
```
Contact: sephana@ave.ai for API keys

## Response Format
```json
{
  "status": 1,
  "msg": "SUCCESS",
  "data_type": 1,
  "data": { ... }
}
```

## Monitoring Skills Endpoints

### Token Search & Discovery
```
GET /v2/tokens?keyword={keyword}&chain={chain}&limit={limit}&orderby={orderby}
```
- Returns up to 300 matching tokens
- Order by: `tx_volume_u_24h`, `main_pair_tvl`, `fdv`, `market_cap`

### Token Details
```
GET /v2/tokens/{token-id}
```
- Format: `{token_address}-{chain_name}`
- Returns token data, trading pairs, holder info

### Batch Price Query (up to 200 tokens)
```
POST /v2/tokens/price
Body: { "token_ids": ["addr-chain", ...], "tvl_min": 0, "tx_24h_volume_min": 0 }
```

### Trending Tokens
```
GET /v2/tokens/trending?chain={chain_name}
```

### Main Chain Tokens
```
GET /v2/tokens/main?chain={chain_name}
```

### Transaction Monitoring
```
GET /v2/txs/{pair-id}?limit={limit}&from_time={time}&to_time={time}
```
- Returns swap details: amounts, prices, liquidity snapshots, wallet addresses

### Contract Security / Risk Assessment
```
GET /v2/contracts/{token-id}
```
- Analyzes: mint functions, ownership, liquidity locks, honeypot detection, holder distribution
- Returns: risk score, gas costs, tax rates, anti-whale flags

### Supported Chains
```
GET /v2/supported_chains
```
- Returns all 130+ supported blockchains

## Trading Skills Endpoints

### K-Line / Technical Data
```
GET /v2/klines/pair/{pair-id}?interval={interval}&limit={limit}
GET /v2/klines/token/{token-id}?interval={interval}
```
- Intervals (minutes): 1, 5, 15, 30, 60, 120, 240, 1440, 4320, 10080, 43200, 525600, 2628000

### Market Rankings
```
GET /v2/ranks/topics
GET /v2/ranks?topic={topic}&limit={limit}
```
- Topics: Hot, Meme, Gainers, Losers, Solana, BSC, Ethereum, Base, AI, DeFi, GameFi, RWA, L2s

## Integration with TypeScript

```typescript
const AVE_BASE = 'https://openapi.avedata.org/api/v1';
const apiKey = process.env.AVE_API_KEY;

const headers = { 'X-API-KEY': apiKey };

// Token prices
async function getTokenPrices(tokenIds: string[]) {
  const res = await fetch(`${AVE_BASE}/v2/tokens/price`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_ids: tokenIds, tvl_min: 0, tx_24h_volume_min: 0 })
  });
  return (await res.json()).data;
}

// Transaction monitoring
async function monitorTransactions(pairId: string, limit = 100) {
  const res = await fetch(`${AVE_BASE}/v2/txs/${pairId}?limit=${limit}`, { headers });
  return (await res.json()).data;
}

// Contract risk assessment
async function getContractRisk(tokenId: string) {
  const res = await fetch(`${AVE_BASE}/v2/contracts/${tokenId}`, { headers });
  return (await res.json()).data;
}

// Trending tokens
async function getTrendingTokens(chain: string) {
  const res = await fetch(`${AVE_BASE}/v2/tokens/trending?chain=${chain}`, { headers });
  return (await res.json()).data;
}

// K-line data
async function getKlines(tokenId: string, interval = 60, limit = 100) {
  const res = await fetch(`${AVE_BASE}/v2/klines/token/${tokenId}?interval=${interval}&limit=${limit}`, { headers });
  return (await res.json()).data;
}

// Market rankings
async function getRankings(topic: string, limit = 50) {
  const res = await fetch(`${AVE_BASE}/v2/ranks?topic=${topic}&limit=${limit}`, { headers });
  return (await res.json()).data;
}
```

## Skill Mapping to Hackathon Tracks

### Monitoring Skills
| AVE API | Hackathon Skill | Use Case |
|---------|----------------|----------|
| Token Search + Trending | Asset Tracking | Discover and track tokens across 130+ chains |
| Batch Price Query | Price Alerts | Real-time price monitoring with threshold alerts |
| Transaction Monitoring | Anomaly Detection | Detect unusual trading patterns, whale movements |
| Contract Security | Risk Alerts | Smart contract risk scoring, rug-pull detection |

### Trading Skills  
| AVE API | Hackathon Skill | Use Case |
|---------|----------------|----------|
| K-Lines + Rankings | Signal Generation | Technical analysis for buy/sell signals |
| (via DEX aggregation) | Auto Execution | Execute trades across 300+ DEXs |
| Batch Price + Positions | Portfolio Management | Track and rebalance portfolio |
| K-Lines historical | Backtesting | Evaluate strategy performance |

## Documentation Links
- AVE Docs: https://docs.ave.ai/
- API Reference: https://docs.ave.ai/reference/api-reference/v2
- Quick Start: https://docs.ave.ai/quick-start
