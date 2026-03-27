import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import type { OverviewResponse, PublicPosition, TradeDecision } from "@autopoly/contracts";
import {
  createTerminalPrinter,
  formatRatioPercent,
  formatUsd,
  getErrorMessage,
  printErrorSummary,
  shouldUseHumanOutput
} from "@autopoly/terminal-ui";
import { Wallet } from "ethers";
import { loadConfig as loadExecutorConfig } from "../services/executor/src/config.ts";
import {
  computeAvgCost,
  executeMarketOrder,
  fetchRemotePositions,
  readBook,
  type RemotePosition
} from "../services/executor/src/lib/polymarket.ts";
import { loadConfig as loadOrchestratorConfig } from "../services/orchestrator/src/config.ts";
import {
  ensureDailyPulseSnapshot,
  runDailyPulseCore
} from "../services/orchestrator/src/jobs/daily-pulse-core.ts";
import {
  buildExecutionPlan,
  shouldWarnSkippedDecision,
  type PlannedExecution,
  type SkippedDecision
} from "../services/orchestrator/src/lib/execution-planning.ts";
import { createTerminalProgressReporter } from "../services/orchestrator/src/lib/terminal-progress.ts";
import { createAgentRuntime } from "../services/orchestrator/src/runtime/runtime-factory.ts";
import { loadPulseSnapshotFromArtifacts } from "./live-test-stateless-pulse.ts";
import {
  buildStatelessRunIdentityRows,
  buildStatelessOverview,
  calculatePositionPnlPct,
  calculatePositionValueUsd
} from "./live-test-stateless-helpers.ts";
import {
  mapOverviewToSummarySnapshot,
  writeRunSummaryArtifacts
} from "./live-run-summary.ts";
import {
  mapBlockedItemToSummaryBlockedItem,
  mapDecisionToSummaryDecision,
  mapExecutedOrderToSummaryOrder,
  mapStatelessPlanToSummaryPlan
} from "./live-run-summary-builders.ts";
import {
  buildLiveRunContextRows,
  createArchiveDir,
  ensureDirectory,
  finalizeArchiveDir,
  formatTimestampToken,
  maskAddressForDisplay,
  writeJsonArtifact
} from "./live-run-common.ts";
import {
  probeCollateralBalanceUsd
} from "./live-preflight-probes.ts";

interface Args {
  json: boolean;
  recommendOnly: boolean;
  pulseJsonPath: string | null;
  pulseMarkdownPath: string | null;
}

interface PreflightReport {
  ok: boolean;
  blockingReason: string | null;
  envFilePath: string | null;
  executionMode: string;
  decisionStrategy: string;
  signerAddress: string;
  funderAddress: string;
  signerMatchesFunder: boolean | null;
  effectiveCollateralUsd: number;
  remotePositionCount: number;
  bankrollCapUsd: number;
  configuredMinTradeUsd: number;
  maxTradePct: number;
  maxEventExposurePct: number;
  collateral: {
    source: "reported" | "onchain" | "fallback";
    reportedUsd: number | null;
    onchainUsdcUsd: number | null;
    probeError: string | null;
  };
  checks: Array<{
    key: string;
    ok: boolean;
    blocking: boolean;
    summary: string;
  }>;
}

interface ExecutedOrderSummary extends PlannedExecution {
  orderId: string | null;
  ok: boolean;
  avgPrice: number | null;
  filledNotionalUsd: number;
  rawResponse: unknown;
}

class StatelessLiveError extends Error {
  constructor(
    readonly stage: string,
    message: string,
    readonly context: Array<[string, string]> = [],
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "StatelessLiveError";
  }
}

function parseArgs(argv = process.argv.slice(2)): Args {
  const get = (flag: string) => {
    const index = argv.indexOf(flag);
    const value = index >= 0 ? argv[index + 1] : undefined;
    return value && !value.startsWith("--") ? value : null;
  };
  return {
    json: argv.includes("--json"),
    recommendOnly: argv.includes("--recommend-only"),
    pulseJsonPath: get("--pulse-json"),
    pulseMarkdownPath: get("--pulse-markdown")
  };
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(4));
}

function getErrorCause(error: unknown): unknown {
  return error instanceof Error ? error.cause : undefined;
}

function getErrorRawSummary(error: unknown): string | null {
  const cause = getErrorCause(error);
  if (cause == null) {
    return null;
  }
  return getErrorMessage(cause);
}

function getPreflightBlockingReason(checks: PreflightReport["checks"]): string | null {
  return checks.find((check) => check.blocking && !check.ok)?.summary ?? null;
}

