# Autonomous Poly Trading

英文版见 [README.en.md](README.en.md)。

这是一个面向 Polymarket 的云端自主交易系统仓库，目标是做出一套可以真实运行、可公开围观、并且具备硬风控约束的交易 Agent。

第一版的定位很明确：

- 只跑一个真钱包实例
- 网站对外公开，只读围观
- 管理操作只在站内管理员页面可用
- 默认支持 `codex` skill runtime
- 预留 `openclaw` skill runtime 接口

## 项目目标

这个系统希望同时解决三件事：

- 让 Agent 可以在云端持续运行，而不是只在本地脚本里临时执行
- 让第三方用户可以在网页上看到真实仓位、交易历史、净值和报告
- 把风控从提示词里拿出来，变成服务层的硬规则

## 给远程 Agent 的最短接手路径

如果你是第一次接手这个仓库，且之前不了解这里的 skills、进度和历史上下文，建议按下面的顺序理解：

1. 读完本 README
2. 查看 [.env.example](.env.example) 了解运行模式和依赖
3. 查看 [risk-controls.md](risk-controls.md) 了解硬风控
4. 查看 [Illustration/trading-modes-flowchart.md](Illustration/trading-modes-flowchart.md) 了解执行路径
5. 需要更细设计时，再看 [progress.md](progress.md) 和 `Illustration/` 下的说明文档

如果目标只是“远程把项目 build 起来”，并不需要先理解全部 skill 细节。

## 依赖矩阵

建议按“构建 / 本地运行 / 真正跑策略”来理解依赖：

| 依赖 | 是否必需 | 用途 | 备注 |
| --- | --- | --- | --- |
| `git` | 必需 | clone、vendor sync、推送代码 | 任意较新版本即可 |
| `Node.js >= 20` | 必需 | monorepo 构建与运行 | 根 `package.json` 已声明 |
| `pnpm 10.x` | 必需 | workspace 包管理 | 当前锁定 `pnpm@10.28.1` |
| `TypeScript 5.9.x` | 已内置 | 构建 TS 服务和包 | 随 workspace 安装 |
| `Docker` / `docker compose` | 可选 | 跑本地 `Postgres + Redis` | `live:test:stateless` 和纯 `build` 不要求 |
| `Postgres 17` | 可选 | stateful web / orchestrator / executor | `docker-compose.yml` 已提供 |
| `Redis 8` | 可选 | queue、sync、后台任务 | `docker-compose.yml` 已提供 |
| `Codex CLI` | 跑 pulse/runtime 时必需 | provider runtime | 纯 `pnpm build` 不要求 |
| `OpenClaw CLI` | 可选 | 备用 provider | 当前不是主路径 |
| Polymarket 钱包凭据 | live 路径必需 | 真钱下单或余额检查 | 仅 live 路径需要 |

工作区内主要运行时依赖如下：

- `apps/web`
  - `next@16.1.6`
  - `react@19.2.0`
  - `react-dom@19.2.0`
- `services/orchestrator`
  - `fastify@5.8.2`
  - `bullmq@5.71.0`
  - `ioredis@5.10.0`
  - `drizzle-orm@0.45.1`
  - `dotenv@17.2.3`
  - `node-cron@4.2.1`
- `services/executor`
  - `@polymarket/clob-client@5.8.0`
  - `ethers@5.7.2`
  - `fastify@5.8.2`
  - `bullmq@5.71.0`
  - `ioredis@5.10.0`
  - `drizzle-orm@0.45.1`
- `packages/db`
  - `postgres@3.4.8`
  - `drizzle-orm@0.45.1`
  - `drizzle-kit@0.31.9`
- `packages/contracts`
  - `zod@4.1.12`

## 整体架构

建议把当前系统理解成四层：

### 1. Research / Pulse 层

- 从 Polymarket 市场列表和 vendor skills 中生成 `pulse`
- 产物写入 `runtime-artifacts/reports/pulse/...`
- 这是所有后续决策的研究输入

### 2. Decision / Runtime 层

- orchestrator 负责把 `pulse + portfolio context` 转成结构化决策
- 当前主路径默认是：
  - `pulse-direct`
- 同时保留一个 legacy 对照入口：
  - `pulse-direct`
  - `provider-runtime`
