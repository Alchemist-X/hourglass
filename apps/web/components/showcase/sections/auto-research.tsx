/**
 * Auto-Research Power Card.
 *
 * Slay the Spire "Power" card style (green border) showing
 * the system's continuous self-improvement loop:
 *   - Re-evaluates every 5 minutes
 *   - Continuously optimizes weights
 *   - Self-tunes parameters
 *
 * Emphasizes "durable operations" -- this is an ongoing agent,
 * not a one-shot tool.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const C = {
  cardBg: "#16213e",
  border: "#2E7D32",
  borderGlow: "rgba(46,125,50,0.25)",
  cream: "#FFF6E2",
  gold: "#d4a574",
  goldBright: "#EFC851",
  muted: "#8b8b9e",
  green: "#2a9d8f",
  greenBright: "#32A050",
  greenDot: "#4CAF50",
  dimText: "#5a5a72",
} as const;

// ---------------------------------------------------------------------------
// Run history data
// ---------------------------------------------------------------------------

interface RunEntry {
  readonly time: string;
  readonly score: string;
  readonly trendW: string;
  readonly whaleW: string;
  readonly highlight: boolean;
}

const recentRuns: readonly RunEntry[] = [
  { time: "14:25", score: "+0.45", trendW: "0.40", whaleW: "0.30", highlight: false },
  { time: "14:30", score: "+0.48", trendW: "0.40", whaleW: "0.30", highlight: false },
  { time: "14:35", score: "+0.52", trendW: "0.35", whaleW: "0.35", highlight: true },
  { time: "14:40", score: "+0.51", trendW: "0.38", whaleW: "0.32", highlight: false },
  { time: "14:45", score: "+0.52", trendW: "0.38", whaleW: "0.32", highlight: false },
] as const;

// ---------------------------------------------------------------------------
// Features list
// ---------------------------------------------------------------------------

const features: readonly string[] = [
  "\u27F3 \u6BCF 5 \u5206\u949F\u91CD\u65B0\u83B7\u53D6 AVE \u94FE\u4E0A\u6570\u636E",
  "\u27F3 \u52A8\u6001\u8C03\u6574\u4FE1\u53F7\u6743\u91CD\uFF08\u57FA\u4E8E\u8FD1\u671F\u51C6\u786E\u7387\uFF09",
  "\u27F3 \u6301\u7EED\u4F18\u5316\u6982\u7387\u6A21\u578B\u53C2\u6570",
  "\u27F3 \u76D1\u63A7 Edge \u53D8\u5316\uFF0CEdge \u6D88\u5931\u5219\u81EA\u52A8\u5E73\u4ED3",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AutoResearch() {
  return (
    <section style={{ padding: "0 24px 60px", maxWidth: "880px", margin: "0 auto" }}>
      <div
        style={{
          background: C.cardBg,
          border: `2px solid ${C.border}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: `0 0 30px ${C.borderGlow}, 0 4px 24px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${C.border}44`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Power card icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${C.greenBright}, ${C.border})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 12px ${C.borderGlow}`,
              fontSize: "16px",
            }}
          >
            {"\u{1F504}"}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Cinzel', 'Iowan Old Style', serif",
                fontSize: "18px",
                color: C.cream,
                fontWeight: 600,
                letterSpacing: "2px",
              }}
            >
              {"\u81EA\u52A8\u7814\u7A76"}
            </div>
            <div style={{ fontSize: "13px", color: C.muted, marginTop: "2px" }}>
              {"\u529B\u91CF\u5361"} {"\u00B7"} {"\u6301\u7EED\u8FD0\u884C\u7684 Agent"}
            </div>
          </div>

          <span
            style={{
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: "3px",
              background: "rgba(46,125,50,0.2)",
              color: C.greenBright,
              fontWeight: 600,
            }}
          >
            {"\u529B\u91CF"}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Description */}
          <p
            style={{
              color: C.cream,
              fontSize: "16px",
              lineHeight: 1.6,
              margin: "0 0 20px 0",
              opacity: 0.9,
            }}
          >
            Hourglass {"\u4E0D\u53EA\u5206\u6790\u4E00\u6B21"} {"\u2014\u2014"} {"\u5B83\u50CF AI \u7814\u7A76\u5458\u4E00\u6837\u6301\u7EED\u8FD0\u884C\uFF0C\u4E0D\u65AD\u8C03\u6574\u53C2\u6570\u4EE5\u83B7\u53D6\u6700\u4F73\u8868\u73B0\u3002"}
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {features.map((f) => (
              <div
                key={f}
                style={{
                  fontSize: "15px",
                  color: C.cream,
                  opacity: 0.85,
                  paddingLeft: "4px",
                }}
              >
                {f}
              </div>
            ))}
          </div>

          {/* Run history */}
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: C.muted,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              {"\u6743\u91CD\u8C03\u6574\u5386\u53F2"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {recentRuns.map((run) => (
                <div
                  key={run.time}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                    color: run.highlight ? C.goldBright : C.cream,
                    opacity: run.highlight ? 1 : 0.7,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: run.highlight ? "rgba(239,200,81,0.08)" : "transparent",
                  }}
                >
                  <span style={{ color: C.muted, width: "40px" }}>{run.time}</span>
                  <span style={{ color: C.green, width: "52px" }}>{"\u5F97\u5206"} {run.score}</span>
                  <span>
                    {"\u8D8B\u52BF"}={run.trendW} {"\u9CB8\u9C7C"}={run.whaleW}
                  </span>
                  {run.highlight && (
                    <span style={{ color: C.goldBright, marginLeft: "auto" }}>
                      {"\u2726"} {"\u9CB8\u9C7C\u51C6\u786E\u7387\u63D0\u5347"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
              color: C.muted,
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: C.greenDot,
                  boxShadow: `0 0 6px ${C.greenDot}`,
                  display: "inline-block",
                }}
              />
              <span style={{ color: C.greenBright }}>{"\u8FD0\u884C\u4E2D"}</span>
            </span>

            <span>{"\u4E0A\u6B21\u66F4\u65B0"}: 2 {"\u5206\u949F\u524D"}</span>
            <span>{"\u5DF2\u5B8C\u6210"} 49 {"\u8F6E"}</span>
            <span>{"\u5E73\u5747"}: 12{"\u79D2"} / {"\u8F6E"}</span>
          </div>
        </div>

        {/* Footer tagline */}
        <div
          style={{
            padding: "12px 28px",
            borderTop: `1px solid ${C.border}33`,
            textAlign: "center",
            fontSize: "14px",
            color: C.gold,
            letterSpacing: "2px",
            fontStyle: "italic",
          }}
        >
          {"\u6301\u4E45\u5316\u8FD0\u8425"} {"\u00B7"} 7{"\u00D7"}24 {"\u81EA\u4E3B Agent"}
        </div>
      </div>
    </section>
  );
}
