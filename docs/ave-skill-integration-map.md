# AVE Claw Skill 集成映射表

> **项目**: Hourglass (autonomous-poly-trading -> AVE Claw DeFi Agent)
> **目标赛道**: Complete Application Scenario (Monitoring + Trading 双技能)
> **最后更新**: 2026-04-13

---

## 1. 架构层级 vs AVE Skill 总览

```
原系统 (Polymarket)                    目标系统 (AVE Claw)
─────────────────                     ─────────────────

Polymarket API 抓取市场    ──────►    AVE Monitoring Skills
  ├─ market-pulse.ts                   ├─ /v2/tokens (搜索)
  ├─ full-pulse.ts                     ├─ /v2/tokens/trending (趋势)
  └─ pulse-filters.ts                 ├─ /v2/ranks (排名)
                                       ├─ /v2/klines (K线)
                                       └─ /v2/contracts (风险评估)

Polymarket CLOB 下单       ──────►    AVE Trading Skills
  ├─ polymarket-sdk.ts                 ├─ 信号生成 (内部)
  ├─ execution-planning.ts             ├─ 自动执行 (DEX swap)
  └─ orderbook-limits.ts              └─ 组合管理 (内部逻辑)

AI 决策引擎 (保留)                     AI 决策引擎 (适配数据源)
  ├─ pulse-entry-planner.ts            ├─ 输入格式从 Polymarket → AVE
  ├─ position-review.ts               ├─ 概率模型 → 价格方向模型
  └─ decision-composer.ts             └─ Kelly 公式适配
```

---

## 2. 模块级详细映射表

### Layer 1: 数据获取层 (Polymarket Fetch → AVE Monitoring)

| 现有模块 | 文件路径 | 当前功能 | 映射 AVE Skill | AVE API 端点 | 改造难度 | 所需变更 |
|---------|---------|---------|---------------|-------------|---------|---------|
| **market-pulse** | `services/orchestrator/src/pulse/market-pulse.ts` | 从 Polymarket API 批量抓取市场数据，解析为 `PulseCandidate[]` 标准格式 | **Monitoring: Asset Tracking** | `GET /v2/tokens?keyword=&chain=&limit=&orderby=` | **Medium** | (1) 替换 Polymarket fetch 脚本为 AVE `/v2/tokens` 调用 (2) `RawPulseMarket` 接口重新定义为 AVE token 结构 (3) `toPulseCandidate()` 转换逻辑重写 |
| **full-pulse** | `services/orchestrator/src/pulse/full-pulse.ts` | 深度研究候选市场：爬取事件详情、抓取 orderbook、生成 markdown 报告 | **Monitoring: Asset Tracking + Anomaly Detection** | `GET /v2/tokens/{token-id}` + `GET /v2/klines/token/{token-id}` + `GET /v2/contracts/{token-id}` | **Hard** | (1) 替换 Polymarket 事件爬虫为 AVE token detail + K线 (2) orderbook 研究改为 K线趋势分析 (3) 安全评估接入 `/v2/contracts` (4) markdown 模板重写 |
| **pulse-filters** | `services/orchestrator/src/pulse/pulse-filters.ts` | 按流动性、价格范围、到期时间等维度过滤候选 | **Monitoring: Asset Tracking** | `GET /v2/ranks?topic=&limit=` | **Easy** | (1) 过滤条件从"到期时间/spread"改为"链/交易量/涨跌幅" (2) 可直接使用 `/v2/ranks` 按 Hot/Gainers/Losers 等预筛 |
| **pulse-prescreen** | `services/orchestrator/src/pulse/pulse-prescreen.ts` | AI 预筛选：轻量模型判断哪些市场有信息优势 | **Monitoring: Anomaly Detection** | `GET /v2/txs/{pair-id}` + `GET /v2/contracts/{token-id}` | **Medium** | (1) 预筛逻辑从"AI 能否预测事件结果"改为"链上交易异常/合约风险" (2) 接入交易流 + 合约安全数据作为筛选信号 |

### Layer 2: AI 决策引擎 (保留核心，适配输入输出)

