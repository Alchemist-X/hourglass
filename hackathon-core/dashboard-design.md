# Hourglass 黑客松展示页面设计文档

> 目标：评审打开 URL 后，5 分钟内完全理解项目价值并留下深刻印象
> 形式：单页滚动，从叙事到 Demo 到结果，一气呵成
> 美学：ethereum.org 风格 — 渐变、几何插画、留白、紫蓝青配色
> 最后更新：2026-04-14

---

## 一、设计原则

1. **叙事驱动** — 页面从上到下讲一个完整故事，不是堆功能
   - 问题 → 方案 → 原理 → 实证 → 结果
2. **单市场聚焦** — 用一个具体市场（BTC $150K）贯穿全页，不切换
3. **推理透明** — 每一步分析都可视化，评审能看到 AI 怎么想
4. **数据真实** — 展示真实交易记录和持仓，不是纯 mock
5. **视觉优先** — 先看图再看字，插画和信号条比文字更有说服力

## 二、色彩系统

### 品牌色
| 名称 | 色值 | 用途 |
|------|------|------|
| 紫 (Primary) | #7B3FE4 | 品牌、标题、CTA |
| 蓝 (Secondary) | #3B82F6 | 链接、交互元素 |
| 青 (Accent) | #14B8A6 | 正面指标、成功状态 |

### 语义色
| 名称 | 色值 | 用途 |
|------|------|------|
| 看涨 | #10B981 | 价格上涨、买入、正 edge |
| 看跌 | #EF4444 | 价格下跌、卖出、负 edge |
| 警告 | #F59E0B | 风险提示、待定状态 |
| 中性 | #6B7280 | 次要文字、分割线 |

### 背景
| 层级 | 色值 | 用途 |
|------|------|------|
| 主背景 | #FAFBFF | 页面底色 |
| 卡片 | #FFFFFF | 内容卡片 |
| 深色区 | #1E1B4B | Hero 背景、对比区域 |
| 渐变 | 紫→蓝→青 | Hero、分割条、强调 |

## 三、字体系统

| 用途 | 字体 | 大小 | 粗细 |
|------|------|------|------|
| Hero 标题 | Inter | 48-64px | 800 |
| 章节标题 | Inter | 28-36px | 700 |
| 卡片标题 | Inter | 18-20px | 600 |
| 正文 | Inter | 15-16px | 400 |
| 数据值 | JetBrains Mono | 24-32px | 700 |
| 小数据 | JetBrains Mono | 14px | 500 |
| 标签 | Inter | 12px | 500, 大写 |

## 四、插画使用

| 插画组件 | 位置 | 尺寸 | 作用 |
|---------|------|------|------|
| HourglassHeroIllustration | Section 1 Hero | 全宽背景 | 品牌第一印象 |
| SignalFlowIllustration | Section 3 信号管线 | 600x200 | 展示 4 Skill 数据流 |
| TradingBrainIllustration | Section 4 AI 决策 | 300x250 | 配合综合判断 |
| ShieldRiskIllustration | Section 5 风控 | 250x250 | 风控安全感 |
| MarketPulseIllustration | Section 2 市场介绍 | 400x200 | K线视觉 |

## 五、页面结构（7 个 Section，单页滚动）

### Section 1: Hero（深色背景）

```
+-------------------------------------------------------------+
| ######## 深紫->蓝渐变背景 ################################## |
|                                                             |
|              [HourglassHeroIllustration]                    |
|                                                             |
|         Hourglass                                           |
|         链上信号驱动的预测市场交易 Agent                      |
|                                                             |
|   用 AVE Claw 的链上数据，在 Polymarket 上                  |
|   发现别人看不到的 edge                                      |
|                                                             |
|   +------------+  +------------+  +------------+            |
|   | 4 AVE      |  | 7 目标     |  | 真实       |            |
|   | Skills     |  | 市场       |  | 交易       |            |
|   +------------+  +------------+  +------------+            |
|                                                             |
|   AVE Claw Hackathon 2026                                   |
|                                                             |
+-------------------------------------------------------------+
```

