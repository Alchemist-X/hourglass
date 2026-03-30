"use client";

import type { PublicPosition } from "@autopoly/contracts";
import { formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import type { ActivityItem } from "../lib/pnl-calculator";
import { buildPnlTimeline, calculatePnl } from "../lib/pnl-calculator";
import { usePollingJson } from "../lib/use-polling";

interface SpectatorActivity {
  type: string;
  side: string | null;
  direction: string | null;
  usdc_size: number;
  share_size: number;
  price: number | null;
  market_slug: string;
  event_slug: string;
  timestamp_utc?: string;
  transaction_hash?: string | null;
}

function toActivityItem(event: SpectatorActivity): ActivityItem {
  return {
    type: event.type,
    side: event.side,
    direction: event.direction,
    usdc_size: event.usdc_size,
    share_size: event.share_size,
    price: event.price ?? 0,
    market_slug: event.market_slug,
    event_slug: event.event_slug,
    timestamp: event.timestamp_utc,
    transaction_hash: event.transaction_hash ?? undefined
  };
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
  initialActivities,
  initialPositions
}: {
  initialActivities: SpectatorActivity[];
  initialPositions: PublicPosition[];
}) {
  const { t } = useLocale();
  const { data: rawActivities } = usePollingJson<SpectatorActivity[]>(
    "/api/public/activity",
    initialActivities,
    15_000
  );
  const { data: positions } = usePollingJson<PublicPosition[]>(
    "/api/public/positions",
    initialPositions,
    15_000
  );

  const activityItems = rawActivities.map(toActivityItem);

  const currentValue = positions.reduce(
    (sum, p) => sum + (p.current_value_usd ?? 0),
    0
  );

  const pnlBreakdown = calculatePnl({
    activities: activityItems,
    positions: positions as any
  });

  const timeline = buildPnlTimeline({
    activities: activityItems,
    currentValue
  });

  const hasData = timeline.length >= 2;

  if (!hasData) {
    return (
      <section className="dash-panel dash-chart-panel dash-chart-prominent">
        <div className="dash-panel-head">
          <h2>{t.pnl_label}</h2>
        </div>
        <p className="dash-empty">{t.no_equity_data}</p>
      </section>
    );
  }

  const pnlValues = timeline.map((p) => p.pnl);
  const high = Math.max(...pnlValues);
  const low = Math.min(...pnlValues);
  const latest = pnlValues[pnlValues.length - 1] ?? 0;
  const isUp = latest >= 0;

  const svgWidth = 720;
  const svgHeight = 240;
  const padding = 20;

  const linePath = buildPath(pnlValues, svgWidth, svgHeight, padding);
  const fillPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Zero line position
  const allMin = Math.min(...pnlValues);
  const allMax = Math.max(...pnlValues);
  const allRange = Math.max(0.01, allMax - allMin);
  const drawHeight = svgHeight - padding * 2;
  const zeroY =
    allMin <= 0 && allMax >= 0
      ? padding + drawHeight - ((0 - allMin) / allRange) * drawHeight
      : null;

  // Time labels
  const labelCount = Math.min(5, timeline.length);
  const labels: Array<{ x: number; text: string }> = [];
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor(
      (i / Math.max(1, labelCount - 1)) * (timeline.length - 1)
    );
    const x = (idx / Math.max(1, timeline.length - 1)) * svgWidth;
    labels.push({ x, text: formatTimestamp(timeline[idx]!.timestamp) });
  }

  // Latest dot
  const lastCx = svgWidth;
  const lastCy =
    padding + drawHeight - ((latest - allMin) / allRange) * drawHeight;

  return (
    <section className="dash-panel dash-chart-panel dash-chart-prominent">
      <div className="dash-panel-head">
        <h2>
          {t.pnl_label}{" "}
          <span className={isUp ? "dash-positive" : "dash-negative"} style={{ fontSize: "20px", fontWeight: 700 }}>
            {isUp ? "+" : ""}{formatUsd(latest)}
          </span>
        </h2>
        <div className="dash-panel-meta">
          <span>{t.high} {formatUsd(high)}</span>
          <span>{t.low} {formatUsd(low)}</span>
          <span>Out {formatUsd(pnlBreakdown.cashOut)}</span>
          <span>In {formatUsd(pnlBreakdown.cashIn)}</span>
        </div>
      </div>
      <div className="dash-chart-wrap">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="dash-chart"
          role="img"
          aria-label="P&L chart"
        >
          <defs>
            <linearGradient id="dash-pnl-fill" x1="0" x2="0" y1="0" y2="1">
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

          {/* Zero line */}
          {zeroY != null && (
            <line
              x1="0"
              y1={zeroY}
              x2={svgWidth}
              y2={zeroY}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

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

          {/* Latest dot */}
          <circle
            cx={lastCx}
            cy={lastCy}
            r="4"
            fill={isUp ? "#34d399" : "#ef4444"}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
          />

          {/* Time labels */}
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
