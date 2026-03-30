"use client";

import type { PublicTrade } from "@autopoly/contracts";
import { formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

interface PnlPoint {
  timestamp: string;
  cumulative_pnl: number;
}

/**
 * Build cumulative PNL points from trade history.
 * Each BUY is a cash outflow (negative), each SELL is a cash inflow (positive).
 * The cumulative sum represents realized cash-flow PNL over time.
 */
function buildCumulativePnlFromTrades(trades: PublicTrade[]): PnlPoint[] {
  if (trades.length === 0) {
    return [];
  }

  // Sort trades by timestamp ascending (oldest first)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp_utc).getTime() - new Date(b.timestamp_utc).getTime()
  );

  let cumulative = 0;
  const points: PnlPoint[] = [
    { timestamp: sorted[0]!.timestamp_utc, cumulative_pnl: 0 }
  ];

  for (const trade of sorted) {
    const usdcAmount = trade.filled_notional_usd;
    if (usdcAmount <= 0) {
      continue;
    }

    // BUY = spending USDC (cost), SELL = receiving USDC (proceeds)
    if (trade.side === "SELL") {
      cumulative = cumulative + usdcAmount;
    } else {
      cumulative = cumulative - usdcAmount;
    }

    points.push({
      timestamp: trade.timestamp_utc,
      cumulative_pnl: Number(cumulative.toFixed(2))
    });
  }

  return points;
}

function buildPath(points: PnlPoint[], width: number, height: number, padding: number): string {
  if (points.length === 0) {
    return "";
  }

  const values = points.map((p) => p.cumulative_pnl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const drawHeight = height - padding * 2;

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = padding + drawHeight - ((point.cumulative_pnl - min) / range) * drawHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildZeroLine(points: PnlPoint[], width: number, height: number, padding: number): number | null {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((p) => p.cumulative_pnl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const drawHeight = height - padding * 2;

  // Only show zero line if the range spans across zero
  if (min > 0 || max < 0) {
    return null;
  }

  return padding + drawHeight - ((0 - min) / range) * drawHeight;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

export function DashboardEquityChart({
  initialTrades,
  currentEquityUsd
}: {
  initialTrades: PublicTrade[];
  currentEquityUsd: number;
}) {
  const { t } = useLocale();
  const { data: trades } = usePollingJson("/api/public/trades", initialTrades);

  const points = buildCumulativePnlFromTrades(trades);

  // If we have points, also add a "current" anchor based on unrealized
  const hasData = points.length >= 2;

  const values = points.map((p) => p.cumulative_pnl);
  const high = hasData ? Math.max(...values) : 0;
  const low = hasData ? Math.min(...values) : 0;
  const latest = hasData ? (values[values.length - 1] ?? 0) : 0;
  const isUp = latest >= 0;

  const svgWidth = 720;
  const svgHeight = 240;
  const padding = 20;

  if (!hasData) {
    return (
      <section className="dash-panel dash-chart-panel dash-chart-prominent">
        <div className="dash-panel-head">
          <h2>{t.cumulative_pnl}</h2>
        </div>
        <p className="dash-empty">{t.no_trade_data}</p>
      </section>
    );
  }

  const linePath = buildPath(points, svgWidth, svgHeight, padding);
  const zeroY = buildZeroLine(points, svgWidth, svgHeight, padding);
  const fillPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Build time labels at even intervals
  const labelCount = Math.min(5, points.length);
  const labels: Array<{ x: number; text: string }> = [];
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / Math.max(1, labelCount - 1)) * (points.length - 1));
    const x = (idx / Math.max(1, points.length - 1)) * svgWidth;
    labels.push({ x, text: formatTimestamp(points[idx]!.timestamp) });
  }

  return (
    <section className="dash-panel dash-chart-panel dash-chart-prominent">
      <div className="dash-panel-head">
        <h2>{t.cumulative_pnl}</h2>
        <div className="dash-panel-meta">
          <span>{t.high} {formatUsd(high)}</span>
          <span>{t.low} {formatUsd(low)}</span>
          <span className={isUp ? "dash-positive" : "dash-negative"}>
            {isUp ? "+" : ""}{formatUsd(latest)}
          </span>
        </div>
      </div>
      <div className="dash-chart-wrap">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="dash-chart"
          role="img"
          aria-label="Cumulative P&L chart"
        >
          <defs>
            <linearGradient id="dash-pnl-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor={isUp ? "rgba(52, 211, 153, 0.30)" : "rgba(239, 68, 68, 0.30)"}
              />
              <stop
                offset="100%"
                stopColor={isUp ? "rgba(52, 211, 153, 0)" : "rgba(239, 68, 68, 0)"}
              />
            </linearGradient>
          </defs>

          {/* Zero line */}
          {zeroY != null ? (
            <line
              x1="0"
              y1={zeroY}
              x2={svgWidth}
              y2={zeroY}
              stroke="rgba(232, 236, 244, 0.12)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
          ) : null}

          {/* Fill area */}
          <path d={fillPath} fill="url(#dash-pnl-fill)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isUp ? "#34d399" : "#ef4444"}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Latest point dot */}
          {points.length > 0 ? (() => {
            const lastPt = points[points.length - 1]!;
            const allVals = points.map((p) => p.cumulative_pnl);
            const mn = Math.min(...allVals);
            const mx = Math.max(...allVals);
            const rng = Math.max(0.01, mx - mn);
            const dh = svgHeight - padding * 2;
            const cx = svgWidth;
            const cy = padding + dh - ((lastPt.cumulative_pnl - mn) / rng) * dh;
            return (
              <circle
                cx={cx}
                cy={cy}
                r="4"
                fill={isUp ? "#34d399" : "#ef4444"}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
            );
          })() : null}

          {/* Time labels along bottom */}
          {labels.map((label) => (
            <text
              key={`${label.x}-${label.text}`}
              x={label.x}
              y={svgHeight - 4}
              textAnchor="middle"
              fill="rgba(232, 236, 244, 0.3)"
              fontSize="10"
              fontFamily="var(--font-mono), monospace"
            >
              {label.text}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
