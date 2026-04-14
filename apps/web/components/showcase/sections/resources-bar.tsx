/**
 * Resources Bar
 *
 * Sticky-ish dark strip with three external-resource buttons so visitors can
 * independently verify the project: GitHub source, the dashboard itself, and
 * the on-chain Polymarket trading profile.
 */

const RESOURCES = [
  {
    label: "GitHub \u6E90\u4EE3\u7801",
    sub: "Alchemist-X/hourglass",
    href: "https://github.com/Alchemist-X/hourglass",
    emoji: "\u{1F4C2}",
  },
  {
    label: "\u5B9E\u65F6 Dashboard",
    sub: "hourglass-eta.vercel.app",
    href: "https://hourglass-eta.vercel.app",
    emoji: "\u{1F310}",
  },
  {
    label: "Polymarket \u4EA4\u6613\u94B1\u5305",
    sub: "0xc78873...2936",
    href: "https://polymarket.com/profile/0xc78873644e582cb950f1af880c4f3ef3c11f2936",
    emoji: "\u{1F464}",
  },
] as const;

const styles = {
  wrap: {
    width: "100%",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgba(15,15,35,0.95) 0%, rgba(26,26,46,0.85) 100%)",
    borderTop: "1px solid rgba(212, 165, 116, 0.18)",
    borderBottom: "1px solid rgba(212, 165, 116, 0.18)",
  },
  inner: {
    width: "100%",
    maxWidth: 960,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 16px",
    background: "rgba(22, 33, 62, 0.7)",
    border: "1px solid rgba(212, 165, 116, 0.32)",
    borderRadius: 8,
    color: "#FFF6E2",
    textDecoration: "none",
    transition: "border-color 0.2s ease, background 0.2s ease",
  },
  emoji: {
    fontSize: 22,
    lineHeight: 1,
  },
  body: {
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 0,
  },
  label: {
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 13,
    letterSpacing: 2,
    color: "#d4a574",
    textTransform: "uppercase" as const,
  },
  sub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#8b8b9e",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
} as const;

export function ResourcesBar() {
  return (
    <nav aria-label="External resources" style={styles.wrap}>
      <div style={styles.inner}>
        {RESOURCES.map((r) => (
          <a
            key={r.href}
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            <span style={styles.emoji} aria-hidden>
              {r.emoji}
            </span>
            <span style={styles.body}>
              <span style={styles.label}>{r.label}</span>
              <span style={styles.sub}>{r.sub}</span>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
