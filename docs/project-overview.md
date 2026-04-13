# Hourglass — 项目说明书

> AVE Claw Hackathon 2026 参赛作品
> 团队: Alchemist-X
> 仓库: https://github.com/Alchemist-X/hourglass

---

## 一、我们做了什么

**一句话定位：** Hourglass 是一个基于 AVE Claw 构建的自主 DeFi 交易代理 —— 它将 AVE 的链上监控能力与 AI 决策引擎、Kelly 仓位管理、服务层硬风控融合为一个 **监控 + 分析 + 交易 + 风控** 的端到端闭环系统。

Hourglass 不是一个简单的 API 包装器。它的前身是 autonomous-poly-trading —— 一个已经在 Polymarket 上运行过 50+ 次 Pulse 分析并产生真实交易记录的生产级系统。本次 Hackathon 中，我们将整个系统从预测市场迁移到 DeFi Token 交易场景，以 AVE Claw 作为数据基座，覆盖了 130+ 链、300+ DEX 的链上资产监控和交易执行。

**核心能力：**
- **全链监控**：通过 AVE API 跨链发现、追踪、评估 Token（搜索、趋势、排名、合约安全审计）
- **AI 信号生成**：基于动量分析、风险溢价、边际收益计算出可交易信号，每个信号附带完整的 thesis 和置信度
- **Kelly 仓位管理**：使用 1/4 Kelly 公式计算仓位，7 级持仓分类模型（止损/止盈/edge衰减/near-stop/edge正向/稳定持有）自动复审
- **服务层硬风控**：6 层风控规则嵌入执行路径，不可被策略层绕过

**技术亮点：Framework-Free 架构。** Hourglass 的 AI 决策引擎是可插拔的 —— 它不绑定任何特定的 AI Agent 框架。Claude Code、OpenClaw、Codex、甚至自定义模型都可以作为决策引擎接入，只需遵循 `TradeDecision` 标准接口。这意味着用户可以选择最适合自己需求的 AI 模型，而不被框架锁定。

---