| 现有模块 | 文件路径 | 当前功能 | 映射 AVE Skill | AVE API 端点 | 改造难度 | 所需变更 |
|---------|---------|---------|---------------|-------------|---------|---------|
| **pulse-entry-planner** | `services/orchestrator/src/runtime/pulse-entry-planner.ts` | 解析 AI 推荐 markdown，提取建仓计划（方向、概率、置信度、Kelly 仓位） | **Trading: Signal Generation** | 无直接 API (内部逻辑) | **Medium** | (1) 概率模型从"事件概率 0-1"改为"价格方向预测 + 目标价" (2) 置信度评估维度增加链上指标 (3) `PulseEntryPlan` 接口增加 token 地址、链 ID 字段 |
| **position-review** | `services/orchestrator/src/review/position-review.ts` | 复审已有仓位：按 edge 阈值判断 hold/reduce/close | **Trading: Portfolio Management** | `POST /v2/tokens/price` | **Easy** | (1) 价格更新从 Polymarket orderbook 改为 AVE 批量价格 API (2) edge 计算逻辑保留，`aiProb` 改为 AI 价格预测比率 (3) 止损阈值保留 |
| **decision-composer** | `services/orchestrator/src/runtime/decision-composer.ts` | 合并 review + entry 决策，处理去重和 add-on 逻辑 | **Trading: Portfolio Management** | 无直接 API (内部逻辑) | **Easy** | 几乎不需改动，仅调整 `token_id` 格式从 CLOB token ID 改为 `{addr}-{chain}` 格式 |
| **pulse-direct-runtime** | `services/orchestrator/src/runtime/pulse-direct-runtime.ts` | 串联 entry planner + position review + decision composer 的完整 runtime | **Trading: Signal Generation** | 无直接 API (内部逻辑) | **Easy** | 调用链不变，仅确保上下游接口适配 |
| **risk (orchestrator)** | `services/orchestrator/src/lib/risk.ts` | Kelly 公式计算仓位、回撤检测、交易护栏（总敞口/单事件/最大持仓数） | **Trading: Portfolio Management** | 无直接 API (内部逻辑) | **Easy** | Kelly 公式适用于 DeFi 场景，保留即可；`event_slug` 概念改为 `chain + token_category` 分组 |

### Layer 3: 交易执行层 (Polymarket CLOB → AVE Trading / DEX)

| 现有模块 | 文件路径 | 当前功能 | 映射 AVE Skill | AVE API 端点 | 改造难度 | 所需变更 |
|---------|---------|---------|---------------|-------------|---------|---------|
| **polymarket-sdk** | `services/executor/src/lib/polymarket-sdk.ts` | Polymarket CLOB 客户端：FOK/GTC 下单、取消、查状态、获取持仓 | **Trading: Auto Execution** | 需外部 DEX SDK (非 AVE API 直接提供) | **Hard** | (1) 整个 `ClobClient` 替换为 DEX swap SDK (e.g. 1inch, Jupiter) (2) FOK → 市价 swap, GTC → limit order (3) 持仓查询改为链上余额读取 (4) 需要钱包签名适配 |
| **execution-planning** | `services/orchestrator/src/lib/execution-planning.ts` | 滑点计算、订单簿深度分析、GTC vs FOK 选择、bankroll 比例计算 | **Trading: Auto Execution** | `GET /v2/klines/pair/{pair-id}` | **Medium** | (1) 滑点模型从 orderbook depth 改为 DEX 流动性池分析 (2) K线数据辅助判断下单时机 (3) `PlannedExecution` 接口增加 chain/dex 字段 |
| **orderbook-limits** | `services/executor/src/lib/orderbook-limits.ts` | Polymarket orderbook 读取，获取 bestBid/bestAsk/minOrderSize | **Monitoring: Price Alerts** | `POST /v2/tokens/price` + `GET /v2/klines/token/{token-id}` | **Medium** | (1) 替换为 AVE 价格 API (2) 最小订单量从 CLOB 限制改为 DEX 最低 swap 量 (3) 价格预警逻辑可接入 AVE 数据 |
| **live-check** | `services/executor/src/ops/live-check.ts` | 检查 Polymarket 连通性和钱包余额 | **Monitoring: Asset Tracking** | `GET /v2/supported_chains` | **Easy** | (1) 连通性检查改为 AVE API health check (2) 余额查询改为链上 RPC 调用 |
| **redeem** | `services/executor/src/lib/redeem.ts` | Polymarket 条件代币赎回 (ERC1155) | N/A (不适用) | 无 | **移除** | DeFi swap 场景无需条件代币赎回，整个模块可移除 |

### Layer 4: Dashboard 展示层

