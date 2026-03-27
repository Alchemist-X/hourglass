import type {
  Artifact,
  OverviewResponse,
  PublicPosition,
  TradeDecision,
  TradeDecisionSet
} from "@autopoly/contracts";
import type { OrchestratorConfig } from "../config.js";
import type { PulseSnapshot } from "../pulse/market-pulse.js";
import type { PositionReviewResult, PulseEntryPlan } from "../runtime/decision-metadata.js";
import {
  buildArtifactRelativePath,
  writeStoredMarkdownPair
} from "./artifacts.js";

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatExecutionAmount(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function estimatePreRiskOpenUsd(decision: TradeDecision): number {
  if (decision.action !== "open") {
    return decision.notional_usd;
  }
  return decision.liquidity_cap_usd != null
    ? Math.min(decision.notional_usd, decision.liquidity_cap_usd)
    : decision.notional_usd;
}

function buildEntryLineZh(plan: PulseEntryPlan) {
  const liquidityCappedUsd = plan.liquidityCapUsd != null
    ? Math.min(plan.decision.notional_usd, plan.liquidityCapUsd)
    : plan.decision.notional_usd;
  const parts = [
    `- ${plan.marketSlug}`,
    `1/4 Kelly ${formatPct(plan.quarterKellyPct)} -> ${formatUsd(plan.decision.notional_usd)}`
  ];
  if (plan.liquidityCapUsd != null) {
    parts.push(`流动性上限 ${formatUsd(plan.liquidityCapUsd)}`);
    if (liquidityCappedUsd + 1e-9 < plan.decision.notional_usd) {
      parts.push(`流动性裁剪后 ${formatUsd(liquidityCappedUsd)}`);
    }
  }
  if (plan.reportedSuggestedPct != null) {
    parts.push(`Pulse 报告仓位 ${formatPct(plan.reportedSuggestedPct)}`);
  }
  parts.push(`理由：${plan.thesisMd}`);
  return parts.join(" | ");
}

function buildEntryLineEn(plan: PulseEntryPlan) {
  const liquidityCappedUsd = plan.liquidityCapUsd != null
    ? Math.min(plan.decision.notional_usd, plan.liquidityCapUsd)
    : plan.decision.notional_usd;
  const parts = [
    `- ${plan.marketSlug}`,
    `Quarter Kelly ${formatPct(plan.quarterKellyPct)} -> ${formatUsd(plan.decision.notional_usd)}`
  ];
  if (plan.liquidityCapUsd != null) {
    parts.push(`liquidity cap ${formatUsd(plan.liquidityCapUsd)}`);
    if (liquidityCappedUsd + 1e-9 < plan.decision.notional_usd) {
      parts.push(`after liquidity clip ${formatUsd(liquidityCappedUsd)}`);
    }
  }
  if (plan.reportedSuggestedPct != null) {
    parts.push(`Pulse markdown size ${formatPct(plan.reportedSuggestedPct)}`);
  }
  parts.push(`reason: ${plan.thesisMd}`);
  return parts.join(" | ");
}

function describeDecisionAmountZh(decision: TradeDecision) {
  if (decision.action === "open") {
    const preRiskOpenUsd = estimatePreRiskOpenUsd(decision);
    return preRiskOpenUsd + 1e-9 < decision.notional_usd
      ? `1/4 Kelly ${formatUsd(decision.notional_usd)} -> 流动性裁剪后 ${formatUsd(preRiskOpenUsd)}`
      : `1/4 Kelly ${formatUsd(decision.notional_usd)}`;
  }
  if (decision.execution_unit === "shares" && decision.execution_amount != null) {
    const parts = [`影响 ${formatUsd(decision.notional_usd)}`];
    if (decision.position_value_usd != null) {
      parts.push(`当前仓位 ${formatUsd(decision.position_value_usd)}`);
    }
    parts.push(`执行 ${formatExecutionAmount(decision.execution_amount)} shares`);
    return parts.join(" | ");
  }
  return formatUsd(decision.notional_usd);
}

function describeDecisionAmountEn(decision: TradeDecision) {
  if (decision.action === "open") {
    const preRiskOpenUsd = estimatePreRiskOpenUsd(decision);
    return preRiskOpenUsd + 1e-9 < decision.notional_usd
      ? `Quarter Kelly ${formatUsd(decision.notional_usd)} -> after liquidity clip ${formatUsd(preRiskOpenUsd)}`
      : `Quarter Kelly ${formatUsd(decision.notional_usd)}`;
  }
  if (decision.execution_unit === "shares" && decision.execution_amount != null) {
    const parts = [`impact ${formatUsd(decision.notional_usd)}`];
    if (decision.position_value_usd != null) {
      parts.push(`current position ${formatUsd(decision.position_value_usd)}`);
    }
    parts.push(`execute ${formatExecutionAmount(decision.execution_amount)} shares`);
    return parts.join(" | ");
  }
  return formatUsd(decision.notional_usd);
}

function summarizeActions(decisions: TradeDecision[]) {
  const counts = {
    open: 0,
    close: 0,
    reduce: 0,
    hold: 0,
    skip: 0
  };
  for (const decision of decisions) {
    counts[decision.action] += 1;
  }
  return counts;
}

function buildEventExposureMap(positions: PublicPosition[]) {
  const exposure = new Map<string, number>();
  for (const position of positions) {
    exposure.set(position.event_slug, (exposure.get(position.event_slug) ?? 0) + position.current_value_usd);
  }
  return exposure;
}

function applyDecisionExposureDelta(
  before: Map<string, number>,
  positions: PublicPosition[],
  decisions: TradeDecision[]
) {
  const after = new Map(before);
  const setExposure = (eventSlug: string, value: number) => {
    if (value <= 0) {
      after.delete(eventSlug);
      return;
    }
    after.set(eventSlug, value);
  };
  for (const decision of decisions) {
    if (decision.action === "open") {
      setExposure(decision.event_slug, (after.get(decision.event_slug) ?? 0) + estimatePreRiskOpenUsd(decision));
      continue;
    }
    if (decision.action === "close") {
      const current = positions.find((position) => position.token_id === decision.token_id)?.current_value_usd ?? 0;
      setExposure(decision.event_slug, Math.max(0, (after.get(decision.event_slug) ?? 0) - current));
      continue;
    }
    if (decision.action === "reduce") {
      setExposure(decision.event_slug, Math.max(0, (after.get(decision.event_slug) ?? 0) - decision.notional_usd));
    }
  }
  return after;
}

function topEntries(exposure: Map<string, number>, limit = 5) {
  return [...exposure.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

function buildReviewMarkdown(input: {
  overview: OverviewResponse;
  positions: PublicPosition[];
  pulse: PulseSnapshot;
  decisionSet: TradeDecisionSet;
  promptSummary: string;
  reasoningMd: string;
  positionReviews?: PositionReviewResult[];
  entryPlans?: PulseEntryPlan[];
}) {
  const counts = summarizeActions(input.decisionSet.decisions);
  const keyDecisions = input.decisionSet.decisions.filter((decision) => decision.action !== "hold").slice(0, 6);
  const positionReviews = input.positionReviews ?? [];
  const entryPlans = input.entryPlans ?? [];
  const reviewLinesZh = positionReviews.length === 0
    ? ["- 当前没有独立的已有仓位复审结果。"]
    : positionReviews.map((review) =>
        `- ${review.position.market_slug} | 结论 ${review.action} | 仍有 edge：${review.stillHasEdge ? "是" : "否"} | edge=${review.edgeValue.toFixed(4)} | Pulse 覆盖：${review.pulseCoverage} | 人工复核：${review.humanReviewFlag ? "是" : "否"} | 归因：${review.basis} | ${review.reviewConclusion} | 原因：${review.reason}`
      );
  const reviewLinesEn = positionReviews.length === 0
    ? ["- No standalone existing-position review results were produced."]
    : positionReviews.map((review) =>
        `- ${review.position.market_slug} | action ${review.action} | still has edge: ${review.stillHasEdge ? "yes" : "no"} | edge=${review.edgeValue.toFixed(4)} | pulse coverage: ${review.pulseCoverage} | human review: ${review.humanReviewFlag ? "yes" : "no"} | basis: ${review.basis} | ${review.reviewConclusion} | reason: ${review.reason}`
      );
  const entryLinesZh = entryPlans.length === 0
    ? ["- 本轮没有新的开仓建议。"]
    : entryPlans.slice(0, 6).map(buildEntryLineZh);
  const entryLinesEn = entryPlans.length === 0
    ? ["- No new entry suggestions were produced in this run."]
    : entryPlans.slice(0, 6).map(buildEntryLineEn);

  const zh = [
    "# 组合复盘报告",
    "",
    "## 本轮概览",
    "",
    `- 运行 ID：${input.decisionSet.run_id}`,
    `- 决策运行时：${input.decisionSet.runtime}`,
    `- 脉冲候选数：${input.pulse.selectedCandidates}`,
    `- 当前持仓数：${input.positions.length}`,
    `- 现金：${formatUsd(input.overview.cash_balance_usd)}`,
    `- 净值：${formatUsd(input.overview.total_equity_usd)}`,
    "",
    "## 动作统计",
    "",
    `- open：${counts.open}`,
    `- close：${counts.close}`,
    `- reduce：${counts.reduce}`,
    `- hold：${counts.hold}`,
    `- skip：${counts.skip}`,
    "",
    "## 已有仓位复审结果",
    "",
    ...reviewLinesZh,
    "",
    "## 新开仓建议",
    "",
    "> 口径：这里先展示程序内重算的 1/4 Kelly 目标，并单列流动性上限；live 执行时仍会继续套用仓位上限、事件敞口、最小交易额和交易所门槛。",
    "",
    ...entryLinesZh,
    "",
    "## 关键决策与原因",
    "",
    ...(keyDecisions.length === 0
      ? ["- 本轮没有非 hold 决策。"]
      : keyDecisions.map((decision) => `- ${decision.action} ${decision.market_slug} | ${describeDecisionAmountZh(decision)} | ${decision.thesis_md}`)),
    "",
    "## 模型反思",
    "",
    `- Prompt 摘要：${input.promptSummary}`,
    `- 推理摘要：${input.reasoningMd.replaceAll("\n", " | ")}`,
    `- Pulse 风险标记：${input.pulse.riskFlags.length === 0 ? "无" : input.pulse.riskFlags.join("；")}`,
    ""
  ].join("\n");

  const en = [
    "# Portfolio Review Report",
    "",
    "## Run Overview",
    "",
    `- Run ID: ${input.decisionSet.run_id}`,
    `- Runtime: ${input.decisionSet.runtime}`,
    `- Pulse candidates: ${input.pulse.selectedCandidates}`,
    `- Current positions: ${input.positions.length}`,
    `- Cash: ${formatUsd(input.overview.cash_balance_usd)}`,
    `- Equity: ${formatUsd(input.overview.total_equity_usd)}`,
    "",
    "## Action Counts",
    "",
    `- open: ${counts.open}`,
    `- close: ${counts.close}`,
    `- reduce: ${counts.reduce}`,
    `- hold: ${counts.hold}`,
    `- skip: ${counts.skip}`,
    "",
    "## Existing Position Review Results",
    "",
    ...reviewLinesEn,
    "",
    "## New Entry Suggestions",
    "",
    "> Basis: this section shows the programmatic quarter-Kelly target first and lists any liquidity cap separately. Live execution may still clip further for bankroll, exposure, minimum trade size, and exchange thresholds.",
    "",
    ...entryLinesEn,
    "",
    "## Key Decisions and Reasons",
    "",
    ...(keyDecisions.length === 0
      ? ["- No non-hold decisions were produced in this run."]
      : keyDecisions.map((decision) => `- ${decision.action} ${decision.market_slug} | ${describeDecisionAmountEn(decision)} | ${decision.thesis_md}`)),
    "",
    "## Model Reflection",
    "",
    `- Prompt summary: ${input.promptSummary}`,
    `- Reasoning summary: ${input.reasoningMd.replaceAll("\n", " | ")}`,
    `- Pulse risk flags: ${input.pulse.riskFlags.length === 0 ? "none" : input.pulse.riskFlags.join("; ")}`,
    ""
  ].join("\n");

  return { zh, en };
}

function buildMonitorMarkdown(input: {
  overview: OverviewResponse;
  positions: PublicPosition[];
  pulse: PulseSnapshot;
}) {
  const negativePositions = input.positions
    .filter((position) => position.unrealized_pnl_pct < 0)
    .sort((left, right) => left.unrealized_pnl_pct - right.unrealized_pnl_pct)
    .slice(0, 5);
  const nearStopLoss = input.positions.filter((position) => position.unrealized_pnl_pct <= -(position.stop_loss_pct * 0.7));

  const zh = [
    "# 组合监控报告",
    "",
    "## 当前快照",
    "",
    `- 系统状态：${input.overview.status}`,
    `- 净值：${formatUsd(input.overview.total_equity_usd)}`,
    `- 回撤：${formatPct(input.overview.drawdown_pct)}`,
    `- 未平仓数量：${input.overview.open_positions}`,
    "",
    "## 风险观察",
    "",
    `- Pulse 风险标记：${input.pulse.riskFlags.length === 0 ? "无" : input.pulse.riskFlags.join("；")}`,
    `- 接近止损仓位：${nearStopLoss.length}`,
    "",
    "## 重点盯防仓位",
    "",
    ...(negativePositions.length === 0
      ? ["- 当前没有浮亏仓位。"]
      : negativePositions.map((position) => `- ${position.market_slug} | 浮盈亏 ${formatPct(position.unrealized_pnl_pct)} | 止损 ${formatPct(position.stop_loss_pct)}`)),
    ""
  ].join("\n");

  const en = [
    "# Portfolio Monitor Report",
    "",
    "## Current Snapshot",
    "",
    `- System status: ${input.overview.status}`,
    `- Equity: ${formatUsd(input.overview.total_equity_usd)}`,
    `- Drawdown: ${formatPct(input.overview.drawdown_pct)}`,
    `- Open positions: ${input.overview.open_positions}`,
    "",
    "## Risk Observations",
    "",
    `- Pulse risk flags: ${input.pulse.riskFlags.length === 0 ? "none" : input.pulse.riskFlags.join("; ")}`,
    `- Positions near stop loss: ${nearStopLoss.length}`,
    "",
    "## Positions to Watch",
    "",
    ...(negativePositions.length === 0
      ? ["- There are no losing positions right now."]
      : negativePositions.map((position) => `- ${position.market_slug} | unrealized PnL ${formatPct(position.unrealized_pnl_pct)} | stop loss ${formatPct(position.stop_loss_pct)}`)),
    ""
  ].join("\n");

  return { zh, en };
}

function buildRebalanceMarkdown(input: {
  overview: OverviewResponse;
  positions: PublicPosition[];
  decisionSet: TradeDecisionSet;
}) {
  const before = buildEventExposureMap(input.positions);
  const after = applyDecisionExposureDelta(before, input.positions, input.decisionSet.decisions);
  const beforeRows = topEntries(before);
  const afterRows = topEntries(after);

  const zh = [
    "# 再平衡报告",
    "",
    "> 口径：基于当前持仓 + 本轮决策提案估算结构变化；在 recommend-only / preview 链路中，这不等于实际成交后的账户状态。",
    "",
    "## 结构变化",
    "",
    `- 运行前事件敞口数：${before.size}`,
    `- 运行后事件敞口数：${after.size}`,
    `- 当前净值基准：${formatUsd(input.overview.total_equity_usd)}`,
    `- 敞口占比口径：事件敞口 / ${formatUsd(input.overview.total_equity_usd)}`,
    "",
    "## 这些数字怎么来的",
    "",
    "- 运行前事件敞口数：按当前持仓里的 event_slug 去重后计数。",
    "- 运行后事件敞口数：在运行前的事件敞口基础上，按本轮决策做一遍假设增减后的去重计数。",
    "- open：按 1/4 Kelly 目标与 liquidity_cap_usd 取更小值后，加到对应 event_slug；还未扣除后续 live 风控裁剪。",
    "- close：按该 token 当前持仓市值，从对应 event_slug 扣减。",
    "- reduce：按 decision.notional_usd 从对应 event_slug 扣减。",
    "- 当前净值基准：直接使用 overview.total_equity_usd。",
    "",
    "## 运行前 Top 事件敞口",
    "",
    ...(beforeRows.length === 0
      ? ["- 空组合。"]
      : beforeRows.map(([eventSlug, exposure]) => `- ${eventSlug} | ${formatUsd(exposure)} | ${formatPct(input.overview.total_equity_usd > 0 ? exposure / input.overview.total_equity_usd : 0)}`)),
    "",
    "## 运行后 Top 事件敞口",
    "",
    ...(afterRows.length === 0
      ? ["- 空组合。"]
      : afterRows.map(([eventSlug, exposure]) => `- ${eventSlug} | ${formatUsd(exposure)} | ${formatPct(input.overview.total_equity_usd > 0 ? exposure / input.overview.total_equity_usd : 0)}`)),
    ""
  ].join("\n");

  const en = [
    "# Rebalance Report",
    "",
    "> Basis: this is a proposal-based structure view built from current positions plus this run's decisions. On recommend-only / preview flows, it is not the same as the post-fill account state.",
    "",
    "## Structure Change",
    "",
    `- Event exposures before run: ${before.size}`,
    `- Event exposures after run: ${after.size}`,
    `- Equity baseline: ${formatUsd(input.overview.total_equity_usd)}`,
    `- Exposure ratio basis: event exposure / ${formatUsd(input.overview.total_equity_usd)}`,
    "",
    "## How These Numbers Are Computed",
    "",
    "- Event exposures before run: count distinct event_slug values in the current positions.",
    "- Event exposures after run: count distinct event_slug values after applying the proposed decision deltas to the before-run map.",
    "- open: add the smaller of quarter-Kelly target and liquidity_cap_usd to the target event_slug; later live risk clipping is still excluded here.",
    "- close: subtract the current marked value of the matching token from the target event_slug.",
    "- reduce: subtract decision.notional_usd from the target event_slug.",
    "- Equity baseline: copied directly from overview.total_equity_usd.",
    "",
    "## Top Event Exposures Before",
    "",
    ...(beforeRows.length === 0
      ? ["- Empty portfolio."]
      : beforeRows.map(([eventSlug, exposure]) => `- ${eventSlug} | ${formatUsd(exposure)} | ${formatPct(input.overview.total_equity_usd > 0 ? exposure / input.overview.total_equity_usd : 0)}`)),
    "",
    "## Top Event Exposures After",
    "",
    ...(afterRows.length === 0
      ? ["- Empty portfolio."]
      : afterRows.map(([eventSlug, exposure]) => `- ${eventSlug} | ${formatUsd(exposure)} | ${formatPct(input.overview.total_equity_usd > 0 ? exposure / input.overview.total_equity_usd : 0)}`)),
    ""
  ].join("\n");

  return { zh, en };
}

async function writePortfolioArtifact(input: {
  config: Pick<OrchestratorConfig, "artifactStorageRoot">;
  kind: Artifact["kind"];
  title: string;
  publishedAtUtc: string;
  runtime: string;
  mode: string;
  runId: string;
  markdown: { zh: string; en: string };
}) {
  const relativePath = buildArtifactRelativePath({
    kind: input.kind,
    publishedAtUtc: input.publishedAtUtc,
    runtime: input.runtime,
    mode: input.mode,
    runId: input.runId,
    extension: "md"
  });

  await writeStoredMarkdownPair({
    storageRoot: input.config.artifactStorageRoot,
    relativePath,
    zhContent: input.markdown.zh,
    enContent: input.markdown.en
  });

  return {
    kind: input.kind,
    title: input.title,
    path: relativePath,
    content: input.markdown.zh,
    published_at_utc: input.publishedAtUtc
  } satisfies Artifact;
}

export async function buildPortfolioReportArtifacts(input: {
  config: Pick<OrchestratorConfig, "artifactStorageRoot">;
  overview: OverviewResponse;
  positions: PublicPosition[];
  pulse: PulseSnapshot;
  decisionSet: TradeDecisionSet;
  promptSummary: string;
  reasoningMd: string;
  positionReviews?: PositionReviewResult[];
  entryPlans?: PulseEntryPlan[];
}) {
  const publishedAtUtc = input.decisionSet.generated_at_utc;
  return Promise.all([
    writePortfolioArtifact({
      config: input.config,
      kind: "review-report",
      title: `Portfolio review ${publishedAtUtc}`,
      publishedAtUtc,
      runtime: input.decisionSet.runtime,
      mode: input.decisionSet.mode,
      runId: input.decisionSet.run_id,
      markdown: buildReviewMarkdown(input)
    }),
    writePortfolioArtifact({
      config: input.config,
      kind: "monitor-report",
      title: `Portfolio monitor ${publishedAtUtc}`,
      publishedAtUtc,
      runtime: input.decisionSet.runtime,
      mode: input.decisionSet.mode,
      runId: input.decisionSet.run_id,
      markdown: buildMonitorMarkdown(input)
    }),
    writePortfolioArtifact({
      config: input.config,
      kind: "rebalance-report",
      title: `Portfolio rebalance ${publishedAtUtc}`,
      publishedAtUtc,
      runtime: input.decisionSet.runtime,
      mode: input.decisionSet.mode,
      runId: input.decisionSet.run_id,
      markdown: buildRebalanceMarkdown(input)
    })
  ]);
}

export async function buildBacktestReportArtifact(input: {
  config: Pick<OrchestratorConfig, "artifactStorageRoot">;
  generatedAtUtc: string;
  runId: string;
  overview: OverviewResponse;
  positions: PublicPosition[];
}) {
  const avgPnl =
    input.positions.length === 0
      ? 0
      : input.positions.reduce((sum, position) => sum + position.unrealized_pnl_pct, 0) / input.positions.length;

  const markdown = {
    zh: [
      "# 回测报告",
      "",
      `- 生成时间：${input.generatedAtUtc}`,
      `- 未平仓数量：${input.positions.length}`,
      `- 组合净值：${formatUsd(input.overview.total_equity_usd)}`,
      `- 平均浮盈亏：${formatPct(avgPnl)}`,
      ""
    ].join("\n"),
    en: [
      "# Backtest Report",
      "",
      `- Generated at: ${input.generatedAtUtc}`,
      `- Open positions: ${input.positions.length}`,
      `- Portfolio equity: ${formatUsd(input.overview.total_equity_usd)}`,
      `- Average unrealized PnL: ${formatPct(avgPnl)}`,
      ""
    ].join("\n")
  };

  return writePortfolioArtifact({
    config: input.config,
    kind: "backtest-report",
    title: `Backtest ${input.generatedAtUtc}`,
    publishedAtUtc: input.generatedAtUtc,
    runtime: "daily-pulse",
    mode: "review",
    runId: input.runId,
    markdown
  });
}
