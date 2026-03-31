# Backlog — 按优先级排列的待办清单

最后更新：2026-03-31

---

## P0 — 必须立即做

（当前无 P0）

## P1 — 本轮应做

- [ ] 用 `--category tech` 和 `--category sports` 重新验证 filter（现在是前置过滤，应该能看到结果了）
- [ ] Vercel 重新部署（PNL 修复 + 最新代码）

## P2 — 下一轮

- [x] ~~Auto-redeem：到期市场自动赎回 tokens（赢家拿 USDC，输家清理持仓）~~
- [ ] VPS 定时部署：systemd timer 方案实施（文档已就绪 `claude-review/vps-scheduling-plan.md`）
- [ ] 市场筛选 Phase D：回报时间线 AI 分析（催化事件、edge 持续窗口）
- [ ] GTC + FOK 混合下单：对收费类别市场实现 Maker 限价单（提案已就绪 `claude-review/gtc-fok-hybrid-proposal.md`）
- [ ] 卖出前校验链上可用余额（而非仅用远程报告的持仓数）
- [ ] 启用 `PULSE_AI_PRESCREEN=true` 并实测效果

## P3 — 后续考虑

- [ ] Phase 2 架构简化：删除 stateful 路径、provider-runtime、BullMQ
- [ ] 简化预检：只保留凭证 + 抵押品检查
- [ ] 结构化交易日志：单个 `run-log.jsonl` 替代 8 个产物文件
- [ ] Maker 返还追踪：统计每日从 Polymarket 获得的 Maker rebate
- [ ] 多钱包支持

---

## 已完成

- [x] 手续费集成（fees.ts + netEdge 排序 + Pulse 报告显示 + CLOB 验证）
- [x] Filter 验证（sports/tech 测试）
- [x] Filter 前置到候选选择前（pre-selection filtering）
- [x] PNL 曲线修复（equity snapshots 画线 + 现金流 headline）
- [x] 市场筛选 Phase B：类型权重排序（politics/tech 1.5x, crypto 0.3x）
- [x] 市场筛选 Phase C：AI 预筛选（TRADE/SKIP，默认关闭 `PULSE_AI_PRESCREEN`）
- [x] 短期价格市场自动过滤（<7 天 crypto/stock 涨跌）
- [x] 交易透明化：`applyTradeGuardsDetailed()` 返回具体约束分解
- [x] 动态 bankroll：去掉静态 cap，用远程 API 实际余额
- [x] Framework-free provider：任意 agent 可作为 provider
- [x] Phase 1 阈值调整：7 个参数放宽
- [x] Monthly Return 排序 + 20% batch cap + resolutionSource 标注
- [x] 前端暗色仪表盘 + 中英文切换 + 投资理念板块
- [x] Vercel 部署成功
- [x] 实盘下单成功（伊朗市场 3 笔）
- [x] Fallback 删除
- [x] Claude Code provider 跑通完整 Pulse 渲染
- [x] 统一模板命令（去掉 codex 特殊分支）
- [x] `live:test:stateless` → `pulse:live` 全局重命名
- [x] PNL 曲线改用现金流口径
- [x] 渲染超时 30min + 报告注入耗时统计
- [x] Polymarket 手续费研究文档 + GTC+FOK 提案
- [x] 市场筛选 filter 功能（JSON 配置 + CLI override）
- [x] Filter 前置到候选选择前
- [x] 项目架构审计 + 历史失败分析
- [x] VPS 定时方案文档 + 市场筛选策略计划文档