## 二、系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 4: 实时 Dashboard (Next.js 16 / React 19)                │
│  持仓面板 · 信号流 · 风控状态 · 权益曲线 · AVE 监控告警         │
├──────────────────────────────────────────────────────────────────┤
│  Layer 3: 交易执行 + 服务层硬风控                                │
│  Kelly 仓位计算 · 6 层风控规则 · Paper/Live 双模式执行           │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2: AI 决策引擎 (Framework-Free)                          │
│  Pulse 分析 → 信号生成 → 持仓复审 → 决策合成                    │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1: AVE Claw 监控层                                       │
│  Token 搜索 · 趋势追踪 · 排名筛选 · 批量价格 · 合约安全审计     │
└──────────────────────────────────────────────────────────────────┘
```

### 各层说明

| 层级 | 职责 | 关键模块 | 数据流向 |
|------|------|---------|---------|
| **Layer 1** | AVE Claw 数据采集与监控 | `ave-market-pulse.ts`, `client.ts`, `mock-data.ts` | AVE API -> 标准化 `AvePulseCandidate` |
| **Layer 2** | AI 分析与信号生成 | `ave-entry-planner.ts`, `ave-position-review.ts`, `ave-pulse-filters.ts` | 候选 Token -> 交易信号 `TradeDecision` |
| **Layer 3** | 执行与风控 | `risk.ts`, `execution-planning.ts`, `ave-direct-runtime.ts` | 信号 -> 风控过滤 -> 执行/拒绝 |
| **Layer 4** | 可视化与运维 | `ave-monitoring-panel.tsx`, Dashboard 组件群 | 系统状态 -> 用户界面 |

---

## 三、AVE Claw Skill 深度集成

### 3.1 监控类 Skill

| Skill | AVE API 端点 | 实现模块 | 功能说明 |
|-------|-------------|---------|---------|
| **资产追踪** | `GET /v2/tokens?keyword=&chain=&limit=&orderby=` | `ave-market-pulse.ts` `fetchTokenSearch()` | 跨 5 条链（Ethereum/BSC/Polygon/Base/Solana）批量扫描 Token，按交易量排序发现候选标的 |
| **趋势发现** | `GET /v2/tokens/trending?chain=` | `ave-market-pulse.ts` `fetchTrendingTokens()` | 抓取各链热门 Token，与搜索结果合并后去重 |
| **排名筛选** | `GET /v2/ranks?topic=Hot&limit=` | `ave-market-pulse.ts` `fetchHotRankings()` | 接入 AVE 的 Hot/Meme/Gainers/Losers/AI/DeFi 六大分类排名 |
| **批量价格** | `POST /v2/tokens/price` | `ave-market-pulse.ts` `fetchBatchPrices()` | 单次最多查询 200 个 Token 的实时价格，自动分批处理 |
| **合约安全** | `GET /v2/contracts/{token-id}` | `ave-market-pulse.ts` `fetchContractRisk()` | 蜜罐检测、mint 函数审计、持有者分布分析、买卖税费检测 |
| **价格预警** | `POST /v2/tokens/price` (轮询) | `ave-position-review.ts` | 持仓 Token 价格实时比对，触发止损/止盈/edge衰减警报 |
| **异常检测** | `GET /v2/txs/{pair-id}` | `ave-pulse-filters.ts` + prescreen | 链上交易流异常模式识别（大额转账、集中卖出） |
| **链支持** | `GET /v2/supported_chains` | `client.ts` `getSupportedChains()` | 130+ 链全覆盖，运行时动态查询支持的链 |

**集成深度说明：** 以 `ave-market-pulse.ts` 为例（完整代码 649 行），它并不是简单调用一个 AVE API 然后透传数据。它的执行流程是：

1. **并行抓取**三个数据源（token search + trending + hot rankings），使用 `Promise.allSettled` 实现优雅降级 —— 任一数据源失败不影响其他
2. **去重合并**来自不同数据源的候选，按交易量保留最优数据
3. **批量价格刷新**，用 `POST /v2/tokens/price` 补充最新价格
4. **合约安全审计**，对交易量 Top 20 的候选自动调用 `/v2/contracts/{token-id}` 评估蜜罐、mint 权限、税费等风险
5. 输出标准化的 `AvePulseCandidate[]`，包含完整的价格、风险、发现来源信息

每一步都有超时（30s）、重试（3次指数退避）、降级策略，符合生产级可靠性要求。

### 3.2 交易类 Skill

| Skill | 实现模块 | 核心算法 | 说明 |
|-------|---------|---------|------|
| **信号生成** | `ave-entry-planner.ts` (440行) | `edge = predicted_return - risk_premium` | 基于动量的方向预测 + 风险溢价扣减，低流动性/高税费 Token 自动提高风险溢价 |
| **仓位计算** | `ave-entry-planner.ts` `calculateAveKelly()` | `1/4 Kelly = (edge * confidence) / odds / 4` | 全 Kelly 过于激进，使用 1/4 Kelly 确保资金安全 |
| **持仓复审** | `ave-position-review.ts` (461行) | 7 级分类决策模型 | 自动化持仓生命周期管理，详见下方 |
| **组合风控** | `risk.ts` (170行) | 6 层硬约束 | 服务层不可绕过的风控规则 |
| **决策合成** | `ave-direct-runtime.ts` (449行) | 合并 review + entry，去重 + 风控 | 完整 pipeline 串联：fetch -> filter -> plan -> review -> compose -> guard |
| **回测分析** | K 线数据分析 | `GET /v2/klines/token/{token-id}` | 支持 13 种时间粒度（1min 到 1month），用于策略历史验证 |

**7 级持仓分类模型（`ave-position-review.ts`）：**

| 分类 | 触发条件 | 行动 | 示例 |
|------|---------|------|------|
| 1. 止损触发 | PnL <= -30% | 立即平仓 | 亏损超过止损线 |
| 2. 止盈触发 | PnL >= 目标收益 | 立即平仓 | 盈利到达预设目标 |
| 3. Edge 消失 | remainingEdge <= -5% | 平仓 + 人工复审标记 | 价格大幅反向移动 |
| 4. 接近止损 | PnL <= -(止损线 * 70%) | 减仓 50% + 人工复审 | 下行空间不足 |
| 5. Edge 衰减 | 0 > remainingEdge > -5% | 减仓 50% + 观察 | 方向不确定 |
| 6. Edge 正向 | remainingEdge > 2% | 持有 | 趋势仍在延续 |
| 7. 稳定持有 | 其他情况 | 持有 + 人工复审标记 | 无明确信号 |

### 3.3 端到端闭环

**具体场景：Hourglass 如何处理一次完整的交易周期**

```
时间 T=0  AVE 监控层 (Layer 1)
  │  ave-market-pulse.ts 并行调用 /v2/tokens + /v2/tokens/trending + /v2/ranks
  │  发现 PEPE 在 Ethereum 上 24h 交易量 $980M，涨幅 8.7%
  │  /v2/contracts/0x6982...-ethereum 返回：risk_level="medium"，is_mintable=true
  ▼
