"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { EnergyOrb } from "./energy-orb";

interface StsCardProps {
  readonly title: string;
  readonly type: "signal" | "data" | "power";
  readonly energyValue: number;
  readonly energyLabel: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

const TYPE_CONFIG = {
  signal: {
    borderClass: "sts-card--signal",
    bannerBg: "rgba(230, 57, 70, 0.85)",
    bannerLabel: "Signal Card",
  },
  data: {
    borderClass: "sts-card--data",
    bannerBg: "rgba(42, 157, 143, 0.85)",
    bannerLabel: "Data Card",
  },
  power: {
    borderClass: "sts-card--power",
    bannerBg: "rgba(95, 168, 211, 0.85)",
    bannerLabel: "Power Card",
  },
} as const;

export function StsCard({
  title,
  type,
  energyValue,
  energyLabel,
  children,
  className = "",
}: StsCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const config = useMemo(() => TYPE_CONFIG[type], [type]);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`sts-card ${config.borderClass} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
        transition: "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Header: Energy Orb + Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 8px",
        }}
      >
        <EnergyOrb value={energyValue} size={40} showValue />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="sts-title sts-title--card"
            style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {title}
          </h3>
          <span
            className="sts-label"
            style={{ fontSize: 10, marginTop: 2, display: "block" }}
          >
            {energyLabel}
          </span>
        </div>
      </div>

      {/* Type Banner */}
      <div
        style={{
          background: config.bannerBg,
          padding: "4px 16px",
          textAlign: "center",
          fontFamily: "var(--sts-font-body)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#fff",
        }}
      >
        {config.bannerLabel}
      </div>

      {/* Card Content */}
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}
