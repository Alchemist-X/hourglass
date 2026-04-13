# Hourglass

> Autonomous DeFi Trading Agent powered by AVE Claw Skills
>
> AVE Claw Hackathon 2026 Submission | [Chinese Version / 中文版](#chinese-version)

---

## What is Hourglass?

Hourglass is an AI-driven autonomous trading agent that unifies AVE Claw's **Monitoring Skills** (asset tracking, price alerts, anomaly detection, contract risk scoring) with **Trading Skills** (signal generation, automated execution, portfolio management) into a single end-to-end system. It continuously scans 130+ blockchains for opportunities, generates trade signals through an AI decision engine, and executes with institutional-grade risk controls enforced at the service layer -- not as prompt suggestions, but as hard-coded rules that cannot be overridden.

Built on top of a battle-tested Polymarket trading system with 50+ live runs and real-money execution history, Hourglass adapts proven autonomous trading infrastructure to the DeFi ecosystem through deep AVE Claw API integration.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Layer 4 : Dashboard + Reports              (Next.js 16)        │
│   Real-time portfolio view, signal stream, risk status, PnL      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 3 : AVE Claw Trading + Risk Control                      │
│   Signal execution, hard risk guards, stop-loss, position mgmt   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 2 : AI Decision Engine                                   │
│   Pulse analysis -> strategy signals -> Kelly sizing             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 1 : AVE Claw Monitoring                                  │
│   Asset discovery, price feeds, anomaly detection, risk scoring  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Data flows bottom-up**: AVE Monitoring feeds raw market data into the AI engine, which produces trading signals. Those signals pass through hard risk controls before execution, and the dashboard renders everything in real time.

| Layer | Role | Key Technology |
|-------|------|----------------|
| Layer 1 | Market data ingestion via AVE Claw APIs | Token search, trending, rankings, K-lines, contract security |
| Layer 2 | AI-powered signal generation and position review | Pulse engine, Kelly criterion sizing, edge-based ranking |
| Layer 3 | Execution with service-layer risk enforcement | FOK orders, drawdown halt, stop-loss, exposure caps |
| Layer 4 | Real-time visualization and reporting | Next.js 16, equity charts, activity feeds, run archives |

---

## AVE Claw Skill Integration

Hourglass enters the **Complete Application Scenario** track, combining both Monitoring and Trading skill categories.

### Monitoring Skills Used

| Skill | AVE API Endpoint | What It Does in Hourglass |
|-------|-----------------|---------------------------|
| **Asset Tracking** | `GET /v2/tokens` -- token search across 130+ chains | Discovers tradeable tokens, replaces legacy market-fetch pipeline |
| | `GET /v2/tokens/{token-id}` -- token detail | Deep-dives into candidate tokens for Pulse research reports |
| | `GET /v2/tokens/trending` -- trending tokens | Surfaces momentum opportunities for the AI engine |
| **Price Alerts** | `POST /v2/tokens/price` -- batch price query (up to 200) | Real-time portfolio valuation and threshold-based alerts |
| **Anomaly Detection** | `GET /v2/txs/{pair-id}` -- transaction monitoring | Detects whale movements and unusual trading patterns |
| **Risk Assessment** | `GET /v2/contracts/{token-id}` -- contract security scan | Honeypot detection, ownership analysis, rug-pull risk scoring |

### Trading Skills Used

| Skill | How Hourglass Implements It |
|-------|----------------------------|
| **Signal Generation** | AI Pulse engine analyzes monitoring data, ranks candidates by `monthlyReturn = edge / monthsToResolution`, selects top opportunities |
| **Portfolio Management** | Position review system evaluates existing holdings: hold / reduce / close decisions based on real-time price data from AVE |
| **Backtesting** | K-line data from `GET /v2/klines/token/{token-id}` (13 intervals from 1min to monthly) feeds historical strategy evaluation |
| **Market Rankings** | `GET /v2/ranks` integration with Hot / Meme / Gainers / Losers / AI / DeFi topics for candidate filtering |

---

## Key Features

- **Fully Autonomous**: Runs 24/7 without human intervention -- from market scanning to trade execution
- **130+ Chain Coverage**: Monitors tokens across all chains supported by AVE Claw
- **Service-Layer Risk Controls**: Hard-coded guards that cannot be bypassed -- drawdown halt, stop-loss, exposure caps, position limits
- **AI Decision Engine**: Pulse analysis pipeline with Kelly criterion position sizing and edge-based candidate ranking
- **Contract Security Screening**: Every candidate token is scanned for honeypots, ownership risks, and suspicious holder distribution via AVE's contract API
- **Real-Time Dashboard**: Next.js 16 web interface showing live portfolio, signal stream, risk status, and historical performance
- **Paper Trading Mode**: Full simulation environment with identical risk controls for strategy validation before going live
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

The Hourglass demo showcases the complete autonomous trading loop:

1. **Market Scanning**: AVE Monitoring Skills discover tokens across multiple chains, filter by trending status, volume, and risk level
2. **AI Signal Generation**: The Pulse engine analyzes candidates, generates structured trade recommendations with confidence scores and Kelly-optimal position sizes
3. **Risk Gate**: Every signal passes through hard risk controls -- exposure caps, position limits, contract security checks -- before reaching execution
4. **Dashboard View**: Real-time web interface displays portfolio equity, active positions, signal history, and risk status

The system produces structured run artifacts (Pulse reports, execution summaries, risk audit logs) archived per run for full auditability.

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

Hourglass 是一个自主 DeFi 交易代理，将 AVE Claw 的监控技能（资产追踪、价格预警、异常检测、合约风险评估）与交易技能（信号生成、自动执行、组合管理）整合为端到端的完整应用场景。系统持续扫描 130+ 条区块链上的机会，通过 AI 决策引擎生成交易信号，并以服务层硬编码风控规则执行交易。

### 核心特性

- **全自主运行**：7x24 小时从市场扫描到交易执行，无需人工干预
- **130+ 链覆盖**：通过 AVE Claw 监控所有支持的区块链上的代币
- **服务层硬风控**：回撤停机、止损、敞口上限、持仓数限制，均为不可绕过的硬规则
- **AI 决策引擎**：Pulse 分析管线 + Kelly 准则仓位计算 + edge 排序
- **合约安全筛查**：每个候选代币通过 AVE 合约 API 扫描蜜罐、权限风险、持仓异常
- **实时仪表盘**：Next.js 16 展示持仓、信号流、风控状态、历史绩效

### 快速开始

```bash
git clone https://github.com/Alchemist-X/hourglass.git
cd hourglass
pnpm install
pnpm build
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend   # 模拟模式运行
pnpm dev                                              # 启动仪表盘
```

### AVE Claw 技能集成

| 技能类别 | 使用的 API | 用途 |
|---------|-----------|------|
| 资产追踪 | `/v2/tokens`, `/v2/tokens/trending` | 发现和追踪链上资产 |
| 价格预警 | `POST /v2/tokens/price` | 实时价格监控与阈值触发 |
| 异常检测 | `/v2/txs/{pair-id}` | 检测鲸鱼动向和异常交易模式 |
| 风险评估 | `/v2/contracts/{token-id}` | 合约安全扫描（蜜罐、权限、跑路风险） |
| 信号生成 | K 线 + 排名数据 | AI 生成买卖信号 |
| 组合管理 | 批量价格 + 持仓审查 | 持仓再平衡与风控 |
| 回测分析 | `/v2/klines` 历史数据 | 策略历史表现评估 |

完整中文文档见 [CLAUDE.md](claude.md)。
