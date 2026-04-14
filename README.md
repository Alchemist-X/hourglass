# Hourglass

> On-chain Signal-Driven Prediction Market Trading Agent
> AVE Claw Monitoring + Polymarket Execution
>
> AVE Claw Hackathon 2026 Submission | [Chinese Version / 中文版](#chinese-version)

## Live Demo

**Dashboard**: [https://hourglass-eta.vercel.app](https://hourglass-eta.vercel.app)

The live deployment shows real Polymarket positions, AVE signal feeds, risk status, and performance metrics in spectator mode.

---

## What is Hourglass?

Hourglass is an AI-driven prediction market trading agent that uses **AVE Claw on-chain monitoring as a research/signal layer** and **Polymarket as the execution layer**. The core innovation: using real-time on-chain data (whale movements, price anomalies, contract risks, volume spikes) to gain an informational edge in prediction markets -- quantitative signals that most market participants overlook.

AVE Claw's **Monitoring Skills** (asset tracking, price alerts, anomaly detection, contract risk scoring) provide the on-chain intelligence. The AI decision engine combines these signals with Polymarket odds to find edge, then executes trades on Polymarket's CLOB with institutional-grade risk controls enforced at the service layer -- not as prompt suggestions, but as hard-coded rules that cannot be overridden.

Built on top of a battle-tested Polymarket trading system with 50+ live runs and real-money execution history, Hourglass adds an AVE Claw signal enrichment layer that transforms on-chain data into prediction market alpha.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Layer 4 : Dashboard + Reports              (Next.js 16)        │
│   AVE signal feed + Polymarket positions, risk status, PnL       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 3 : Polymarket CLOB Execution + Risk Control             │
│   Prediction market orders, hard risk guards, position mgmt     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 2 : AI Decision Engine                                   │
│   AVE signals + Polymarket odds -> find edge -> Kelly sizing     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 1 : AVE Claw Monitoring (Research Signal Layer)          │
│   Whale movements, price anomalies, volume spikes, risk scoring  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Data flows bottom-up**: AVE Claw monitors on-chain activity and feeds signals into the AI engine. The engine combines AVE signals with Polymarket odds to find edge, sizes positions via Kelly criterion, and executes on Polymarket's CLOB after passing through hard risk controls.

| Layer | Role | Key Technology |
|-------|------|----------------|
| Layer 1 | On-chain signal collection via AVE Claw APIs | Token search, trending, rankings, K-lines, contract security |
| Layer 2 | AI decision: AVE signals + Polymarket odds = edge | Signal enrichment, Pulse engine, Kelly sizing, edge ranking |
| Layer 3 | Polymarket CLOB execution with risk enforcement | FOK/GTC orders, drawdown halt, stop-loss, exposure caps |
| Layer 4 | Real-time visualization and reporting | Next.js 16, AVE signal feed, equity charts, run archives |

---

## AVE Claw Skill Integration

Hourglass enters the **Complete Application Scenario** track. AVE Claw provides the **research/signal layer** (Monitoring Skills), while Polymarket provides the **execution layer** (Trading Skills).

### Monitoring Skills -- On-Chain Research Signals

| Skill | AVE API Endpoint | How It Creates Prediction Market Edge |
|-------|-----------------|---------------------------------------|
| **Asset Tracking** | `GET /v2/tokens` -- token search across 130+ chains | Finds on-chain data for tokens mentioned in prediction markets (e.g., BTC data for "Will BTC hit $100K?") |
| | `GET /v2/tokens/{token-id}` -- token detail | Deep-dives into tokens relevant to prediction market questions |
| | `GET /v2/tokens/trending` -- trending tokens | Detects on-chain momentum that may affect prediction market outcomes |
| **Price Alerts** | `POST /v2/tokens/price` -- batch price query (up to 200) | Real-time on-chain price signals for crypto-related prediction markets |
| **Anomaly Detection** | `GET /v2/txs/{pair-id}` -- transaction monitoring | Detects whale movements that may predict prediction market outcomes |
| **Risk Assessment** | `GET /v2/contracts/{token-id}` -- contract security scan | Contract risk signals affect probability estimates for token-related markets |

### Trading Skills -- Polymarket Execution

| Skill | How Hourglass Implements It |
|-------|----------------------------|
| **Signal Generation** | AI engine combines AVE on-chain signals with Polymarket odds to find informational edge |
| **Signal Enrichment** | `ave-signal-enrichment.ts` extracts crypto keywords from market questions, queries AVE for on-chain context |
| **Portfolio Management** | Position review system evaluates Polymarket holdings: hold / reduce / close decisions |
| **Polymarket Execution** | `polymarket-sdk.ts` executes FOK/GTC orders on Polymarket's CLOB |
| **Backtesting** | K-line data from `GET /v2/klines/token/{token-id}` (13 intervals) validates signal quality |
| **Market Rankings** | `GET /v2/ranks` integration for trend signals that correlate with prediction market outcomes |

---

## Key Features

- **On-Chain Signal Edge**: AVE Claw monitors 130+ chains for whale movements, price anomalies, and contract risks -- signals that most prediction market participants ignore
- **Polymarket Execution**: Battle-tested CLOB execution with FOK/GTC orders, proven across 50+ live runs
- **Fully Autonomous**: Runs 24/7 without human intervention -- from on-chain monitoring to prediction market execution
- **Service-Layer Risk Controls**: Hard-coded guards that cannot be bypassed -- drawdown halt, stop-loss, exposure caps, position limits
- **AI Decision Engine**: Combines AVE on-chain signals with Polymarket odds via Kelly criterion position sizing and edge-based ranking
- **Smart Keyword Extraction**: Automatically extracts crypto-related tokens from prediction market questions and queries AVE for relevant on-chain data
- **Contract Security Screening**: Tokens mentioned in prediction markets are scanned for honeypots, ownership risks via AVE's contract API
- **Real-Time Dashboard**: Next.js 16 web interface showing AVE signal feed, Polymarket positions, risk status, and performance
- **Paper Trading Mode**: Full simulation environment with identical risk controls for strategy validation
- **Framework-Agnostic AI**: Supports multiple AI providers (Codex, Claude Code, OpenClaw) via a single environment variable switch

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22+ | Runtime |
| pnpm | 10.x | Monorepo workspace management |
| TypeScript | 5.9 | Type-safe codebase |
| Next.js | 16 | Dashboard and public-facing web app |
| React | 19 | UI framework |
| Fastify | 5 | API server for orchestrator and executor |
| BullMQ | 5 | Job queue for trade execution pipeline |
| Drizzle ORM | latest | Database schema and queries |
| Zod | 4 | Runtime validation for trade decisions and API contracts |
| Vitest | latest | Unit and integration testing |
| Playwright | latest | End-to-end testing |
| Docker Compose | -- | Local Postgres 17 + Redis 8 |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Alchemist-X/hourglass.git
cd hourglass
pnpm install

# 2. Build all packages
pnpm build

# 3. Run the Pulse analysis demo (paper mode, no real funds)
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend

# 4. Start the full dashboard
cp .env.example .env
pnpm dev
```

### Run Modes

| Mode | Command | What It Does |
|------|---------|--------------|
| **Build only** | `pnpm build` | Verify TypeScript compilation (no Docker or keys needed) |
| **Paper trading** | `pnpm trial:recommend` | Full analysis pipeline with simulated execution |
| **Dashboard** | `pnpm dev` | Start web UI at `localhost:3000` |
| **Pulse analysis** | `pnpm pulse:live -- --recommend-only` | Generate trade recommendations without executing |
| **Live trading** | `pnpm pulse:live` | Real execution (requires wallet credentials + AVE API key) |

---

## Demo

The Hourglass demo showcases the complete on-chain signal to prediction market execution loop:

1. **Polymarket Scanning**: Fetch active prediction markets from Polymarket
2. **AVE Signal Enrichment**: For crypto-related markets, query AVE Claw for on-chain data -- token prices, whale activity, contract risks, volume anomalies
3. **AI Decision**: The engine combines AVE on-chain signals with Polymarket odds to estimate true probabilities, finds edge where on-chain data disagrees with market pricing
4. **Risk Gate**: Every signal passes through hard risk controls -- exposure caps, position limits, stop-loss -- before reaching Polymarket execution
5. **Dashboard View**: Real-time web interface displays AVE signal feed, Polymarket positions, and risk status

The system produces structured run artifacts (Pulse reports, AVE enrichment logs, execution summaries) archived per run for full auditability.

---

## Risk Controls

All risk rules are enforced at the service layer as hard constraints. No AI prompt or configuration can bypass them.

| Rule | Threshold | Effect |
|------|-----------|--------|
| Portfolio drawdown halt | NAV drops >= 30% from high-water mark | System enters `halted` state; all new opens blocked |
| Per-position stop-loss | Unrealized loss >= 30% | Position auto-closed; priority over strategy actions |
| Per-trade cap | 15% of bankroll | Single trade cannot exceed this allocation |
| Max total exposure | 80% of bankroll | Combined open positions capped |
| Max event exposure | 30% of bankroll | Concentration limit per token category |
| Max concurrent positions | 22 | Hard position count limit |
| Min trade size | $5 | Orders below threshold are discarded |
| Pulse staleness | > 120 minutes old | Stale data blocks new opens |
| Contract risk screen | AVE `/v2/contracts` risk level | High-risk tokens filtered before signal generation |

Recovery from `halted` state requires explicit admin action (fail-closed design).

---

## Project Structure

```
hourglass/
├── apps/
│   └── web/                    # Next.js 16 dashboard + admin console
├── services/
│   ├── ave-monitor/            # AVE Claw Monitoring adapter layer
│   ├── orchestrator/           # Pulse engine, AI decisions, risk guards
│   ├── executor/               # Trade execution + position sync
│   └── rough-loop/             # Autonomous code-task loop
├── packages/
│   ├── contracts/              # Zod schemas (TradeDecisionSet, shared types)
│   ├── db/                     # Drizzle ORM schema + migrations + queries
│   └── terminal-ui/            # Terminal rendering utilities
├── skills/                     # AVE Skill definitions
│   └── daily-pulse/            # Daily Pulse skill agent
├── scripts/                    # CLI entry points (daily-pulse, pulse-live)
├── docs/                       # Hackathon rules, API reference, integration map
├── runtime-artifacts/          # Run outputs (gitignored)
├── docker-compose.yml          # Local Postgres 17 + Redis 8
└── package.json                # Root scripts + workspace config
```

| Module | Responsibility |
|--------|---------------|
| `services/ave-monitor` | Wraps AVE Claw Monitoring APIs into a unified data subscription interface |
| `services/orchestrator` | Pulse generation, AI decision runtime, risk trimming, report artifacts |
| `services/executor` | Trade execution, position sync, stop-loss, order queue worker |
| `apps/web` | Public dashboard: portfolio, positions, trades, runs, reports |
| `packages/contracts` | Shared Zod schemas for type-safe cross-service communication |
| `packages/db` | Database schema, migrations, queries, paper-mode local state |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Group | Key Variables | Purpose |
|-------|--------------|---------|
| **AVE** | `AVE_API_KEY` | AVE Claw API authentication |
| **Shared** | `AUTOPOLY_EXECUTION_MODE` | `paper` (simulation) or `live` (real funds) |
| **Web** | `ADMIN_PASSWORD` | Dashboard admin authentication |
| **Orchestrator** | `AGENT_RUNTIME_PROVIDER`, `AGENT_DECISION_STRATEGY` | AI provider and strategy selection |
| **Executor** | `PRIVATE_KEY`, `CHAIN_ID` | Wallet and chain configuration |

---

## Team

| Member | Role |
|--------|------|
| Alchemist-X | Lead Developer |

---

## License

MIT

---

<a id="chinese-version"></a>

## 中文简介

### 什么是 Hourglass?

Hourglass 是一个链上信号驱动的预测市场交易代理。它将 AVE Claw 的链上监控能力作为研究信号层，与 Polymarket 预测市场的 CLOB 执行相结合，利用链上数据（鲸鱼动向、价格异常、合约风险、交易量突变）在预测市场中获取信息优势。

### 核心特性

- **链上信号优势**：AVE Claw 监控 130+ 链的链上活动，提供大多数预测市场参与者忽略的定量信号
- **Polymarket 执行**：经过 50+ 次生产运行验证的预测市场交易系统，FOK/GTC 订单
- **全自主运行**：7x24 小时从链上监控到预测市场执行，无需人工干预
- **服务层硬风控**：回撤停机、止损、敞口上限、持仓数限制，均为不可绕过的硬规则
- **AI 决策引擎**：将 AVE 链上信号与 Polymarket 赔率结合分析 + Kelly 仓位计算
- **智能关键词提取**：自动从预测市场问题中提取 crypto 关键词，查询 AVE 获取链上数据
- **实时仪表盘**：Next.js 16 展示 AVE 信号流、Polymarket 持仓、风控状态

### 快速开始

```bash
git clone https://github.com/Alchemist-X/hourglass.git
cd hourglass
pnpm install
pnpm build
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend   # 模拟模式运行
pnpm dev                                              # 启动仪表盘
```

### AVE Claw 技能集成（链上信号层）

| 技能类别 | 使用的 API | 预测市场用途 |
|---------|-----------|-------------|
| 资产追踪 | `/v2/tokens`, `/v2/tokens/trending` | 查询预测市场中提到的 Token 的链上状态 |
| 价格预警 | `POST /v2/tokens/price` | 链上实时价格信号，辅助预测市场概率估计 |
| 异常检测 | `/v2/txs/{pair-id}` | 鲸鱼动向信号，预测市场结果的领先指标 |
| 风险评估 | `/v2/contracts/{token-id}` | 合约安全风险影响相关预测市场概率 |
| 信号富化 | `ave-signal-enrichment.ts` | 从预测市场问题中提取 crypto 关键词，查询 AVE 获取链上信号 |
| 回测分析 | `/v2/klines` 历史数据 | 验证链上信号与预测市场结果的相关性 |

完整中文文档见 [CLAUDE.md](claude.md)。
