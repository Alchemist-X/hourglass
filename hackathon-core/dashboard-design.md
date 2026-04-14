# Hourglass Dashboard 设计文档

> **设计目标**：让评审一眼看懂 "AI 是怎么用链上数据做预测市场交易的"
> **核心约束**：一次只展示一个市场的完整推理过程
> **最后更新**：2026-04-14

---

## 一、设计原则

1. **单市场聚焦** — 一屏只展示一个预测市场。评审不需要在多个面板间分散注意力。通过左右箭头或下拉切换市场。
2. **推理可追溯** — 从 AVE 原始数据 → 信号 → 概率 → edge → 下单，每一步都可视化，形成完整证据链。
3. **数据即叙事** — 不是堆数字，而是用数据讲故事。"为什么 AI 认为 BTC 会到 $150K？因为鲸鱼在大量买入。"
4. **ethereum.org 美学** — 干净、渐变、几何插画、紫蓝青配色、大量留白。
5. **移动友好** — 评审可能在手机上看。

---

## 二、设计元素

### 2.1 色彩系统

#### 品牌色

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | `#7B3FE4` (紫) | 品牌、标题、强调、CTA 按钮 |
| 辅色 | `#3B82F6` (蓝) | 链接、交互元素、信息标签 |
| 强调 | `#14B8A6` (青) | 正面信号、成功状态、活跃指标 |

#### 语义色

| 用途 | 色值 | 说明 |
|------|------|------|
| 看涨 | `#10B981` (绿) | 价格上涨、买入信号、正 edge |
| 看跌 | `#EF4444` (红) | 价格下跌、卖出信号、负 edge |
| 中性 | `#F59E0B` (琥珀) | 警告、待定、信号不明确 |

#### 背景与文字

| 用途 | 色值 | 说明 |
|------|------|------|
| 页面背景 | `#FAFBFF` (浅灰蓝) | 主背景，带微蓝调 |
| 卡片背景 | `#FFFFFF` (白) | 白色卡片 + 微阴影 |
| 卡片悬浮 | `#F8F7FF` (淡紫) | hover 状态背景 |
| 主文本 | `#1E1B4B` (深紫) | 标题、重要数据 |
| 次文本 | `#6B7280` (灰) | 说明文字、标签 |
| 分割线 | `#E5E7EB` (浅灰) | 区域分隔 |

#### 渐变

| 用途 | 渐变 | 说明 |
|------|------|------|
| CTA 按钮 | `linear-gradient(135deg, #7B3FE4, #3B82F6)` | 紫→蓝，135 度 |
| 信号条正值 | `linear-gradient(90deg, #F59E0B, #10B981)` | 琥珀→绿 |
| 信号条负值 | `linear-gradient(90deg, #EF4444, #F59E0B)` | 红→琥珀 |
| 英雄区背景 | `linear-gradient(180deg, #F0ECFF 0%, #FAFBFF 100%)` | 淡紫→页面背景 |

### 2.2 字体系统

```css
/* 标题 */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
font-weight: 700;

/* 数据/数字（所有价格、得分、百分比） */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
font-weight: 500;

/* 正文 */
font-family: 'Inter', system-ui, -apple-system, sans-serif;
font-weight: 400;
```

| 元素 | 字号 | 行高 | 字重 |
|------|------|------|------|
| 页面标题 (市场问题) | 32px / 2rem | 1.3 | 700 |
| 区域标题 | 20px / 1.25rem | 1.4 | 600 |
| 卡片标题 | 16px / 1rem | 1.5 | 600 |
| 大数据 (价格/得分) | 36px / 2.25rem | 1.2 | 500 (mono) |
| 中数据 (概率/edge) | 24px / 1.5rem | 1.3 | 500 (mono) |
| 正文 | 15px / 0.9375rem | 1.6 | 400 |
| 辅助文字 | 13px / 0.8125rem | 1.5 | 400 |
| 标签/Badge | 12px / 0.75rem | 1.4 | 500 |

### 2.3 插画系统

已有 5 个 SVG 组件（`apps/web/components/illustrations/`），按区域分配：

