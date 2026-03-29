"use client";

import type { OverviewResponse } from "@autopoly/contracts";
import { formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

function statusColor(status: OverviewResponse["status"]): string {
  switch (status) {
    case "running":
      return "dash-status-running";
    case "paused":
      return "dash-status-paused";
    case "halted":
      return "dash-status-halted";
    default:
      return "";
  }
}

function statusLabel(status: OverviewResponse["status"]): string {
  switch (status) {
    case "running":
      return "Running";
    case "paused":
      return "Paused";
    case "halted":
      return "Halted";
    default:
      return status;
  }
}

function relativeTime(isoString: string | null): string {
  if (!isoString) {
    return "N/A";
  }
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  if (diffMs < 0) {
    return "just now";
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardHeader({ initialData }: { initialData: OverviewResponse }) {
  const { data, error } = usePollingJson("/api/public/overview", initialData);

  const pnlUsd = data.total_equity_usd - data.high_water_mark_usd;
  const pnlIsPositive = pnlUsd >= 0;

  return (
    <header className="dash-header">
      <div className="dash-header-row">
        <div className="dash-kpi">
          <div className="dash-kpi-item dash-kpi-equity">
            <span className="dash-kpi-label">Total Equity</span>
            <strong className="dash-kpi-value">{formatUsd(data.total_equity_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Cash</span>
            <strong className="dash-kpi-value">{formatUsd(data.cash_balance_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">HWM</span>
            <strong className="dash-kpi-value">{formatUsd(data.high_water_mark_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Drawdown</span>
            <strong className={`dash-kpi-value ${data.drawdown_pct > 0 ? "dash-negative" : ""}`}>
              {formatPct(data.drawdown_pct)}
            </strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">vs HWM</span>
            <strong className={`dash-kpi-value ${pnlIsPositive ? "dash-positive" : "dash-negative"}`}>
              {pnlIsPositive ? "+" : ""}{formatUsd(pnlUsd)}
            </strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Open Positions</span>
            <strong className="dash-kpi-value">{data.open_positions}</strong>
          </div>
        </div>
        <div className="dash-status-group">
          <div className={`dash-status-badge ${statusColor(data.status)}`}>
            <span className="dash-status-dot" />
            {statusLabel(data.status)}
          </div>
          <span className="dash-last-update">
            {error ? `Error: ${error}` : `Updated ${relativeTime(data.last_run_at)}`}
          </span>
        </div>
      </div>
    </header>
  );
}
