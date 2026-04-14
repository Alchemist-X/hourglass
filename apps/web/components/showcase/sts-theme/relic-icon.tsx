"use client";

import { useState, useMemo, useCallback } from "react";

interface RelicIconProps {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly status: "active" | "triggered" | "inactive";
  readonly tooltip?: string;
}

const STATUS_STYLES = {
  active: {
    borderColor: "rgba(212, 165, 116, 0.7)",
    background: "rgba(212, 165, 116, 0.08)",
    animation: "relicGlow 3s ease-in-out infinite",
    opacity: 1,
    iconFilter: "none",
  },
  triggered: {
    borderColor: "rgba(230, 57, 70, 0.8)",
    background: "rgba(230, 57, 70, 0.12)",
    animation: "relicTrigger 0.5s ease-in-out",
    opacity: 1,
    iconFilter: "none",
  },
  inactive: {
    borderColor: "rgba(139, 139, 158, 0.3)",
    background: "rgba(139, 139, 158, 0.05)",
    animation: "none",
    opacity: 0.5,
    iconFilter: "grayscale(0.6)",
  },
} as const;

export function RelicIcon({
  icon,
  label,
  value,
  status,
  tooltip,
}: RelicIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const styles = useMemo(() => STATUS_STYLES[status], [status]);

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        position: "relative",
        cursor: tooltip ? "help" : "default",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Relic Square */}
      <div
        style={{
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${styles.borderColor}`,
          borderRadius: 6,
          background: styles.background,
          animation: styles.animation,
          opacity: styles.opacity,
          fontSize: 20,
          filter: styles.iconFilter,
          transition: "opacity 0.3s ease, border-color 0.3s ease",
        }}
        role="img"
        aria-label={`${label}: ${value}`}
      >
        {icon}
      </div>

      {/* Value */}
      <span
        className="sts-data--sm"
        style={{
          color: status === "triggered" ? "var(--sts-bear)" : "var(--sts-text-cream)",
          fontSize: 12,
          fontWeight: 700,
          opacity: styles.opacity,
        }}
      >
        {value}
      </span>

      {/* Label */}
      <span
        className="sts-label"
        style={{
          fontSize: 9,
          opacity: styles.opacity,
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 60,
        }}
      >
        {label}
      </span>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            background: "rgba(15, 15, 35, 0.95)",
            border: "1px solid rgba(212, 165, 116, 0.3)",
            borderRadius: 6,
            fontFamily: "var(--sts-font-body)",
            fontSize: 12,
            color: "var(--sts-text-cream)",
            whiteSpace: "nowrap",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          {tooltip}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: "rgba(15, 15, 35, 0.95)",
              borderRight: "1px solid rgba(212, 165, 116, 0.3)",
              borderBottom: "1px solid rgba(212, 165, 116, 0.3)",
            }}
          />
        </div>
      )}
    </div>
  );
}
