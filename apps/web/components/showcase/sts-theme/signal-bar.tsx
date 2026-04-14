"use client";

import { useEffect, useRef, useMemo, useState } from "react";

interface SignalBarProps {
  readonly value: number;
  readonly label: string;
  readonly showMarker?: boolean;
  readonly animated?: boolean;
  readonly size?: "sm" | "md" | "lg";
}

function getLabelClass(value: number): string {
  if (value > 0.15) return "sts-signal-bar__label--bull";
  if (value < -0.15) return "sts-signal-bar__label--bear";
  return "sts-signal-bar__label--neutral";
}

export function SignalBar({
  value,
  label,
  showMarker = true,
  animated = true,
  size = "md",
}: SignalBarProps) {
  const [visible, setVisible] = useState(!animated);
  const ref = useRef<HTMLDivElement>(null);

  // Clamp value to [-1, 1]
  const clampedValue = useMemo(() => Math.max(-1, Math.min(1, value)), [value]);

  // Convert [-1, 1] to [0%, 100%]
  const fillPercent = useMemo(() => ((clampedValue + 1) / 2) * 100, [clampedValue]);

  // Marker position = fillPercent
  const markerLeft = useMemo(() => `${fillPercent}%`, [fillPercent]);

  const labelClass = useMemo(() => getLabelClass(clampedValue), [clampedValue]);

  useEffect(() => {
    if (!animated || !ref.current) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [animated]);

  return (
    <div className="sts-signal-bar" ref={ref}>
      <div className={`sts-signal-bar__track sts-signal-bar__track--${size}`}>
        <div
          className="sts-signal-bar__fill"
          style={{ width: visible ? `${fillPercent}%` : "50%" }}
        />
      </div>
      {showMarker && (
        <div
          className="sts-signal-bar__marker"
          style={{ left: visible ? markerLeft : "50%" }}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <span className="sts-data--sm" style={{ color: "var(--sts-text-muted)", fontSize: 10 }}>
          -1.0
        </span>
        <span className={`sts-signal-bar__label ${labelClass}`}>
          {label} ({clampedValue > 0 ? "+" : ""}{clampedValue.toFixed(2)})
        </span>
        <span className="sts-data--sm" style={{ color: "var(--sts-text-muted)", fontSize: 10 }}>
          +1.0
        </span>
      </div>
    </div>
  );
}
