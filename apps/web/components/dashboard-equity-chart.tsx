"use client";

import { formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

interface EquitySnapshot {
  timestamp: string;
  total_equity_usd: number;
  cash_usd: number;
  positions_value_usd: number;
  open_positions: number;
}

function buildPath(
  values: readonly number[],
  width: number,
  height: number,
  padding: number
): string {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const drawHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = padding + drawHeight - ((value - min) / range) * drawHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
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
  initialEquityHistory
}: {
  initialEquityHistory: EquitySnapshot[];
}) {
  const { t } = useLocale();
  const { data: equityHistory } = usePollingJson<EquitySnapshot[]>(
    "/equity-history.json",
    initialEquityHistory,
    30_000 // poll every 30s (static file, no need to be aggressive)
  );

  const hasData = equityHistory.length >= 2;

  if (!hasData) {
    return (
      <section className="dash-panel dash-chart-panel dash-chart-prominent">
        <div className="dash-panel-head">
          <h2>{t.equity_curve}</h2>
        </div>
        <p className="dash-empty">{t.no_equity_data}</p>
      </section>
    );
  }

  const equityValues = equityHistory.map((s) => s.total_equity_usd);
  const high = Math.max(...equityValues);
  const low = Math.min(...equityValues);
  const latest = equityValues[equityValues.length - 1] ?? 0;
  const initial = equityValues[0] ?? 0;
  const pnl = Number((latest - initial).toFixed(2));
  const isUp = pnl >= 0;

  const svgWidth = 720;
  const svgHeight = 240;
  const padding = 20;

  const linePath = buildPath(equityValues, svgWidth, svgHeight, padding);
  const fillPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Build time labels at even intervals
  const labelCount = Math.min(5, equityHistory.length);
  const labels: Array<{ x: number; text: string }> = [];
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor(
      (i / Math.max(1, labelCount - 1)) * (equityHistory.length - 1)
    );
    const x = (idx / Math.max(1, equityHistory.length - 1)) * svgWidth;
    labels.push({ x, text: formatTimestamp(equityHistory[idx]!.timestamp) });
  }

  // Compute last point coordinates for the dot
  const allMin = Math.min(...equityValues);
  const allMax = Math.max(...equityValues);
  const allRange = Math.max(0.01, allMax - allMin);
  const drawHeight = svgHeight - padding * 2;
  const lastCx = svgWidth;
  const lastCy =
    padding + drawHeight - ((latest - allMin) / allRange) * drawHeight;

  return (
    <section className="dash-panel dash-chart-panel dash-chart-prominent">
      <div className="dash-panel-head">
        <h2>{t.equity_curve}</h2>
        <div className="dash-panel-meta">
          <span>
            {t.high} {formatUsd(high)}
          </span>
          <span>
            {t.low} {formatUsd(low)}
          </span>
          <span className={isUp ? "dash-positive" : "dash-negative"}>
            {t.pnl_label} {isUp ? "+" : ""}
            {formatUsd(pnl)}
          </span>
        </div>
      </div>
      <div className="dash-chart-wrap">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="dash-chart"
          role="img"
          aria-label="Equity curve chart"
        >
          <defs>
            <linearGradient id="dash-equity-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor={
                  isUp
                    ? "rgba(52, 211, 153, 0.30)"
                    : "rgba(239, 68, 68, 0.30)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  isUp ? "rgba(52, 211, 153, 0)" : "rgba(239, 68, 68, 0)"
                }
              />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <path d={fillPath} fill="url(#dash-equity-fill)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isUp ? "#34d399" : "#ef4444"}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Latest point dot */}
          <circle
            cx={lastCx}
            cy={lastCy}
            r="4"
            fill={isUp ? "#34d399" : "#ef4444"}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
          />

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
