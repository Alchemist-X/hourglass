# Hourglass — 项目说明书

> AVE Claw Hackathon 2026 参赛作品
> 团队: Alchemist-X
> 仓库: https://github.com/Alchemist-X/hourglass

---

## 一、我们做了什么

**一句话定位：** Hourglass 是一个链上信号驱动的预测市场交易 Agent —— 它将 AVE Claw 的链上监控能力作为 **研究/信号层**，与 Polymarket 预测市场的 CLOB 交易执行相结合，利用链上数据在预测市场中获取信息优势。

Hourglass 不是一个简单的 API 包装器。它的前身是 autonomous-poly-trading —— 一个已经在 Polymarket 上运行过 50+ 次 Pulse 分析并产生真实交易记录的生产级系统。本次 Hackathon 中，我们将 AVE Claw 的链上监控能力深度集成为预测市场决策的信号来源 —— 通过 130+ 链、300+ DEX 的实时链上数据（鲸鱼动向、价格异常、合约安全风险、交易量突变），为 Polymarket 预测市场的概率估计提供大多数参与者忽略的定量信息边际。

**核心创新：链上数据 → 预测市场 Edge。** 大多数 Polymarket 参与者只看新闻和社交情绪。Hourglass 通过 AVE Claw 实时监控链上活动，将链上信号注入 AI 决策引擎，在"Will BTC hit $100K?"这类预测市场中，系统能看到链上鲸鱼正在大量买入 BTC —— 这是其他参与者不会查看的信号。

**核心能力：**
- **AVE 链上信号层**：通过 AVE API 跨链监控 Token 价格、鲸鱼动向、合约安全、交易量异常，为预测市场提供链上数据信号
- **AI 信号生成**：将 AVE 链上信号与 Polymarket 赔率结合分析，寻找信息边际，生成交易信号
- **Polymarket 执行**：在预测市场上执行 CLOB 订单（FOK/GTC），Kelly 仓位管理，7 级持仓分类自动复审
- **服务层硬风控**：6 层风控规则嵌入执行路径，不可被策略层绕过

**技术亮点：Framework-Free 架构。** Hourglass 的 AI 决策引擎是可插拔的 —— 它不绑定任何特定的 AI Agent 框架。Claude Code、OpenClaw、Codex、甚至自定义模型都可以作为决策引擎接入，只需遵循 `TradeDecision` 标准接口。这意味着用户可以选择最适合自己需求的 AI 模型，而不被框架锁定。

---