**要素：**
- 深色渐变背景（#1E1B4B -> #312E81）
- 沙漏插画半透明浮在背景
- 一句话定位：大字白色
- 3 个统计指标卡片（紫色半透明）
- 底部 hackathon badge

### Section 2: 问题与方案（浅色背景）

```
+-------------------------------------------------------------+
|                                                             |
|   为什么预测市场需要链上数据？                               |
|                                                             |
|   +--------------+        +--------------+                  |
|   |  普通交易者   |        |  Hourglass   |                  |
|   |              |        |              |                  |
|   | 看新闻       |   VS   | 看链上       |                  |
|   | 靠直觉       |        | AI 分析      |                  |
|   | 延迟分钟     |        | 秒级响应     |                  |
|   | 覆盖 <10     |        | 覆盖 130+    |                  |
|   |    市场      |        |    链        |                  |
|   +--------------+        +--------------+                  |
|                                                             |
|   核心洞察：链上数据是预测市场的先行指标。                    |
|   鲸鱼在买入 -> 价格还没动 -> 预测市场赔率还没调整            |
|   -> Hourglass 就已经发现了 edge。                          |
|                                                             |
+-------------------------------------------------------------+
```

**要素：**
- 对比卡片：普通交易者 vs Hourglass
- 核心洞察用大字强调
- 简洁，不超过 3 段话

### Section 3: 实时分析演示 — 单市场深潜（核心区域）

**选定市场：** "When will Bitcoin hit $150K?" ($3.1M 交易量)

这个 Section 占页面最大篇幅，讲述完整推理过程。

#### 3a: 市场介绍卡

```
+-------------------------------------------------------------+
|                                                             |
|  When will Bitcoin hit $150K?                               |
|                                                             |
|  [MarketPulseIllustration]                                  |
|                                                             |
|  交易量 $3.1M  |  结算 2026-06-30  |  剩余 77 天           |
|  当前赔率: 3.1% Yes / 96.9% No                              |
|                                                             |
+-------------------------------------------------------------+
```

#### 3b: 四个 AVE Skill 分析卡（2x2 网格）

每个卡片是一个独立的分析单元，有标题、数据、迷你可视化、信号条。

数据对应 `CryptoSignal` 接口（`ave-crypto-signals.ts`）：
- 卡片 1 对应 `price` 字段
- 卡片 2 对应 `trendScore` + `details.klines`（KlineDetails: ma20, ma50, macdSignal, volatility）
- 卡片 3 对应 `whalePressure` + `details.whales`（WhaleDetails: buyVolume, sellVolume, netRatio, largeTradeCount）
- 卡片 4 对应 `sentimentScore` + `details.sentiment`（SentimentDetails: buy5m, sell5m, buy1h, sell1h, buy6h, sell6h）

**卡片 1: 实时价格**

```
+----------------------------+
| REAL-TIME PRICE            |
| AVE API: POST /v2/tokens/  |
|          price              |
|                            |
| BTC 当前     $94,200       |
| 目标价格     $150,000      |
| 需要涨幅     +59.2%        |
|                            |
| [迷你价格线图 过去7天]      |
|                            |
| 信号: 中性                 |
| [__________#__________]   |
| -1        0.0        +1   |
+----------------------------+
```

**卡片 2: K线趋势分析**

```
+----------------------------+
| KLINE TREND ANALYSIS       |
| AVE API: GET /v2/klines/   |
|          token/{id}         |
|                            |
| [迷你K线图 + MA20/MA50]    |
|                            |
| MA20: $93,800              |
|   > MA50: $91,200          |
| MACD: 金叉 (bullish)      |
| 波动率: 3.2%/日            |
|                            |
| 信号: 看涨                 |
| [________________########]|
| -1              +0.73  +1 |
+----------------------------+
```