- `provider-runtime` 仍可用，但不再是默认主路径

### 3. Execution / Risk 层

- executor 负责：
  - 下单
  - sync 远端仓位
  - stop-loss
  - flatten
- 风控不依赖提示词，而是在服务层硬裁剪：
  - 单笔上限
  - 事件暴露上限
  - 总暴露上限
  - 最大持仓数
  - 回撤 halt

### 4. State / Archive / UI 层

- `packages/db`
  - DB schema、查询与 file-backed local state
- `runtime-artifacts/`
  - pulse、runtime-log、live runs、paper state、rough-loop 等归档
- `apps/web`
  - 公开只读展示和管理员控制台

从运行路径看，当前仓库主要有三种模式：

| 模式 | 典型命令 | 依赖 | 用途 |
| --- | --- | --- | --- |
| `paper` | `pnpm trial:recommend` / `trial:approve` | 本地文件状态 + daily pulse core | 本地模拟与人工确认 |
| `live:test:stateless` | `pnpm live:test:stateless` | 钱包 + Polymarket + daily pulse core | 最快的真钱闭环 |
| `live:test` | `pnpm live:test` | 钱包 + DB + Redis + queue worker + daily pulse core | 更接近完整生产链路 |

## 仓库结构

本仓库是一个 `pnpm` monorepo，主要分为以下几部分：

- `apps/web`
  - Next.js 网站
  - 用于公开围观页和管理员控制台
  - 目标部署平台是 Vercel
- `services/orchestrator`
  - 负责调度 Agent 运行
  - 负责风控状态管理
  - 负责 backtest、resolution、review 等周期任务
- `services/executor`
  - 负责对接 Polymarket CLOB
  - 负责下单、成交同步、仓位同步
  - 负责 live ops 脚本
- `services/rough-loop`
  - 独立的代码任务持续执行器
  - 不是主交易链路的前置条件
- `packages/contracts`
  - 共享的 zod schema
  - 用来约束 `TradeDecisionSet` 等结构化数据
- `packages/db`
  - Drizzle schema
  - 数据查询
  - 种子数据与迁移
- `packages/terminal-ui`
  - 统一的终端彩色输出、错误摘要和表格渲染
- `scripts`
  - live test、stateless live、wallet env、summary 等工作区级入口脚本
- `vendor`
  - 外部依赖仓库的固定清单
  - 用于把外部 repo 锁到特定 commit

## 网站形态

公开围观页当前规划和实现的页面包括：

- `/`
  - 总览页
  - 展示资金、净值、系统状态等信息
- `/positions`
  - 当前持仓
- `/trades`
  - 历史成交
- `/runs`
  - Agent 运行列表
- `/runs/[id]`
  - 单次运行详情
  - 包括 reasoning、日志、决策等
- `/reports`
  - pulse、review、resolution 结果
- `/backtests`
  - 每日回测结果

管理员页面提供以下操作：

- `pause`
- `resume`
- `run-now`
- `cancel-open-orders`
- `flatten`

第一版不提供对外开发者 API。网站只读数据库或走站内内部接口，不做公开可集成的 API 产品。

## 风控规则

当前已经明确的硬风控包括：

- 单仓止损：`30%`
- 总体资金回撤停机：`20%`
- 最大总敞口：`50%`
- 最大并发持仓数：`10`
- 单笔最大下单比例：资金的 `5%`

执行层首版统一使用 `FOK` 市价单。

这意味着：

- 即使模型想下单，服务层仍然会做风控裁剪
- 进入 `HALTED` 状态后，不允许继续新开仓
- 止损和人工 flatten 的优先级高于常规策略动作

完整规则见 [risk-controls.md](risk-controls.md)。

## Provider Runtime

当前 orchestrator 已经切到 provider-based runtime：

- `AGENT_RUNTIME_PROVIDER=codex|openclaw`
- `codex` 和 `openclaw` 都有独立的 skill 配置
- skill 可配置：
  - skill 根目录
  - 中文或英文 locale
  - 参与本轮决策的 skill 列表
- 当前不再保留 mock pulse fallback
- 如果 provider 命令缺失、skill 文件缺失或 pulse 抓取失败，运行会直接 fail-closed

当前默认的 pulse 存储命名为：

