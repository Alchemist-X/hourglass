/**
 * AVE API Section — Raw request/response visualization.
 *
 * Shows each AVE Claw endpoint call with its URL, status, elapsed time, and
 * a truncated JSON/error snippet so viewers can see the actual network
 * traffic driving the pipeline (or the actual error if the API is offline).
 */

import type { AveApiCall } from "../../../lib/showcase-data";

const styles = {
  section: {
    padding: "48px 24px",
    background: "#0f0f23",
  },
  inner: {
    maxWidth: 960,
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
    marginBottom: 24,
  },
  fallbackNote: {
    padding: "10px 14px",
    background: "rgba(230, 57, 70, 0.08)",
    border: "1px solid rgba(230, 57, 70, 0.35)",
    borderRadius: 6,
    color: "#f4a261",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    marginBottom: 20,
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
  },
  card: {
    background: "rgba(22, 33, 62, 0.75)",
    border: "1px solid rgba(212, 165, 116, 0.28)",
    borderRadius: 8,
    padding: "14px 16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    marginBottom: 10,
  },
  endpoint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#FFF6E2",
    fontWeight: 600,
  },
  statusBadge: (ok: boolean): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    padding: "3px 8px",
    borderRadius: 4,
    background: ok ? "rgba(42, 157, 143, 0.18)" : "rgba(230, 57, 70, 0.18)",
    color: ok ? "#2a9d8f" : "#e63946",
    border: `1px solid ${ok ? "rgba(42,157,143,0.4)" : "rgba(230,57,70,0.4)"}`,
  }),
  url: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#5fa8d3",
    wordBreak: "break-all" as const,
    marginBottom: 10,
  },
  errorLine: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#e63946",
    marginBottom: 8,
  },
  snippetLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: "#8b8b9e",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  snippet: {
    background: "#0f0f23",
    border: "1px solid rgba(212, 165, 116, 0.2)",
    borderRadius: 4,
    padding: "10px 12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    lineHeight: 1.55,
    color: "#d4a574",
    whiteSpace: "pre" as const,
    overflowX: "auto" as const,
    maxHeight: 220,
  },
} as const;

function statusLabel(call: AveApiCall): string {
  if (call.ok) return `\u2705 ${call.status} OK`;
  if (call.status > 0) return `\u274C ${call.status}`;
  return `\u274C \u7F51\u7EDC\u5931\u8D25`;
}

interface AveApiSectionProps {
  readonly calls: ReadonlyArray<AveApiCall>;
  readonly isLive: boolean;
  readonly fallbackReason: string | null;
}

export function AveApiSection({ calls, isLive, fallbackReason }: AveApiSectionProps) {
  return (
    <section style={styles.section}>
      <div style={styles.inner}>
        <div style={styles.label}>{"AVE CLAW API \u539F\u59CB\u54CD\u5E94"}</div>
        <h2 style={styles.title}>
          {isLive
            ? "\u5B9E\u65F6 AVE API \u8C03\u7528"
            : "AVE API \u5C1D\u8BD5\u8C03\u7528 \u2014 \u5F53\u524D\u79BB\u7EBF"}
        </h2>
        <p style={styles.summary}>
          {isLive
            ? "\u4E0B\u65B9\u662F\u672C\u6B21\u6E32\u67D3\u65F6\u5411 AVE Claw \u53D1\u51FA\u7684\u5B9E\u9645\u8BF7\u6C42\uFF0C\u5305\u542B URL\u3001\u72B6\u6001\u7801\u3001\u8017\u65F6\u4EE5\u53CA\u54CD\u5E94 JSON \u6458\u8981\u3002"
            : "AVE \u5B98\u65B9\u63A5\u53E3\u5F53\u524D\u4E0D\u53EF\u8FBE\uFF0C\u9875\u9762\u4FDD\u7559\u771F\u5B9E\u5931\u8D25\u8BB0\u5F55 \u2014 \u4FE1\u53F7\u7BA1\u7EBF\u9006\u5411\u56DE\u9000\u5230\u672C\u5730\u786C\u5316\u6570\u636E\u3002"}
        </p>

        {!isLive && fallbackReason && (
          <div style={styles.fallbackNote}>
            {"\u26A0\uFE0F  \u56DE\u9000\u539F\u56E0\uFF1A"}
            {fallbackReason}
          </div>
        )}

        <div style={styles.list}>
          {calls.map((call) => (
            <div key={`${call.method}-${call.url}`} style={styles.card}>
              <div style={styles.row}>
                <span style={styles.endpoint}>{call.endpoint}</span>
                <span style={styles.statusBadge(call.ok)}>
                  {statusLabel(call)}
                  <span style={{ color: "#8b8b9e", marginLeft: 8 }}>
                    ({call.elapsedMs}ms)
                  </span>
                </span>
              </div>

              <div style={styles.url}>{call.url}</div>

              {call.error && (
                <div style={styles.errorLine}>
                  {"\u9519\u8BEF\uFF1A"}
                  {call.error}
                </div>
              )}

              <div style={styles.snippetLabel}>
                {"\u54CD\u5E94\u6570\u636E\uFF08\u622A\u53D6\uFF09"}
              </div>
              <pre style={styles.snippet}>{call.snippet}</pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