**卡片 3: 鲸鱼行为追踪**

```
+----------------------------+
| WHALE TRACKING             |
| AVE API: GET /v2/txs/      |
|          {pair-id}          |
|                            |
| 过去 1 小时 (>$100K 交易):  |
|                            |
| 买入 ############ $42.3M  |
| 卖出 #####       $18.1M   |
|                            |
| 净买入: +$24.2M            |
| 大额交易数: 47 笔          |
|                            |
| 最大单笔: $8.2M 买入       |
|                            |
| 信号: 看涨                 |
| [______________######__]   |
| -1             +0.40   +1 |
+----------------------------+
```

**卡片 4: 链上买卖比**

```
+----------------------------+
| BUY/SELL RATIO             |
| AVE API: GET /v2/tokens/   |
|          {id}               |
|                            |
| 时间窗口    买入  卖出  比率 |
| --------------------------  |
| 5 分钟     182   98  1.86x |
| 1 小时     890  560  1.59x |
| 6 小时    3200 2800  1.14x |
|                            |
| [三行水平对比条]            |
| 5m ############____ 1.86x  |
| 1h ##########______ 1.59x  |
| 6h #########_______ 1.14x  |
|                            |
| 信号: 偏多                 |
| [_____________#####____]   |
| -1           +0.31     +1 |
+----------------------------+
```

#### 3c: 信号聚合 + Edge 计算

对应 `ave-signal-to-probability.ts` 的 `ProbabilityEstimate` 接口和 `buildProbabilityEstimate()` 函数。

信号聚合权重来自 `ave-crypto-signals.ts` 的 `BASE_WEIGHTS`：
- trend: 0.4, whale: 0.3, sentiment: 0.3
- `overallScore = trendScore * 0.4 + whalePressure * 0.3 + sentimentScore * 0.3`

Edge 计算来自 `ProbabilityEstimate.edge`：
- `edge = estimatedProbability - marketImpliedProbability`

```
+-------------------------------------------------------------+
|                                                             |
|  [SignalFlowIllustration -- 4节点流动图]                     |
|                                                             |
|  PRICE x0.1 + KLINE x0.4 + WHALE x0.3 + RATIO x0.3 = SUM  |
|  (0.00)       (+0.73)      (+0.40)      (+0.31)     +0.52  |
|                                                             |
|  综合信号条:                                                |
|  [##########################__________________]             |
|  -1.0        0.0        +0.52           +1.0                |
|                      BULLISH                                |
|                                                             |
|  +--------------------------------------------------+      |
|  |                                                    |      |
|  |   我们的概率         市场赔率        Edge           |      |
|  |                                                    |      |
|  |     21%              3.1%         +17.9%           |      |
|  |   [大圆环]          [大圆环]       [大数字]         |      |
|  |                                                    |      |
|  |   "链上信号显示鲸鱼在积极买入 BTC，                  |      |
|  |    MA 金叉确认上升趋势。市场严重低估                  |      |
|  |    BTC 达到 $150K 的可能性。"                        |      |
|  |                          -- Hourglass AI            |      |
|  |                                                    |      |
|  +--------------------------------------------------+      |
|                                                             |
+-------------------------------------------------------------+
```

**要素：**
- SignalFlow 插画贯穿
- 4 个 Skill 得分 -> 加权 -> 综合
- 概率 vs 赔率用大圆环对比
- Edge 用超大绿色数字
- AI 推理总结用引用框（像 ChatGPT 的回答样式）

**数据映射：**
- "我们的概率" = `ProbabilityEstimate.estimatedProbability`
- "市场赔率" = `ProbabilityEstimate.marketImpliedProbability`
- "Edge" = `ProbabilityEstimate.edge`
- 推理文本基于 `ProbabilityEstimate.confidence` + `aveScore` + `targetDirection` 动态生成

### Section 4: 交易执行 + 风控（白色背景）

