# Autonomous Poly Trading

Chinese version: [README.md](README.md)

This repository is a cloud-hosted autonomous trading system for Polymarket. The goal is to build a trading agent that can run with real funds, expose live activity publicly, and enforce hard risk controls at the service layer.

The v1 scope is intentionally narrow:

- run a single real wallet
- expose a public read-only website
- keep all controls inside the admin surface
- support `codex` as the default skill runtime
- keep an `openclaw` skill runtime integration path ready

## Project goals

This system is designed to solve three practical problems:

- keep the agent running continuously in the cloud instead of as a local script
- expose real positions, trade history, equity, and reports on the web
- move risk management out of prompts and into hard service-side rules

## Fast Handoff For A Remote Agent

If you are taking over this repository for the first time and do not know its prior skills, progress, or chat context, use this order:

1. read this README fully
2. inspect [.env.example](.env.example) for runtime modes and dependencies
3. inspect [risk-controls.en.md](risk-controls.en.md) for hard controls
4. inspect [Illustration/trading-modes-flowchart.en.md](Illustration/trading-modes-flowchart.en.md) for execution routes
5. only then read [progress.en.md](progress.en.md) and the documents under `Illustration/` if you need more detail

If the immediate goal is only to build the project remotely, you do not need to understand every skill detail first.

## Dependency Matrix

It is easiest to understand dependencies by separating build, local stack, and live execution:

| Dependency | Required | Purpose | Notes |
| --- | --- | --- | --- |
| `git` | required | clone, vendor sync, push | any recent version |
| `Node.js >= 20` | required | workspace build and runtime | declared in the root `package.json` |
| `pnpm 10.x` | required | workspace package manager | currently pinned to `pnpm@10.28.1` |
| `TypeScript 5.9.x` | bundled | compile services and packages | installed through the workspace |
| `Docker` / `docker compose` | optional | local `Postgres + Redis` | not required for `live:test:stateless` or plain `build` |
| `Postgres 17` | optional | stateful web / orchestrator / executor flows | provided in `docker-compose.yml` |
| `Redis 8` | optional | queues, sync, background jobs | provided in `docker-compose.yml` |
| `Codex CLI` | required for pulse/runtime execution | provider runtime | not required for plain `pnpm build` |
| `OpenClaw CLI` | optional | alternate provider | not the main path today |
| Polymarket wallet credentials | required for live routes | real trading and balance checks | only needed for live execution |

Main workspace runtime dependencies:

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

## Architecture Overview

The current system is easiest to understand as four layers:

### 1. Research / Pulse layer

- generates `pulse` from Polymarket market data plus vendor skills
- writes artifacts to `runtime-artifacts/reports/pulse/...`
- acts as the research input for later decisions

### 2. Decision / Runtime layer

- orchestrator turns `pulse + portfolio context` into structured decisions
- two strategies currently exist:
  - `pulse-direct`
  - `provider-runtime`
- the project direction is currently more aligned with `pulse-direct`

### 3. Execution / Risk layer

- executor handles:
  - order placement
  - remote position sync
  - stop-loss
  - flatten
- risk controls are hard service-side rules rather than prompt instructions:
  - per-trade cap
  - per-event cap
  - total exposure cap
  - max positions
  - drawdown halt

### 4. State / Archive / UI layer

- `packages/db`
  - database schema, queries, and file-backed local state
- `runtime-artifacts/`
  - pulse, runtime-log, live runs, paper state, and rough-loop archives
- `apps/web`
  - public read-only UI plus the admin console

From an execution-path perspective, there are currently three main modes:

| Mode | Typical command | Dependencies | Purpose |
| --- | --- | --- | --- |
| `paper` | `pnpm trial:recommend` / `trial:approve` | local file state + provider runtime | local simulation with human approval |
| `live:test:stateless` | `pnpm live:test:stateless` | wallet + Polymarket + provider runtime | fastest real-fund closed loop |
| `live:test` | `pnpm live:test` | wallet + DB + Redis + queue worker | closer to the full production path |

## Repository structure

This repository is a `pnpm` monorepo with the following main parts:

- `apps/web`
  - Next.js site
  - public spectator pages and admin console
  - intended for Vercel
- `services/orchestrator`
  - agent scheduling
  - risk state management
  - periodic jobs such as backtests, resolution checks, and reviews
- `services/executor`
  - Polymarket CLOB integration
  - order execution, fill sync, and position sync
  - live ops scripts
- `services/rough-loop`
  - standalone continuous code-task runner
  - not a prerequisite for the main trading path