时间 T=1  筛选层
  │  ave-pulse-filters.ts 过滤：volume > $10K (通过), liquidity > $5K (通过)
  │  排除 risk_level=high/critical (medium 通过但降低风险乘数)
  │  蜜罐检测：非蜜罐 (通过), 税费检测：buy_tax+sell_tax < 10% (通过)
  ▼
时间 T=2  AI 决策引擎 (Layer 2)
  │  ave-entry-planner.ts 分析：
  │    predicted_return = 8.7% * 0.674 (confidence) = 5.86%
  │    risk_premium = 2% (base) + 1% (medium risk) + 0.5% (mint函数) = 3.5%
  │    edge = 5.86% - 3.5% = 2.36%  > minEdge(0.5%) → 可交易
  │    1/4 Kelly = (2.36% * 67.4%) / 1 / 4 = 0.398% of bankroll
  │    bankroll $10,000 → sizeUsd = $39.8
  ▼
时间 T=3  风控层 (Layer 3)
  │  risk.ts applyTradeGuardsDetailed() 逐一检查 6 层约束：
  │    ✓ 单笔上限 (15% of bankroll = $1,500) → $39.8 通过
  │    ✓ 总敞口 (80% of bankroll = $8,000) → 当前敞口 $3,200 + $39.8 通过
  │    ✓ 最大持仓数 (22) → 当前 8 仓 通过
  │    ✓ 最低交易额 ($5) → $39.8 通过
  │    ✓ 流动性上限 (TVL * 5%) → 通过
  │  → 放行，bindingConstraint="requested"（无约束被触发）
  ▼
时间 T=4  Dashboard (Layer 4)
  │  ave-monitoring-panel.tsx 实时展示：
  │    [WARN] PEPE ethereum — Price Alert: +8.7% in 24h
  │    新建仓 PEPE $39.8 BUY confidence=medium-high
  │    持仓列表更新，权益曲线刷新
  ▼
时间 T+N  持仓复审 (Layer 2, 周期性)
  │  ave-position-review.ts 读取 /v2/tokens/price 最新价格
  │  若 PnL = -25% → 分类 4 (near-stop-loss)：减仓 50%，标记人工复审
  │  若 PnL = -32% → 分类 1 (stop-loss-breached)：立即全部平仓
  │  若 edge 仍 > 2% → 分类 6 (edge-positive)：继续持有