| 组件 | 文件 | 使用位置 | 说明 |
|------|------|---------|------|
| `HourglassHeroIllustration` | `hourglass-hero.tsx` | 底部品牌区 | 品牌展示，沙漏主题 |
| `MarketPulseIllustration` | `market-pulse.tsx` | 市场标题区背景 | 装饰性，展示市场活力 |
| `SignalFlowIllustration` | `signal-flow.tsx` | 综合判断区 | 信号流动管线可视化 |
| `TradingBrainIllustration` | `trading-brain.tsx` | 综合判断区辅助 | AI 决策引擎视觉 |
| `ShieldRiskIllustration` | `shield-risk.tsx` | 交易执行区 | 风控/安全视觉 |

插画使用规则：
- 每个区域最多一个插画，避免视觉噪音
- 插画尺寸 120-200px，半透明（opacity 0.15-0.25）作为背景装饰
- 在关键展示区域（综合判断区）可全尺寸展示

### 2.4 组件规范

#### 卡片

```css
.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 24px;
  border: 1px solid #F3F4F6;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(123, 63, 228, 0.08);
}
```

#### 按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #7B3FE4, #3B82F6);
  color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-secondary {
  background: transparent;
  color: #7B3FE4;
  border: 1.5px solid #7B3FE4;
  border-radius: 12px;
  padding: 12px 24px;
}
```

#### 信号条

```css
.signal-bar {
  height: 8px;
  border-radius: 4px;
  background: #E5E7EB;
  overflow: hidden;
  position: relative;
}

.signal-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1.2s ease-out;
  /* 正值: linear-gradient(90deg, #F59E0B, #10B981) */
  /* 负值: linear-gradient(90deg, #EF4444, #F59E0B) */
}
```

#### 信号标签 (Badge)

```css
.badge-bullish {
  background: #ECFDF5;
  color: #059669;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-bearish {
  background: #FEF2F2;
  color: #DC2626;
}

.badge-neutral {
  background: #FFFBEB;
  color: #D97706;
}
```

#### 进度指示器

```css
.pulse-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10B981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
```

---

## 三、页面结构（单市场视图）

整个页面讲述一个完整故事：
> "这是 **[市场名称]**，AI 分析了链上数据，认为概率是 **X%**，而市场给的是 **Y%**，所以 edge 是 **Z%**，于是下了 **N** 单。"

页面从上到下分为 6 个区域，每个区域是故事的一个章节。

### 3.1 顶部导航栏

固定在页面顶部，始终可见。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⏳ Hourglass                [← 上一个] 市场 2/7 [下一个 →] │
│                                                             │
│  ● Live   最后更新: 3 分钟前                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**元素说明**：

| 元素 | 规格 |
|------|------|
| Logo | 沙漏 emoji + "Hourglass" 文字，Inter 700, 18px, `#7B3FE4` |
| 市场切换 | 左右箭头按钮（圆形，40px，`#F3F4F6` 背景），中间显示 "市场 N/7" |
| 状态指示 | 绿色脉冲圆点 + "Live" 文字 + 最后更新时间 |
| 高度 | 64px，`#FFFFFF` 背景，底部 `1px solid #E5E7EB` |

**键盘支持**：左右方向键切换市场。

### 3.2 市场标题区（Hero Section）

页面的开篇，用大标题告诉评审"我们在看什么市场"。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [MarketPulseIllustration 作为淡色背景装饰]          │   │
│  │                                                     │   │
│  │      When will Bitcoin hit $150k?                   │   │
│  │                                                     │   │
│  │      BTC · $3.1M 交易量 · 结算: 开放式 · 剩余: --  │   │
│  │                                                     │   │
│  │      ┌────────┐  ┌─────────┐                       │   │
│  │      │ 🟢 BTC │  │ $94,200 │                       │   │
│  │      └────────┘  └─────────┘                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**元素说明**：

| 元素 | 规格 |
|------|------|
| 背景 | `linear-gradient(180deg, #F0ECFF 0%, #FAFBFF 100%)`，`MarketPulseIllustration` 右侧 opacity 0.15 |
| 市场问题 | Inter 700, 32px, `#1E1B4B`，最多 2 行 |
| 副信息 | Inter 400, 14px, `#6B7280`，用 "·" 分隔：Token / 交易量 / 结算日期 / 剩余天数 |
| Token Badge | 圆角 8px，绿色背景 `#ECFDF5`，显示 Token 符号 |
| 当前价格 | JetBrains Mono 500, 24px, `#1E1B4B` |
| 内边距 | 上下 48px，左右 32px |

