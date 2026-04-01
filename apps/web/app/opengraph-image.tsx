import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AutoPoly — Autonomous Polymarket Trading Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 40%, #16213e 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
          padding: "60px 80px",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            padding: "8px 20px",
            borderRadius: "24px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            background: "rgba(56, 189, 248, 0.08)",
            fontSize: "18px",
            color: "#38bdf8",
            letterSpacing: "0.05em",
          }}
        >
          WORLD&apos;S FIRST AUTONOMOUS POLYMARKET AGENT
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: "20px",
            background: "linear-gradient(to right, #ffffff, #94a3b8)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          AutoPoly
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "800px",
          }}
        >
          AI-powered prediction market trading.
          <br />
          Full-market coverage. Long-horizon reasoning.
        </div>

        {/* Bottom stats */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "40px",
            fontSize: "16px",
            color: "#64748b",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>LIVE</span>
            <span>TRADING</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>7800+</span>
            <span>MARKETS SCANNED</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>24/7</span>
            <span>AUTONOMOUS</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
