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
  card: {
    display: "block",
    background: "rgba(22, 33, 62, 0.75)",
    border: "1px solid rgba(212, 165, 116, 0.28)",
    borderRadius: 8,
    padding: "14px 16px",
    textDecoration: "none",
    color: "#FFF6E2",
    transition: "border-color 0.2s ease, transform 0.2s ease",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
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
  actionBadge: (action: "BUY" | "SKIP"): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 1,
    padding: "2px 6px",
    borderRadius: 4,
    background: action === "BUY" ? "rgba(42, 157, 143, 0.2)" : "rgba(139, 139, 158, 0.15)",
    color: action === "BUY" ? "#2a9d8f" : "#8b8b9e",
    border: `1px solid ${action === "BUY" ? "rgba(42,157,143,0.4)" : "rgba(139,139,158,0.3)"}`,
  }),
  question: {
    fontSize: 14,
    lineHeight: 1.4,
    color: "#FFF6E2",
    marginBottom: 10,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 4,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
  },
  statLabel: {
    color: "#8b8b9e",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  statValueOdds: {
    color: "#2a9d8f",
    fontWeight: 600,
  },
  statValueEdgePos: {
    color: "#2a9d8f",
    fontWeight: 600,
  },
  statValueEdgeNeg: {
    color: "#e63946",
    fontWeight: 600,
  },
  statValueNeutral: {
    color: "#FFF6E2",
    fontWeight: 600,
  },
  externalHint: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    color: "#d4a574",
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
} as const;

function edgeStyle(edge: number): React.CSSProperties {
  if (edge >= 0.02) return styles.statValueEdgePos;
  if (edge < 0) return styles.statValueEdgeNeg;
  return styles.statValueNeutral;
}

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
        <h2 style={styles.title}>{"\u6539\u6210\u7684 BTC / ETH \u4EF7\u683C\u76EE\u6807\u5E02\u573A"}</h2>
        <p style={styles.summary}>
          {`\u626B\u63CF\u4E86 ${totalScanned} \u4E2A\u6D3B\u8DC3\u5E02\u573A\uFF0C\u5339\u914D\u5230 ${matchedCount} \u4E2A\u76EE\u6807\u5E02\u573A\uFF0C\u6392\u9664 ${rejectedCount} \u4E2A\u4E0D\u73B0\u5B9E\u5E02\u573A\u3002\u70B9\u51FB\u5361\u7247\u53EF\u8DF3\u8F6C\u5230 Polymarket \u6838\u5BF9\u539F\u6570\u636E\u3002`}
        </p>

        <div style={styles.grid}>
          {markets.map((m) => (
            <a
              key={m.slug}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.card}
            >
              <div style={styles.cardTopRow}>
                <span style={styles.tokenBadge(m.token)}>{m.token}</span>
                <span style={styles.actionBadge(m.action)}>
                  {m.action === "BUY"
                    ? `\u2705 \u4E70\u5165  Edge ${m.edge >= 0 ? "+" : ""}${(m.edge * 100).toFixed(0)}%`
                    : `\u23ED\uFE0F \u8DF3\u8FC7  ${(m.edge * 100).toFixed(0)}%`}
                </span>
              </div>

              <div style={styles.question}>{m.question}</div>

              <div style={styles.statsRow}>
                <div>
                  <div style={styles.statLabel}>{"\u4EA4\u6613\u91CF"}</div>
                  <div style={styles.statValueNeutral}>{m.volumeLabel}</div>
                </div>
                <div>
                  <div style={styles.statLabel}>{"\u8D54\u7387"}</div>
                  <div style={styles.statValueOdds}>{m.yesOddsPct}</div>
                </div>
                <div>
                  <div style={styles.statLabel}>{"\u6211\u4EEC"}</div>
                  <div style={styles.statValueNeutral}>
                    {`${(m.ourProbability * 100).toFixed(0)}%`}
                  </div>
                </div>
                <div>
                  <div style={styles.statLabel}>{"\u7ED3\u7B97"}</div>
                  <div style={styles.statValueNeutral}>{m.endDateLabel}</div>
                </div>
              </div>

              <span style={styles.externalHint}>
                {"\u{1F517} polymarket.com/event/"}
                {m.eventSlug}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