**数据来源**：
- 市场问题 / 交易量 / 结算日期：Polymarket Gamma API（`DecisionReasoningData.marketQuestion`）
- 当前价格：`CryptoSignal.price`
- Token：`CryptoSignal.token`

### 3.3 AVE 信号面板（核心区域）

**这是整个页面的主角**。展示 4 个 AVE Skill 的分析结果，每个 Skill 一张独立卡片。

布局：2x2 网格（桌面端），1 列堆叠（移动端）。

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  📊 实时价格                  │  │  📈 K线趋势分析               │
│  Real-time Price             │  │  K-line Trend Analysis       │
│                              │  │                              │
│  BTC 当前: $94,200           │  │  [迷你K线图 — 面积图]         │
│  目标: $150,000              │  │                              │
│  距离: +59.2%                │  │  MA20: $93,800 ▲             │
│                              │  │  MA50: $91,200 ▲             │
│  ┌──────────────────┐        │  │  MACD: 金叉 ✅               │
│  │ [迷你价格走势图]  │        │  │                              │
│  └──────────────────┘        │  │                              │
│                              │  │                              │
│  信号: 中性 ── (0.00)        │  │  信号: 看涨 ▲ (+0.73)        │
│  [███████████░░░░░░░░░░░░░░] │  │  [█████████████████████░░░░░] │
│  -1.0       0.0       +1.0  │  │  -1.0       +0.73      +1.0  │
└──────────────────────────────┘  └──────────────────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────────┐
│  🐋 鲸鱼行为追踪              │  │  📉 链上买卖比                │
│  Whale Tracking              │  │  On-chain Buy/Sell Ratio     │
│                              │  │                              │
│  过去 1 小时大额交易:         │  │  5分钟:  买 182 / 卖 98      │
│                              │  │          比率 1.86x ▲        │
│  买入: $42.3M ████████       │  │  1小时:  买 890 / 卖 560     │
│  卖出: $18.1M ████           │  │          比率 1.59x ▲        │
│                              │  │  6小时:  买 3200 / 卖 2800   │
│  净买入: +$24.2M             │  │          比率 1.14x ─        │
│  大额交易: 23 笔             │  │                              │
│                              │  │                              │
│  信号: 看涨 ▲ (+0.40)        │  │  信号: 偏多 ▲ (+0.31)        │
│  [██████████████████░░░░░░░░] │  │  [████████████████░░░░░░░░░░] │
│  -1.0       +0.40     +1.0  │  │  -1.0       +0.31     +1.0  │
└──────────────────────────────┘  └──────────────────────────────┘
```

**单个 Skill 卡片结构**：

```
┌─────────────────────────────────────────┐
│  [emoji] [Skill 中文名]                 │  ← 顶部: 标题行
│  [Skill 英文名]                         │
│                                         │
│  [具体数据 + 迷你可视化]                 │  ← 中部: 核心数据
│                                         │
│  信号: [标签] ([得分])                   │  ← 底部: 信号总结
│  [████████████░░░░░░░]                  │  ← 信号条
│  -1.0     [标记]     +1.0              │
└─────────────────────────────────────────┘
```

**卡片规格**：

| 元素 | 规格 |
|------|------|
| 卡片 | `border-radius: 16px`，`padding: 24px`，白色背景 |
| Skill 图标 | emoji，24px |
| Skill 标题 | Inter 600, 16px, `#1E1B4B` |
| Skill 副标题 | Inter 400, 13px, `#6B7280` |
| 数据值 | JetBrains Mono 500, 16px |
| 信号标签 | Badge 组件（看涨/看跌/中性） |
| 信号得分 | JetBrains Mono 500, 14px |
| 信号条 | 高度 8px，圆角 4px，底部标尺 -1.0 / 0.0 / +1.0 |

**4 个 Skill 的数据映射**：