| 现有模块 | 文件路径 | 当前功能 | 映射 AVE Skill | AVE API 端点 | 改造难度 | 所需变更 |
|---------|---------|---------|---------------|-------------|---------|---------|
| **Dashboard Page** | `apps/web/app/page.tsx` | 主面板：equity chart + 持仓 + PnL + 活动流 | **展示层 (消费所有 Skill 数据)** | 全部 | **Medium** | (1) 数据源从 Polymarket position 改为 DeFi token 持仓 (2) equity chart 适配 token 估值 (3) 增加链维度展示 |
| **dashboard-positions** | `apps/web/components/dashboard-positions.tsx` | 显示当前持仓列表（market/outcome/价格/PnL） | **Monitoring: Asset Tracking** | `POST /v2/tokens/price` | **Medium** | (1) 持仓结构从 market/outcome 改为 token/chain (2) 价格实时更新用 AVE 批量价格 |
| **dashboard-equity-chart** | `apps/web/components/dashboard-equity-chart.tsx` | 权益曲线图 | N/A (内部渲染) | 无 | **Easy** | 数据结构不变，仅确保估值数据源正确 |
| **dashboard-header** | `apps/web/components/dashboard-header.tsx` | 系统状态、总权益、回撤率 | N/A (内部渲染) | 无 | **Easy** | 展示字段不变 |
| **dashboard-pnl-summary** | `apps/web/components/dashboard-pnl-summary.tsx` | PnL 汇总和已平仓统计 | N/A (内部渲染) | 无 | **Easy** | PnL 计算逻辑保留 |

### 共享层: Contracts 与数据模型

| 现有模块 | 文件路径 | 当前功能 | 映射 AVE Skill | AVE API 端点 | 改造难度 | 所需变更 |
|---------|---------|---------|---------------|-------------|---------|---------|
| **contracts/index** | `packages/contracts/src/index.ts` | Zod schema 定义：TradeDecision, Artifact, OverviewResponse 等类型 | **全局共享类型** | 无 | **Medium** | (1) `token_id` 格式规范改为 `{addr}-{chain}` (2) `event_slug`/`market_slug` 语义调整 (3) 新增 `chain_id`, `token_address` 字段 (4) Artifact kind 增加 `ave-monitor-report` |

---

## 3. AVE API 端点使用矩阵

下表展示每个 AVE API 端点在哪些模块中被使用：

| AVE API 端点 | 功能说明 | 使用模块 | 调用频率 | 优先级 |
|-------------|---------|---------|---------|-------|
| `GET /v2/tokens?keyword=&chain=&limit=&orderby=` | Token 搜索（最多 300） | market-pulse, pulse-filters | 每轮 Pulse 1-3 次 | **P0** |
| `GET /v2/tokens/{token-id}` | Token 详情 | full-pulse | 每个候选 1 次 | **P0** |
| `POST /v2/tokens/price` | 批量价格（最多 200） | position-review, dashboard-positions, orderbook-limits | 高频 (每分钟级) | **P0** |
| `GET /v2/tokens/trending?chain=` | 热门 Token | pulse-filters (替代维度) | 每轮 Pulse 1 次 | **P1** |
| `GET /v2/ranks?topic=&limit=` | 排名 (Hot/Meme/Gainers/Losers/AI/DeFi) | pulse-filters, market-pulse | 每轮 Pulse 1-2 次 | **P1** |
| `GET /v2/klines/token/{token-id}?interval=&limit=` | K 线数据 | full-pulse, execution-planning | 每个候选 1 次 | **P1** |
| `GET /v2/contracts/{token-id}` | 合约安全/风险评估 | full-pulse, pulse-prescreen | 每个候选 1 次 | **P1** |
| `GET /v2/txs/{pair-id}?limit=&from_time=&to_time=` | 交易流监控 | pulse-prescreen (异常检测) | 按需 | **P2** |
| `GET /v2/klines/pair/{pair-id}?interval=&limit=` | 交易对 K 线 | execution-planning | 按需 | **P2** |
| `GET /v2/ranks/topics` | 可用排名主题列表 | 初始化/配置 | 启动时 1 次 | **P2** |
| `GET /v2/supported_chains` | 支持的 130+ 链列表 | live-check, 配置 | 启动时 1 次 | **P2** |
| `GET /v2/tokens/main?chain=` | 主链 Token | market-pulse (补充数据) | 按需 | **P3** |

---

## 4. 改造难度分布与工作量估算

### 按难度统计

| 难度 | 模块数 | 模块列表 |
|------|-------|---------|
| **Easy** | 8 | pulse-filters, position-review, decision-composer, pulse-direct-runtime, risk, live-check, equity-chart, dashboard-header, pnl-summary |
| **Medium** | 7 | market-pulse, pulse-prescreen, pulse-entry-planner, execution-planning, orderbook-limits, dashboard-page, contracts |
| **Hard** | 2 | full-pulse, polymarket-sdk |
| **移除** | 1 | redeem |

