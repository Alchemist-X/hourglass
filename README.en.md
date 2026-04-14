# Hourglass

> Autonomous DeFi Trading Agent powered by AVE Claw Skills
>
> AVE Claw Hackathon 2026 Submission
>
> **Live Demo**: [https://hourglass-eta.vercel.app](https://hourglass-eta.vercel.app)

This is the English version of the README. The primary [README.md](README.md) is English-first with a Chinese summary section at the bottom.

For the full Chinese project guide, see [CLAUDE.md](claude.md).

---

## What is Hourglass?

Hourglass is an AI-driven autonomous trading agent that unifies AVE Claw's **Monitoring Skills** (asset tracking, price alerts, anomaly detection, contract risk scoring) with **Trading Skills** (signal generation, automated execution, portfolio management) into a single end-to-end system. It continuously scans 130+ blockchains for opportunities, generates trade signals through an AI decision engine, and executes with institutional-grade risk controls enforced at the service layer -- not as prompt suggestions, but as hard-coded rules that cannot be overridden.

Built on top of a battle-tested Polymarket trading system with 50+ live runs and real-money execution history, Hourglass adapts proven autonomous trading infrastructure to the DeFi ecosystem through deep AVE Claw API integration.

## Quick Start

```bash
git clone https://github.com/Alchemist-X/hourglass.git
cd hourglass
pnpm install
pnpm build
AUTOPOLY_EXECUTION_MODE=paper pnpm trial:recommend   # Paper mode demo
pnpm dev                                              # Start dashboard at localhost:3000
```

See the main [README.md](README.md) for full architecture details, AVE Claw integration map, risk controls, and project structure.