| Skill | 数据来源（CryptoSignal） | 展示内容 |
|-------|------------------------|---------|
| 📊 实时价格 | `price` | 当前价格 vs 目标价格，距离百分比，迷你走势图 |
| 📈 K线趋势 | `details.klines`（ma20, ma50, macdSignal, volatility） | MA20/MA50 数值和方向箭头，MACD 状态，波动率 |
| 🐋 鲸鱼追踪 | `details.whales`（buyVolume, sellVolume, netRatio, largeTradeCount） | 买卖柱状图，净买入金额，大额交易笔数 |
| 📉 买卖比 | `details.sentiment`（buy5m, sell5m, buy1h, sell1h, buy6h, sell6h） | 三个时间窗口的买卖比，每窗口显示比率和方向 |

**信号得分**（每个 Skill 底部）：
- `trendScore`（-1 到 +1）→ K线趋势卡片
- `whalePressure`（-1 到 +1）→ 鲸鱼追踪卡片
- `sentimentScore`（-1 到 +1）→ 买卖比卡片
- 价格 Skill 使用 `(price - targetPrice) / targetPrice` 归一化到 -1~+1

### 3.4 综合判断区（决策推理核心）

这一区域讲完整的决策故事，是评审最关注的区域。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [SignalFlowIllustration — 全尺寸展示，作为视觉锚点]         │
│                                                             │
│  ── 信号聚合管线 ──────────────────────────────────────────  │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  📊     │    │  📈     │    │  🐋     │    │  📉     │  │
│  │ 实时价格│ →  │ K线趋势 │ →  │ 鲸鱼    │ →  │ 买卖比  │  │
│  │         │    │         │    │         │    │         │  │
│  │  0.00   │    │ +0.73   │    │ +0.40   │    │ +0.31   │  │
│  │  ×0.0   │    │  ×0.4   │    │  ×0.3   │    │  ×0.3   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │        │
│       └──────────────┴──────────────┴──────────────┘        │
│                          ↓                                  │
│                                                             │
│  ── 综合得分 ──────────────────────────────────────────────  │
│                                                             │
│              综合得分: +0.52 (看涨)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■░░░░░░░░░░░░░░░░░░░░ │   │
│  └──────────────────────────────────────────────────────┘   │
│  -1.0              0.0          ▲ +0.52            +1.0     │
│                                                             │
│  ── 概率与 Edge ─────────────────────────────────────────── │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │                │  │                │  │                │ │
│  │   我们的概率    │  │   市场赔率      │  │     Edge       │ │
│  │                │  │                │  │                │ │
│  │     52%        │  │     31%        │  │    +21%        │ │
│  │                │  │                │  │   (看涨)       │ │
│  │  AVE 链上信号   │  │  Polymarket    │  │  信息优势      │ │
│  │                │  │                │  │                │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                             │
│  "4 个 AVE 信号综合后得分 +0.52（看涨），转换为概率 52%。    │
│   市场只给了 31%。这意味着有 21% 的 edge — 市场低估了        │
│   链上鲸鱼买入和技术趋势的看涨信号。"                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**元素说明**：

| 元素 | 规格 |
|------|------|
| 插画 | `SignalFlowIllustration`，宽度 100%，max-height 120px，opacity 0.2 作为区域背景 |
| 信号聚合管线 | 4 个小卡片横排，每个 120px 宽，用箭头连接 |
| 小卡片 | 圆角 12px，`#F8F7FF` 背景，显示 emoji + 名称 + 得分 + 权重 |
| 综合得分 | JetBrains Mono 700, 36px，动画计数到最终值 |
| 综合信号条 | 高度 12px（加粗版），带三角标记指示得分位置 |
| 三格面板 | 3 个等宽卡片，圆角 16px |
| "我们的概率" 卡片 | `#7B3FE4` 边框高亮，数字 JetBrains Mono 700, 36px |
| "市场赔率" 卡片 | `#3B82F6` 边框，数字同上 |
| "Edge" 卡片 | 正值绿色边框 `#10B981`，负值红色边框 `#EF4444`，数字同上 |
| 叙事文字 | Inter 400, 15px, `#4B5563`，斜体，解释 AI 的推理逻辑 |

**数据映射**（来自 `ProbabilityEstimate`）：