```text
reports/pulse/YYYY/MM/DD/pulse-<timestamp>-<runtime>-<mode>-<runId>.md
reports/pulse/YYYY/MM/DD/pulse-<timestamp>-<runtime>-<mode>-<runId>.json
```

## 外部仓库依赖

当前系统围绕以下外部仓库进行集成：

- `polymarket-trading-TUI`
  - 作为交易终端和 CLOB 接线参考
- `polymarket-market-pulse`
  - 作为下注建议和仓位建议的核心输入
- `alert-stop-loss-pm`
  - 作为止损逻辑参考
- `all-polymarket-skill`
  - 提供 backtesting、monitor、resolution tracking 等能力参考
- `pm-PlaceOrder`
  - 作为下单参考和本地凭据来源

`vendor` 目录的作用，是把这些外部依赖锁定在明确版本，而不是在运行时临时拉代码。

当前 `vendor/manifest.json` 已锁定具体 commit，因此远端 Agent 不需要自己猜外部依赖版本。

## 快速开始

### 只验证能否远程 build

如果目标只是让一个陌生 Agent 在远端把项目 build 起来，最短命令是：

```bash
git clone https://github.com/Alchemist-X/autonomous-poly-trading.git
cd autonomous-poly-trading
pnpm install
pnpm build
```

说明：

- 这条路径不要求 `Docker`
- 这条路径不要求 `Codex CLI`
- 这条路径不要求真钱包或 `.env` 凭据
- 这条路径只验证 workspace 能否完成 TS / Next.js 构建

### 远程准备能运行 pulse / runtime

如果远端不仅要 build，还要能跑 pulse 和 recommendation，请继续做：

```bash
cp .env.example .env
pnpm vendor:sync
```

然后补齐：

- `CODEX_COMMAND`
- `ENV_FILE` 或真实 `.env`
- 必要时的 Polymarket wallet 凭据

### 远程准备完整 stateful 本地栈

如果目标是启动完整 web + orchestrator + executor 本地栈，再继续：

```bash
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev
```

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 安装依赖：

```bash
pnpm install
```

3. 同步外部 vendor 仓库：

```bash
pnpm vendor:sync
```

说明：

- `pnpm build` 本身不依赖 `vendor` 目录
- 但只要你要跑 `pulse`、`trial:*`、`live:test*`，就应先执行 `pnpm vendor:sync`

4. 启动本地数据服务：

```bash
docker compose up -d postgres redis
```

5. 执行数据库迁移并写入初始数据：

```bash
pnpm db:migrate
pnpm db:seed
```

6. 启动整个 monorepo：

```bash
pnpm dev
```

本地默认端口：

- web：`http://localhost:3000`
- orchestrator：`http://localhost:4001`
- executor：`http://localhost:4002`

## 环境变量说明

完整模板见 [.env.example](.env.example)。

如果你的 Polymarket 凭据放在相邻仓库里，可以在 `.env` 中设置：

```bash
ENV_FILE=../pm-PlaceOrder/.env.aizen
```

当前 executor 和 orchestrator 都支持在开发环境自动发现相邻目录中的 `.env.aizen`。

如果你显式设置了 `ENV_FILE`，现在会优先加载这个文件并覆盖默认 `.env*` 发现结果。真实资金单次测试建议固定使用独立的 `.env.live-test`。

环境变量大致分为四组：

- shared
  - 数据库
  - Redis
  - App URL
  - `AUTOPOLY_EXECUTION_MODE=paper|live`
  - `AUTOPOLY_LOCAL_STATE_FILE`
- web
  - 管理员密码
  - orchestrator 内部 token
- executor
  - 私钥
  - funder address
  - signature type
  - chain id
- orchestrator
  - provider 选择
  - codex / openclaw skill 设置
  - pulse 抓取与存储参数
  - 调度周期
  - 风控参数

## Rough Loop

现在仓库已经内置了一个独立的 `Rough Loop` 代码任务持续执行器。