- `packages/contracts`
  - shared zod schemas
  - validation for `TradeDecisionSet` and related payloads
- `packages/db`
  - Drizzle schema
  - queries
  - seeds and migrations
- `packages/terminal-ui`
  - shared colored terminal output, error summaries, and table rendering
- `scripts`
  - workspace-level entrypoints for live test, stateless live, wallet env generation, and summaries
- `vendor`
  - pinned manifest for external repositories
  - external repos are locked to explicit commits here

## Website shape

The public site currently includes:

- `/`
  - overview page
  - cash, equity, and system status
- `/positions`
  - current positions
- `/trades`
  - trade history
- `/runs`
  - agent run list
- `/runs/[id]`
  - run detail
  - reasoning, logs, and decisions
- `/reports`
  - pulse, review, and resolution outputs
- `/backtests`
  - daily backtest results

The admin page supports:

- `pause`
- `resume`
- `run-now`
- `cancel-open-orders`
- `flatten`

V1 does not provide a public developer API. The site reads from the database or internal site handlers only.

## Risk rules

The current hard risk rules are:

- per-position stop loss: `30%`
- portfolio drawdown halt: `20%`
- max total exposure: `50%`
- max concurrent positions: `10`
- max single trade size: `5%` of bankroll

The first execution version uses `FOK` market orders.

This means:

- model outputs are still constrained by service-side risk checks
- once the system enters `HALTED`, no new positions should be opened
- stop-loss exits and manual flatten actions take priority over normal strategy activity

See [risk-controls.en.md](risk-controls.en.md) for the full hard-control document.

## Provider runtime

The orchestrator now runs on a provider-based runtime:

- `AGENT_RUNTIME_PROVIDER=codex|openclaw`
- `codex` and `openclaw` each have independent skill settings
- each provider can configure:
  - skill root directory
  - Chinese or English skill locale
  - the list of skills used in the current decision cycle
- the runtime no longer keeps a mock pulse fallback
- if the provider command is missing, a skill file is missing, or pulse fetch fails, the run fails closed

The current pulse storage naming is:

```text
reports/pulse/YYYY/MM/DD/pulse-<timestamp>-<runtime>-<mode>-<runId>.md
reports/pulse/YYYY/MM/DD/pulse-<timestamp>-<runtime>-<mode>-<runId>.json
```

## External repository dependencies

The current system is built around the following external repositories:

- `polymarket-trading-TUI`
  - trading terminal and CLOB wiring reference
- `polymarket-market-pulse`
  - core market recommendation and sizing input
- `alert-stop-loss-pm`
  - stop-loss logic reference
- `all-polymarket-skill`
  - references for backtesting, monitoring, and resolution tracking
- `pm-PlaceOrder`
  - execution reference and local credential source

The `vendor` directory exists so these repositories can be pinned to explicit versions instead of being pulled ad hoc at runtime.

The current `vendor/manifest.json` already pins the exact commits, so a remote agent does not need to guess external repository versions.

## Quick start

### Build-only remote bootstrap

If the only goal is to let an unfamiliar remote agent build the repository, the shortest path is:

```bash
git clone https://github.com/Alchemist-X/autonomous-poly-trading.git
cd autonomous-poly-trading
pnpm install
pnpm build
```

Notes:

- this path does not require `Docker`
- this path does not require `Codex CLI`
- this path does not require a real wallet or `.env` secrets
- this path only verifies the workspace can complete its TS / Next.js build

### Remote bootstrap for pulse / runtime execution

If the remote machine should not only build but also run pulse and recommendation flows:

```bash
cp .env.example .env
pnpm vendor:sync
```

Then fill in:

- `CODEX_COMMAND`
- `ENV_FILE` or a real `.env`
- Polymarket wallet credentials if live execution is needed

### Remote bootstrap for the full local stateful stack

If the goal is to run web + orchestrator + executor locally:

```bash
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev
```

1. Copy the env template:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Sync external vendor repositories:

```bash
pnpm vendor:sync
```

Notes:

- `pnpm build` itself does not depend on `vendor`
- but `pulse`, `trial:*`, and `live:test*` should be treated as vendor-dependent and should run after `pnpm vendor:sync`

4. Start local data services:

```bash
docker compose up -d postgres redis
```

5. Run migrations and seed data:

```bash
pnpm db:migrate
pnpm db:seed
```

6. Start the monorepo:

```bash
pnpm dev
```

Default local ports:

- web: `http://localhost:3000`
- orchestrator: `http://localhost:4001`
- executor: `http://localhost:4002`

## Environment configuration

See [.env.example](.env.example) for the full template.

If your Polymarket credentials are stored in a sibling repository, set:

```bash
ENV_FILE=../pm-PlaceOrder/.env.aizen
```

The executor and orchestrator also support auto-discovering a sibling `.env.aizen` during development.

If you explicitly set `ENV_FILE`, that file now takes precedence and overrides the default `.env*` discovery chain. Real-fund single-run tests should use a dedicated `.env.live-test`.

The environment variables are grouped into four logical sets:

- shared
  - database
  - Redis
  - app URL
  - `AUTOPOLY_EXECUTION_MODE=paper|live`
  - `AUTOPOLY_LOCAL_STATE_FILE`
- web
  - admin password
  - internal orchestrator token
- executor
  - private key
  - funder address
  - signature type
  - chain id
- orchestrator
  - provider selection
  - codex / openclaw skill settings
  - pulse fetch and storage settings
  - schedules
  - risk parameters

## Rough Loop

The repository now includes a standalone `Rough Loop` code-task continuous executor.

- Main task file: [rough-loop.md](rough-loop.md)
- Usage guide: [rough-loop-guide.en.md](rough-loop-guide.en.md)
- It continuously reads task cards, invokes `codex|openclaw`, runs verification, updates task state, and writes artifacts under `runtime-artifacts/rough-loop/`
- After each completed task, it immediately commits only the files touched by that task
- v1 only handles code tasks by default, not live trading, production deploys, or secret operations
- If you want to force-start it in the current dirty worktree, explicitly set `ROUGH_LOOP_RELAX_GUARDRAILS=1`

## Common commands

Workspace validation:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

E2E workspace:

```bash
pnpm e2e:install-browsers
pnpm e2e:local-lite
AUTOPOLY_E2E_REMOTE=1 pnpm e2e:remote-real
```

Rough Loop:

```bash
pnpm rough-loop:doctor
pnpm rough-loop:once
pnpm rough-loop:start
pnpm rough-loop:dev
pnpm rough-loop:doctor -- --json
```

Executor live checks:

```bash
pnpm --filter @autopoly/executor ops:check
pnpm --filter @autopoly/executor ops:check -- --slug <market-slug>
pnpm --filter @autopoly/executor ops:trade -- --slug <market-slug> --max-usd 1
pnpm --filter @autopoly/executor ops:check -- --json
```

Single-run live fund test:

```bash
ENV_FILE=.env.live-test pnpm live:test
ENV_FILE=.env.live-test pnpm live:test -- --json
ENV_FILE=.env.live-test pnpm live:test:stateless -- --recommend-only
ENV_FILE=.env.live-test pnpm live:test:stateless -- --json
```

In `live:test` mode:

- The flow is fixed to `preflight -> recommend -> queue execute -> sync -> summary`
- The command only continues when `AUTOPOLY_EXECUTION_MODE=live` and the dedicated env file loads successfully
- Preflight rejects missing live credentials, unavailable Redis/DB, failed Polymarket client initialization, non-empty remote positions, or existing open DB positions
- The effective bankroll is pinned to `$20`, with `MAX_TRADE_PCT<=0.1` and `MAX_EVENT_EXPOSURE_PCT<=0.3`
- Any recommendation, execution, or sync failure fails fast and writes system status to `halted`
- Artifacts are stored under `runtime-artifacts/live-test/<timestamp>-<runId>/`
- The archive always includes `preflight.json`, `recommendation.json`, and `execution-summary.json`, plus `error.json` on failure
- TTY terminals get colored stage output and error summaries; `--json` falls back to machine-readable output

In `live:test:stateless` mode:

- The flow is fixed to `preflight -> fetch remote portfolio -> pulse -> decision runtime -> guards + token cap -> direct execute -> summary`
- It does not require local `Postgres` or `Redis`; it only depends on the live wallet, Polymarket, and the provider runtime
- `--recommend-only` generates recommendations and archives only, without sending live orders
- TTY output explicitly prints the current `execution mode` and `decision strategy` in preflight, recommendation, and summary sections; `--json` output includes the same fields
- `STATELESS_MAX_BUY_TOKENS` defaults to `1`, so each `BUY` is capped to at most `1` token
- To keep one-token buys executable, the stateless path lowers the minimum trade floor to `0.01 USD` by default; you can override it with `STATELESS_MIN_TRADE_USD`
- Artifacts are stored under `runtime-artifacts/live-stateless/<timestamp>-<runId>/`