### 工作量估算 (人天)

| 阶段 | 工作内容 | 估算 |
|------|---------|------|
| Phase 1: AVE Client | AVE API 客户端封装 (类型定义 + HTTP client + 重试/降级) | 0.5 天 |
| Phase 2: Monitoring 适配 | market-pulse + pulse-filters + pulse-prescreen 改造 | 1 天 |
| Phase 3: 深度研究 | full-pulse 改造 (K线 + 合约安全 + 报告模板) | 1 天 |
| Phase 4: 决策引擎适配 | entry-planner + position-review + contracts 类型 | 0.5 天 |
| Phase 5: 执行层 | polymarket-sdk 替换为 DEX swap (或用 paper trading 演示) | 1 天 |
| Phase 6: Dashboard | 持仓/价格展示适配 | 0.5 天 |
| **合计** | | **4.5 天** |

---

## 5. 推荐实现优先级

基于 Hackathon 评审权重 (创新 30% + 技术 30% + **实用 40%**) 和提交截止时间，推荐以下优先级：

### P0 - 必须完成 (Demo 核心路径)

```
实现顺序: 1 → 2 → 3 → 4

1. [AVE Client 封装]
   services/ave-monitor/src/client.ts
   - 统一 HTTP 客户端 + X-API-KEY 认证
   - 超时/重试/降级机制
   - 所有 AVE API 端点的 TypeScript 类型定义

2. [market-pulse 改造]
   services/orchestrator/src/pulse/market-pulse.ts
   - 用 /v2/tokens + /v2/ranks 替换 Polymarket fetch
   - 输出标准化 PulseCandidate[]
   - 这是 Demo 场景 1 的入口："实时监控 → 信号生成"

3. [position-review + 批量价格]
   services/orchestrator/src/review/position-review.ts
   - 用 POST /v2/tokens/price 获取实时价格
   - 复审逻辑保留 (edge 判断 hold/reduce/close)
   - 这是 Demo 场景 2 的核心："自动执行 → 风控拦截"

4. [contracts 类型适配]
   packages/contracts/src/index.ts
   - token_id 格式: {addr}-{chain}
   - 增加 chain_id, token_address 字段
```

### P1 - 高价值 (提升评分)

```
5. [pulse-filters + ranks 集成]
   - 接入 /v2/ranks 实现 Hot/Meme/Gainers/Losers 筛选
   - 展示 AVE Skill 的 "深度集成" (加分项)

6. [full-pulse + 合约安全]
   - 接入 /v2/contracts 做安全评估 (蜜罐检测、权限风险)
   - 接入 /v2/klines 做趋势分析
   - 这是 "异常检测" 能力的核心展示

7. [Dashboard 适配]
   - 持仓列表改为 token/chain 维度
   - 实时价格用 AVE 数据更新
```

### P2 - 加分项 (时间允许)

```
8. [pulse-prescreen + 交易流异常检测]
   - 接入 /v2/txs 监控链上交易
   - AI 识别异常模式 (大额转账、集中卖出)

9. [execution-planning + K线时机]
   - K线数据辅助判断下单时机
   - 滑点模型从 orderbook 改为 DEX 流动性

10. [polymarket-sdk → DEX swap]
    - 如果时间不够，用 paper trading 模式演示
    - 时间够则接入真实 DEX (1inch/Jupiter)
```

### P3 - 可跳过 (不影响演示)

```
- redeem.ts: 直接移除
- tokens/main: 非核心
- supported_chains: 启动配置，硬编码即可
```

---

## 6. 数据模型映射速查

### Polymarket → AVE 概念对照

| Polymarket 概念 | AVE 对应概念 | 说明 |
|----------------|-------------|------|
| `market` (预测市场) | `token` (链上代币) | 交易标的从二元事件变为链上资产 |
| `event` (事件) | `chain + category` | 分组维度从事件改为链+分类 |
| `outcome` (Yes/No) | `buy/sell direction` | 从二元结果改为价格方向 |
| `outcome_price` (0-1 概率) | `token price` (USD) | 从概率改为绝对价格 |
| `clob_token_id` | `{addr}-{chain}` | Token 唯一标识格式变化 |
| `liquidity` | `liquidity` (DEX 池深度) | 概念相同，数据源不同 |
| `volume_24hr` | `volume_24h` | 概念相同 |
| `spread` (bid-ask 价差) | `slippage` (DEX 滑点) | 交易成本度量 |
| `end_date` (市场到期) | N/A | DeFi 无到期概念，移除此字段 |
| `neg_risk` | `riskControlLevel` | 风险标记来源不同 |
| `category_slug` | `ranks topic` | 分类体系从 Polymarket 改为 AVE ranks |

