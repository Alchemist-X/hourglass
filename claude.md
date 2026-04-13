# Hourglass — AVE Claw Hackathon 2026 项目约定

> **Repo**: https://github.com/Alchemist-X/hourglass
> **Base**: autonomous-poly-trading（Polymarket 云端交易系统）
> **最后更新**：2026-04-13

英文版见 [claude.en.md](claude.en.md)。

---

## 0. Hackathon 上下文

### 时间线

| 节点 | 日期 |
|------|------|
| 提交窗口 | Apr 13 – 15, 2026 |
| 结果公布 | Apr 18, 2026 |
| 香港 Demo Day | Apr 21, 2026 |

### 评审权重

| 维度 | 权重 |
|------|------|
| 创新性 Innovation | 30% |
| 技术实现 Technical Implementation | 30% |
| 实用性与商业价值 Practicality & Business Value | **40%** |

### 提交物清单

- [ ] GitHub 代码（可运行、原创）
- [ ] 文档说明 AVE Skill 使用方式
- [ ] Demo 视频 ≤ 5 分钟
- [ ] README 含项目简介、架构图、运行方式

---

## 1. 项目概述

Hourglass 是一个链上信号驱动的预测市场交易代理。它将 AVE Claw 的 **Monitoring Skills**（资产追踪、价格预警、异常检测、合约风险评估）作为 **研究/信号层**，与 Polymarket 预测市场的 **CLOB 交易执行** 相结合，形成一个 **Complete Application Scenario** —— 利用链上数据在预测市场中获取信息优势。

核心创新：大多数预测市场参与者只关注新闻和情绪。Hourglass 通过 AVE Claw 实时获取链上鲸鱼动向、代币价格异常、合约安全风险、交易量突变等定量信号，将这些链上数据注入 AI 决策引擎，为预测市场的概率估计提供其他参与者忽略的信息边际。

### 四层架构

```
┌─────────────────────────────────────────────┐
│  Layer 4: Dashboard + Reports (Next.js 16)  │
│           AVE 监控信号流 + Polymarket 持仓    │
├─────────────────────────────────────────────┤
│  Layer 3: Polymarket CLOB Execution         │
│           预测市场下单 + 仓位管理 + 硬风控    │
├─────────────────────────────────────────────┤
│  Layer 2: AI Decision Engine                │
│           AVE 信号 + Polymarket 赔率 → 寻边  │
├─────────────────────────────────────────────┤
│  Layer 1: AVE Claw Monitoring (信号层)       │
│           链上数据信号：鲸鱼、价格、异常、风险 │
└─────────────────────────────────────────────┘
```

- **Layer 1 — AVE Claw Monitoring（研究信号层）**：资产追踪、价格流、异常检测、合约安全审计。提供链上定量信号，为预测市场决策提供数据基础。
- **Layer 2 — AI Decision Engine**：将 AVE 链上信号与 Polymarket 赔率结合分析，寻找预测市场中的信息边际，生成交易信号。
- **Layer 3 — Polymarket CLOB Execution**：在 Polymarket 预测市场上执行交易（FOK/GTC 订单），保留原系统的仓位管理与 6 层服务层硬风控。
- **Layer 4 — Dashboard**：Next.js 16 实时面板，同时展示 AVE 监控信号流和 Polymarket 持仓状态。

---

## 2. AVE Claw 集成概览

### Monitoring Skills（Layer 1）

| Skill | 用途 | 对应原模块 |
|-------|------|-----------|
| Asset Tracking | 实时追踪链上资产变动 | Polymarket market fetch |
| Price Alerts | 价格阈值触发通知 | 市场快照轮询 |
| Anomaly Detection | 检测异常交易/价格偏离 | 无（新增能力） |

### Trading Skills（Layer 3）

| Skill | 用途 | 对应原模块 |
|-------|------|-----------|
| Signal Generation | 基于监控数据生成交易信号 | Pulse recommendation |
| Auto Execution | 自动执行交易指令 | Polymarket CLOB executor |
| Portfolio Management | 持仓再平衡与风控 | Risk guard + position mgr |

### 集成原则

- 所有 AVE Skill 调用必须有 **超时 + 重试 + 降级**。
- Monitoring 数据流走 **push 模式**（WebSocket/SSE），回退到 polling。
- Trading 执行走 **request-response**，必须等到链上确认才标记成功。

---

## 3. 单仓结构（Monorepo）

```
ave-hackathon/
├── apps/
│   └── web/                  # Next.js 16 Dashboard
├── packages/
│   ├── contracts/            # 合约类型与 ABI
│   ├── db/                   # Drizzle ORM schema + migrations
│   └── terminal-ui/          # CLI 可视化组件
├── services/
│   ├── ave-monitor/          # [新增] AVE Claw Monitoring 适配层
│   ├── executor/             # 交易执行（改造为 AVE Trading）
│   ├── orchestrator/         # 主调度器
│   └── rough-loop/           # Pulse 分析管线
├── skills/                   # AVE Skill 定义与注册
├── scripts/                  # 运维脚本
└── docs/                     # 项目文档
```

### 新增模块：`services/ave-monitor/`

