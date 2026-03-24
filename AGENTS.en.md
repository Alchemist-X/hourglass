# Project Collaboration Rules (Aligned to Current User Preferences)

Chinese version: [AGENTS.md](AGENTS.md)

Last updated: 2026-03-24

## 1. Language and Documentation

- Code comments must be in English.
- Human-facing Markdown defaults to Chinese, with an English copy (`*.en.md`).
- Chinese keeps the primary filename, English uses `*.en.md`.
- If the Chinese and English versions diverge, the Chinese version is the source of truth and the English version must be brought back into alignment.
- Any update to human-facing docs must update both language versions.

## 2. Terminal Interaction Preferences

- Every critical workflow must print visible stage output in the terminal.
- Long-running tasks must emit heartbeat progress updates, ideally including:
  - current stage
  - elapsed time
  - timeout/ETA (if available)
- Terminal output should be colorful and leveled (`INFO/WARN/ERR/OK`).
- Errors must be actionable and include at least:
  - failure stage
  - key context (`runId/market/token/requested usd/env/artifact dir`)
  - concise cause
  - next command(s)

## 3. Communication Style Preferences

- Default to language that a normal product manager can understand; do not hide behind jargon, buzzwords, or vague technical phrasing.
- Necessary technical terms are allowed, but explain them the first time they appear: what they mean and what they affect.
- Every substantive reply or progress update should start with a human review entry point:
  - first point out the `1-5` most important places worth manual review
  - prefer concrete files and key sections before abstract summary
  - immediately after the review entry point, explain:
    - what was changed
    - what effect the change had
- When describing a plan, answer these four things first:
  - what the problem is
  - what it affects
  - how it will be handled
  - what the user needs to decide
- If model, inference, infrastructure, or trading execution details matter, give the plain-English conclusion first and technical detail second.
- Avoid reporting nouns without a conclusion. Terms like "framework," "loop," "leverage point," or "pipeline" are not substitutes for an answer.

## 4. Collaboration and Delegation Preferences

- Default collaboration mode: the main agent should decompose the work first, then delegate suitable parts to sub-agents to run in parallel; the main session is responsible for coordination, dependency handling, final integration, and user-facing communication.
- Do not keep heavy execution in the main session unless the task is trivial, must be sequential, or involves high-risk privileged operations.
- The agent should make low-value decisions autonomously and keep trying and testing until the issue is actually resolved; do not keep pushing obviously decidable choices back to the user.
- When something is blocked, first determine whether the issue comes from code, environment, external services, permission boundaries, or overly conservative judgment before deciding what to do next.
- Stop and ask the user only when the task requires external permission, carries irreversible risk, affects fund safety, or the product goal itself is genuinely unclear.

## 5. Trading and Execution Preferences

- Three main paths are supported:
  - `paper` (local simulation with manual confirmation support)
  - `live:test:stateless` (fast loop, no DB/Redis dependency)
  - `live:test` (production-like path with queue worker + DB/Redis)
- `Preflight` is a mandatory stage, not a standalone mode.
- On live paths:
  - default behavior is fail-fast
  - critical failures should halt the system when designed to do so
  - `collateral=0` and `remote positions=0` must be blocked (unless explicitly recommend-only)
  - when internal risk limits, minimum trade sizing, or position caps push an order below Polymarket's executable threshold, print an explicit warning that the trade will fail and show both the internal executable cap and the exchange threshold
- Decision strategies:
  - `provider-runtime`
  - `pulse-direct` (House Direct)
- Every run should print both `execution mode` and `decision strategy`.

## 6. State Consistency Preferences

- Local testing should use a single state source; no silent state-file switching.
- Paper path should use `AUTOPOLY_LOCAL_STATE_FILE` (or the agreed default) and print it.
- If state inconsistency or multi-address mix-up is detected, print an explicit warning and fix guidance.

## 7. Traceable Artifacts

- Every key run must archive traceable outputs (preflight/recommendation/execution/error).
- On failure, preserve intermediate artifacts (checkpoint/temp/provider output) for resume.
- At run end, always print archive directory and key artifact paths.

## 8. Illustration Archive (Human-AI Certified)

- Unified archive directory: `Illustration/`.
- User-facing explanations (flowcharts, FAQ, mechanism notes) should be stored there.
- Docs inside `Illustration/` must also follow bilingual policy:
  - Chinese primary (`*.md`)
  - English copy (`*.en.md`)

## 9. Current Default Baseline

- Documentation: Chinese primary + English copy.
- Terminal UX: visible progress + color levels + actionable errors.
- Human communication: start with a human review entry point, then explain what changed and what effect it had, and only then add conclusions, impact, and technical detail.
- Collaboration mode: the main agent should delegate parallelizable work to sub-agents first and keep the main session focused on integration.
- Preferred trading debug route: `live:test:stateless` first, then `live:test`.

## 10. Frontend Preview Workflow

- When the user asks to "redo the site", explore clearly different UI directions, or substantially rethink the frontend, do not default to a single version. The agent should first produce `3` locally renderable preview variants so the user can compare them before any production replacement.
- These `3` variants must differ in at least `2` of the following:
  - information architecture
  - visual language
  - first-screen narrative
  - priority/order of data modules
- The three variants must not be mere color swaps or spacing tweaks. They should read as three clearly distinct directions at a glance.
- During preview work, reuse the real data layer or existing public APIs whenever possible. Do not create a fake backend just for mock visuals. If static samples are necessary, label them explicitly.
- Preview variants should live under separate local routes or a dedicated preview entry, instead of replacing the production page before the user chooses a direction.
- After generating the three previews, the main agent must explain for each one:
  - what the design idea is
  - what scenario it fits best
  - what it improves relative to the original version
- Once the user picks a direction, only then should the chosen variant be promoted to the formal page and followed by detailed polish, responsive cleanup, and accessibility finishing.
- The agent may skip the three-variant preview workflow only when:
  - the task is very small and only involves local styling fixes
  - the user explicitly requests a single version only
  - the existing page is tightly constrained by a strict design system and not suitable for direction exploration

## 11. Vercel Deployment Verification

- For `apps/web` deployments to Vercel, do not treat the CLI URL alone as proof of success; the deployed page must be opened and visually verified.
- After every public deployment, the main agent must at minimum:
  - open the real deployed URL
  - capture a screenshot of the live page
  - compare that screenshot against the intended local version or the user-selected reference image
  - verify that the target API is returning the expected data
- For spectator mode pages, first verify that `POLYMARKET_PUBLIC_WALLET_ADDRESS` and `NEXT_PUBLIC_POLYMARKET_PUBLIC_WALLET_ADDRESS` are actually active in the target environment; do not assume `production` variables automatically cover `preview`.
- If the homepage is already a full custom page or full-screen preview, also inspect whether `layout` is still wrapping it in the legacy shell, to avoid stacking the old hero/navigation on top of the new homepage.
- Do not tell the user "it matches local" before that live screenshot verification has been done.