function buildArchivedPreflightReport(report: PreflightReport) {
  const gateCheckOrder = ["execution-mode", "env-file", "credentials", "collateral", "exchange-sizing"];
  const gateChecks = gateCheckOrder
    .map((key) => report.checks.find((check) => check.key === key))
    .filter((check): check is PreflightReport["checks"][number] => Boolean(check))
    .map((check) => ({
      key: check.key,
      ok: check.ok,
      blocking: check.blocking,
      detail: check.summary
    }));

  const warnings: string[] = [];
  if (report.signerMatchesFunder === false) {
    warnings.push(`Signer ${report.signerAddress} does not match wallet ${report.funderAddress}.`);
  } else if (report.signerMatchesFunder == null && report.signerAddress) {
    warnings.push("Signer and wallet alignment could not be fully verified.");
  }
  if (report.collateral.probeError) {
    warnings.push(report.collateral.probeError);
  }

  const wallet = {
    funderAddress: report.funderAddress,
    signerAddress: report.signerAddress,
    signerMatchesFunder: report.signerMatchesFunder
  };
  const collateralDiagnostics = {
    source: report.collateral.source,
    reportedUsd: report.collateral.reportedUsd,
    onchainUsdcUsd: report.collateral.onchainUsdcUsd,
    probeError: report.collateral.probeError
  };

  return {
    ok: report.ok,
    status: report.ok ? "pass" : "blocked",
    primaryConclusion: report.blockingReason
      ?? report.checks.find((check) => check.key === "collateral")?.summary
      ?? "Preflight passed.",
    liveReadiness: {
      canContinue: report.ok,
      blockingReason: report.blockingReason,
      effectiveCollateralUsd: report.effectiveCollateralUsd,
      remotePositionCount: report.remotePositionCount
    },
    execution: {
      executionMode: report.executionMode,
      decisionStrategy: report.decisionStrategy,
      envFilePath: report.envFilePath
    },
    tradingConstraints: {
      bankrollCapUsd: report.bankrollCapUsd,
      configuredMinTradeUsd: report.configuredMinTradeUsd,
      maxTradePct: report.maxTradePct,
      maxEventExposurePct: report.maxEventExposurePct,
      exchangeSizingRequired: true
    },
    gateChecks,
    ...(warnings.length > 0 ? { warnings } : {}),
    ...(report.funderAddress || report.signerAddress ? { wallet } : {}),
    ...(report.collateral.reportedUsd != null || report.collateral.onchainUsdcUsd != null || report.collateral.probeError
      ? { collateralDiagnostics }
      : {})
  };
}

async function buildRemotePublicPositions(
  executorConfig: ReturnType<typeof loadExecutorConfig>,
  remotePositions: RemotePosition[],
  stopLossPct: number
): Promise<PublicPosition[]> {
  const timestamp = new Date().toISOString();
  return Promise.all(
    remotePositions.map(async (remote) => {
      const [avgCost, book] = await Promise.all([
        computeAvgCost(executorConfig, remote.tokenId),
        readBook(executorConfig, remote.tokenId)
      ]);
      const currentPrice = book?.bestBid ?? avgCost ?? 0.5;
      const normalizedAvgCost = avgCost ?? currentPrice;
      return {
        id: randomUUID(),
        event_slug: remote.eventSlug ?? remote.marketSlug ?? remote.tokenId,
        market_slug: remote.marketSlug ?? remote.eventSlug ?? remote.tokenId,
        token_id: remote.tokenId,
        side: "BUY",
        outcome_label: remote.outcome || "Unknown",
        size: remote.size,
        avg_cost: normalizedAvgCost,
        current_price: currentPrice,
        current_value_usd: calculatePositionValueUsd(remote.size, currentPrice),
        unrealized_pnl_pct: calculatePositionPnlPct(normalizedAvgCost, currentPrice),
        stop_loss_pct: stopLossPct,
        opened_at: timestamp,
        updated_at: timestamp
      } satisfies PublicPosition;
    })
  );
}

