/**
 * Market List — Real Polymarket data section.
 *
 * Displays a sortable (by volume) table of matched BTC/ETH price-target
 * markets pulled live from the Gamma API. Each row is a clickable link to
 * the actual Polymarket event page so viewers can verify the trade on-chain.
 */

import type { ShowcaseMarket } from "../../../lib/showcase-data";

const styles = {
  section: {
    padding: "48px 24px",
    background: "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)",
  },
  inner: {
    maxWidth: 1040,
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
    fontSize: 28,
    color: "#FFF6E2",
    margin: "0 0 8px 0",
  },
  summary: {
    textAlign: "center" as const,
    color: "#8b8b9e",
    fontSize: 14,
    marginBottom: 28,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 14,
  },
  card: (action: "BUY" | "SKIP"): React.CSSProperties => ({
    display: "block",
    background:
      action === "BUY"
        ? "linear-gradient(180deg, rgba(42,157,143,0.08) 0%, rgba(22,33,62,0.85) 60%)"
        : "rgba(22, 33, 62, 0.55)",
    border:
      action === "BUY"
        ? "1px solid rgba(42, 157, 143, 0.55)"
        : "1px solid rgba(139, 139, 158, 0.25)",
    borderRadius: 10,
    padding: 0,
    textDecoration: "none",
    color: "#FFF6E2",
    transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
    overflow: "hidden" as const,
    opacity: action === "BUY" ? 1 : 0.72,
    boxShadow: action === "BUY" ? "0 0 24px rgba(42,157,143,0.15)" : "none",
  }),
  decisionRibbon: (action: "BUY" | "SKIP"): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: action === "BUY" ? "14px 18px" : "8px 14px",
    background:
      action === "BUY"
        ? "linear-gradient(90deg, rgba(42,157,143,0.85) 0%, rgba(42,157,143,0.35) 100%)"
        : "rgba(60, 60, 75, 0.55)",
    borderBottom:
      action === "BUY"
        ? "1px solid rgba(42,157,143,0.6)"
        : "1px solid rgba(139,139,158,0.2)",
  }),
  decisionLabel: (action: "BUY" | "SKIP"): React.CSSProperties => ({
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: action === "BUY" ? 26 : 14,
    fontWeight: 800,
    letterSpacing: action === "BUY" ? 3 : 1.5,
    color: action === "BUY" ? "#FFF6E2" : "#b8b8c8",
    textTransform: "uppercase" as const,
    textShadow: action === "BUY" ? "0 2px 6px rgba(0,0,0,0.35)" : "none",
    lineHeight: 1,
  }),
  decisionEdge: (action: "BUY" | "SKIP"): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: action === "BUY" ? 22 : 13,
    fontWeight: 700,
    color: action === "BUY" ? "#FFF6E2" : "#8b8b9e",
    textAlign: "right" as const,
    lineHeight: 1.1,
  }),
  decisionEdgeLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(255, 246, 226, 0.7)",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: 2,
  },
  cardBody: {
    padding: "14px 16px",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  tokenBadge: (token: "BTC" | "ETH"): React.CSSProperties => ({
    background: token === "BTC" ? "rgba(244, 162, 97, 0.18)" : "rgba(95, 168, 211, 0.18)",
    color: token === "BTC" ? "#f4a261" : "#5fa8d3",
    border: `1px solid ${token === "BTC" ? "rgba(244,162,97,0.45)" : "rgba(95,168,211,0.45)"}`,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 1,
    padding: "2px 6px",
    borderRadius: 4,
  }),
  question: {
    fontSize: 14,
    lineHeight: 1.4,
    color: "#FFF6E2",
    marginBottom: 12,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
  },
  statLabel: {
    color: "#8b8b9e",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  statValueNeutral: {
    color: "#FFF6E2",
    fontWeight: 600,
    fontSize: 13,
  },
  // Probability comparison: market (small, gray) vs ours (large, colored)
  probCompare: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: "10px 12px",
    background: "rgba(15, 15, 35, 0.55)",
    border: "1px solid rgba(212, 165, 116, 0.15)",
    borderRadius: 6,
  },
  probCol: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    flex: 1,
  },
  probLabelSmall: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#8b8b9e",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  probLabelLarge: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#d4a574",
    textTransform: "uppercase" as const,
    marginBottom: 4,
    fontWeight: 700,
  },
  probValueMarket: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 15,
    color: "#8b8b9e",
    fontWeight: 600,
  },
  probValueOursBullish: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 24,
    color: "#2a9d8f",
    fontWeight: 800,
    textShadow: "0 0 12px rgba(42,157,143,0.35)",
  },
  probValueOursBear: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 24,
    color: "#e63946",
    fontWeight: 800,
  },
  probArrow: {
    color: "#8b8b9e",
    fontSize: 16,
    fontFamily: "'JetBrains Mono', monospace",
  },
  externalHint: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    color: "#d4a574",
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
} as const;