```
+-------------------------------------------------------------+
|                                                             |
|  [TradingBrainIllustration]                                 |
|                                                             |
|  +------------------+  +--------------------------+         |
|  | 交易执行          |  | 风控检查                  |         |
|  |                  |  |                          |         |
|  | 动作: BUY        |  | [ShieldRiskIllustration]  |         |
|  | Shares: 5        |  |                          |         |
|  | 价格: $0.031     |  | OK 单笔 0.8% <= 15%     |         |
|  | 花费: $0.155     |  | OK 总敞口 62% <= 80%     |         |
|  |                  |  | OK 持仓数 2 <= 10        |         |
|  | 状态: 已执行      |  | OK 回撤 0% < 30%        |         |
|  | TxHash: 0x3e3f.. |  | OK 止损已设置 30%        |         |
|  |                  |  |                          |         |
|  | Kelly: 1/4 保守   |  | 6 层风控全部通过          |         |
|  | 签名: 免Gas       |  |                          |         |
|  +------------------+  +--------------------------+         |
|                                                             |
+-------------------------------------------------------------+
```

**风控参数说明（来自 CLAUDE.md 风控基线）：**

| 参数 | 默认值 | 检查逻辑 |
|------|-------|---------|
| MAX_TRADE_PCT | 15% | 单笔交易金额 / bankroll <= 15% |
| MAX_TOTAL_EXPOSURE_PCT | 80% | 所有持仓总价值 / bankroll <= 80% |
| MAX_POSITIONS | 22 | 当前持仓数 < 22 |
| DRAWDOWN_STOP_PCT | 30% | 从峰值的回撤 < 30% |
| MIN_TRADE_USD | $5 | 交易金额 >= $5 |
| MAX_EVENT_EXPOSURE_PCT | 30% | 单事件敞口 / bankroll <= 30% |

### Section 5: 真实交易结果（浅灰背景）

```
+-------------------------------------------------------------+
|                                                             |
|  真实交易记录（链上可验证）                                    |
|                                                             |
|  +--------------------------------------------------+      |
|  | #  市场                    Shares  入场   PnL     |      |
|  +--------------------------------------------------+      |
|  | 1  BTC hit $150K Jun 2026  162.34  $0.031 -39%    |      |
|  | 2  BTC hit $1M before GTA  20.45   $0.489 -0.2%   |      |
|  +--------------------------------------------------+      |
|                                                             |
|  钱包: 0xc788...2936                                        |
|  总权益: $17.94  |  现金: $4.96  |  部署: $15.00             |
|                                                             |
|  [Polymarket 验证链接]                                       |
|                                                             |
+-------------------------------------------------------------+
```

**设计要点：**
- 表格行颜色编码：盈利绿色背景，亏损红色背景
- PnL 数字使用语义色
- 钱包地址可点击跳转链上浏览器
- "Polymarket 验证链接" 按钮跳转到 Polymarket 个人持仓页

### Section 6: 技术架构（渐变背景）

```
+-------------------------------------------------------------+
| ### 浅紫渐变背景 ########################################## |
|                                                             |
|  四层架构                                                   |
|                                                             |
|  +-------------------------------------------------+       |
|  | Layer 1: AVE Claw 监控                            |       |
|  | PRICE | KLINE | WHALE | BUY/SELL RATIO           |       |
|  +-------------------------------------------------+       |
|  | Layer 2: AI 决策引擎                               |       |
|  | 信号聚合 -> 概率估算 -> Edge 计算                    |       |
|  +-------------------------------------------------+       |
|  | Layer 3: Polymarket 执行 + 风控                    |       |
|  | FOK 订单 | 6层风控 | 免Gas签名                     |       |
|  +-------------------------------------------------+       |
|  | Layer 4: 展示 + 归档                               |       |
|  | Dashboard | 交易记录 | 运行报告                    |       |
|  +-------------------------------------------------+       |
|                                                             |
|  技术栈: TypeScript | Next.js 16 | Fastify | BullMQ        |
|  代码: 15,000+ 行 | 12 个 workspace 包 | 50+ 历史运行       |
|                                                             |
+-------------------------------------------------------------+
```