async function runPreflight(input: {
  executorConfig: ReturnType<typeof loadExecutorConfig>;
  orchestratorConfig: ReturnType<typeof loadOrchestratorConfig>;
  recommendOnly: boolean;
}) {
  const remotePositions = await fetchRemotePositions(input.executorConfig);
  const collateralProbe = await probeCollateralBalanceUsd(input.executorConfig);
  const signerAddress = input.executorConfig.privateKey
    ? (() => {
        try {
          return new Wallet(input.executorConfig.privateKey).address;
        } catch {
          return "";
        }
      })()
    : "";
  const signerMatchesFunder =
    signerAddress &&
    input.executorConfig.funderAddress &&
    signerAddress.toLowerCase() === input.executorConfig.funderAddress.toLowerCase();
  const effectiveCollateralBalanceUsd = roundCurrency(
    collateralProbe.balanceUsd ?? input.orchestratorConfig.initialBankrollUsd
  );
  const checks = [
    {
      key: "execution-mode",
      blocking: true,
      ok: process.env.AUTOPOLY_EXECUTION_MODE === "live",
      summary: process.env.AUTOPOLY_EXECUTION_MODE === "live"
        ? "Execution mode is live."
        : `AUTOPOLY_EXECUTION_MODE must be live. Received ${process.env.AUTOPOLY_EXECUTION_MODE ?? "-"}.`
    },
    {
      key: "env-file",
      blocking: true,
      ok: Boolean(input.orchestratorConfig.envFilePath ?? input.executorConfig.envFilePath),
      summary: (input.orchestratorConfig.envFilePath ?? input.executorConfig.envFilePath)
        ? `Using env file ${(input.orchestratorConfig.envFilePath ?? input.executorConfig.envFilePath)}.`
        : "ENV_FILE is required for stateless live runs."
    },
    {
      key: "credentials",
      blocking: true,
      ok: Boolean(input.executorConfig.privateKey && input.executorConfig.funderAddress),
      summary: input.executorConfig.privateKey && input.executorConfig.funderAddress
        ? "PRIVATE_KEY and FUNDER_ADDRESS are present."
        : "Missing PRIVATE_KEY or FUNDER_ADDRESS."
    },
    {
      key: "signer-funder",
      blocking: false,
      ok: true,
      summary: !signerAddress
        ? "Unable to derive signer address from PRIVATE_KEY."
        : !input.executorConfig.funderAddress
          ? "FUNDER_ADDRESS is missing."
          : signerMatchesFunder
            ? "Signer address matches FUNDER_ADDRESS."
            : `Signer ${signerAddress} does not match FUNDER_ADDRESS ${input.executorConfig.funderAddress}. Proceeding in non-blocking mode (proxy/funder setup may be intentional).`
    },
    {
      key: "collateral",
      blocking: !input.recommendOnly,
      ok: input.recommendOnly || collateralProbe.balanceUsd == null || collateralProbe.balanceUsd > 0 || remotePositions.length > 0,
      summary: input.recommendOnly && !(collateralProbe.balanceUsd == null || collateralProbe.balanceUsd > 0 || remotePositions.length > 0)
        ? "Recommend-only mode ignores zero collateral and continues without sending live orders."
        : collateralProbe.balanceUsd == null
          ? `Collateral probe unavailable; falling back to bankroll cap ${input.orchestratorConfig.initialBankrollUsd.toFixed(2)} USD. ${collateralProbe.errorMessage ?? ""}`.trim()
        : collateralProbe.balanceUsd > 0 || remotePositions.length > 0
          ? `Collateral ${collateralProbe.balanceUsd.toFixed(2)} USD (${collateralProbe.source}) | reported ${(collateralProbe.reportedBalanceUsd ?? 0).toFixed(2)} USD | onchain ${(collateralProbe.onchainBalanceUsd ?? 0).toFixed(2)} USD | remote positions ${remotePositions.length}.`
          : `No tradable collateral and no remote positions are available. reported ${(collateralProbe.reportedBalanceUsd ?? 0).toFixed(2)} USD | onchain ${(collateralProbe.onchainBalanceUsd ?? 0).toFixed(2)} USD.`
    },
    {
      key: "exchange-sizing",
      blocking: false,
      ok: true,
      summary: "Live orders will be checked against Polymarket order-book sizing before execution."
    }
  ];

  return {
    report: {
      ok: checks.every((check) => check.ok || !check.blocking),
      blockingReason: getPreflightBlockingReason(checks),
      envFilePath: input.orchestratorConfig.envFilePath ?? input.executorConfig.envFilePath,
      executionMode: process.env.AUTOPOLY_EXECUTION_MODE ?? "live",
      decisionStrategy: input.orchestratorConfig.decisionStrategy,
      signerAddress,
      funderAddress: input.executorConfig.funderAddress,
      signerMatchesFunder: signerAddress && input.executorConfig.funderAddress
        ? signerMatchesFunder
        : null,
      effectiveCollateralUsd: effectiveCollateralBalanceUsd,
      remotePositionCount: remotePositions.length,
      bankrollCapUsd: input.orchestratorConfig.initialBankrollUsd,
      configuredMinTradeUsd: input.orchestratorConfig.minTradeUsd,
      maxTradePct: input.orchestratorConfig.maxTradePct,
      maxEventExposurePct: input.orchestratorConfig.maxEventExposurePct,
      collateral: {
        source: collateralProbe.source,
        reportedUsd: collateralProbe.reportedBalanceUsd,
        onchainUsdcUsd: collateralProbe.onchainBalanceUsd,
        probeError: collateralProbe.errorMessage
      },
      checks
    } satisfies PreflightReport,
    remotePositions,
    collateralBalanceUsd: effectiveCollateralBalanceUsd
  };
}

