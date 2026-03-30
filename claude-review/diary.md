# Claude Diary — 工作日志与反思

持续累积每次 session 的工作记录、决策背景和教训。

---

## 2026-03-29 Session

### 完成
- 交易透明化：`applyTradeGuardsDetailed()` 返回具体约束分解
- 动态 bankroll：去掉静态 `INITIAL_BANKROLL_USD` cap，改用远程 API 实际余额
- Provider 架构：framework-free，任意 agent 可作为 provider
- Phase 1 阈值调整：7 个参数放宽
- Monthly Return 排序 + 20% batch cap
- 前端暗色仪表盘上线
- 项目架构审计、历史失败分析

### 反思
- **改动未推送 = 未完成**：所有代码改动必须 commit + push + 验证部署后才算完成
- **recommend-only ≠ 实盘下单**：测试时必须明确区分
- **先验证再扩展**：先确保一笔交易能跑通，再做架构改进
- **.env 配置是生命线**：provider 配置必须正确设置

---

## 2026-03-30 Session

### 完成
- 实盘下单成功（2 笔伊朗市场 + 1 笔 Apr 30 市场）
- Fallback 删除：deterministic fallback 导致方向完全相反的交易，已移除
- Claude Code 作为 provider 跑通完整 Pulse 渲染
- 统一模板命令（去掉 codex 特殊分支）
- `live:test:stateless` → `pulse:live` 全局重命名
- PNL 曲线改用现金流口径计算
- 中英文切换上线
- 投资理念文案更新（README + 网页）
- Polymarket 手续费研究文档
- GTC+FOK 混合下单提案
- 市场筛选 filter 功能（JSON 配置 + CLI override）
- 渲染超时 20min → 30min，报告注入耗时统计

### 反思
- **Fallback 是危险的**：跟随市场共识 + 固定上调 10% 的假 edge，导致了方向完全相反的实盘交易。AI 分析失败时必须停止而不是降级
- **手续费改变了盈利门槛**：Geopolitics = 0% 是最优类别；Crypto 往返 3.6% 意味着需要 >6% edge 才能盈利
- **渲染超时是真实问题**：Claude Code 处理 40k token prompt 需要 5-20 分钟
- **PNL 不能用权益差值**：入金会被算成利润，必须用 cash_in - cash_out + current_value

### 未完成
- 手续费集成到交易代码（仅文档，未改代码）
- 用 `--category sports/tech` 实际跑一次 recommend
- PNL 曲线历史段修复（中间点缺少未实现盈亏估值）
- VPS 定时部署（仅文档）
- 市场筛选 Phase B-D（类型权重、AI 预筛选、回报时间线）
