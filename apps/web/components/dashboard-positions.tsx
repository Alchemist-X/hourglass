"use client";

import type { PublicPosition } from "@autopoly/contracts";
import {
  calculatePositionCostBasisUsd,
  calculatePositionUnrealizedPnlPct,
  calculatePositionUnrealizedPnlUsd,
  calculatePositionWeightPct,
  calculatePortfolioMarketValueUsd
} from "../lib/account-metrics";
import { formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

function timeHeld(openedAt: string): string {
  const now = Date.now();
  const opened = new Date(openedAt).getTime();
  const diffMs = now - opened;
  if (diffMs < 0) {
    return "just now";
  }
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) {
    const minutes = Math.floor(diffMs / 60000);
    return minutes < 1 ? "< 1m" : `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function DashboardPositions({ initialData, totalEquityUsd }: { initialData: PublicPosition[]; totalEquityUsd: number }) {
  const { data } = usePollingJson("/api/public/positions", initialData);
  const marketValueUsd = calculatePortfolioMarketValueUsd(data);
  const profitableCount = data.filter((p) => calculatePositionUnrealizedPnlUsd(p) >= 0).length;

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>Open Positions</h2>
        <div className="dash-panel-meta">
          <span>{data.length} open</span>
          <span className="dash-positive">{profitableCount} profitable</span>
          <span>{formatUsd(marketValueUsd)} market value</span>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="dash-empty">No open positions.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Shares</th>
                <th>Entry</th>
                <th>Current</th>
                <th>Cost Basis</th>
                <th>Value</th>
                <th>Unreal. PnL</th>
                <th>PnL %</th>
                <th>Weight</th>
                <th>Held</th>
              </tr>
            </thead>
            <tbody>
              {data.map((position) => {
                const pnlUsd = calculatePositionUnrealizedPnlUsd(position);
                const pnlPct = calculatePositionUnrealizedPnlPct(position);
                const costBasis = calculatePositionCostBasisUsd(position);
                const weight = calculatePositionWeightPct(position, totalEquityUsd);
                const isProfit = pnlUsd >= 0;

                return (
                  <tr key={position.id}>
                    <td data-label="Market">
                      <strong className="dash-cell-title">{position.market_slug}</strong>
                      <span className="dash-cell-sub">{position.outcome_label}</span>
                    </td>
                    <td data-label="Side">{position.side}</td>
                    <td data-label="Shares">{position.size.toFixed(2)}</td>
                    <td data-label="Entry">{position.avg_cost.toFixed(3)}</td>
                    <td data-label="Current">{position.current_price.toFixed(3)}</td>
                    <td data-label="Cost Basis">{formatUsd(costBasis)}</td>
                    <td data-label="Value">{formatUsd(position.current_value_usd)}</td>
                    <td data-label="Unreal. PnL" className={isProfit ? "dash-positive" : "dash-negative"}>
                      {isProfit ? "+" : ""}{formatUsd(pnlUsd)}
                    </td>
                    <td data-label="PnL %" className={isProfit ? "dash-positive" : "dash-negative"}>
                      {isProfit ? "+" : ""}{formatPct(pnlPct)}
                    </td>
                    <td data-label="Weight">{formatPct(weight)}</td>
                    <td data-label="Held">{timeHeld(position.opened_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
