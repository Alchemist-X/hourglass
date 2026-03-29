"use client";

import type { OverviewPoint } from "@autopoly/contracts";
import { formatUsd } from "../lib/format";

function buildPath(points: OverviewPoint[], width: number, height: number): string {
  if (points.length === 0) {
    return "";
  }
  const values = points.map((p) => p.total_equity_usd);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((point.total_equity_usd - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function DashboardEquityChart({ points }: { points: OverviewPoint[] }) {
  const values = points.map((p) => p.total_equity_usd);
  const high = values.length > 0 ? Math.max(...values) : 0;
  const low = values.length > 0 ? Math.min(...values) : 0;
  const isUp = values.length > 1 && (values[values.length - 1] ?? 0) >= (values[0] ?? 0);

  if (points.length < 2) {
    return (
      <section className="dash-panel dash-chart-panel">
        <div className="dash-panel-head">
          <h2>Equity Curve</h2>
        </div>
        <p className="dash-empty">Not enough data points to render chart.</p>
      </section>
    );
  }

  return (
    <section className="dash-panel dash-chart-panel">
      <div className="dash-panel-head">
        <h2>Equity Curve</h2>
        <div className="dash-panel-meta">
          <span>High {formatUsd(high)}</span>
          <span>Low {formatUsd(low)}</span>
        </div>
      </div>
      <div className="dash-chart-wrap">
        <svg viewBox="0 0 640 200" className="dash-chart" role="img" aria-label="Equity curve chart">
          <defs>
            <linearGradient id="dash-eq-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "rgba(52, 211, 153, 0.35)" : "rgba(239, 68, 68, 0.35)"} />
              <stop offset="100%" stopColor={isUp ? "rgba(52, 211, 153, 0)" : "rgba(239, 68, 68, 0)"} />
            </linearGradient>
          </defs>
          <path d={`${buildPath(points, 640, 180)} L 640 200 L 0 200 Z`} fill="url(#dash-eq-fill)" />
          <path
            d={buildPath(points, 640, 180)}
            fill="none"
            stroke={isUp ? "#34d399" : "#ef4444"}
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </section>
  );
}
