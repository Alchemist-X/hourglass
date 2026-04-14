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
    fontSize: "14px",
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
    fontSize: "28px",
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
    fontSize: "11px",
    letterSpacing: "2px",
    color: "#8b8b9e",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "18px",
    fontWeight: 600,
    color: "#FFF6E2",
  },
  oddsSection: {
    marginTop: "8px",
  },
  oddsLabel: {
    fontSize: "12px",
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
    fontSize: "16px",
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
    fontSize: "14px",
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
    fontSize: "11px",
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
      <span style={styles.encounterLabel}>ENCOUNTER</span>

      <div style={styles.card}>
        <div style={styles.cardInner}>
          <h2 style={styles.bossTitle}>{m.question}</h2>

          <div style={styles.statsRow}>
            <StatBlock label="Volume" value={m.volume} />
            <StatBlock label="Resolution" value={m.resolutionDate} />
            <StatBlock label="Time Left" value={`${m.daysLeft} days`} />
          </div>

          <div style={styles.oddsSection}>
            <div style={styles.oddsLabel}>Current Odds</div>

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
