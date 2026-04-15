/**
 * Section 3a: Market Encounter — Boss encounter card.
 *
 * Displays the target Polymarket question in a Slay the Spire
 * boss encounter style with gold double-border, market stats,
 * and current odds bar.
 */

import { showcaseMarket } from "../data/mock-trade-data";

// ---------------------------------------------------------------------------
// Styles (CSS-in-JS objects for portability)
// ---------------------------------------------------------------------------

const styles = {
  section: {
    padding: "80px 24px 40px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "16px",
  },
  encounterLabel: {
    fontFamily: "'Cinzel', 'Iowan Old Style', serif",
    fontSize: "16px",
    letterSpacing: "6px",
    color: "#8b8b9e",
    textTransform: "uppercase" as const,
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "#16213e",
    border: "2px solid #d4a574",
    borderRadius: "12px",
    padding: "40px 36px",
    boxShadow: "0 0 40px rgba(212, 165, 116, 0.15), inset 0 1px 0 rgba(212, 165, 116, 0.1)",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  cardInner: {
    border: "1px solid rgba(212, 165, 116, 0.3)",
    borderRadius: "8px",
    padding: "32px 28px",
  },
  bossTitle: {
    fontFamily: "'Cinzel', 'Iowan Old Style', serif",
    fontSize: "32px",
    color: "#d4a574",
    textAlign: "center" as const,
    margin: "0 0 32px 0",
    lineHeight: 1.3,
    textShadow: "0 0 20px rgba(212, 165, 116, 0.3)",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "48px",
    marginBottom: "32px",
    flexWrap: "wrap" as const,
  },
  statBlock: {
    textAlign: "center" as const,
    minWidth: "100px",
  },
  statLabel: {
    fontSize: "13px",
    letterSpacing: "2px",
    color: "#8b8b9e",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "20px",
    fontWeight: 600,
    color: "#FFF6E2",
  },
  oddsSection: {
    marginTop: "8px",
  },
  oddsLabel: {
    fontSize: "14px",
    color: "#8b8b9e",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginBottom: "12px",
    textAlign: "center" as const,
  },
  oddsDisplay: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "18px",
  },
  yesOdds: {
    color: "#2a9d8f",
    fontWeight: 700,
  },
  noOdds: {
    color: "#e63946",
    fontWeight: 700,
  },
  separator: {
    color: "#8b8b9e",
    fontSize: "16px",
  },
  barContainer: {
    width: "100%",
    height: "8px",
    borderRadius: "4px",
    background: "#e63946",
    overflow: "hidden",
    position: "relative" as const,
  },
  barFill: {
    height: "100%",
    borderRadius: "4px 0 0 4px",
    background: "linear-gradient(90deg, #2a9d8f, #3dbda8)",
    transition: "width 0.6s ease-out",
  },
  barLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
    fontSize: "13px",
    color: "#8b8b9e",
    fontFamily: "'JetBrains Mono', monospace",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketEncounter() {
  const m = showcaseMarket;
  const yesPct = m.yesOdds * 100;

  return (
    <section style={styles.section}>
      <span style={styles.encounterLabel}>{"\u53D1\u73B0\u6700\u6709\u5229\u53EF\u56FE\u7684\u5E02\u573A"}</span>

      <div style={styles.card}>
        <div style={styles.cardInner}>
          <h2 style={styles.bossTitle}>{m.question}</h2>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                color: "#5fa8d3",
                textDecoration: "none",
                borderBottom: "1px dashed rgba(95,168,211,0.4)",
                wordBreak: "break-all",
              }}
            >
              {"\u{1F517} "}
              {m.url}
            </a>
          </div>

          <div style={styles.statsRow}>
            <StatBlock label={"\u4EA4\u6613\u91CF"} value={m.volume} />
            <StatBlock label={"\u7ED3\u7B97\u65E5"} value={m.resolutionDate} />
            <StatBlock label={"\u5269\u4F59\u65F6\u95F4"} value={`${m.daysLeft} \u5929`} />
          </div>

          <div style={styles.oddsSection}>
            <div style={styles.oddsLabel}>{"\u5F53\u524D\u8D54\u7387"}</div>

            <div style={styles.oddsDisplay}>
              <span style={styles.yesOdds}>{m.yesOddsPct} Yes</span>
              <span style={styles.separator}>/</span>
              <span style={styles.noOdds}>{m.noOddsPct} No</span>
            </div>

            <div style={styles.barContainer}>
              <div style={{ ...styles.barFill, width: `${yesPct}%` }} />
            </div>

            <div style={styles.barLabels}>
              <span>{m.yesOddsPct}</span>
              <span>{m.noOddsPct}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBlock({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div style={styles.statBlock}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}
