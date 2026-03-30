# 项目协作约定（按当前用户偏好）

> **同步规则：** 本文件（AGENTS.md）与 CLAUDE.md 内容必须保持同步。任何一方有改动时，必须同步更新另一方。

英文版见 [AGENTS.en.md](AGENTS.en.md)。

最后更新：2026-03-29

## 1. 语言与文档

- 代码注释统一使用英文。
- 面向人阅读的 Markdown 默认中文，并维护英文副本（`*.en.md`）。
- 中文文件保留主文件名，英文文件使用 `*.en.md`。
- 如中英文内容存在不一致，以中文为准，英文必须尽快对齐中文。
- 新增或修改人类可读文档时，中文与英文必须同步更新。

## 2. 终端交互偏好

- 所有关键流程必须在可见终端输出阶段信息，允许使用subagent“静默长时间运行”，但一定要定期汇报进度。
- 长任务必须持续输出进度心跳，建议包含：
  - 当前阶段
  - 已耗时
  - 预计超时/剩余信息（若可得）
- 终端输出优先彩色、分级（`INFO/WARN/ERR/OK`）。
- 错误输出必须可执行，并按照“时间戳+错误原因”命名错误归档文件夹，统一存储在 `run-error/` 目录下，至少包含以下内容：
  - 失败阶段（stage）
  - 核心上下文（`runId/market/token/requested usd/env/artifact dir`）
  - 原因摘要
  - 下一步命令

## 3. 沟通风格偏好

- 默认使用“正常产品经理能理解”的表达，不要用黑话、空话或术语堆砌来糊弄。
- 可以使用必要的专业术语，但首次出现时要顺手解释清楚它是什么、会影响什么。
- 每次正式回复或中间进度汇报时，优先先给“人类 review 入口”：
  - 先告诉用户这次最值得人工核对的 `1-5` 个改动点在哪里
  - 优先给具体文件和关键段落，而不是先讲抽象总结
  - 在指出 review 入口后，要紧接着解释：
    - 这边具体做了什么
    - 改完后的效果如何
- 讲方案时优先回答这四件事：
  - 现在的问题是什么
  - 会影响什么
  - 准备怎么处理
  - 需要用户决定什么
- 如果必须讨论模型、推理、基础设施或交易执行细节，先给人话结论，再补技术细节。
- 避免只报名词不报结论；避免把“框架、闭环、抓手、赋能、链路、 埋点”这类词当成答案本身。

## 4. 协作与分工偏好

- 默认协作方式：主 agent 先拆任务，再分配给多个 sub-agents 并行推进；主会话负责汇总结果、处理依赖关系、做最终整合与对外沟通。
- 除非任务非常小、必须串行，或涉及高风险权限操作，否则不要把重活直接堆在主会话里。
- 默认由 agent 自主做低价值决策，并持续尝试、持续测试，直到问题真正通过；不要把明显可以自行判断的选择反复抛回给用户。
- 遇到阻塞时，先主动区分问题属于代码、环境、外部服务、权限边界，还是自己判断过于保守，再决定下一步。
- 只有在涉及外部权限、不可逆风险、资金安全，或产品目标本身不明确时，才停下来请求用户拍板。
- 默认要定期保存当前进度，不要等到整项任务结束才统一落盘；关键保存点必须记录明确时间戳，便于回溯“最近一次可恢复进度”。
- 如果距离上一次已保存或已推送的有效进度超过 `12h`，应优先整理当前可用更新并推送到远端，再继续长任务。

## 5. 交易与执行偏好

- 本仓库支持三条主链路：
  - `paper`（本地模拟，支持手动确认）
  - `pulse:live`（无 DB/Redis 依赖，优先用于快速闭环）
  - `live:test`（带 queue worker + DB/Redis 的完整生产路径）
- `Preflight` 是必经阶段，不是独立模式。
- 在 live 路径中：
  - 默认 fail-fast
  - 关键失败后应标记 halted（若该路径设计为可 halt）
  - `collateral=0 且 remote positions=0` 必须拦截（除非明确 recommend-only）
  - 当内部风控、最小交易额或仓位上限把订单压到低于 Polymarket 可执行门槛时，必须明确预警：告诉用户当前限额会让交易失败，并同时打印内部可执行上限与交易所门槛
