# Autonomous Poly Trading

Chinese version: [README.md](README.md)

This repository is a cloud-hosted autonomous trading system for Polymarket. The goal is to build a trading agent that can run with real funds, expose live activity publicly, and enforce hard risk controls at the service layer.

The v1 scope is intentionally narrow:

- run a single real wallet
- expose a public read-only website
- keep all controls inside the admin surface
- support Claude Code first
- support OpenClaw later

## Project goals

This system is designed to solve three practical problems:

- keep the agent running continuously in the cloud instead of as a local script
- expose real positions, trade history, equity, and reports on the web
- move risk management out of prompts and into hard service-side rules

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
- `packages/contracts`
  - shared zod schemas
  - validation for `TradeDecisionSet` and related payloads
- `packages/db`
  - Drizzle schema
  - queries
  - seeds and migrations
- `vendor`
  - pinned manifest for external repositories

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

## Quick start

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

The environment variables are grouped into four logical sets:

- shared
  - database
  - Redis
  - app URL
- web
  - admin password
  - internal orchestrator token
- executor
  - private key
  - funder address
  - signature type
  - chain id
- orchestrator
  - Claude runtime command
  - schedules
  - risk parameters

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

Executor live checks:

```bash
pnpm --filter @autopoly/executor ops:check
pnpm --filter @autopoly/executor ops:check -- --slug <market-slug>
pnpm --filter @autopoly/executor ops:trade -- --slug <market-slug> --max-usd 1
```

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

As of `2026-03-13`, the repository already has:

- the monorepo structure
- public pages and admin pages
- the shared data model
- orchestrator and executor service scaffolding
- `.env.aizen` auto-discovery
- one successful capped live trade test below `$1`

See [progress.md](progress.md) for detailed progress tracking.

## Current limitations

The main current limitations are:

- Docker runtime validation has not been completed on this machine
- production deployment to Vercel and the cloud host is not done yet
- Claude Code has a runtime abstraction and integration point, but the full production decision loop still needs work
- OpenClaw is not implemented yet

## Next steps

See [todo-loop.md](todo-loop.md) for the current high-priority follow-up items.
