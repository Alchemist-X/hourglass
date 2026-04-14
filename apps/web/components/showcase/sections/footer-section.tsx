"use client";

// Section 7: Footer with relic bar (dark background, StS ending style)

interface RelicItem {
  readonly label: string;
  readonly value: string;
  readonly paramName: string;
}

const RELIC_ITEMS: readonly RelicItem[] = [
  { label: "\u5355\u7b14\u4e0a\u9650", value: "15%", paramName: "MAX_TRADE" },
  { label: "\u603b\u655e\u53e3", value: "80%", paramName: "EXPOSURE" },
  { label: "\u4e8b\u4ef6\u4e0a\u9650", value: "30%", paramName: "EVENT_EXP" },
  { label: "\u6700\u5927\u6301\u4ed3", value: "22", paramName: "MAX_POS" },
  { label: "\u6b62\u635f\u7ebf", value: "30%", paramName: "DRAWDOWN" },
  { label: "\u6700\u4f4e\u4ea4\u6613", value: "$5", paramName: "MIN_TRADE" },
];

function MiniShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2L4 5v4.5c0 4.14 2.56 8.01 6 9.5 3.44-1.49 6-5.36 6-9.5V5l-6-3z"
        fill="#2a9d8f"
        fillOpacity={0.3}
        stroke="#2a9d8f"
        strokeWidth={1}
      />
      <path
        d="M7.5 10l2 2 3-3"
        stroke="#2a9d8f"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StickyRelicBar() {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15,15,35,0.95)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(212,165,116,0.2)",
        padding: "10px 24px",
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#8b8b9e",
            fontWeight: 600,
            letterSpacing: 1,
            marginRight: 8,
          }}
        >
          RELICS
        </span>
        {RELIC_ITEMS.map((relic) => (
          <div
            key={relic.paramName}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 4,
              background: "rgba(42,157,143,0.08)",
              border: "1px solid rgba(42,157,143,0.15)",
            }}
            title={`${relic.label} (${relic.paramName})`}
          >
            <MiniShieldIcon />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                fontWeight: 600,
                color: "#e8e8e8",
              }}
            >
              {relic.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FooterSection() {
  return (
    <>
      <footer
        style={{
          padding: "64px 24px 100px",
          background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#d4a574",
            letterSpacing: 6,
            marginBottom: 8,
          }}
        >
          {"\u231b"} H O U R G L A S S
        </div>

        {/* Hackathon badge */}
        <div
          style={{
            fontSize: 14,
            color: "#8b8b9e",
            marginBottom: 28,
          }}
        >
          AVE Claw Hackathon 2026
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 1,
            background: "linear-gradient(90deg, transparent, #d4a574, transparent)",
            margin: "0 auto 28px",
          }}
        />

        {/* Links */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <a
            href="https://github.com/Alchemist-X/hourglass"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              border: "1px solid rgba(212,165,116,0.3)",
              borderRadius: 6,
              background: "rgba(22,33,62,0.4)",
              color: "#e8e8e8",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
          <a
            href="https://hourglass-eta.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              border: "1px solid rgba(212,165,116,0.3)",
              borderRadius: 6,
              background: "rgba(22,33,62,0.4)",
              color: "#e8e8e8",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 8h12M8 1c-2 2.5-2 5-2 7s0 4.5 2 7M8 1c2 2.5 2 5 2 7s0 4.5-2 7" stroke="currentColor" strokeWidth="1" />
            </svg>
            Live Demo
          </a>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 14,
            fontWeight: 600,
            color: "#d4a574",
            marginBottom: 16,
          }}
        >
          4 AVE Skills {"\u00d7"} 7 Markets {"\u00d7"} Real Trades
        </div>

        {/* Quote */}
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -8,
              left: -4,
              fontFamily: "Cinzel, serif",
              fontSize: 36,
              color: "rgba(212,165,116,0.2)",
              lineHeight: 1,
            }}
          >
            {"\u201c"}
          </span>
          <p
            style={{
              fontSize: 16,
              color: "rgba(240,230,211,0.7)",
              fontStyle: "italic",
              lineHeight: 1.6,
              margin: 0,
              paddingLeft: 20,
            }}
          >
            {"\u7528\u94fe\u4e0a\u6570\u636e\uff0c\u5728\u9884\u6d4b\u5e02\u573a\u627e\u5230\u522b\u4eba\u770b\u4e0d\u5230\u7684 edge"}
          </p>
        </div>
      </footer>

      {/* Sticky relic bar at very bottom */}
      <StickyRelicBar />
    </>
  );
}