| 显示 | 数据字段 |
|------|---------|
| 综合得分 | `CryptoSignal.overallScore` |
| 我们的概率 | `ProbabilityEstimate.estimatedProbability` |
| 市场赔率 | `ProbabilityEstimate.marketImpliedProbability` |
| Edge | `ProbabilityEstimate.edge` |
| 权重 | 固定值: trend ×0.4, whale ×0.3, sentiment ×0.3 |

**计算公式（页面上展示）**：

```
overallScore = trendScore × 0.4 + whalePressure × 0.3 + sentimentScore × 0.3
edge = estimatedProbability - marketImpliedProbability
```

### 3.5 交易执行区

展示基于 edge 做出的交易决策和风控检查结果。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [ShieldRiskIllustration — 右侧装饰，opacity 0.15]         │
│                                                             │
│  ── 交易决策 ──────────────────────────────────────────────  │
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │                          │  │                          │ │
│  │  动作                    │  │  风控检查                 │ │
│  │                          │  │                          │ │
│  │  BUY YES                 │  │  ✅ 单笔 ≤ 15%  (0.8%)  │ │
│  │  5 shares @ $0.31        │  │  ✅ 总敞口 ≤ 80% (62%)   │ │
│  │  花费: $1.55             │  │  ✅ 单事件 ≤ 30% (8%)    │ │
│  │                          │  │  ✅ 回撤 < 30%  (0%)     │ │
│  │  状态: ✅ 已执行          │  │  ✅ 持仓数 < 22 (4/22)   │ │
│  │  Order: 0x3e3f...        │  │                          │ │
│  │  时间: 3 分钟前           │  │  全部通过 ✅              │ │
│  │                          │  │                          │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                             │
│  ── 当前持仓 ──────────────────────────────────────────────  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  162.34 shares                                       │   │
│  │  入场均价: $0.031  |  现价: $0.018  |  PnL: -39.7%   │   │
│  │                                                      │   │
│  │  [持仓价值柱状图 — 入场 vs 现价]                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**元素说明**：

| 元素 | 规格 |
|------|------|
| 动作 Badge | "BUY" = 绿色大号 Badge，"SELL" = 红色，"SKIP" = 灰色 |
| 交易详情 | JetBrains Mono, 各行 16px |
| 状态 | 已执行 = 绿色 ✅，待定 = 琥珀色 ⏳，跳过 = 灰色 ⊘ |
| Order ID | 截断显示，点击复制完整地址 |
| 风控检查 | 逐项列出 5 个检查项，每项 ✅/❌ + 参数名 + 当前值 |
| 持仓卡片 | 显示 shares 数量、入场/现价、PnL 百分比（正绿负红） |

**数据映射**（来自 `DecisionReasoningData`）：

| 显示 | 数据字段 |
|------|---------|
| 动作 | `action`（BUY / SELL / SKIP） |
| shares | `shares` |
| 价格 | `marketProbability`（作为 share 价格） |
| 状态 | `status`（executed / pending / skipped） |
| 风控参数 | 硬编码风控基线（见 CLAUDE.md 第 7 节） |

### 3.6 底部品牌区

收尾，展示项目成就和品牌。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [HourglassHeroIllustration — 居中展示，max-width 200px]    │
│                                                             │
│  Hourglass                                                  │
│  链上信号驱动的预测市场交易 Agent                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 4        │  │ 7        │  │ 3+       │  │ $70.4M   │   │
│  │ AVE Skill│  │ 目标市场  │  │ 真实交易  │  │ 总交易量  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  AVE Claw Hackathon 2026                                    │
│  github.com/Alchemist-X/hourglass                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**元素说明**：

| 元素 | 规格 |
|------|------|
| 插画 | `HourglassHeroIllustration`，居中，max-width 200px |
| 品牌名 | Inter 700, 28px, `#7B3FE4` |
| 副标题 | Inter 400, 16px, `#6B7280` |
| 统计卡片 | 4 个小卡片等宽，数字 JetBrains Mono 700 24px，标签 Inter 400 13px |
| GitHub 链接 | `#3B82F6`，下划线，hover 加深 |
| 背景 | `#F0ECFF`，圆角 24px，内边距 48px |

---

## 四、交互设计