## 二、系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 4: 实时 Dashboard (Next.js 16 / React 19)                │
│  AVE 监控信号流 · Polymarket 持仓 · 风控状态 · 权益曲线         │
├──────────────────────────────────────────────────────────────────┤
│  Layer 3: Polymarket CLOB 执行 + 服务层硬风控                    │
│  预测市场 FOK/GTC 订单 · Kelly 仓位 · 6 层风控 · Paper/Live     │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2: AI 决策引擎 (Framework-Free)                          │
│  AVE 链上信号 + Polymarket 赔率 → 寻边 → 决策合成               │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1: AVE Claw 监控层（研究/信号层）                         │
│  鲸鱼动向 · 价格异常 · 交易量突变 · 合约安全 · 趋势追踪         │
└──────────────────────────────────────────────────────────────────┘
```

### 各层说明

| 层级 | 职责 | 关键模块 | 数据流向 |
|------|------|---------|---------|
| **Layer 1** | AVE Claw 链上信号采集 | `ave-market-pulse.ts`, `ave-signal-enrichment.ts`, `client.ts` | AVE API -> 链上信号 `AveSignal[]` |
| **Layer 2** | AI 分析 + 信号融合 | `ave-polymarket-runtime.ts`, `pulse-entry-planner.ts`, `position-review.ts` | AVE 信号 + Polymarket 赔率 -> `TradeDecision` |
| **Layer 3** | Polymarket 执行与风控 | `polymarket-sdk.ts`, `risk.ts`, `execution-planning.ts` | 信号 -> 风控过滤 -> CLOB 下单 |
| **Layer 4** | 可视化与运维 | `ave-monitoring-panel.tsx`, Dashboard 组件群 | AVE 信号流 + Polymarket 持仓 -> 用户界面 |

---

## 三、AVE Claw Skill 深度集成（研究/信号层）

AVE Claw 在 Hourglass 中的定位是 **预测市场的链上研究信号层**。它不直接执行交易，而是为 AI 决策引擎提供链上定量信号，帮助系统在 Polymarket 预测市场中获取信息优势。

### 3.1 监控类 Skill → 预测市场信号来源

| Skill | AVE API 端点 | 实现模块 | 预测市场信号用途 |
|-------|-------------|---------|----------------|
| **资产追踪** | `GET /v2/tokens?keyword=&chain=&limit=&orderby=` | `ave-market-pulse.ts` `fetchTokenSearch()`, `ave-signal-enrichment.ts` | 跨链扫描预测市场相关 Token 的实时链上状态，为"Will BTC hit $100K?"等市场提供价格数据 |
| **趋势发现** | `GET /v2/tokens/trending?chain=` | `ave-market-pulse.ts` `fetchTrendingTokens()` | 发现链上热点趋势，关联到预测市场中的 crypto 相关问题 |
| **排名筛选** | `GET /v2/ranks?topic=Hot&limit=` | `ave-market-pulse.ts` `fetchHotRankings()` | 热门/Meme/涨幅/跌幅排名，为预测市场提供市场情绪信号 |
| **批量价格** | `POST /v2/tokens/price` | `ave-market-pulse.ts` `fetchBatchPrices()` | 批量获取预测市场相关 Token 的最新链上价格（单次 200 个） |
| **合约安全** | `GET /v2/contracts/{token-id}` | `ave-signal-enrichment.ts`, `ave-market-pulse.ts` | 评估预测市场中提到的 Token 的合约安全风险（蜜罐、mint 权限、税费） |
| **异常检测** | `GET /v2/txs/{pair-id}` | `ave-pulse-filters.ts` + prescreen | 链上交易流异常模式识别（鲸鱼大额转账、集中卖出），关联到预测市场概率调整 |
| **链支持** | `GET /v2/supported_chains` | `client.ts` `getSupportedChains()` | 130+ 链全覆盖，运行时动态查询支持的链 |

**信号关联示例：** 当 Polymarket 上出现 "Will Ethereum reach $5,000 by June?" 这个市场时，`ave-signal-enrichment.ts` 会：

1. 从市场问题中提取关键词 "Ethereum" → 映射到 AVE 搜索词 ["ETH", "WETH"]
2. 调用 AVE API 查询 ETH 在 5 条链上的实时价格、24h 变化、交易量
3. 检测链上异常：鲸鱼是否在大量买入 ETH？交易量是否异常放大？
4. 获取 ETH 合约安全评估（虽然 ETH 风险很低，但对其他 Token 市场如 meme coin 相关市场，这一步很关键）
5. 将所有链上信号注入 AI 决策引擎，辅助概率估计

**集成深度说明：** 以 `ave-signal-enrichment.ts` 为例，它不是简单调用 AVE API。它的执行流程是：

1. **关键词提取**：从预测市场问题中智能提取 crypto 相关关键词（支持 50+ 种代币名称/符号映射）
2. **并行链上查询**：对每个关键词在 5 条链上并行搜索，使用 `Promise.allSettled` 实现优雅降级
3. **信号生成**：从价格变动、交易量突变、合约风险中提取量化信号
4. **异常检测**：识别极端价格波动、洗盘交易、蜜罐合约等异常
5. 输出标准化的 `EnrichedPulseCandidate[]`，包含 AVE 信号、风险评估、价格上下文

每一步都有超时、重试、降级策略，符合生产级可靠性要求。

### 3.2 交易执行层（Polymarket CLOB）

| Skill | 实现模块 | 核心算法 | 说明 |
|-------|---------|---------|------|
| **信号生成** | `pulse-entry-planner.ts`, `ave-polymarket-runtime.ts` | AVE 链上信号 + Polymarket 赔率 → 寻边 | 将链上信号注入概率估计，与市场赔率比较计算 edge |
| **仓位计算** | `pulse-entry-planner.ts` | `1/4 Kelly = (edge * confidence) / odds / 4` | 全 Kelly 过于激进，使用 1/4 Kelly 确保资金安全 |
| **持仓复审** | `position-review.ts` | 7 级分类决策模型 | 自动化持仓生命周期管理，详见下方 |
| **组合风控** | `risk.ts` (170行) | 6 层硬约束 | 服务层不可绕过的风控规则 |
| **Polymarket 执行** | `polymarket-sdk.ts` | CLOB FOK/GTC 订单 | 在 Polymarket 预测市场上执行交易，支持 Paper/Live 双模式 |
| **决策合成** | `ave-polymarket-runtime.ts` | 合并 review + entry + AVE 信号 | 完整 pipeline：Polymarket 抓取 -> AVE 信号富化 -> AI 决策 -> 风控 -> 执行 |
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

**具体场景：Hourglass 如何利用链上数据在预测市场中获取 Edge**

```
时间 T=0  Polymarket 抓取
  │  market-pulse.ts 从 Polymarket 抓取活跃预测市场
  │  发现市场："Will Bitcoin reach $100,000 by July 2026?"
  │  当前市场赔率：YES 62% / NO 38%
  ▼