async function executePlans(input: {
  plans: PlannedExecution[];
  executorConfig: ReturnType<typeof loadExecutorConfig>;
  archiveDir: string;
  runId: string;
  envFilePath: string | null;
  executionMode: string;
  decisionStrategy: string;
}) {
  const executed: ExecutedOrderSummary[] = [];
  for (const plan of input.plans) {
    const result = await executeMarketOrder(input.executorConfig, {
      tokenId: plan.tokenId,
      side: plan.side,
      amount: plan.executionAmount
    });
    const summary: ExecutedOrderSummary = {
      ...plan,
      orderId: result.orderId ?? null,
      ok: result.ok,
      avgPrice: result.avgPrice ?? null,
      filledNotionalUsd: result.filledNotionalUsd,
      rawResponse: result.rawResponse
    };
    executed.push(summary);

    if (!result.ok) {
      throw new StatelessLiveError(
        "execute",
        `Order rejected for ${plan.marketSlug}.`,
        buildLiveRunContextRows({
          envFilePath: input.envFilePath,
          archiveDir: input.archiveDir,
          funderAddress: input.executorConfig.funderAddress,
          executionMode: input.executionMode,
          decisionStrategy: input.decisionStrategy,
          runId: input.runId,
          marketSlug: plan.marketSlug,
          tokenId: plan.tokenId,
          requestedUsd: plan.notionalUsd
        }),
        { cause: result.rawResponse }
      );
    }
  }
  return executed;
}

async function buildFinalPortfolioState(input: {
  executorConfig: ReturnType<typeof loadExecutorConfig>;
  orchestratorConfig: ReturnType<typeof loadOrchestratorConfig>;
}) {
  const [remotePositions, collateralBalanceUsd] = await Promise.all([
    fetchRemotePositions(input.executorConfig),
    probeCollateralBalanceUsd(input.executorConfig)
  ]);
  const positions = await buildRemotePublicPositions(
    input.executorConfig,
    remotePositions,
    input.orchestratorConfig.positionStopLossPct
  );
  const overview = buildStatelessOverview({
    collateralBalanceUsd: roundCurrency(collateralBalanceUsd.balanceUsd ?? input.orchestratorConfig.initialBankrollUsd),
    positions,
    bankrollCapUsd: input.orchestratorConfig.initialBankrollUsd
  });
  return {
    remotePositions,
    positions,
    overview,
    collateralBalanceUsd: roundCurrency(collateralBalanceUsd.balanceUsd ?? input.orchestratorConfig.initialBankrollUsd)
  };
}

function printRecommendationSummary(input: {
  executionMode: string;
  decisionStrategy: string;
  envFilePath: string | null;
  runId: string;
  archiveDir: string;
  collateralBalanceUsd: number;
  overview: OverviewResponse;
  plans: PlannedExecution[];
  skipped: SkippedDecision[];
  pulseMarkdownPath: string;
  pulseJsonPath: string;
  runtimeLogPath: string | null;
}) {
  const printer = createTerminalPrinter();
  printer.section("Stateless Recommendation", "route live:test:stateless");
  printer.table([
    ["Run ID", input.runId],
    ["Env File", input.envFilePath ?? "-"],
    ...buildStatelessRunIdentityRows({
      executionMode: input.executionMode,
      decisionStrategy: input.decisionStrategy
    }),
    ["Wallet Collateral", formatUsd(input.collateralBalanceUsd)],
    ["Effective Bankroll", formatUsd(input.overview.total_equity_usd)],
    ["Archive Dir", input.archiveDir]
  ]);
  printer.section("Planned Orders", `${input.plans.length} trade(s)`);
  if (input.plans.length === 0) {
    printer.note("warn", "No live-ready orders", "All candidate orders were removed by guardrails or Polymarket sizing checks.");
  } else {
    for (const [index, plan] of input.plans.entries()) {
      printer.note(
        "info",
        `${index + 1}. ${plan.action} ${plan.marketSlug}`,
        `${formatUsd(plan.notionalUsd)} | ${formatRatioPercent(plan.bankrollRatio)} bankroll${plan.exchangeMinNotionalUsd != null ? ` | exchange minimum ${formatUsd(plan.exchangeMinNotionalUsd)}` : ""}`
      );
      printer.line(`    ${plan.thesisMd}`);
    }
  }
  if (input.skipped.length > 0) {
    printer.section("Skipped Decisions");
    for (const item of input.skipped) {
      printer.note(shouldWarnSkippedDecision(item.reason) ? "warn" : "muted", item.marketSlug, item.reason);
    }
  }
  printer.section("Artifacts");
  printer.table([
    ["Pulse Markdown", input.pulseMarkdownPath],
    ["Pulse JSON", input.pulseJsonPath],
    ["Runtime Log", input.runtimeLogPath ?? "-"]
  ]);
}

