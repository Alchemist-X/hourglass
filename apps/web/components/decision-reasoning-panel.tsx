"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SignalData {
  readonly value: number;
  readonly label: string;
  readonly detail: string;
}

interface DecisionReasoning {
  readonly id: string;
  readonly marketQuestion: string;
  readonly token: "BTC" | "ETH";
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly signals: {
    readonly price: SignalData;
    readonly trend: SignalData;
    readonly whale: SignalData;
    readonly sentiment: SignalData;
  };
  readonly overallScore: number;
  readonly ourProbability: number;
  readonly marketProbability: number;
  readonly edge: number;
  readonly action: "BUY" | "SELL" | "SKIP";
  readonly shares?: number;
  readonly status: "executed" | "pending" | "skipped";
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers (pure functions, no mutation)
// ---------------------------------------------------------------------------

function scoreToPercent(score: number): number {
  return ((score + 1) / 2) * 100;
}

function scoreColorClass(score: number): string {
  if (score >= 0.3) return "signal-bar-positive";
  if (score <= -0.3) return "signal-bar-negative";
  return "signal-bar-neutral";
}

function edgeColorClass(edge: number): string {
  if (edge > 0) return "edge-positive";
  if (edge < 0) return "edge-negative";
  return "edge-neutral";
}

function statusBadgeClass(status: DecisionReasoning["status"]): string {
  switch (status) {
    case "executed":
      return "decision-status decision-status-executed";
    case "pending":
      return "decision-status decision-status-pending";
    case "skipped":
      return "decision-status decision-status-skipped";
    default:
      return "decision-status";
  }
}

function statusLabel(status: DecisionReasoning["status"]): string {
  switch (status) {
    case "executed":
      return "Executed";
    case "pending":
      return "Pending";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

function actionLabel(action: DecisionReasoning["action"]): string {
  switch (action) {
    case "BUY":
      return "BUY YES";
    case "SELL":
      return "SELL NO";
    case "SKIP":
      return "SKIP";
    default:
      return action;
  }
}

function formatUsd(value: number): string {
  if (value >= 1_000) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Signal Waterfall Bar
// ---------------------------------------------------------------------------

interface SignalBarProps {
  readonly emoji: string;
  readonly name: string;
  readonly signal: SignalData;
  readonly animate: boolean;
}

function SignalBar({ emoji, name, signal, animate }: SignalBarProps) {
  const fillPercent = scoreToPercent(signal.value);
  const colorClass = scoreColorClass(signal.value);
  const signStr = signal.value >= 0 ? "+" : "";

  return (
    <div className="signal-row">
      <div className="signal-row-label">
        <span className="signal-emoji">{emoji}</span>
        <span className="signal-name">{name}</span>
      </div>
      <div className="signal-bar-track">
        <div className="signal-bar-center-line" />
        <div
          className={`signal-bar-fill ${colorClass}`}
          style={{ width: animate ? `${fillPercent}%` : "50%" }}
        />
        <div className="signal-bar-marker" style={{ left: `${fillPercent}%` }} />
      </div>
      <div className="signal-row-meta">
        <span className={`signal-score ${colorClass}`}>
          {signStr}{signal.value.toFixed(2)}
        </span>
        <span className="signal-detail">{signal.detail}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Bar (-1 to +1 gradient)
// ---------------------------------------------------------------------------

interface ScoreBarProps {
  readonly score: number;
  readonly probability: number;
  readonly edge: number;
  readonly animate: boolean;
}

function OverallScoreBar({ score, probability, edge, animate }: ScoreBarProps) {
  const markerPos = scoreToPercent(score);
  const signStr = score >= 0 ? "+" : "";
  const edgeSign = edge >= 0 ? "+" : "";

  return (
    <div className="overall-score-section">
      <div className="overall-score-divider" />
      <div className="overall-score-row">
        <div className="overall-score-bar-wrap">
          <div className="overall-score-labels">
            <span>-1.0</span>
            <span>0</span>
            <span>+1.0</span>
          </div>
          <div className="overall-score-bar-track">
            <div className="overall-score-gradient" />
            <div
              className="overall-score-marker"
              style={{ left: animate ? `${markerPos}%` : "50%" }}
            >
              <span className="overall-score-value">{signStr}{score.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="overall-score-stats">
          <div className="score-stat">
            <span className="score-stat-label">Prob</span>
            <span className="score-stat-value">{(probability * 100).toFixed(0)}%</span>
          </div>
          <div className="score-stat">
            <span className="score-stat-label">Edge</span>
            <span className={`score-stat-value score-stat-edge ${edgeColorClass(edge)}`}>
              {edgeSign}{(edge * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

interface DecisionCardProps {
  readonly decision: DecisionReasoning;
  readonly animationIndex: number;
}

function DecisionCard({ decision, animationIndex }: DecisionCardProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, animationIndex * 150);
    return () => clearTimeout(timer);
  }, [animationIndex]);

  const edgeSign = decision.edge >= 0 ? "+" : "";
  const tokenColor = decision.token === "BTC" ? "#f7931a" : "#627eea";

  return (
    <article
      className={`decision-card ${decision.status === "executed" ? "decision-card-executed" : ""} ${decision.status === "skipped" ? "decision-card-skipped" : ""}`}
      style={{ animationDelay: `${animationIndex * 0.08}s` }}
    >
      {/* Header */}
      <div className="decision-card-header">
        <div className="decision-card-token-row">
          <span className="decision-card-token-icon" style={{ background: tokenColor }}>
            {decision.token.charAt(0)}
          </span>
          <div className="decision-card-title-group">
            <h3 className="decision-card-question">{decision.marketQuestion}</h3>
            <div className="decision-card-meta-row">
              <span className="decision-card-price">
                {decision.token} {formatUsd(decision.currentPrice)}
              </span>
              <span className="decision-card-target">
                Target: {formatUsd(decision.targetPrice)}
              </span>
            </div>
          </div>
        </div>
        <div className="decision-card-badges">
          <span className={statusBadgeClass(decision.status)}>
            {decision.status === "executed" && (
              <svg className="status-check-icon" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {statusLabel(decision.status)}
          </span>
        </div>
      </div>

      {/* Signal Waterfall */}
      <div className="signal-waterfall">
        <SignalBar emoji="$" name="Price" signal={decision.signals.price} animate={animate} />
        <SignalBar emoji="~" name="Trend" signal={decision.signals.trend} animate={animate} />
        <SignalBar emoji="W" name="Whales" signal={decision.signals.whale} animate={animate} />
        <SignalBar emoji="S" name="Sentiment" signal={decision.signals.sentiment} animate={animate} />
      </div>

      {/* Overall Score Bar */}
      <OverallScoreBar
        score={decision.overallScore}
        probability={decision.ourProbability}
        edge={decision.edge}
        animate={animate}
      />

      {/* Decision Summary */}
      <div className="decision-card-summary">
        <div className="decision-summary-grid">
          <div className="decision-summary-item">
            <span className="decision-summary-label">Our Probability</span>
            <span className="decision-summary-value">{(decision.ourProbability * 100).toFixed(0)}%</span>
          </div>
          <div className="decision-summary-item">
            <span className="decision-summary-label">Market Odds</span>
            <span className="decision-summary-value">{(decision.marketProbability * 100).toFixed(0)}%</span>
          </div>
          <div className="decision-summary-item">
            <span className="decision-summary-label">Edge</span>
            <span className={`decision-summary-value decision-edge-value ${edgeColorClass(decision.edge)}`}>
              {edgeSign}{(decision.edge * 100).toFixed(1)}%
            </span>
          </div>
          <div className="decision-summary-item">
            <span className="decision-summary-label">Action</span>
            <span className={`decision-summary-value decision-action-badge decision-action-${decision.action.toLowerCase()}`}>
              {actionLabel(decision.action)}
            </span>
          </div>
          {decision.shares != null && decision.shares > 0 && (
            <div className="decision-summary-item">
              <span className="decision-summary-label">Shares</span>
              <span className="decision-summary-value">{decision.shares}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="decision-card-footer">
        <span className="decision-card-timestamp">{formatTimestamp(decision.timestamp)}</span>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function DecisionReasoningPanel({ decisions }: { readonly decisions: readonly DecisionReasoning[] }) {
  const executedCount = decisions.filter((d) => d.status === "executed").length;
  const pendingCount = decisions.filter((d) => d.status === "pending").length;

  return (
    <section className="dash-panel dash-decision-panel">
      <div className="dash-panel-head">
        <h2 className="dash-decision-heading">
          <span className="dash-decision-brain-icon">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              <path d="M7 10.5C7 8.5 8.5 7 10 7s3 1.5 3 3.5c0 1.2-.8 2.2-2 2.8v1.2h-2v-1.2C7.8 12.7 7 11.7 7 10.5z" fill="currentColor" opacity="0.6" />
              <circle cx="10" cy="6" r="1" fill="currentColor" />
            </svg>
          </span>
          AI Decision Reasoning
        </h2>
        <div className="dash-panel-meta">
          <span>{decisions.length} decisions</span>
          <span className="decision-meta-executed">{executedCount} executed</span>
          {pendingCount > 0 && <span className="decision-meta-pending">{pendingCount} pending</span>}
        </div>
      </div>

      {decisions.length === 0 ? (
        <p className="dash-empty">No active decisions -- awaiting next analysis cycle.</p>
      ) : (
        <div className="decision-card-list">
          {decisions.map((decision, index) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              animationIndex={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