时间 T=1  AVE 链上信号富化 (Layer 1)
  │  ave-signal-enrichment.ts 从问题中提取关键词 "Bitcoin" → BTC, WBTC
  │  并行查询 AVE API：
  │    /v2/tokens?keyword=BTC → 价格 $95,200，24h +3.2%
  │    /v2/tokens/trending → BTC 在趋势列表中排名第 1
  │    /v2/contracts/{btc-token-id} → risk_level="low"
  │  异常检测：24h 交易量 $42B（正常范围），无洗盘信号
  │  [信号] price_movement: BTC +3.2% | volume_spike: $42B 24h volume
  │  [信号] trending: BTC is trending on AVE (#1 Hot ranking)
  ▼
时间 T=2  AI 决策引擎 (Layer 2)
  │  ave-polymarket-runtime.ts 分析：
  │    市场赔率: YES 62%
  │    AVE 链上信号：BTC 价格持续上涨 +3.2%，距离 $100K 仅差 5%
  │    鲸鱼信号：大量买入活动（链上交易量偏高）
  │    AI 概率估计：YES 70%（链上数据支持上涨趋势）
  │    edge = 70% - 62% = 8% → 显著可交易
  │    1/4 Kelly = (8% * 72%) / 1.61 / 4 = 0.89% of bankroll
  │    bankroll $10,000 → sizeUsd = $89
  ▼
时间 T=3  Polymarket 执行 + 风控 (Layer 3)
  │  risk.ts applyTradeGuardsDetailed() 逐一检查 6 层约束：
  │    ✓ 单笔上限 (15% of bankroll = $1,500) → $89 通过
  │    ✓ 总敞口 (80% of bankroll = $8,000) → 当前敞口 $3,200 + $89 通过
  │    ✓ 最大持仓数 (22) → 当前 8 仓 通过
  │    ✓ 最低交易额 ($5) → $89 通过
  │  polymarket-sdk.ts 在 Polymarket CLOB 下单：BUY YES $89 FOK
  ▼
时间 T=4  Dashboard (Layer 4)
  │  实时展示：
  │    [AVE SIGNAL] BTC +3.2% trending #1 → enriched "BTC $100K" market
  │    [TRADE] BUY YES $89 on "Will Bitcoin reach $100,000?" (edge=8%)
  │    Polymarket 持仓列表更新，权益曲线刷新
  ▼
时间 T+N  持仓复审 (Layer 2 + Layer 1, 周期性)
  │  AVE 持续监控 BTC 链上价格和鲸鱼活动
  │  position-review.ts 结合 AVE 信号和 Polymarket 赔率变化
  │  若 edge 仍 > 2% → 分类 6 (edge-positive)：继续持有
  │  若 BTC 链上价格暴跌 -15% → 分类 3 (edge-gone)：平仓
```

---

## 四、商业价值与实用性

### 4.1 解决的真实问题

| 痛点 | 影响范围 | 现有解决方案的不足 |
|------|---------|------------------|
| 预测市场参与者缺乏链上数据 | 所有 Polymarket 用户 | 大多数参与者只看新闻/社交情绪，忽略链上定量信号 |
| 链上数据分散在 130+ 链 | 跨链研究者 | 缺乏统一监控工具，手动跟踪链上活动成本极高 |
| 预测市场 7x24 不间断运行 | 所有参与者 | 人类无法持续监控赔率变化和链上信号，错过关键时机 |
| 智能合约安全风险影响预测 | crypto 相关市场 | Token 的合约安全问题（蜜罐、rug pull）会影响相关预测市场结果 |
| 缺乏系统化风控 | 非机构投资者 | 情绪化交易导致亏损扩大，无止损纪律 |
| AI Agent 框架锁定 | 开发者 | 现有工具绑定单一框架，迁移成本高 |

### 4.2 Hourglass 的解决方案：链上数据的信息优势

- **链上信号驱动预测**：通过 AVE Claw API 实时获取 130+ 链的链上数据（鲸鱼动向、价格异常、交易量突变），为预测市场的概率估计提供独特的信息边际
- **智能关键词提取**：自动从预测市场问题中提取 crypto 相关关键词（支持 50+ 种代币映射），精准关联链上信号
- **合约安全信号**：通过 AVE 合约安全审计 API 评估预测市场中提到的 Token 的安全风险，高风险 Token 影响概率估计
- **Polymarket CLOB 执行**：保留经过 50+ 次生产运行验证的预测市场交易系统，FOK/GTC 订单类型
- **机构级风控系统**：6 层硬约束嵌入执行路径，回撤超 30% 自动停机，单笔上限 15%，总敞口上限 80%，不可被策略层绕过
- **公开透明的 Dashboard**：AVE 监控信号流 + Polymarket 持仓状态实时可视化

### 4.3 竞争优势

| 对比维度 | 简单 API 包装 | 纯预测市场 Bot | Hourglass |
|---------|-------------|--------------|-----------|
| 链上数据利用 | 调用 1-2 个 API 展示数据 | 不使用链上数据 | 12 个 AVE API 端点深度集成，链上信号驱动预测 |
| 预测市场执行 | 无交易执行 | 有但缺乏链上信号 | AVE 信号 + Polymarket CLOB 执行的完整闭环 |
| 风控能力 | 无或仅前端展示 | 简单止损 | 6 层服务层硬风控，风控拒绝返回具体约束名称 |
| AI 决策 | 无或调用 GPT 一次性推荐 | 基于新闻情绪 | 链上信号 + 市场赔率 + Kelly 仓位 + 7 级分类复审 |
| 架构成熟度 | Demo 级 | 单一功能 | 基于 50+ 次生产运行的代码库，pnpm monorepo 12 个子包 |
| 框架依赖 | 绑定特定 Agent 框架 | 绑定特定框架 | Framework-Free，支持任意 AI Agent |

### 4.4 落地路径

1. **预测市场交易者**：部署 Hourglass，配置 AVE API Key + Polymarket 钱包，利用链上数据获取预测市场信息优势
2. **量化团队**：作为策略研发框架，接入自定义 AI 模型，结合链上信号快速迭代预测市场策略
3. **AVE 生态**：展示 AVE Claw 数据在预测市场中的应用价值 —— 链上数据不仅用于 DeFi 交易，还能为预测市场参与者提供信息边际

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
| **创新性 (30%)** | 创新点 | (1) **链上数据驱动预测市场**：首次将 AVE Claw 链上监控信号用于 Polymarket 预测市场的概率估计 (2) Framework-Free 架构：不锁定 AI Agent 框架，支持 Claude/OpenClaw/Codex 任意接入 (3) 7 级持仓分类模型：基于 edge 衰减的精细化预测市场持仓管理 |
| **技术实现 (30%)** | 技术深度 | (1) 12 个 AVE API 端点深度集成，链上信号智能关联到预测市场问题 (2) 全链路 TypeScript + Zod 校验 + 超时/重试/降级 (3) pnpm monorepo 12 子包，关注点分离 (4) 合约安全审计自动影响预测概率估计 |
| **实用性与商业价值 (40%)** | 落地能力 | (1) 真实可运行的预测市场交易系统 (2) Mock/Live 无缝切换 (3) 6 层硬风控不可绕过 (4) 链上数据为预测市场参与者提供信息优势 (5) 为 AVE 生态展示数据在预测市场中的应用价值 |

---

## 七、团队与致谢

**Team Alchemist-X**

本项目基于 autonomous-poly-trading 开源代码库构建，在此基础上完成了 AVE Claw 链上信号层的深度集成。我们保留了原系统经过 50+ 次实战验证的预测市场交易核心（Polymarket CLOB 执行、Kelly 仓位管理、服务层风控），同时新增了 AVE 链上信号富化层（`ave-signal-enrichment.ts`）和组合运行时（`ave-polymarket-runtime.ts`），将链上数据转化为预测市场的信息优势。

感谢 AVE 团队提供的 API 文档和技术支持。

---

> 本项目参加 **Complete Application Scenario** 赛道。AVE Claw Monitoring Skills 作为链上研究信号层（资产追踪、价格预警、异常检测、风险评估），Trading Skills 通过 Polymarket 预测市场执行（信号生成、自动执行、组合管理）。创新点：利用链上数据在预测市场中获取信息优势。