职责：封装 AVE Claw Monitoring Skills，对上层暴露统一的数据订阅接口。

```
services/ave-monitor/
├── src/
│   ├── skills/           # 各 Monitoring Skill 适配器
│   ├── stream/           # 数据流管理（WebSocket/polling）
│   ├── transform/        # 原始数据 → 标准化格式
│   └── index.ts          # 统一导出
├── package.json
└── tsconfig.json
```

---

## 4. 技术栈

| 领域 | 技术 | 版本 |
|------|------|------|
| Runtime | Node.js | 22+ |
| Package Manager | pnpm | 10.x |
| Language | TypeScript | 5.9 |
| Frontend | Next.js / React | 16 / 19 |
| API | Fastify | 5 |
| Queue | BullMQ | 5 |
| ORM | Drizzle | latest |
| Validation | Zod | 4 |
| Testing | Vitest / Playwright | latest |

---

## 5. 语言与文档

- 代码注释统一使用 **英文**。
- 面向人阅读的 Markdown 默认 **中文**，并维护英文副本（`*.en.md`）。
- 中英文不一致时以中文为准，英文必须尽快对齐。

---

## 6. 协作与执行模式

### Sub-agent 并行执行

- 主 agent 先拆任务，分配给多个 sub-agents 并行推进。
- 主会话负责汇总结果、处理依赖、最终整合。
- 除非任务极小或涉及高风险操作，否则不把重活堆在主会话。

### 自主决策边界

- Agent 自主做低价值决策，持续尝试直到问题通过。
- 只在涉及 **外部权限、不可逆风险、资金安全、产品目标不明确** 时停下请求用户拍板。

### 进度管理

- 关键保存点必须记录时间戳，便于回溯。
- 完成改动后及时 commit + push。

---

## 7. 风控基线

### 服务层硬风控（从原系统继承，按 AVE 场景调整）

| 参数 | 默认值 | 说明 |
|------|-------|------|
| `MAX_TRADE_PCT` | 15% | 单笔交易占 bankroll 上限 |
| `MAX_TOTAL_EXPOSURE_PCT` | 80% | 总敞口占 bankroll 上限 |
| `MAX_EVENT_EXPOSURE_PCT` | 30% | 单事件敞口占 bankroll 上限 |
| `MAX_POSITIONS` | 22 | 最大并行持仓数 |
| `MIN_TRADE_USD` | $5 | 最低交易金额 |
| `DRAWDOWN_STOP_PCT` | 30% | 回撤停机阈值 |

- 风控拒绝必须返回 **具体约束名称**（max_positions / total_exposure / event_exposure 等），禁止模糊的 "blocked_by_risk_cap"。
- 当内部限额导致交易低于交易所可执行门槛时，必须预警并打印双方阈值。

---

## 8. 错误输出规范

错误信息必须可执行（actionable），至少包含：

- **失败阶段**（stage）
- **核心上下文**（runId / market / token / requested USD / env）
- **原因摘要**
- **下一步命令**

错误归档统一存储在 `run-error/` 目录，按"时间戳+错误原因"命名。

---

## 9. 提交规范

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

---

## 10. Demo 优先级与视频脚本

### 核心 Demo 场景（按优先级排序）

1. **实时监控 → 信号生成**：AVE Monitoring 检测到价格异常 → Pulse 引擎生成交易信号（展示 Layer 1 → 2）
2. **自动执行 → 风控拦截**：信号触发自动下单 → 风控规则介入调整仓位（展示 Layer 2 → 3）
3. **Dashboard 全景**：实时展示持仓、信号流、风控状态、绩效曲线（展示 Layer 4）
4. **异常检测 → 止损**：Anomaly Detection 触发紧急止损流程（展示完整闭环）

### 视频脚本大纲（≤ 5 分钟）

| 时段 | 内容 | 时长 |
|------|------|------|
| 0:00 – 0:30 | 项目介绍：Hourglass 是什么、解决什么问题 | 30s |
| 0:30 – 1:30 | 架构总览：四层架构 + AVE Skill 集成方式 | 60s |
| 1:30 – 3:00 | 实机演示：场景 1 + 场景 2 连续执行 | 90s |
| 3:00 – 4:00 | Dashboard 展示：实时数据面板 | 60s |
| 4:00 – 4:45 | 商业价值：为什么 AI + AVE Claw 是 DeFi 交易的未来 | 45s |
| 4:45 – 5:00 | 总结与展望 | 15s |

### Demo 准备要点

- 必须有 **真实可运行** 的演示，不能只放录屏。
- Dashboard 需预填合理的历史数据，避免空页面。
- 演示网络环境提前测试，准备离线回退方案。

---

## 11. 终端交互偏好

- 关键流程必须在终端输出阶段信息。
- 长任务持续输出进度心跳：当前阶段 / 已耗时 / 预计剩余。
- 终端输出优先彩色、分级（`INFO / WARN / ERR / OK`）。

---

## 12. 沟通风格

- 默认使用"正常产品经理能理解"的表达。
- 先给人类 review 入口（具体文件和关键段落），再解释做了什么、效果如何。
- 讲方案时优先回答：问题是什么 → 影响什么 → 怎么处理 → 需要用户决定什么。
