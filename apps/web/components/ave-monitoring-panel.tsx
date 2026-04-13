"use client";

import type { AveAlert } from "@autopoly/contracts";
import { useLocale } from "../lib/locale-context";

interface AveMonitoringPanelProps {
  readonly alerts: readonly AveAlert[];
}

function severityClass(severity: AveAlert["severity"]): string {
  switch (severity) {
    case "info":
      return "dash-alert-info";
    case "warning":
      return "dash-alert-warning";
    case "critical":
      return "dash-alert-critical";
    default:
      return "";
  }
}

function severityLabel(severity: AveAlert["severity"]): string {
  switch (severity) {
    case "info":
      return "INFO";
    case "warning":
      return "WARN";
    case "critical":
      return "CRIT";
    default:
      return severity;
  }
}

function alertTypeLabel(type: AveAlert["type"]): string {
  switch (type) {
    case "price_alert":
      return "Price Alert";
    case "anomaly":
      return "Anomaly Detected";
    case "risk_alert":
      return "Risk Warning";
    case "whale_movement":
      return "Whale Movement";
    default:
      return type;
  }
}

function tokenIconColor(symbol: string): string {
  const colors = [
    "#34d399", "#60a5fa", "#f59e0b", "#a78bfa",
    "#f472b6", "#fb923c", "#2dd4bf", "#818cf8"
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0]!;
}

function relativeTime(isoString: string, t: { just_now: string; minutes_ago: (n: number) => string; hours_ago: (n: number) => string; days_ago: (n: number) => string }): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  if (diffMs < 0) {
    return t.just_now;
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return t.just_now;
  }
  if (minutes < 60) {
    return t.minutes_ago(minutes);
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t.hours_ago(hours);
  }
  const days = Math.floor(hours / 24);
  return t.days_ago(days);
}

export function AveMonitoringPanel({ alerts }: AveMonitoringPanelProps) {
  const { t } = useLocale();

  return (
    <section className="dash-panel dash-monitoring-panel">
      <div className="dash-panel-head">
        <h2 className="dash-monitoring-heading">
          <span className="dash-monitoring-dot" />
          {t.monitoring_title}
        </h2>
        <div className="dash-panel-meta">
          <span>{alerts.length} alerts</span>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="dash-empty">{t.no_alerts}</p>
      ) : (
        <div className="dash-activity-list">
          {alerts.map((alert, index) => {
            const key = `${alert.tokenAddress}-${alert.timestamp}-${index}`;
            const iconColor = tokenIconColor(alert.tokenSymbol);
            const firstLetter = alert.tokenSymbol.charAt(0).toUpperCase();
            return (
              <article key={key} className={`dash-alert-card ${severityClass(alert.severity)}`}>
                <div className="dash-activity-main">
                  <span
                    className="dash-token-icon"
                    style={{ background: iconColor }}
                  >
                    {firstLetter}
                  </span>
                  <span className={`dash-alert-badge ${severityClass(alert.severity)}`}>
                    {severityLabel(alert.severity)}
                  </span>
                  <div className="dash-activity-info">
                    <strong>
                      {alert.tokenSymbol}
                      <span className="dash-chain-badge" style={{ marginLeft: 6 }}>{alert.chain}</span>
                    </strong>
                    <span className="dash-activity-detail">
                      {alertTypeLabel(alert.type)} &mdash; {alert.message}
                    </span>
                  </div>
                </div>
                <span className="dash-activity-time">{relativeTime(alert.timestamp, t)}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