Local paper trading:

```bash
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:approve -- --latest
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend -- --json
```

In `paper` mode:

- The default state file is `runtime-artifacts/local/paper-state.json`
- `trial:recommend` generates recommendations first and persists the run as `awaiting-approval`
- A TTY terminal shows colored stage progress plus the final notional and bankroll ratio for each recommendation
- Only `trial:approve` mutates paper positions, trades, and overview state
- If the web app points to the same `AUTOPOLY_LOCAL_STATE_FILE`, `/runs`, `/positions`, and `/trades` read directly from that local file
- `--json`, non-TTY shells, CI, and `NO_COLOR=1` automatically fall back to machine-readable or colorless output

Provider trial run:

```bash
pnpm trial:run
```

Recommended first `codex` trial-run command:

```bash
CODEX_SKILLS=polymarket-market-pulse \
CODEX_SKILL_LOCALE=zh \
PROVIDER_TIMEOUT_SECONDS=0 \
PULSE_REPORT_TIMEOUT_SECONDS=0 \
CODEX_COMMAND='codex exec --skip-git-repo-check -C {{repo_root}} -s read-only --color never -c model_reasoning_effort="low" --output-schema {{schema_file}} -o {{output_file}} < {{prompt_file}}' \
pnpm trial:run
```

Notes:

- `PROVIDER_TIMEOUT_SECONDS=0` disables the decision-runtime timeout
- `PULSE_REPORT_TIMEOUT_SECONDS=0` disables the full-pulse render and pulse-research subcommand timeouts
- Non-model operational timeouts such as `PULSE_FETCH_TIMEOUT_SECONDS` remain in place so external fetches do not hang forever

## Deployment shape

Recommended deployment layout:

- `apps/web`
  - deploy to Vercel
  - use read-only Postgres credentials
- `services/orchestrator`
  - deploy to a single cloud host
- `services/executor`
  - deploy to the same cloud host
- Postgres
  - preferably managed
- Redis
  - only for backend coordination and queues

Admin actions remain inside the site and call protected orchestrator endpoints instead of being exposed publicly.

## Current status

As of `2026-03-17`, the practical completion state is:

| Subsystem | Status | Notes |
| --- | --- | --- |
| monorepo / workspace build | complete | `pnpm build`, `pnpm typecheck`, and `pnpm test` are first-class workspace operations |
| web spectator/admin UI | complete | overview, positions, trades, runs, reports, backtests, and admin pages exist |
| shared contracts / db / terminal-ui | complete | schemas, queries, local state, and terminal rendering are implemented |
| local `paper` trading | complete | recommendation, human approval, and file-backed state are connected |
| `live:test:stateless` | complete | DB-less real-fund closed loop plus archives is implemented |
| `live:test` stateful path | implemented, still being validated | queue worker, preflight, sync, and summaries exist but depend more on infra |
| real pulse fetch and archiving | complete | no mock pulse fallback in the main path |
| bilingual run summaries | complete | live runs can write Chinese + English summaries |
| Polymarket proxy wallet / signature type compatibility | complete | funder-address and signature-type handling has been clarified in the code and env flow |
| review / monitor / rebalance Markdown design | design complete | design documents exist in `Illustration/`, but full automated producers are still pending |
| resolution tracking | implemented | independent recurring capability, not the main trading entrypoint |
| backtest | basic | currently lightweight / placeholder-like |
| openclaw provider | reserved | wired, but not the primary path |
| rough-loop | separate subsystem | present and runnable, but not a prerequisite for remote build or the trading path |

If the immediate goal is only to let a remote agent build the project, the repository is already in good enough shape. The environment-sensitive pieces are:

- pulse / recommendation execution
- live wallet access
- the stateful DB/Redis-backed stack

See [progress.md](progress.md) for detailed progress tracking.

The E2E test driven development workspace lives in [E2E Test Driven Development/README.md](E2E%20Test%20Driven%20Development/README.md).

## Current limitations

The main current limitations are:

- a dedicated production deployment handbook has not been finalized yet
- `live:test` is more infra-dependent than `live:test:stateless`, so remote reproducibility is harder
- `review / monitor / rebalance` have design docs but are not yet fully connected as automatic report producers
- `backtest` is still lightweight and should not be treated as production-grade evaluation
- the `openclaw` runtime surface exists, but it is not the default recommended path today

## Next steps

See [todo-loop.md](todo-loop.md) for the current high-priority follow-up items.
