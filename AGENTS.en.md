# Project Collaboration Rules (Aligned to Current User Preferences)

Chinese version: [AGENTS.md](AGENTS.md)

Last updated: 2026-03-23

## 1. Language and Documentation

- Code comments must be in English.
- Human-facing Markdown defaults to Chinese, with an English copy (`*.en.md`).
- Chinese keeps the primary filename, English uses `*.en.md`.
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
- Human communication: plain language first, conclusions and impact before technical detail.
- Collaboration mode: the main agent should delegate parallelizable work to sub-agents first and keep the main session focused on integration.
- Preferred trading debug route: `live:test:stateless` first, then `live:test`.