```

---

## 四、商业价值与实用性

### 4.1 解决的真实问题

| 痛点 | 影响范围 | 现有解决方案的不足 |
|------|---------|------------------|
| DeFi 市场 7x24 不间断运行 | 所有参与者 | 人类无法持续监控，错过关键时机 |
| 资产分散在 130+ 链 | 跨链用户 | 缺乏统一监控工具，需手动切换多个平台 |
| 智能合约安全风险 | 散户投资者 | 蜜罐、rug pull 难以人工检测，造成不可逆损失 |
| 缺乏系统化风控 | 非机构投资者 | 情绪化交易导致亏损扩大，无止损纪律 |
| AI Agent 框架锁定 | 开发者 | 现有工具绑定单一框架，迁移成本高 |

### 4.2 Hourglass 的解决方案

- **AI Agent 24/7 全链覆盖监控**：通过 AVE Claw API 接入 130+ 链、300+ DEX，跨链 Token 搜索 + 趋势追踪 + 排名筛选三线并行
- **智能合约安全预审**：每轮 Pulse 自动对 Top 20 候选执行合约安全审计（`/v2/contracts`），蜜罐 Token 直接过滤，高税费 Token 自动提高风险溢价
- **机构级风控系统**：6 层硬约束嵌入执行路径，回撤超 30% 自动停机，单笔上限 15%，总敞口上限 80%，不可被策略层绕过
- **公开透明的 Dashboard**：真实持仓、交易记录、净值曲线、监控告警全部实时可视化
- **Mock/Live 无缝切换**：20 个 mock Token（ETH/BTC/SOL/PEPE/SHIB 等）带动态价格模拟，`pnpm ave:demo` 即可体验完整 pipeline

### 4.3 竞争优势

| 对比维度 | 简单 API 包装 | Hourglass |
|---------|-------------|-----------|
| AVE 集成深度 | 调用 1-2 个 API 展示数据 | 12 个 AVE API 端点深度集成，5 阶段 pipeline |
| 风控能力 | 无或仅前端展示 | 6 层服务层硬风控，风控拒绝返回具体约束名称 |
| AI 决策 | 无或调用 GPT 一次性推荐 | Kelly 仓位计算 + 7 级分类复审 + edge 量化 |
| 架构成熟度 | Demo 级 | 基于 50+ 次生产运行的代码库，pnpm monorepo 12 个子包 |
| 框架依赖 | 绑定特定 Agent 框架 | Framework-Free，支持任意 AI Agent |
| 可运行性 | 需要复杂配置 | `pnpm install && pnpm ave:demo` 即可运行 |

### 4.4 落地路径

1. **个人投资者**：一键部署 Hourglass，配置 AVE API Key 和资金参数，自动监控和交易
2. **量化团队**：作为策略研发框架，接入自定义 AI 模型，快速迭代信号生成逻辑
3. **AVE 生态**：为 AVE 平台增加自动化交易能力，提升 API 使用频次和用户粘性，展示 AVE Claw 在 Complete Application Scenario 赛道的完整应用

---

## 五、技术实现亮点

### 5.1 代码质量

- **TypeScript 全栈**，Zod 运行时校验（所有 AVE API 响应都经过 schema validation）
- **pnpm monorepo 工作区**（12 个子包：1 app + 3 packages + 4 services + 4 skills）
- **Vitest 单测 + Playwright E2E**，关键模块测试覆盖
- **所有 AVE API 调用**都有超时（30s）/ 重试（3次指数退避）/ 降级策略
- **Immutable 数据流**：所有数据变换返回新对象，不修改输入（`enrichWithPriceData` 使用 spread 操作符创建新候选）
- **Actionable 错误输出**：每个错误包含失败阶段、核心上下文、原因摘要、下一步命令

### 5.2 关键数字

| 指标 | 数值 | 说明 |
|------|------|------|
| AVE API 端点集成 | 12 个 | token search / detail / price / trending / main / transactions / contracts / chains / kline(token) / kline(pair) / rank topics / rankings |
| Mock Token 池 | 20 个 | ETH/WBTC/USDT/USDC/SOL/BNB/MATIC/ARB/OP/LINK/UNI/AAVE/MKR/CRV/DOGE/PEPE/SHIB/WLD/RNDR/FET，覆盖 6 条链 |
| 持仓分类级别 | 7 级 | stop-loss / profit-target / edge-gone / near-stop / edge-weakening / edge-positive / stable-hold |
| 风控规则层数 | 6 层 | 组合回撤停机 / 单笔上限 / 总敞口上限 / 流动性上限 / 最低交易额 / 最大持仓数 |
| 重试策略 | 3 次 | 指数退避：1s → 2s → 4s |
| AVE 价格批量上限 | 200 / 批 | 超过自动分批，并行请求 |
| Zod Schema 定义 | 15+ 个 | 覆盖全部 AVE API 响应类型 + 内部领域模型 |
| Monorepo 子包 | 12 个 | apps/web, packages/{contracts,db,terminal-ui}, services/{ave-monitor,executor,orchestrator,rough-loop}, skills/{ave-complete,ave-monitoring,ave-trading,daily-pulse} |

### 5.3 AVE 客户端封装（`services/ave-monitor/src/client.ts`）

`AveClient` 类封装了全部 12 个 AVE API 端点，每个方法都包含：

```typescript
// 统一认证 + 超时控制 + 重试 + Zod 校验
async searchTokens(params: {...}): Promise<AveToken[]>
async getTokenDetail(tokenId: string): Promise<AveTokenDetail>
async getTokenPrices(tokenIds: string[]): Promise<AveTokenPrice[]>
async getTrendingTokens(chain: string): Promise<AveTrendingToken[]>
async getTransactions(pairId: string, params?): Promise<AveTransaction[]>
async getContractSecurity(tokenId: string): Promise<AveContractRisk>
async getSupportedChains(): Promise<AveChain[]>
async getKlines(tokenId: string, params?): Promise<AveKline[]>
async getPairKlines(pairId: string, params?): Promise<AveKline[]>
async getRankTopics(): Promise<string[]>
async getRankings(topic: string, limit?): Promise<AveRankedToken[]>
async getMainTokens(chain: string): Promise<AveToken[]>
```

每个调用都经过 `withRetry()` 包装（3 次指数退避），响应通过 `safeParse()` 做 Zod schema 校验并优雅降级。

### 5.4 可运行性

```bash
git clone https://github.com/Alchemist-X/hourglass.git
cd hourglass
pnpm install && pnpm build
pnpm ave:demo           # 完整 Demo（mock 模式，无需 API Key）
pnpm dev                # 启动 Dashboard（http://localhost:3000）
```

Mock 模式使用 xoshiro128** 伪随机数生成器确保可复现性，20 个 Token 的价格动态模拟包含趋势（上涨/下跌/横盘）和波动率控制。

---

## 六、评审维度对照

| 评审维度 | 权重 | Hourglass 的回应 |
|---------|------|-----------------|
| **创新性 (30%)** | 创新点 | (1) Framework-Free 架构：不锁定 AI Agent 框架，支持 Claude/OpenClaw/Codex 任意接入 (2) 将成熟的预测市场交易系统迁移到 DeFi 场景，复用经过 50+ 次真实运行验证的 pipeline (3) 7 级持仓分类模型：不是简单的止损/止盈，而是基于 edge 衰减的精细化持仓管理 |
| **技术实现 (30%)** | 技术深度 | (1) 12 个 AVE API 端点深度集成，不是简单 wrapper (2) 全链路 TypeScript + Zod 校验 + 超时/重试/降级 (3) pnpm monorepo 12 子包，关注点分离 (4) 合约安全审计自动集成到 pipeline |
| **实用性与商业价值 (40%)** | 落地能力 | (1) `pnpm ave:demo` 一键可运行 (2) Mock/Live 无缝切换 (3) 6 层硬风控不可绕过 (4) 真实代码库，非理论项目 (5) 为 AVE 生态带来自动化交易能力 |

---

## 七、团队与致谢

**Team Alchemist-X**

本项目基于 autonomous-poly-trading 开源代码库构建，在此基础上完成了 AVE Claw 生态的全面集成。我们保留了原系统经过实战验证的核心架构（AI 决策引擎、Kelly 仓位管理、服务层风控），同时为 AVE 场景重写了数据层（12 个 API 端点封装）、决策层（DeFi Token 方向预测 + 风险溢价模型）、和展示层（AVE 监控面板 + 告警系统）。

感谢 AVE 团队提供的 API 文档和技术支持。

---

> 本项目参加 **Complete Application Scenario** 赛道，同时覆盖 Monitoring Skills（资产追踪、价格预警、异常检测、风险评估）和 Trading Skills（信号生成、自动执行、组合管理、回测分析）。
