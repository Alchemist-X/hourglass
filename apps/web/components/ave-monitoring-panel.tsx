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

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  if (diffMs < 0) {
    return "just now";
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AveMonitoringPanel({ alerts }: AveMonitoringPanelProps) {
  const { t } = useLocale();

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>{t.monitoring_title}</h2>
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
            return (
              <article key={key} className="dash-activity-row">
                <div className="dash-activity-main">
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
                <span className="dash-activity-time">{relativeTime(alert.timestamp)}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