- 主入口文档是 [rough-loop.md](rough-loop.md)
- 使用说明见 [rough-loop-guide.md](rough-loop-guide.md)
- 它会持续读取任务卡片、调用 `codex|openclaw`、执行验证、更新状态，并把产物写入 `runtime-artifacts/rough-loop/`
- 每次任务完成后，它会立即提交本轮任务实际触碰到的文件
- 首版默认只处理代码任务，不处理真实交易、生产部署和私钥操作
- 如果你要在当前脏工作树里强行启动，可以显式设置 `ROUGH_LOOP_RELAX_GUARDRAILS=1`

## 常用命令

工作区校验：

```bash
pnpm typecheck
pnpm test
pnpm build
```

数据库相关：

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

E2E 工作区：

```bash
pnpm e2e:install-browsers
pnpm e2e:local-lite
AUTOPOLY_E2E_REMOTE=1 pnpm e2e:remote-real
```

Rough Loop：

```bash
pnpm rough-loop:doctor
pnpm rough-loop:once
pnpm rough-loop:start
pnpm rough-loop:dev
pnpm rough-loop:doctor -- --json
```

执行层 live 检查：

```bash
pnpm --filter @autopoly/executor ops:check
pnpm --filter @autopoly/executor ops:check -- --slug <market-slug>
pnpm --filter @autopoly/executor ops:trade -- --slug <market-slug> --max-usd 1
pnpm --filter @autopoly/executor ops:check -- --json
```

真实资金单次测试：

```bash
ENV_FILE=.env.live-test pnpm live:test
ENV_FILE=.env.live-test pnpm live:test -- --json
ENV_FILE=.env.live-test pnpm live:test:stateless -- --recommend-only
ENV_FILE=.env.live-test pnpm live:test:stateless -- --json
```

在 `live:test` 模式下：

- 运行顺序固定为 `preflight -> recommend -> queue execute -> sync -> summary`
- 只有 `AUTOPOLY_EXECUTION_MODE=live` 且专用 env 文件加载成功时才允许继续
- preflight 会拒绝空私钥、Redis/DB 不可达、Polymarket client 初始化失败、远端地址已有持仓、或数据库里已有未平仓状态
- 本轮有效 bankroll 固定要求为 `$20`，并要求 `MAX_TRADE_PCT<=0.1`、`MAX_EVENT_EXPOSURE_PCT<=0.3`
- 任一推荐、下单或 sync 关键错误都会 fail fast，并把系统状态写成 `halted`
- 产物统一写到 `runtime-artifacts/live-test/<timestamp>-<runId>/`
- 归档目录至少包含 `preflight.json`、`recommendation.json`、`execution-summary.json`，失败时额外写 `error.json`
- TTY 终端会输出彩色阶段和错误摘要；`--json` 会退回机器可读结果

在 `live:test:stateless` 模式下：

- 运行顺序固定为 `preflight -> fetch remote portfolio -> pulse -> decision runtime -> guards + token cap -> direct execute -> summary`
- 不依赖本地 `Postgres` 或 `Redis`，只依赖 live wallet、Polymarket 和 provider runtime
- `--recommend-only` 只生成推荐和归档，不会真实下单
- TTY 终端会在 preflight、recommendation 和 summary 中明确打印当前 `execution mode` 与 `decision strategy`；`--json` 输出同样包含这两个字段
- `STATELESS_MAX_BUY_TOKENS` 默认是 `1`，每笔 `BUY` 最多只买 `1` 个代币
- 为了让 `1 token` 买单可执行，stateless 路径默认把最小交易额降到 `0.01 USD`；也可以显式设置 `STATELESS_MIN_TRADE_USD`
- 产物统一写到 `runtime-artifacts/live-stateless/<timestamp>-<runId>/`

本地 paper 测试盘：

```bash
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:approve -- --latest
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend -- --json
```

在 `paper` 模式下：

- 默认状态文件路径是 `runtime-artifacts/local/paper-state.json`
- `trial:recommend` 会先生成推荐并把 run 写成 `awaiting-approval`
- TTY 终端会显示带颜色的阶段进度、最终金额和 bankroll 比例
- 只有 `trial:approve` 才会把 paper 持仓、成交和总览写回状态文件
- 如果 web 也使用同一个 `AUTOPOLY_LOCAL_STATE_FILE`，`/runs`、`/positions`、`/trades` 会直接反映这份本地状态
- `--json`、非 TTY、CI 和 `NO_COLOR=1` 会自动退回机器可读或无颜色输出

