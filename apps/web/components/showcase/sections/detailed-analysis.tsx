/**
 * Detailed Analysis — 6-step reasoning block for the top-edge market.
 *
 * Presented on a parchment-style card with the market question as title
 * (linked to Polymarket), volume/odds/resolution stats, and the six
 * reasoning steps the pipeline walks through to arrive at our probability
 * and edge. The recommendation (if any) appears at the bottom.
 */

import type { DetailedAnalysis as AnalysisT } from "../../../lib/showcase-data";

const styles = {
  section: {
    padding: "56px 24px",
    background: "linear-gradient(180deg, #16213e 0%, #0f0f23 100%)",
  },
  inner: {
    maxWidth: 880,
    margin: "0 auto",
  },
  label: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 13,
    letterSpacing: 6,
    color: "#d4a574",
    textTransform: "uppercase" as const,
    textAlign: "center" as const,
    marginBottom: 6,
  },
  title: {
    textAlign: "center" as const,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 26,
    color: "#FFF6E2",
    margin: "0 0 20px 0",
  },
  card: {
    padding: "32px 32px 36px",
    borderRadius: 14,
    border: "2px solid rgba(212, 165, 116, 0.55)",
    background: "#f0e6d3",
    backgroundImage:
      "radial-gradient(ellipse at 20% 50%, rgba(210, 180, 140, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(190, 160, 120, 0.2) 0%, transparent 40%)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    color: "#2d2a26",
  },
  questionWrap: {
    textAlign: "center" as const,
    marginBottom: 20,
  },
  question: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 22,
    color: "#4a1e0e",
    margin: "0 0 8px 0",
    lineHeight: 1.3,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: "#7b2d8e",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    textDecoration: "underline",
    wordBreak: "break-all" as const,
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    marginBottom: 24,
    flexWrap: "wrap" as const,
  },
  stat: {
    textAlign: "center" as const,
    minWidth: 90,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#6b5a48",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16,
    fontWeight: 700,
    color: "#2d2a26",
  },
  divider: {
    width: "100%",
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(139, 109, 76, 0.4), transparent)",
    margin: "14px 0 20px",
  },
  stepsHeader: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 15,
    letterSpacing: 3,
    color: "#4a1e0e",
    textTransform: "uppercase" as const,
    marginBottom: 14,
  },
  stepsList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  stepRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#4a1e0e",
    color: "#f0e6d3",
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#2d2a26",
    lineHeight: 1.4,
    marginBottom: 2,
  },
  stepDetail: {
    fontSize: 13,
    color: "#6b5a48",
    lineHeight: 1.5,
    fontFamily: "'JetBrains Mono', monospace",
  },
  conclusionBox: {
    marginTop: 24,
    padding: "16px 18px",
    borderRadius: 8,
    background: "rgba(74, 30, 14, 0.08)",
    border: "1px solid rgba(74, 30, 14, 0.3)",
  },
  conclusionLabel: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 12,
    letterSpacing: 3,
    color: "#4a1e0e",
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  conclusionText: {
    fontSize: 15,
    color: "#2d2a26",
    lineHeight: 1.55,
  },
  recommendation: {
    marginTop: 10,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#2d6a4f",
    fontWeight: 700,
  },
} as const;

const TONE_COLOR: Record<"bull" | "bear" | "neutral", string> = {
  bull: "#2d6a4f",
  bear: "#a4161a",
  neutral: "#6b5a48",
};

interface DetailedAnalysisProps {
  readonly analysis: AnalysisT;
}

export function DetailedAnalysis({ analysis }: DetailedAnalysisProps) {
  const { market, steps, conclusion, recommendation } = analysis;

  return (
    <section style={styles.section}>
      <div style={styles.inner}>
        <div style={styles.label}>{"\u91CD\u70B9\u5E02\u573A\u5206\u6790"}</div>
        <h2 style={styles.title}>
          {"\u6700\u9AD8 EDGE \u5E02\u573A \u2014 6 \u6B65\u63A8\u7406\u8FFD\u8E2A"}
        </h2>

        <article style={styles.card}>
          <div style={styles.questionWrap}>
            <h3 style={styles.question}>{market.question}</h3>
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {"\u{1F517} "}
              {market.url}
            </a>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{"\u4EA4\u6613\u91CF"}</div>
              <div style={styles.statValue}>{market.volumeLabel}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{"YES \u8D54\u7387"}</div>
              <div style={styles.statValue}>{market.yesOddsPct}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{"\u6211\u4EEC\u7684\u6982\u7387"}</div>
              <div style={styles.statValue}>
                {`${(market.ourProbability * 100).toFixed(0)}%`}
              </div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{"EDGE"}</div>
              <div
                style={{
                  ...styles.statValue,
                  color: market.edge >= 0 ? "#2d6a4f" : "#a4161a",
                }}
              >
                {`${market.edge >= 0 ? "+" : ""}${(market.edge * 100).toFixed(0)}%`}
              </div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{"\u7ED3\u7B97\u65E5"}</div>
              <div style={styles.statValue}>{market.endDateLabel}</div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.stepsHeader}>{"\u{1F9E0} AI \u63A8\u7406\u6B65\u9AA4"}</div>

          <ol style={styles.stepsList}>
            {steps.map((step, idx) => (
              <li key={idx} style={styles.stepRow}>
                <span style={styles.stepNumber}>{idx + 1}</span>
                <div style={styles.stepBody}>
                  <div
                    style={{
                      ...styles.stepTitle,
                      color: TONE_COLOR[step.tone],
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={styles.stepDetail}>{step.detail}</div>
                </div>
              </li>
            ))}
          </ol>

          <div style={styles.conclusionBox}>
            <div style={styles.conclusionLabel}>{"\u{1F4A1} \u7ED3\u8BBA"}</div>
            <div style={styles.conclusionText}>{conclusion}</div>
            {recommendation && (
              <div style={styles.recommendation}>
                {"\u2705 "}
                {recommendation}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