**架构层与 AVE API 映射：**

| 层级 | 关键模块 | AVE API 端点 |
|------|---------|-------------|
| Layer 1 | `ave-crypto-signals.ts` | `POST /v2/tokens/price`, `GET /v2/klines/token/{id}`, `GET /v2/txs/{pair-id}`, `GET /v2/tokens/{id}` |
| Layer 2 | `ave-signal-to-probability.ts` | 无直接 API 调用，消费 Layer 1 的 `CryptoSignal` |
| Layer 3 | `polymarket-sdk.ts`, `risk.ts` | 无 AVE API，Polymarket CLOB |
| Layer 4 | Dashboard 组件 | 展示 Layer 1-3 数据 |

### Section 7: Footer（深色）

```
+-------------------------------------------------------------+
| ######## 深色背景 ########################################## |
|                                                             |
|  Hourglass                                                  |
|  AVE Claw Hackathon 2026                                    |
|                                                             |
|  GitHub: github.com/Alchemist-X/hourglass                   |
|  Demo: hourglass-eta.vercel.app                              |
|                                                             |
|  4 AVE Skills x 7 Markets x Real Trades                     |
|  "用链上数据，在预测市场找到别人看不到的 edge"                 |
|                                                             |
+-------------------------------------------------------------+
```

## 六、动画与交互

### 6.1 滚动触发动画
- 每个 Section 在进入视口时 fade-in + slide-up (300ms)
- 信号条在可见时从 0 动画填充到实际值 (1.2s ease-out)
- 4 个 Skill 卡片错开 0.2s 入场（瀑布效果）
- 综合得分数字从 0 数到最终值 (1.5s)
- Edge 数字有轻微 glow pulse

### 6.2 交互
- Skill 卡片 hover 上浮 + 阴影
- 信号条 hover 显示详细数据 tooltip
- 交易记录可点击跳转 Polymarket

### 6.3 响应式
- Desktop (>= 1024px): 2x2 Skill 网格
- Tablet (768-1023px): 2x1
- Mobile (< 768px): 1x1 堆叠

## 七、数据来源

所有展示数据来自两个来源：
1. **AVE Mock/Real** -- `CryptoSignal` 数据（价格、K线、鲸鱼、买卖比），结构定义在 `ave-crypto-signals.ts`
2. **Polymarket Real** -- 真实持仓和交易记录（通过 spectator 模式）

页面服务端渲染，数据在 build 时或请求时生成，不依赖客户端 API 调用。

### 7.1 核心数据接口

**CryptoSignal（from ave-crypto-signals.ts）：**
```typescript
interface CryptoSignal {
  token: string           // "BTC" | "ETH"
  tokenId: string         // AVE token contract address
  price: number           // 当前价格
  trendScore: number      // K线趋势得分 [-1, +1]
  whalePressure: number   // 鲸鱼压力 [-1, +1]
  sentimentScore: number  // 买卖比情绪 [-1, +1]
  overallScore: number    // 综合得分 [-1, +1]
  details: {
    klines: { ma20, ma50, macdSignal, volatility }
    whales: { buyVolume, sellVolume, netRatio, largeTradeCount }
    sentiment: { buy5m, sell5m, buy1h, sell1h, buy6h, sell6h }
  }
  timestamp: string
}
```

**ProbabilityEstimate（from ave-signal-to-probability.ts）：**
```typescript
interface ProbabilityEstimate {
  marketQuestion: string
  token: string
  targetPrice: number
  targetDirection: "above" | "below" | "hit"
  currentPrice: number
  aveScore: number                 // = CryptoSignal.overallScore
  estimatedProbability: number     // 我们的概率估计 [0.05, 0.95]
  marketImpliedProbability: number // Polymarket 当前赔率
  edge: number                    // = estimated - market
  confidence: number              // 信心度 [0, 1]
}
```