试运行 provider runtime：

```bash
pnpm trial:run
```

推荐首次 `codex` 试运行参数：

```bash
CODEX_SKILLS=polymarket-market-pulse \
CODEX_SKILL_LOCALE=zh \
PROVIDER_TIMEOUT_SECONDS=0 \
PULSE_REPORT_TIMEOUT_SECONDS=0 \
CODEX_COMMAND='codex exec --skip-git-repo-check -C {{repo_root}} -s read-only --color never -c model_reasoning_effort="low" --output-schema {{schema_file}} -o {{output_file}} < {{prompt_file}}' \
pnpm trial:run
```

说明：

- `PROVIDER_TIMEOUT_SECONDS=0` 表示 decision runtime 不设超时
- `PULSE_REPORT_TIMEOUT_SECONDS=0` 表示 pulse 渲染与 pulse research 子命令不设超时
- 目前保留 `PULSE_FETCH_TIMEOUT_SECONDS` 等非模型推理超时，避免外部抓取永久挂死

## 部署形态

推荐部署方式如下：

- `apps/web`
  - 部署到 Vercel
  - 使用只读 Postgres 凭据
- `services/orchestrator`
  - 部署到单台云主机
- `services/executor`
  - 部署到同一台云主机
- Postgres
  - 建议使用托管数据库
- Redis
  - 仅供后台任务和队列使用

管理员操作保持在站内，通过受保护的内部接口调用 orchestrator，不向公众暴露。

## 当前状态

截至 `2026-03-17`，建议把当前完成度理解成下面这张表：

| 子系统 | 状态 | 说明 |
| --- | --- | --- |
| monorepo / workspace 构建 | 已完成 | `pnpm build`、`pnpm typecheck`、`pnpm test` 已具备基础工作区支持 |
| web 围观页 / 管理页 | 已完成 | 首页、持仓、成交、runs、reports、backtests、admin 页面已存在 |
| shared contracts / db / terminal-ui | 已完成 | schema、查询、本地 state、终端渲染都已落地 |
| `paper` 本地测试盘 | 已完成 | 推荐、人工确认、file-backed state 已打通 |
| `live:test:stateless` | 已完成 | 无 DB/Redis 的真钱闭环与归档已打通 |
| `live:test` stateful 路径 | 已实现，持续验证中 | queue worker、preflight、sync、summary 已存在，但更依赖远端基础设施 |
| pulse 真实抓取与归档 | 已完成 | 不再依赖 mock pulse fallback |
| bilingual run summaries | 已完成 | live 路径每轮可生成中英总结 |
| Polymarket proxy wallet / signature type 兼容 | 已完成 | `FUNDER_ADDRESS` 与 `SIGNATURE_TYPE` 兼容逻辑已澄清 |
| review / monitor / rebalance 报告 | 已完成并接入主链路 | 现在会随 daily pulse / live 运行一起写入 artifact |
| resolution tracking | 已实现 | 属于独立周期能力，不是主交易入口 |
| backtest | 已接入统一 artifact 层 | 当前仍是轻量版，但已输出中英双语 artifact |
| openclaw provider | 预留 | 接口存在，但不是当前主路径 |
| rough-loop | 独立子系统 | 存在且可运行，但不是远程 build 主前置条件 |

如果你只是让远程 Agent “先把项目 build 起来”，当前完成度已经足够。真正需要额外环境的是：

- pulse / recommendation 运行
- live wallet 访问
- DB/Redis 的 stateful 本地栈

更详细的实现进度见 [progress.md](progress.md)。

端到端测试驱动开发工作区见 [E2E Test Driven Development/README.md](E2E%20Test%20Driven%20Development/README.md)。

## 当前限制

目前仍有以下限制：

- 完整生产部署说明还没有收敛成单独 deploy handbook
- `live:test` 比 `live:test:stateless` 更依赖远端基础设施，远程复现成本更高
- `provider-runtime` 仍保留为 legacy 路径，后续会继续弱化
- `backtest` 当前仍是轻量版，不适合作为生产级评估结论
- `openclaw` 运行接口已预留，但不是当前默认推荐路径

## 后续规划

接下来的高优先级事项见 [todo-loop.md](todo-loop.md)。