### 4.1 市场切换

| 触发方式 | 动作 |
|---------|------|
| 点击顶部 "←" / "→" 按钮 | 切换到上一个/下一个市场 |
| 键盘左/右方向键 | 同上 |
| 移动端左/右滑动 | 同上 |
| 下拉列表（点击 "市场 N/7"） | 展开 7 个市场列表，点击跳转 |

**过渡动画**：
- 整个内容区域 `opacity: 0 → 1`，`translateY: 8px → 0`
- duration: 300ms, easing: `ease-out`
- 新市场数据加载时显示骨架屏（Skeleton）

### 4.2 信号条动画

**加载动画**（首次进入 / 切换市场时）：

```
时间线:
  0.0s — 4 个信号条都在 0（中间位置）
  0.3s — 📊 实时价格 信号条开始动画（1.2s ease-out）
  0.5s — 📈 K线趋势 信号条开始动画
  0.7s — 🐋 鲸鱼追踪 信号条开始动画
  0.9s — 📉 买卖比 信号条开始动画
  1.5s — 综合得分条开始动画
  1.5s — 综合得分数字从 0 计数到最终值（1.5s）
  2.0s — 概率/Edge 数字淡入
```

- 每个信号条从 width 50%（中间位置）动画到实际值
- 错开 0.2s 启动（瀑布效果）
- easing: `cubic-bezier(0.16, 1, 0.3, 1)`（弹性出）

### 4.3 数字计数动画

所有大数字（综合得分、概率、Edge）使用 counting animation：

```typescript
// 伪代码
function countUp(from: number, to: number, duration: number) {
  // 1500ms, ease-out
  // 使用 requestAnimationFrame
  // 显示过程中数字持续变化
}
```

- 综合得分: 从 `0.00` 到 `+0.52`
- 概率: 从 `0%` 到 `52%`
- Edge: 从 `0%` 到 `+21%`

### 4.4 悬停效果

| 元素 | 效果 |
|------|------|
| Skill 卡片 | `translateY(-2px)` + 阴影加深 |
| 数据值 | 显示 tooltip，解释数据含义和来源 |
| 信号条 | 显示精确数值 tooltip |
| 管线小卡片 | 高亮边框 `#7B3FE4`，显示计算细节 |
| 风控检查项 | 显示参数详细解释 |

### 4.5 Tooltip 内容示例

| 悬停目标 | Tooltip 内容 |
|---------|-------------|
| MA20 数值 | "20 周期移动均线。当前价格在 MA20 之上，表示短期趋势向上。" |
| 鲸鱼净买入 | "过去 1 小时内超过 $100K 的大额交易净买入金额。正值表示大户在买入。" |
| Edge 值 | "Edge = 我们的概率估计 - 市场隐含概率。正 Edge 表示市场低估，是买入机会。" |
| 权重 ×0.4 | "K线趋势在综合得分中占 40% 权重，因为技术分析对价格预测市场最直接。" |

---

## 五、7 个目标市场

Dashboard 循环展示以下 7 个市场（来自 `implementation-roadmap.md`）：

| # | 市场问题 | Token | 交易量 | 频率 | 我们的 Edge 来源 |
|---|---------|-------|--------|------|-----------------|
| 1 | What price will Bitcoin hit in 2026? | BTC | $30.8M | 年度 | K线多周期趋势 + 鲸鱼积累检测 |
| 2 | What price will Bitcoin hit in April? | BTC | $19.2M | 月度 | 实时价格 + 买卖比失衡 |
| 3 | Bitcoin ATH by ___? | BTC | $6.1M | 季度 | K线突破信号 + 长期积累 |
| 4 | What price will Ethereum hit in April? | ETH | $4.2M | 月度 | ETH 价格 + 买卖比 |
| 5 | What price will Ethereum hit in 2026? | ETH | $4.1M | 年度 | K线长期趋势 |
| 6 | When will Bitcoin hit $150k? | BTC | $3.1M | 开放 | 鲸鱼买入趋势 + K线 |
| 7 | Bitcoin above ___ weekly | BTC | $2.9M | 周度 | 15 分钟K线 + 鲸鱼实时交易 |

每个市场对应一套完整的 `CryptoSignal` + `ProbabilityEstimate` 数据。