- 决策策略支持：
  - `provider-runtime`
  - `pulse-direct`（House Direct）
- 任何一次执行都要在输出中明确当前使用的 `execution mode` 与 `decision strategy`。

## 6. 状态一致性偏好

- 本地测试应坚持单一状态源，不允许隐式切换多个 state 文件。
- paper 路径统一使用 `AUTOPOLY_LOCAL_STATE_FILE`（或约定默认路径）并在输出中打印。
- 若检测到状态文件不一致或多地址混用风险，必须明确告警并给出修复建议。

## 7. 可追溯归档

- 所有关键运行必须产出可追溯归档（preflight/recommendation/execution/error）。
- 失败时必须保留中间产物（checkpoint、temp、provider output 等）供断点续跑。
- 运行结束后必须输出归档目录与关键文件路径。

## 8. Illustration 归档目录（Human-AI Certified）

- 统一归档目录：`Illustration/`。
- 需要向用户解释或沉淀的内容（流程图、FAQ、关键机制说明、还有反思）放入该目录。
- `Illustration/` 文档同样执行双语规则：
  - 中文主文件（`*.md`）
  - 英文副本（`*.en.md`）

## 9. 当前默认执行基线

- 文档语言：中文主文件 + 英文副本。
- 终端风格：可见进度 + 彩色分级 + 可执行错误信息。
- 对人沟通：默认说人话，先给人类 review 入口，再说明做了什么、效果如何，最后补结论影响和技术细节。
- 协作方式：主 agent 默认先拆给 sub-agents 并行推进，主会话负责整合。
- 交易调试优先：`pulse:live`，再扩展到 `live:test`。

## 10. 前端预览工作流

- 当用户要求“重做网页”“明显换视觉方向”或“探索前端方案”时，默认不要只产出单一版本；应先并行给出 `3` 个本地可渲染的预览版本，供用户比较后再决定正式替换。
- 这 `3` 个版本必须在以下层面至少有 `2` 项明显不同：
  - 信息架构
  - 视觉语言
  - 首屏叙事方式
  - 数据模块优先级
- 三个版本不能只是换配色或微调间距；必须是人一眼能区分的三种方向。
- 预览阶段优先复用真实数据层或现有公开接口，不要为了做视觉稿再造一套假后端；如果必须用静态样本，要明确标注。
- 预览版本应优先放在独立本地路由或独立预览入口下，避免在用户确认前直接覆盖正式页面。
- 完成三案预览后，主 agent 必须明确向用户说明每一版：
  - 设计思路是什么
  - 更适合什么场景
  - 相比原版改进了什么
- 用户确认方向后，再把选中的版本提升为正式页面，并继续做细修、响应式和可访问性收尾。
- 只有在以下情况，才可以跳过“三案预览”直接改单版：
  - 任务非常小，只是局部修样式
  - 用户明确要求只做一个版本
  - 当前页面已被设计系统严格约束，不适合做方向探索

## 11. Vercel 部署校验

- 对 `apps/web` 的 Vercel 部署，不能只看到 CLI 返回 URL 就宣布完成；必须真实打开部署后的页面做人工可见验收。
- 每次公开部署后，主 agent 必须至少完成：
  - 打开真实部署 URL
  - 截图保存当前线上页面
  - 把线上截图和本地目标版本或用户指定参考图对比
  - 核对目标 API 是否返回了预期数据
- 如果是 spectator mode 页面，必须先检查 `POLYMARKET_PUBLIC_WALLET_ADDRESS` 与 `NEXT_PUBLIC_POLYMARKET_PUBLIC_WALLET_ADDRESS` 是否在目标环境中生效；不要假设 `production` 变量自动覆盖 `preview`。
- 如果首页本身已经是完整风格页或整页预览，必须同时检查 `layout` 是否还包着 legacy shell，避免旧 hero/导航和新首页叠在一起。
- 没做过线上截图核验前，不要对用户说”已经和本地一致”。

## 12. 风控阈值基线（2026-03-29 确认）