function printExecutionSummary(input: {
  executionMode: string;
  decisionStrategy: string;
  runId: string;
  archiveDir: string;
  overview: OverviewResponse;
  executed: ExecutedOrderSummary[];
}) {
  const printer = createTerminalPrinter();
  printer.section("Stateless Execution Summary", `run ${input.runId}`);
  printer.table([
    ...buildStatelessRunIdentityRows({
      executionMode: input.executionMode,
      decisionStrategy: input.decisionStrategy
    }),
    ["Archive Dir", input.archiveDir],
    ["Cash", formatUsd(input.overview.cash_balance_usd)],
    ["Equity", formatUsd(input.overview.total_equity_usd)],
    ["Open Positions", String(input.overview.open_positions)],
    ["Drawdown", formatRatioPercent(input.overview.drawdown_pct)]
  ]);
  if (input.executed.length === 0) {
    printer.note("warn", "No live orders were sent");
    return;
  }
  for (const [index, order] of input.executed.entries()) {
    printer.note(
      order.ok ? "success" : "error",
      `${index + 1}. ${order.marketSlug}`,
      `${order.side} ${order.unit === "usd" ? formatUsd(order.executionAmount) : `${order.executionAmount.toFixed(4)} shares`} | order ${order.orderId ?? "-"}`
    );
  }
}