---

## 六、数据需求

### 6.1 数据流

```
AVE API ──→ CryptoSignal ──→ ProbabilityEstimate ──→ Dashboard
              ↑                     ↑
        ave-crypto-signals.ts  ave-signal-to-probability.ts
```

### 6.2 数据接口

每个市场需要以下数据：

| 数据 | 来源 | 对应字段 | 刷新频率 |
|------|------|---------|---------|
| 市场问题 | Polymarket Gamma API | `DecisionReasoningData.marketQuestion` | 5 分钟 |
| 交易量/结算日期 | Polymarket Gamma API | market metadata | 5 分钟 |
| BTC/ETH 当前价格 | AVE `POST /v2/tokens/price` | `CryptoSignal.price` | 30 秒 |
| K线 MA20/MA50/MACD | AVE `GET /v2/klines/token/{id}` | `CryptoSignal.details.klines` | 5 分钟 |
| 鲸鱼大额交易 | AVE `GET /v2/txs/{pair-id}` | `CryptoSignal.details.whales` | 1 分钟 |
| 买卖比 (5m/1h/6h) | AVE `GET /v2/tokens/{id}` | `CryptoSignal.details.sentiment` | 1 分钟 |
| 综合得分 | 内部计算 | `CryptoSignal.overallScore` | 每次信号更新 |
| 我们的概率 | 内部计算 | `ProbabilityEstimate.estimatedProbability` | 每次信号更新 |
| 市场赔率 | Polymarket | `ProbabilityEstimate.marketImpliedProbability` | 5 分钟 |
| Edge | 内部计算 | `ProbabilityEstimate.edge` | 每次信号更新 |
| 持仓/交易记录 | Polymarket Data API | position data | 5 分钟 |

### 6.3 API 数据 → CryptoSignal 映射

```typescript
// ave-crypto-signals.ts 输出的 CryptoSignal 接口:
interface CryptoSignal {
  token: string;           // "BTC" | "ETH"
  tokenId: string;         // ERC-20 地址
  price: number;           // 当前价格 (USD)
  trendScore: number;      // -1 到 +1 (K线趋势)
  whalePressure: number;   // -1 到 +1 (鲸鱼买压)
  sentimentScore: number;  // -1 到 +1 (买卖比情绪)
  overallScore: number;    // 加权综合得分
  details: {
    klines: { ma20, ma50, macdSignal, volatility };
    whales: { buyVolume, sellVolume, netRatio, largeTradeCount };
    sentiment: { buy5m, sell5m, buy1h, sell1h, buy6h, sell6h };
  };
  timestamp: string;
}
```

### 6.4 CryptoSignal → ProbabilityEstimate 映射

```typescript
// ave-signal-to-probability.ts 输出的 ProbabilityEstimate 接口:
interface ProbabilityEstimate {
  marketQuestion: string;
  token: string;
  targetPrice: number;
  targetDirection: "above" | "below" | "hit";
  currentPrice: number;
  aveScore: number;                  // = CryptoSignal.overallScore
  estimatedProbability: number;      // 0 到 1
  marketImpliedProbability: number;  // 0 到 1
  edge: number;                      // estimated - market
  confidence: number;                // 0 到 1
}
```

---

## 七、响应式设计

### 7.1 断点

| 断点 | 宽度 | 布局变化 |
|------|------|---------|
| Desktop | ≥ 1024px | 2 列网格，全部展示 |
| Tablet | 768-1023px | 2 列网格，缩小间距 |
| Mobile | < 768px | 1 列堆叠，信号管线纵向 |

### 7.2 移动端适配

| 区域 | 移动端变化 |
|------|-----------|
| 顶部导航 | Logo 缩写为 "⏳"，箭头保留，状态指示隐藏 |
| 市场标题 | 字号缩小到 24px，副信息换行 |
| Skill 卡片 | 1 列堆叠，全宽 |
| 信号管线 | 改为纵向排列（上到下） |
| 三格面板 | 1 列堆叠 |
| 交易执行区 | 动作卡片和风控卡片上下排列 |
| 底部统计 | 2x2 网格 |

### 7.3 间距系统

