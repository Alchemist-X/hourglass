import type { OverviewResponse, PublicPosition } from "@autopoly/contracts";

export function buildStatelessRunIdentityRows(input: {
  executionMode: string;
  decisionStrategy: string;
}): Array<[string, string]> {
  return [
    ["Execution Mode", input.executionMode],
    ["Decision Strategy", input.decisionStrategy]
  ];
}

export function shouldClampHighConfidenceOpen(confidence: "low" | "medium" | "medium-high" | "high") {
  return confidence === "medium-high" || confidence === "high";
}

export function resolveOpenExecutionSizing(input: {
  confidence: "low" | "medium" | "medium-high" | "high";
  decisionNotionalUsd: number;
  configuredMinTradeUsd: number;
  exchangeMinNotionalUsd: number | null;
}) {
  const clampToExecutableMinimum = shouldClampHighConfidenceOpen(input.confidence)
    && input.exchangeMinNotionalUsd != null
    && input.exchangeMinNotionalUsd > 0;
  return {
    requestedForGuardsUsd: clampToExecutableMinimum
      ? Math.max(input.decisionNotionalUsd, input.exchangeMinNotionalUsd ?? 0)
      : input.decisionNotionalUsd,
    minTradeUsdForGuards: clampToExecutableMinimum ? 0 : input.configuredMinTradeUsd,
    clampToExecutableMinimum
  };
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

export function computeExchangeBuyMinNotionalUsd(input: {
  bestAsk: number | null;
  minOrderSize: number | null;
}) {
  if (!(input.bestAsk != null && input.bestAsk > 0) || !(input.minOrderSize != null && input.minOrderSize > 0)) {
    return null;
  }
  return roundCurrency(input.bestAsk * input.minOrderSize);
}

export function isBelowExchangeBuyMinimum(input: {
  notionalUsd: number;
  bestAsk: number | null;
  minOrderSize: number | null;
}) {
  const minNotionalUsd = computeExchangeBuyMinNotionalUsd({
    bestAsk: input.bestAsk,
    minOrderSize: input.minOrderSize
  });
  if (!(minNotionalUsd != null && minNotionalUsd > 0)) {
    return false;
  }
  return input.notionalUsd < minNotionalUsd;
}

export function isBelowExchangeSellMinimum(input: {
  size: number;
  minOrderSize: number | null;
}) {
  if (!(input.minOrderSize != null && input.minOrderSize > 0)) {
    return false;
  }
  return input.size < input.minOrderSize;
}

export function buildStatelessOverview(input: {
  collateralBalanceUsd: number;
  positions: PublicPosition[];
  bankrollCapUsd: number;
}): OverviewResponse {
  const openExposureUsd = input.positions.reduce((sum, position) => sum + position.current_value_usd, 0);
  const actualTotalEquityUsd = roundCurrency(input.collateralBalanceUsd + openExposureUsd);
  const effectiveBankrollUsd = roundCurrency(
    Math.min(
      input.bankrollCapUsd,
      actualTotalEquityUsd > 0 ? actualTotalEquityUsd : input.bankrollCapUsd
    )
  );

  return {
    status: "running",
    cash_balance_usd: roundCurrency(input.collateralBalanceUsd),
    total_equity_usd: effectiveBankrollUsd,
    high_water_mark_usd: effectiveBankrollUsd,
    drawdown_pct: 0,
    open_positions: input.positions.length,
    last_run_at: null,
    latest_risk_event: null,
    equity_curve: [
      {
        timestamp: new Date().toISOString(),
        total_equity_usd: effectiveBankrollUsd,
        drawdown_pct: 0
      }
    ]
  };
}

export function calculatePositionValueUsd(size: number, currentPrice: number) {
  return roundCurrency(size * currentPrice);
}

export function calculatePositionPnlPct(avgCost: number, currentPrice: number) {
  if (!(avgCost > 0)) {
    return 0;
  }
  return roundMetric((currentPrice - avgCost) / avgCost);
}