interface MarketListProps {
  readonly markets: ReadonlyArray<ShowcaseMarket>;
  readonly totalScanned: number;
  readonly matchedCount: number;
  readonly rejectedCount: number;
}

export function MarketList({
  markets,
  totalScanned,
  matchedCount,
  rejectedCount,
}: MarketListProps) {
  if (markets.length === 0) {
    return (
      <section style={styles.section}>
        <div style={styles.inner}>
          <div style={styles.label}>{"\u5B9E\u65F6 POLYMARKET \u5E02\u573A"}</div>
          <h2 style={styles.title}>{"\u6682\u65F6\u672A\u627E\u5230\u5339\u914D\u5E02\u573A"}</h2>
          <p style={styles.summary}>
            {"Gamma API \u5DF2\u8FDE\u63A5\uFF0C\u4F46\u5F53\u524D\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684 BTC/ETH \u4EF7\u683C\u76EE\u6807\u5E02\u573A\u3002"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <div style={styles.inner}>
        <div style={styles.label}>{"\u5B9E\u65F6 POLYMARKET \u5E02\u573A"}</div>
        <h2 style={styles.title}>{"\u76D1\u63A7\u5E02\u573A"}</h2>
        <p style={styles.summary}>
          {`\u626B\u63CF\u4E86 ${totalScanned} \u4E2A\u6D3B\u8DC3\u5E02\u573A\uFF0C\u5339\u914D\u5230 ${matchedCount} \u4E2A\u76EE\u6807\u5E02\u573A\uFF0C\u6392\u9664 ${rejectedCount} \u4E2A\u4E0D\u73B0\u5B9E\u5E02\u573A\u3002\u70B9\u51FB\u5361\u7247\u53EF\u8DF3\u8F6C\u5230 Polymarket \u6838\u5BF9\u539F\u6570\u636E\u3002`}
        </p>

        <div style={styles.grid}>
          {markets.map((m) => {
            const marketPct = parseFloat(m.yesOddsPct);
            const oursPct = m.ourProbability * 100;
            const isBullish = oursPct >= marketPct;
            const edgeSign = m.edge >= 0 ? "+" : "";
            const edgeLabel = `${edgeSign}${(m.edge * 100).toFixed(0)}%`;
            return (
              <a
                key={m.slug}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.card(m.action)}
              >
                {/* Prominent decision ribbon */}
                <div style={styles.decisionRibbon(m.action)}>
                  <div style={styles.decisionLabel(m.action)}>
                    {m.action === "BUY" ? "\u2705 \u4E70\u5165" : "\u23ED\uFE0F \u8DF3\u8FC7"}
                  </div>
                  <div>
                    <span style={styles.decisionEdgeLabel}>Edge</span>
                    <div style={styles.decisionEdge(m.action)}>{edgeLabel}</div>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardTopRow}>
                    <span style={styles.tokenBadge(m.token)}>{m.token}</span>
                  </div>

                  <div style={styles.question}>{m.question}</div>

                  <div style={styles.statsRow}>
                    <div>
                      <div style={styles.statLabel}>{"\u4EA4\u6613\u91CF"}</div>
                      <div style={styles.statValueNeutral}>{m.volumeLabel}</div>
                    </div>
                    <div>
                      <div style={styles.statLabel}>{"\u7ED3\u7B97"}</div>
                      <div style={styles.statValueNeutral}>{m.endDateLabel}</div>
                    </div>
                  </div>

                  {/* Probability comparison: Market vs Ours */}
                  <div style={styles.probCompare}>
                    <div style={styles.probCol}>
                      <span style={styles.probLabelSmall}>{"\u8D54\u7387"}</span>
                      <span style={styles.probValueMarket}>{m.yesOddsPct}</span>
                    </div>
                    <span style={styles.probArrow}>{"\u2192"}</span>
                    <div style={styles.probCol}>
                      <span style={styles.probLabelLarge}>{"\u6211\u4EEC"}</span>
                      <span
                        style={
                          isBullish
                            ? styles.probValueOursBullish
                            : styles.probValueOursBear
                        }
                      >
                        {`${oursPct.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>

                  <span style={styles.externalHint}>
                    {"\u{1F517} polymarket.com/event/"}
                    {m.eventSlug}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