基于 8px 网格：

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px | 紧凑间距 |
| `space-2` | 8px | 元素内部 |
| `space-3` | 12px | 标签间距 |
| `space-4` | 16px | 卡片内元素间 |
| `space-5` | 24px | 卡片内边距 |
| `space-6` | 32px | 区域间距 |
| `space-7` | 48px | 大区域分隔 |
| `space-8` | 64px | Hero 区域内边距 |

---

## 八、实现优先级

### P0 — Demo 必须有（4h）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 1 | 单市场聚焦视图框架 | 1h | 页面骨架 + 市场切换 state |
| 2 | 4 个 Skill 卡片 + 信号条 | 1.5h | 核心视觉，2x2 网格 |
| 3 | 综合得分 + 概率 + Edge 展示 | 1h | 三格面板 + 信号管线 |
| 4 | 市场切换器 | 0.5h | 7 个市场循环切换 |

### P1 — 加分项（2h）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 5 | 信号条瀑布动画 | 0.5h | CSS animation + stagger |
| 6 | 数字计数动画 | 0.5h | requestAnimationFrame |
| 7 | SVG 插画集成 | 0.5h | 5 个插画放入对应区域 |
| 8 | 风控检查展示 | 0.5h | 5 项逐条展示 |

### P2 — 时间允许（2h）

| # | 任务 | 预估 | 说明 |
|---|------|------|------|
| 9 | 迷你K线图 / 价格走势图 | 1h | lightweight chart library |
| 10 | 移动端适配 | 0.5h | 响应式断点调整 |
| 11 | Tooltip 系统 | 0.5h | Hover 解释 |
| 12 | 叙事文字生成 | 0.5h | 根据数据自动生成推理说明 |

---

## 九、与现有代码的关系

### 9.1 需要保留的

| 文件 | 用途 | 备注 |
|------|------|------|
| `apps/web/components/illustrations/*` | 5 个 SVG 插画 | 直接复用 |
| `apps/web/lib/public-wallet.ts` | 获取持仓/交易数据 | API 层保留 |
| `apps/web/components/decision-reasoning-panel.tsx` | 决策推理面板 | 重构为单市场版 |

### 9.2 需要重写的

| 文件 | 变化 | 原因 |
|------|------|------|
| `apps/web/app/page.tsx` | 完全重写 | 从多面板概览改为单市场聚焦 |
| `apps/web/components/dashboard-header.tsx` | 重写 | 改为市场切换导航 |
| `apps/web/components/dashboard-positions.tsx` | 重构 | 只展示当前市场持仓 |

### 9.3 需要新建的

| 文件 | 用途 |
|------|------|
| `apps/web/components/market-switcher.tsx` | 市场切换器组件 |
| `apps/web/components/skill-card.tsx` | 通用 Skill 卡片组件 |
| `apps/web/components/signal-bar.tsx` | 信号条组件（带动画） |
| `apps/web/components/signal-pipeline.tsx` | 信号聚合管线可视化 |
| `apps/web/components/edge-panel.tsx` | 概率 + Edge 三格面板 |
| `apps/web/components/trade-execution.tsx` | 交易执行 + 风控展示 |
| `apps/web/components/brand-footer.tsx` | 底部品牌区 |
| `apps/web/hooks/use-count-up.ts` | 数字计数动画 hook |
| `apps/web/hooks/use-market-navigation.ts` | 市场切换逻辑 hook |

---

## 十、设计参考

### ethereum.org 借鉴要素

- **色调**：紫蓝为主，避免黑色重工业风
- **插画风格**：几何抽象、渐变填充、线条简洁
- **留白**：每个区域之间充分呼吸，不拥挤
- **卡片系统**：圆角、微阴影、白色背景
- **渐变背景**：Hero 区域用淡色渐变过渡
- **字体层次**：标题粗体大号 → 数据等宽中号 → 正文细体小号
- **信息密度**：宁可滚动也不要一屏塞太多

### 核心差异（我们独有的）

- **信号条**：-1 到 +1 的可视化，是我们系统的核心视觉语言
- **推理管线**：4 个信号 → 综合得分 → 概率 → Edge 的流程图
- **叙事文字**：自动生成的推理解释，不是冷冰冰的数字
