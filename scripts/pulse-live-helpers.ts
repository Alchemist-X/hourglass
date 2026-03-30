import type { OverviewResponse, PublicPosition } from "@autopoly/contracts";
export {
  computeExchangeBuyMinNotionalUsd,
  isBelowExchangeBuyMinimum,
  isBelowExchangeSellMinimum
} from "../services/orchestrator/src/lib/execution-planning.ts";

export function buildPulseLiveRunIdentityRows(input: {
  executionMode: string;
  decisionStrategy: string;
}): Array<[string, string]> {
  return [
    ["Execution Mode", input.executionMode],
    ["Decision Strategy", input.decisionStrategy]
  ];
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

export function buildPulseLiveOverview(input: {
  collateralBalanceUsd: number;
  positions: PublicPosition[];
}): OverviewResponse {
  const openExposureUsd = input.positions.reduce((sum, position) => sum + position.current_value_usd, 0);
  const totalEquityUsd = roundCurrency(input.collateralBalanceUsd + openExposureUsd);

  return {
    status: "running",
    cash_balance_usd: roundCurrency(input.collateralBalanceUsd),
    total_equity_usd: totalEquityUsd,
    high_water_mark_usd: totalEquityUsd,
    drawdown_pct: 0,
    open_positions: input.positions.length,
    last_run_at: null,
    latest_risk_event: null,
    equity_curve: [
      {
        timestamp: new Date().toISOString(),
        total_equity_usd: totalEquityUsd,
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
