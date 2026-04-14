"use client";

import { useMemo } from "react";

interface EnergyOrbProps {
  readonly value: number;
  readonly size?: number;
  readonly showValue?: boolean;
}

function getOrbClass(value: number): string {
  if (value > 0.1) return "sts-energy-orb--bull";
  if (value < -0.1) return "sts-energy-orb--bear";
  return "sts-energy-orb--neutral";
}

function formatValue(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function EnergyOrb({ value, size = 48, showValue = true }: EnergyOrbProps) {
  const orbClass = useMemo(() => getOrbClass(value), [value]);
  const formattedValue = useMemo(() => formatValue(value), [value]);
  const fontSize = Math.max(10, size * 0.28);

  return (
    <div
      className={`sts-energy-orb ${orbClass}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      aria-label={`Energy orb: ${formattedValue}`}
    >
      {showValue && (
        <span
          className="sts-energy-orb__value"
          style={{ fontSize }}
        >
          {formattedValue}
        </span>
      )}
    </div>
  );
}
