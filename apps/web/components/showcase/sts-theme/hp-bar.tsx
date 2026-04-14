"use client";

import { useMemo } from "react";

interface HpBarProps {
  readonly current: number;
  readonly max: number;
  readonly label?: string;
  readonly showValues?: boolean;
}

function getFillClass(percentage: number): string {
  if (percentage < 30) return "sts-hp-bar__fill--critical";
  if (percentage < 50) return "sts-hp-bar__fill--low";
  return "";
}

export function HpBar({
  current,
  max,
  label = "HP",
  showValues = true,
}: HpBarProps) {
  const percentage = useMemo(() => {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }, [current, max]);

  const fillClass = useMemo(() => getFillClass(percentage), [percentage]);

  return (
    <div className="sts-hp-bar" aria-label={`${label}: ${current} / ${max}`}>
      <span className="sts-hp-bar__icon" role="img" aria-hidden="true">
        &#10084;&#65039;
      </span>
      <div className="sts-hp-bar__track">
        <div
          className={`sts-hp-bar__fill ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
        {showValues && (
          <div className="sts-hp-bar__values">
            <span>
              ${current.toFixed(2)} / ${max.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span
          className="sts-label"
          style={{ minWidth: 40, textAlign: "right", color: "var(--sts-text-muted)" }}
        >
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