### 7.2 信号聚合权重

来源：`ave-crypto-signals.ts` 的 `BASE_WEIGHTS` 常量

| 信号组件 | 权重 | 失败降级 |
|---------|------|---------|
| trendScore (K线) | 0.4 | 该组件归零，其余按比例放大 |
| whalePressure (鲸鱼) | 0.3 | 同上 |
| sentimentScore (买卖比) | 0.3 | 同上 |

当某组件 AVE 调用失败时，`reweightForFailures()` 函数自动将剩余组件权重按比例归一化。

### 7.3 概率估算逻辑

来源：`ave-signal-to-probability.ts` 的 `estimateProbability()`

1. **基础概率** -- 基于价格距离 + 剩余时间
   - 当前价 >= 目标价: base = 0.8
   - 差距 <= 10%: base = 0.5
   - 差距 10-30%: base = 0.35
   - 差距 > 30%: base = 0.2
   - 时间调整：剩余天数越多，base 越靠近 0.5

2. **AVE 调整** -- `aveScore * 0.15`（最大 15% 的概率偏移）

3. **最终概率** -- `clamp(baseProbability + aveAdjustment, 0.05, 0.95)`

4. **Edge** -- `estimatedProbability - marketImpliedProbability`

## 八、评审维度对照

展示页面的 7 个 Section 如何对应评审标准（Innovation 30%, Technical 30%, Practicality 40%）：

| Section | 评审维度 | 目的 |
|---------|---------|------|
| 1 Hero | 全局 | 第一印象，建立品牌认知 |
| 2 问题与方案 | 实用性 (40%) | 证明解决真实问题 |
| 3 实时分析 | 创新性 (30%) + 技术 (30%) | 展示链上数据驱动预测市场的独特性 + AVE API 深度集成 |
| 4 交易执行 | 技术 (30%) | 展示 CLOB 执行 + 6 层风控的工程质量 |
| 5 真实交易 | 实用性 (40%) | 证明系统真实可用，有链上可验证的交易记录 |
| 6 架构 | 技术 (30%) | 展示 12 子包 monorepo + Framework-Free 架构 |
| 7 Footer | 全局 | 收尾，提供 GitHub / Demo 链接 |

## 九、实现计划

| 优先级 | 内容 | 文件 | 预计 |
|-------|------|------|------|
| P0 | Hero section | page.tsx + globals.css | 30min |
| P0 | 4 Skill 卡片 + 信号条 | 新组件 | 1h |
| P0 | 综合判断 + Edge | 新组件 | 30min |
| P0 | 交易执行 + 风控 | 新组件 | 30min |
| P1 | 问题与方案对比 | 新组件 | 20min |
| P1 | 真实交易结果 | 新组件 | 20min |
| P1 | 技术架构展示 | 新组件 | 20min |
| P1 | 插画集成 | 引用已有 SVG | 20min |
| P2 | 滚动动画 | IntersectionObserver | 30min |
| P2 | 移动端适配 | CSS media queries | 30min |

**总预计：5-6 小时**

### P0 组件拆分

```
apps/web/components/showcase/
  hero-section.tsx          # Section 1
  skill-card.tsx            # 单个 AVE Skill 卡片（复用 x4）
  signal-bar.tsx            # 信号条组件（-1 到 +1 可视化）
  signal-aggregation.tsx    # Section 3c 综合判断
  edge-display.tsx          # 概率 vs 赔率 + Edge 大数字
  trade-execution.tsx       # Section 4
  risk-check.tsx            # 风控检查清单
```

### P1 组件拆分

```
apps/web/components/showcase/
  problem-solution.tsx      # Section 2 对比卡片
  trade-history.tsx         # Section 5 真实交易表格
  architecture.tsx          # Section 6 四层架构图
  footer.tsx                # Section 7
```