| 参数 | 默认值 | 说明 |
|------|-------|------|
| `PULSE_MIN_FETCHED_MARKETS` | 5000 | Pulse 抓取市场下限 |
| `PULSE_MIN_TRADEABLE_CANDIDATES` | 1 | 可交易候选最低数量 |
| `PULSE_MAX_AGE_MINUTES` | 120 | Pulse 快照有效期（分钟） |
| `MAX_TRADE_PCT` | 15% | 单笔交易占 bankroll 上限 |
| `MAX_TOTAL_EXPOSURE_PCT` | 80% | 总敞口占 bankroll 上限 |
| `MAX_EVENT_EXPOSURE_PCT` | 30% | 单事件敞口占 bankroll 上限 |
| `MAX_POSITIONS` | 22 | 最大并行持仓数 |
| `MIN_TRADE_USD` | $5 | 最低交易金额 |
| `DRAWDOWN_STOP_PCT` | 30% | 回撤停机阈值 |

- CLOB token ID 风险标志已移除（坏候选在生成阶段已过滤，不再封杀所有交易）。
- 以上为代码默认值，可通过环境变量覆盖。

## 13. Bankroll 计算规则

- **bankroll = 远程实际余额（现金 + 持仓市值）**，由 Polymarket API 动态获取。
- `INITIAL_BANKROLL_USD` 仅作为 API 不可用时的 fallback，**不作为上限 cap**。
- 禁止使用静态配置值覆盖真实 equity。

## 14. Provider 架构（Framework-Free）

- `AgentRuntimeProvider` 接受任意字符串，不限于 codex/openclaw。
- `pulse-direct` 策略下不需要任何 provider（默认 `”none”`）。
- `providers` 字段为 `Record<string, SkillProviderConfig>` 通用 map。
- 支持 Codex、Claude Code、OpenClaw 或不配置 provider。

## 15. 交易拒绝透明化

- `applyTradeGuardsDetailed()` 必须返回具体的约束分解。
- 拒绝原因必须指明具体约束名称（max_positions / total_exposure / event_exposure / max_trade_pct / liquidity_cap / min_trade）。
- 禁止使用模糊的 “blocked_by_risk_cap” 不带具体约束名称。

## 16. Monthly Return 排序与批量上限（2026-03-29）

- 每个 entry plan 计算 `monthlyReturn = edge / monthsToResolution`，按此降序排列，取 top 4。
- 每轮 Pulse 的总下注不超过 bankroll 的 **20%**，超过则等比例缩放。
- `resolutionSource` 字段标明结算日期来源：`”market”`（Polymarket 实际数据）或 `”estimated”`（缺失时用 180 天估算）。
- 短期市场（5 分钟/10 分钟涨跌）AI 没有 edge，应在筛选阶段过滤。系统应聚焦 long horizon reasoning。

## 17. 投资理念（写入网页）

- 人不能实时地盯着所有市场。
- 哪怕 AI 的能力比人类弱一些，但它在数量上和及时性上弥补了这一点。
- AI 的优势在于 long horizon reasoning + 全市场覆盖。

## 18. 部署模式目标（待实现）

- Codex/OpenClaw 部署在远程 VPS，定时执行 Pulse + 下单。
- 运行范式应为 API Key-free 的 Agentic 模式（框架驱动，非具体 API Key 驱动）。
- Pulse 报告中的回报时间线分析应由 AI 完成，不仅是机械的 edge/days 计算。
- 市场筛选阶段应加入 AI 分析，过滤无 edge 的短期市场。

## 19. 工作流反思（2026-03-29 session）

- **改动未推送 = 未完成**：所有代码改动必须 commit + push + 验证部署后才算完成。本地跑通不等于上线。
- **recommend-only ≠ 实盘下单**：测试时必须明确区分。如果目标是验证下单，必须跑不带 `--recommend-only` 的命令。
- **先验证再扩展**：在增加新功能前，应先确保现有流程能真正执行一笔交易（从 Pulse 到下单），再做架构改进。
- **.env 配置是生命线**：provider 配置（codex command、model）必须在 .env 中正确设置，否则整个链路断裂。

## 20. 部署验证规则（2026-03-30）

- 每次 push 代码更新后，必须确保 **Vercel 能部署成功**。
- 部署失败 = 改动未完成。必须修复构建错误后重新推送。
- 推荐流程：`pnpm build`（本地验证）→ `git push` → `npx vercel --prod` → 验证线上页面。
- 如果 lockfile 过期导致构建失败，先 `pnpm install --no-frozen-lockfile` 更新 lockfile 再推。