export async function runStatelessLiveTest(args: Args = parseArgs()) {
  process.env.ENV_FILE = process.env.ENV_FILE?.trim() || ".env.pizza";
  const reporter = createTerminalProgressReporter({
    enabled: !args.json,
    stream: args.json ? process.stderr : process.stdout
  });
  const useHumanOutput = !args.json && shouldUseHumanOutput(process.stdout);
  const orchestratorConfig = loadOrchestratorConfig();
  const executorConfig = loadExecutorConfig();
  const configuredMinTradeUsd = Math.max(0, orchestratorConfig.minTradeUsd);
  const timestamp = formatTimestampToken();
  let archiveDir = await createArchiveDir(
    path.join(orchestratorConfig.artifactStorageRoot, "live-stateless"),
    timestamp
  );
  let runId: string | null = null;
  let errorPath: string | null = null;
  let preflightPath: string | null = null;
  let recommendationPath: string | null = null;
  let executionSummaryPath: string | null = null;
  let preflightReport: PreflightReport | null = null;
  let overviewBefore: OverviewResponse | null = null;
  let overviewAfter: OverviewResponse | null = null;
  let decisionsForSummary: TradeDecision[] = [];
  let plansForSummary: PlannedExecution[] = [];
  let skippedForSummary: SkippedDecision[] = [];
  let executedForSummary: ExecutedOrderSummary[] = [];
  let promptSummary: string | null = null;
  let reasoningMd: string | null = null;
  let pulseMarkdownPath: string | null = null;
  let pulseJsonPath: string | null = null;
  let runtimeLogPath: string | null = null;
  let supplementalArtifactPaths: string[] = [];

  try {
    reporter.info("Flow: 1) preflight 2) fetch remote portfolio 3) generate pulse 4) run decision runtime 5) apply guards + exchange sizing checks 6) execute directly 7) summarize");
    const preflight = await runPreflight({
      executorConfig,
      orchestratorConfig,
      recommendOnly: args.recommendOnly
    });
    preflightReport = preflight.report;
    preflightPath = path.join(archiveDir, "preflight.json");
    await writeJsonArtifact(preflightPath, buildArchivedPreflightReport(preflight.report));
    if (useHumanOutput) {
      const printer = createTerminalPrinter();
      printer.section("Stateless Live Preflight", "route live:test:stateless");
      printer.table([
        ...buildStatelessRunIdentityRows({
          executionMode: preflight.report.executionMode,
          decisionStrategy: preflight.report.decisionStrategy
        }),
        ["Env File", preflight.report.envFilePath ?? "-"],
        ["Effective Collateral", formatUsd(preflight.report.effectiveCollateralUsd)],
        ["Remote Positions", String(preflight.report.remotePositionCount)],
        ["Bankroll Cap", formatUsd(preflight.report.bankrollCapUsd)],
        ["Configured Min Trade", formatUsd(preflight.report.configuredMinTradeUsd)],
        ["Max Trade", formatRatioPercent(preflight.report.maxTradePct)],
        ["Max Event Exposure", formatRatioPercent(preflight.report.maxEventExposurePct)],
        ["Wallet", maskAddressForDisplay(preflight.report.funderAddress)],
        ["Exchange Sizing", "Validated per Polymarket order book"]
      ]);
      if (preflight.report.blockingReason) {
        printer.note("error", "Blocking reason", preflight.report.blockingReason);
      }
      if (preflight.report.signerMatchesFunder === false) {
        printer.note(
          "warn",
          "Signer / Wallet mismatch",
          `${maskAddressForDisplay(preflight.report.signerAddress)} vs ${maskAddressForDisplay(preflight.report.funderAddress)}`
        );
      }
      if (preflight.report.collateral.reportedUsd != null || preflight.report.collateral.onchainUsdcUsd != null) {
        printer.note(
          "muted",
          "Collateral diagnostics",
          `reported ${preflight.report.collateral.reportedUsd == null ? "-" : formatUsd(preflight.report.collateral.reportedUsd)} | onchain ${preflight.report.collateral.onchainUsdcUsd == null ? "-" : formatUsd(preflight.report.collateral.onchainUsdcUsd)} | source ${preflight.report.collateral.source}`
        );
      }
      if (preflight.report.collateral.probeError) {
        printer.note("warn", "Collateral probe", preflight.report.collateral.probeError);
      }
      for (const check of preflight.report.checks) {
        printer.note(check.ok ? "success" : check.blocking ? "error" : "warn", check.key, check.summary);
      }
    }
    if (!preflight.report.ok) {
      throw new StatelessLiveError(
        "preflight",
        "Stateless live preflight failed.",
        buildLiveRunContextRows({
          envFilePath: preflight.report.envFilePath,
          archiveDir,
          funderAddress: executorConfig.funderAddress,
          executionMode: preflight.report.executionMode,
          decisionStrategy: preflight.report.decisionStrategy
        })
      );
    }

    const positions = await buildRemotePublicPositions(
      executorConfig,
      preflight.remotePositions,
      orchestratorConfig.positionStopLossPct
    );
    const overview = buildStatelessOverview({
      collateralBalanceUsd: preflight.collateralBalanceUsd,
      positions,
      bankrollCapUsd: orchestratorConfig.initialBankrollUsd
    });
    overviewBefore = overview;
    const pulseRunId = randomUUID();
    reporter.stage({
      percent: 10,
      label: "Loaded stateless portfolio context",
      detail: `${positions.length} positions | collateral ${formatUsd(preflight.collateralBalanceUsd)} | effective bankroll ${formatUsd(overview.total_equity_usd)}`
    });
    const pulse = args.pulseJsonPath
      ? await loadPulseSnapshotFromArtifacts({
          artifactStorageRoot: orchestratorConfig.artifactStorageRoot,
          pulseJsonPath: args.pulseJsonPath,
          pulseMarkdownPath: args.pulseMarkdownPath
        })
      : await ensureDailyPulseSnapshot({
          config: orchestratorConfig,
          runId: pulseRunId,
          mode: "full",
          progress: reporter
        });
    reporter.stage({
      percent: 70,
      label: args.pulseJsonPath ? "Reused pulse snapshot ready" : "Pulse snapshot ready",
      detail: `${pulse.selectedCandidates} candidates | risk flags ${pulse.riskFlags.length}`
    });
    const runtime = createAgentRuntime(orchestratorConfig);
    const coreResult = await runDailyPulseCore({
      config: orchestratorConfig,
      runtime,
      runId: pulseRunId,
      mode: "full",
      overview,
      positions,
      pulse,
      progress: reporter
    });
    const runtimeResult = coreResult.result;
    runId = coreResult.decisionSet.run_id;
    archiveDir = await finalizeArchiveDir(archiveDir, timestamp, runId);
    preflightPath = path.join(archiveDir, "preflight.json");
    runtimeLogPath = coreResult.decisionSet.artifacts.find((artifact) => artifact.kind === "runtime-log")?.path ?? null;
    supplementalArtifactPaths = coreResult.decisionSet.artifacts
      .filter((artifact) => !["pulse-report", "runtime-log"].includes(artifact.kind))
      .map((artifact) => artifact.path);
    recommendationPath = path.join(archiveDir, "recommendation.json");
    promptSummary = runtimeResult.promptSummary;
    reasoningMd = runtimeResult.reasoningMd;
    decisionsForSummary = coreResult.decisionSet.decisions;
    pulseMarkdownPath = pulse.absoluteMarkdownPath;
    pulseJsonPath = pulse.absoluteJsonPath;
    const { plans, skipped } = await buildExecutionPlan({
      decisions: coreResult.decisionSet.decisions,
      positions,
      overview,
      config: orchestratorConfig,
      minTradeUsd: configuredMinTradeUsd,
      readBook: async (tokenId) => {
        const book = await readBook(executorConfig, tokenId);
        if (!book) {
          return null;
        }
        return {
          bestAsk: book.bestAsk ?? null,
          bestBid: book.bestBid ?? null,
          minOrderSize: book.minOrderSize ?? null
        };
      }
    });
    plansForSummary = plans;
    skippedForSummary = skipped;
    await writeJsonArtifact(recommendationPath, {
      runId,
      executionMode: "live-stateless",
      envFilePath: preflight.report.envFilePath,
      collateralBalanceUsd: preflight.report.effectiveCollateralUsd,
      overview,
      pulseMarkdownPath: pulse.absoluteMarkdownPath,
      pulseJsonPath: pulse.absoluteJsonPath,
      runtimeLogPath: runtimeLogPath,
      promptSummary: runtimeResult.promptSummary,
      reasoningMd: runtimeResult.reasoningMd,
      decisions: coreResult.decisionSet.decisions,
      executablePlans: plans,
      skipped
    });

    if (useHumanOutput) {
      printRecommendationSummary({
        executionMode: preflight.report.executionMode,
        decisionStrategy: preflight.report.decisionStrategy,
        envFilePath: preflight.report.envFilePath,
        runId,
        archiveDir,
        collateralBalanceUsd: preflight.report.effectiveCollateralUsd,
        overview,
        plans,
        skipped,
        pulseMarkdownPath: pulse.absoluteMarkdownPath,
        pulseJsonPath: pulse.absoluteJsonPath,
        runtimeLogPath: runtimeLogPath
      });
    }

    if (args.recommendOnly) {
      await writeRunSummaryArtifacts({
        mode: "live:test:stateless",
        executionMode: "live",
        strategy: orchestratorConfig.decisionStrategy,
        envFilePath: preflight.report.envFilePath,
        archiveDir,
        runId,
        status: "success",
        stage: "recommend-only",
        promptSummary,
        reasoningMd,
        decisions: decisionsForSummary.map(mapDecisionToSummaryDecision),
        executablePlans: plansForSummary.map(mapStatelessPlanToSummaryPlan),
        blockedItems: skippedForSummary.map(mapBlockedItemToSummaryBlockedItem),
        portfolioBefore: mapOverviewToSummarySnapshot(overview),
        portfolioAfter: mapOverviewToSummarySnapshot(overview),
        artifacts: {
          preflightPath,
          recommendationPath,
          pulseMarkdownPath,
          pulseJsonPath,
          runtimeLogPath,
          additionalPaths: supplementalArtifactPaths
        }
      });
      const output = {
        ok: true,
        mode: "recommend-only",
        executionMode: preflight.report.executionMode,
        decisionStrategy: preflight.report.decisionStrategy,
        runId,
        archiveDir,
        recommendationPath,
        executablePlans: plans.length
      };
      if (args.json) {
        console.log(JSON.stringify(output, null, 2));
      }
      return output;
    }

    executedForSummary = await executePlans({
      plans,
      executorConfig,
      archiveDir,
      runId,
      envFilePath: preflight.report.envFilePath,
      executionMode: preflight.report.executionMode,
      decisionStrategy: preflight.report.decisionStrategy
    });
    const finalState = await buildFinalPortfolioState({
      executorConfig,
      orchestratorConfig
    });
    overviewAfter = finalState.overview;
    executionSummaryPath = path.join(archiveDir, "execution-summary.json");
    await writeJsonArtifact(executionSummaryPath, {
      runId,
      archiveDir,
      overview: finalState.overview,
      collateralBalanceUsd: finalState.collateralBalanceUsd,
      positions: finalState.positions,
      executed: executedForSummary
    });

    reporter.done(`Stateless live run completed | ${runId}`);
    if (useHumanOutput) {
      printExecutionSummary({
        executionMode: preflight.report.executionMode,
        decisionStrategy: preflight.report.decisionStrategy,
        runId,
        archiveDir,
        overview: finalState.overview,
        executed: executedForSummary
      });
    }

    await writeRunSummaryArtifacts({
      mode: "live:test:stateless",
      executionMode: "live",
      strategy: orchestratorConfig.decisionStrategy,
      envFilePath: preflight.report.envFilePath,
      archiveDir,
      runId,
      status: "success",
      stage: "completed",
      promptSummary,
      reasoningMd,
      decisions: decisionsForSummary.map(mapDecisionToSummaryDecision),
      executablePlans: plansForSummary.map(mapStatelessPlanToSummaryPlan),
      executedOrders: executedForSummary.map(mapExecutedOrderToSummaryOrder),
      blockedItems: skippedForSummary.map(mapBlockedItemToSummaryBlockedItem),
      portfolioBefore: overviewBefore ? mapOverviewToSummarySnapshot(overviewBefore) : null,
      portfolioAfter: overviewAfter ? mapOverviewToSummarySnapshot(overviewAfter) : null,
      artifacts: {
        preflightPath,
        recommendationPath,
        executionSummaryPath,
        pulseMarkdownPath,
        pulseJsonPath,
        runtimeLogPath,
        additionalPaths: supplementalArtifactPaths
      }
    });

    const output = {
      ok: true,
      executionMode: preflight.report.executionMode,
      decisionStrategy: preflight.report.decisionStrategy,
      runId,
      archiveDir,
      recommendationPath,
      executionSummaryPath,
      executedOrders: executedForSummary.length
    };
    if (args.json) {
      console.log(JSON.stringify(output, null, 2));
    }
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stage = error instanceof StatelessLiveError ? error.stage : "unknown";
    const rawSummary = getErrorRawSummary(error);
    const rawResponse = getErrorCause(error) ?? null;
    const errorContext = error instanceof StatelessLiveError
      ? error.context
      : buildLiveRunContextRows({
          envFilePath: preflightReport?.envFilePath ?? (orchestratorConfig.envFilePath ?? executorConfig.envFilePath),
          archiveDir,
          funderAddress: executorConfig.funderAddress,
          executionMode: preflightReport?.executionMode ?? (process.env.AUTOPOLY_EXECUTION_MODE ?? "live"),
          decisionStrategy: preflightReport?.decisionStrategy ?? orchestratorConfig.decisionStrategy,
          runId
        });
    errorPath = path.join(archiveDir, "error.json");
    await ensureDirectory(archiveDir);
    await writeJsonArtifact(errorPath, {
      stage,
      message,
      rawSummary,
      rawResponse,
      archiveDir,
      runId,
      context: errorContext
    });
    await writeRunSummaryArtifacts({
      mode: "live:test:stateless",
      executionMode: "live",
      strategy: orchestratorConfig.decisionStrategy,
      envFilePath: preflightReport?.envFilePath ?? null,
      archiveDir,
      runId,
      status: "failed",
      stage,
      promptSummary,
      reasoningMd,
      decisions: decisionsForSummary.map(mapDecisionToSummaryDecision),
      executablePlans: plansForSummary.map(mapStatelessPlanToSummaryPlan),
      executedOrders: executedForSummary.map(mapExecutedOrderToSummaryOrder),
      blockedItems: skippedForSummary.map(mapBlockedItemToSummaryBlockedItem),
      portfolioBefore: overviewBefore ? mapOverviewToSummarySnapshot(overviewBefore) : null,
      portfolioAfter: overviewAfter ? mapOverviewToSummarySnapshot(overviewAfter) : null,
      failure: {
        stage,
        message,
        rawSummary,
        nextSteps: [
          "Inspect error.json and recommendation.json in the stateless archive.",
          "Retry after fixing the Polymarket or provider-side failure."
        ]
      },
      artifacts: {
        preflightPath,
        recommendationPath,
        executionSummaryPath,
        errorPath,
        pulseMarkdownPath,
        pulseJsonPath,
        runtimeLogPath,
        additionalPaths: supplementalArtifactPaths
      }
    });
    if (args.json) {
      console.log(JSON.stringify({
        ok: false,
        executionMode: preflightReport?.executionMode ?? (process.env.AUTOPOLY_EXECUTION_MODE ?? "live"),
        decisionStrategy: preflightReport?.decisionStrategy ?? orchestratorConfig.decisionStrategy,
        stage,
        message,
        archiveDir,
        runId,
        errorPath
      }, null, 2));
    } else {
      printErrorSummary(createTerminalPrinter(), {
        title: "Stateless Live Test Failed",
        stage,
        error,
        rawSummary,
        context: errorContext,
        artifactDir: archiveDir,
        nextSteps: [
          "Inspect error.json and recommendation.json in the stateless archive.",
          "Retry after fixing the Polymarket or provider-side failure."
        ]
      });
    }
    return {
      ok: false,
      executionMode: preflightReport?.executionMode ?? (process.env.AUTOPOLY_EXECUTION_MODE ?? "live"),
      decisionStrategy: preflightReport?.decisionStrategy ?? orchestratorConfig.decisionStrategy,
      archiveDir,
      runId,
      errorPath
    };
  }
}

async function main() {
  const result = await runStatelessLiveTest(parseArgs());
  if (!result.ok) {
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error) => {
    printErrorSummary(createTerminalPrinter(), {
      title: "Stateless Live Test Failed",
      stage: "bootstrap",
      error,
      context: buildLiveRunContextRows({
        envFilePath: process.env.ENV_FILE?.trim() || null,
        archiveDir: "-",
        funderAddress: process.env.FUNDER_ADDRESS ?? "",
        executionMode: process.env.AUTOPOLY_EXECUTION_MODE ?? "live",
        decisionStrategy: process.env.AGENT_DECISION_STRATEGY ?? "provider-runtime"
      }),
      nextSteps: ["Inspect the stack trace above and retry after fixing the bootstrap error."]
    });
    process.exit(1);
  });
}