### 关键接口变更

```typescript
// 原: PulseCandidate (Polymarket)
interface PulseCandidate {
  question: string;          // "Will BTC hit $100K?"
  eventSlug: string;         // "btc-100k"
  marketSlug: string;        // "btc-100k-2026"
  clobTokenIds: string[];    // ["12345", "12346"]
  outcomePrices: number[];   // [0.65, 0.35]
  liquidityUsd: number;
  endDate: string;
}

// 改: PulseCandidate (AVE)
interface PulseCandidate {
  question: string;          // "BTC/USDT 趋势分析"
  tokenAddress: string;      // "0x2260..."-"ethereum"
  chain: string;             // "ethereum"
  tokenSymbol: string;       // "WBTC"
  currentPrice: number;      // 95000.50
  priceChange24h: number;    // 0.032 (3.2%)
  liquidityUsd: number;
  volume24hUsd: number;
  riskLevel: string;         // from /v2/contracts
  // eventSlug/marketSlug 改为 chain + category
  categorySlug: string;      // "defi" / "meme" / "ai"
}
```

---

## 7. Demo 场景 → 模块 → AVE API 追溯

| Demo 场景 | 涉及模块 | AVE API 调用链 | 展示 Skill |
|----------|---------|---------------|-----------|
| **场景 1: 实时监控 → 信号生成** | market-pulse → pulse-filters → pulse-entry-planner | `/v2/tokens` → `/v2/ranks` → `/v2/tokens/{id}` → `/v2/klines` | Monitoring: Asset Tracking + Anomaly Detection |
| **场景 2: 自动执行 → 风控拦截** | position-review → risk → execution-planning → (executor) | `/v2/tokens/price` → 内部风控 → DEX swap | Trading: Auto Execution + Portfolio Management |
| **场景 3: Dashboard 全景** | dashboard-* 组件 | `/v2/tokens/price` (polling) | 展示层 (消费 Monitoring 数据) |
| **场景 4: 异常检测 → 止损** | pulse-prescreen → position-review → decision-composer | `/v2/contracts/{id}` → `/v2/txs/{pair}` → `/v2/tokens/price` | Monitoring: Anomaly Detection + Risk Alerts |

---

## 8. 风险与降级策略

| 风险点 | 影响 | 降级方案 |
|-------|------|---------|
| AVE API 限频 | Pulse 数据获取受限 | 本地缓存 + 降低刷新频率 (30s → 5min) |
| AVE API 不可用 | 全链路中断 | 预缓存一批 mock 数据，Dashboard 展示静态快照 |
| DEX swap 集成复杂 | 执行层无法完成 | **Paper Trading 模式**: 仅记录交易意图，不真实执行 |
| K线数据延迟 | 信号滞后 | 用 `/v2/tokens/price` 实时价格补充 |
| 合约安全 API 误报 | 误拦截正常 token | 安全等级设置阈值，低于阈值仅告警不拦截 |

---

## 9. 快速行动检查单

- [ ] **Phase 1**: 创建 `services/ave-monitor/src/client.ts`，封装 AVE HTTP 客户端
- [ ] **Phase 1**: 定义 AVE API 响应类型 (`services/ave-monitor/src/types.ts`)
- [ ] **Phase 2**: 改造 `market-pulse.ts`，替换 Polymarket fetch 为 AVE tokens/ranks
- [ ] **Phase 2**: 改造 `pulse-filters.ts`，适配 AVE 数据字段
- [ ] **Phase 3**: 改造 `position-review.ts`，接入 AVE 批量价格
- [ ] **Phase 3**: 更新 `packages/contracts/src/index.ts` 类型定义
- [ ] **Phase 4**: 改造 `full-pulse.ts`，接入 K线 + 合约安全
- [ ] **Phase 5**: 替换或 mock `polymarket-sdk.ts` 执行层
- [ ] **Phase 6**: 适配 Dashboard 组件展示 token 持仓
- [ ] **验证**: 端到端跑通 Demo 场景 1 + 2
- [ ] **录制**: 准备 Demo 视频素材
