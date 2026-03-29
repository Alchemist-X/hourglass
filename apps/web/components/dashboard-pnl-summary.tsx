"use client";

import type { PublicPosition } from "@autopoly/contracts";
import type { SpectatorClosedPosition } from "../lib/public-wallet";
import {
  calculatePortfolioCostBasisUsd,
  calculatePortfolioMarketValueUsd,
  calculatePortfolioUnrealizedPnlPct,
  calculatePortfolioUnrealizedPnlUsd,
  calculatePositionUnrealizedPnlUsd,
  getTopPositionsByContribution
} from "../lib/account-metrics";
import { formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

export function DashboardPnlSummary({
  initialPositions,
  initialClosedPositions
}: {
  initialPositions: PublicPosition[];
  initialClosedPositions: SpectatorClosedPosition[];
}) {
  const { data: positions } = usePollingJson("/api/public/positions", initialPositions);
  const { data: closedPositions } = usePollingJson<SpectatorClosedPosition[]>(
    "/api/public/closed-positions",
    initialClosedPositions
  );

  const marketValue = calculatePortfolioMarketValueUsd(positions);
  const costBasis = calculatePortfolioCostBasisUsd(positions);
  const unrealizedPnl = calculatePortfolioUnrealizedPnlUsd(positions);
  const unrealizedPnlPct = calculatePortfolioUnrealizedPnlPct(positions);
  const realizedPnl = closedPositions.reduce((sum, p) => sum + p.realized_pnl_usd, 0);
  const netPnl = realizedPnl + unrealizedPnl;
  const topPositions = getTopPositionsByContribution(positions, 5);

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>P&L Summary</h2>
      </div>
      <div className="dash-pnl-grid">
        <div className="dash-pnl-card">
          <span>Net P&L</span>
          <strong className={netPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {netPnl >= 0 ? "+" : ""}{formatUsd(netPnl)}
          </strong>
        </div>
        <div className="dash-pnl-card">
          <span>Unrealized</span>
          <strong className={unrealizedPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {unrealizedPnl >= 0 ? "+" : ""}{formatUsd(unrealizedPnl)}
          </strong>
          <small>{formatPct(unrealizedPnlPct)}</small>
        </div>
        <div className="dash-pnl-card">
          <span>Realized</span>
          <strong className={realizedPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {realizedPnl >= 0 ? "+" : ""}{formatUsd(realizedPnl)}
          </strong>
          <small>{closedPositions.length} closed markets</small>
        </div>
        <div className="dash-pnl-card">
          <span>Cost Basis</span>
          <strong>{formatUsd(costBasis)}</strong>
        </div>
        <div className="dash-pnl-card">
          <span>Market Value</span>
          <strong>{formatUsd(marketValue)}</strong>
        </div>
      </div>
      {topPositions.length > 0 ? (
        <div className="dash-top-movers">
          <h3>Top Movers</h3>
          <div className="dash-movers-list">
            {topPositions.map((position) => {
              const pnl = calculatePositionUnrealizedPnlUsd(position);
              const isProfit = pnl >= 0;
              return (
                <div key={position.id} className="dash-mover-row">
                  <div className="dash-mover-info">
                    <strong>{position.market_slug}</strong>
                    <span>{position.outcome_label}</span>
                  </div>
                  <strong className={isProfit ? "dash-positive" : "dash-negative"}>
                    {isProfit ? "+" : ""}{formatUsd(pnl)}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
