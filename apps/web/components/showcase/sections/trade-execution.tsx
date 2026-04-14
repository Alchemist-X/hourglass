"use client";

// Section 4: Trade execution + Risk controls (StS battle execution phase)

interface TradeDetail {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}

const TRADE_DETAILS: readonly TradeDetail[] = [
  { label: "\u64CD\u4F5C", value: "\u4E70\u5165 Yes", highlight: true },
  { label: "\u4EFD\u6570", value: "5 (\u603B\u8BA1 162.34)" },
  { label: "\u4EF7\u683C", value: "$0.031" },
  { label: "\u6210\u672C", value: "$0.155" },
  { label: "Kelly", value: "1/4 \u4FDD\u5B88\u7B56\u7565" },
  { label: "\u7B7E\u540D", value: "\u514DGas (Type 2)" },
];

interface RelicCheck {
  readonly name: string;
  readonly description: string;
  readonly actual: string;
  readonly limit: string;
  readonly passed: boolean;
}

const RELIC_CHECKS: readonly RelicCheck[] = [
  { name: "MAX_TRADE", description: "\u5355\u7B14\u4E0A\u9650", actual: "0.8%", limit: "15%", passed: true },
  { name: "EXPOSURE", description: "\u603B\u655E\u53E3", actual: "62%", limit: "80%", passed: true },
  { name: "MAX_POS", description: "\u6301\u4ED3\u6570", actual: "2", limit: "10", passed: true },
  { name: "DRAWDOWN", description: "\u56DE\u64A4", actual: "0%", limit: "30%", passed: true },
  { name: "STOP_LOSS", description: "\u6B62\u635F", actual: "\u5DF2\u8BBE\u7F6E", limit: "30%", passed: true },
  { name: "MIN_TRADE", description: "\u6700\u4F4E\u4EA4\u6613", actual: "$0.15", limit: "$0.50", passed: true },
];

function ShieldIcon({ passed }: { readonly passed: boolean }) {
  const color = passed ? "#2a9d8f" : "#e63946";
  const glowColor = passed
    ? "rgba(42, 157, 143, 0.4)"
    : "rgba(230, 57, 70, 0.4)";

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
    >
      <path
        d="M16 3L5 8v7c0 7.73 4.66 14.96 11 17 6.34-2.04 11-9.27 11-17V8L16 3z"
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={1.5}
      />
      {passed ? (
        <path
          d="M12 16l3 3 5-5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <line x1="12" y1="12" x2="20" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <line x1="20" y1="12" x2="12" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function TradeCard() {
  return (
    <div
      style={{
        flex: "1 1 340px",
        maxWidth: 420,
        border: "2px solid #e63946",
        borderRadius: 8,
        background: "linear-gradient(135deg, #16213e 0%, #1a2540 100%)",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(230, 57, 70, 0.1), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: "linear-gradient(135deg, #e63946, #c1121f)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 1,
          }}
        >
          {"\u4EA4\u6613\u5361"}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          {"\u4FE1\u53F7\u5361"}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "24px 20px" }}>
        {TRADE_DETAILS.map((detail) => (
          <div
            key={detail.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid rgba(212,165,116,0.08)",
            }}
          >
            <span style={{ fontSize: 16, color: "#8b8b9e" }}>
              {detail.label}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 16,
                fontWeight: detail.highlight ? 700 : 500,
                color: detail.highlight ? "#2a9d8f" : "#e8e8e8",
              }}
            >
              {detail.value}
            </span>
          </div>
        ))}

        {/* Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0 4px",
            borderBottom: "1px solid rgba(212,165,116,0.08)",
          }}
        >
          <span style={{ fontSize: 16, color: "#8b8b9e" }}>{"\u72B6\u6001"}</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#2a9d8f",
            }}
          >
            {"\u2705 \u5DF2\u6267\u884C"}
          </span>
        </div>

        {/* TxHash */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0 0",
          }}
        >
          <span style={{ fontSize: 16, color: "#8b8b9e" }}>TxHash</span>
          <a
            href="https://polygonscan.com/tx/0x3e3f"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 14,
              color: "#5fa8d3",
              textDecoration: "none",
              borderBottom: "1px dashed rgba(95,168,211,0.4)",
            }}
          >
            0x3e3f...
          </a>
        </div>
      </div>
    </div>
  );
}

function RelicBar() {
  return (
    <div
      style={{
        flex: "1 1 340px",
        maxWidth: 480,
        border: "2px solid #d4a574",
        borderRadius: 8,
        background: "linear-gradient(135deg, #16213e 0%, #1a2540 100%)",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(212,165,116,0.1), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #d4a574, #b8956a)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#1a1a2e",
            letterSpacing: 1,
          }}
        >
          {"\u98CE\u63A7\u68C0\u67E5"}
        </span>
        <span style={{ fontSize: 13, color: "rgba(26,26,46,0.6)" }}>
          {"\u98CE\u9669\u63A7\u5236"}
        </span>
      </div>

      {/* Relic icons row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          padding: "16px 16px 8px",
          borderBottom: "1px solid rgba(212,165,116,0.1)",
        }}
      >
        {RELIC_CHECKS.map((relic) => (
          <div
            key={relic.name}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `2px solid ${relic.passed ? "#d4a574" : "#e63946"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(22,33,62,0.8)",
            }}
          >
            <ShieldIcon passed={relic.passed} />
          </div>
        ))}
      </div>

      {/* Relic checks list */}
      <div style={{ padding: "12px 20px 20px" }}>
        {RELIC_CHECKS.map((relic) => (
          <div
            key={relic.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid rgba(212,165,116,0.06)",
            }}
          >
            <span style={{ fontSize: 15, color: relic.passed ? "#2a9d8f" : "#e63946" }}>
              {relic.passed ? "\u2705" : "\u26a0\ufe0f"}
            </span>
            <span style={{ fontSize: 15, color: "#8b8b9e", flex: 1 }}>
              {relic.description}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 14,
                color: "#e8e8e8",
              }}
            >
              {relic.actual}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                color: "#8b8b9e",
              }}
            >
              {"\u2264"} {relic.limit}
            </span>
          </div>
        ))}

        {/* Summary */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "rgba(42, 157, 143, 0.08)",
            border: "1px solid rgba(42, 157, 143, 0.2)",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 17,
              fontWeight: 600,
              color: "#2a9d8f",
            }}
          >
            {"6 \u5c42\u98ce\u63a7\u5168\u90e8\u901a\u8fc7"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PortfolioHpBar() {
  const currentEquity = 17.94;
  const maxEquity = 20.0;
  const pct = (currentEquity / maxEquity) * 100;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* HP bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18 }}>{"\u2764\ufe0f"}</span>
        <div
          style={{
            flex: 1,
            height: 24,
            background: "rgba(230,57,70,0.2)",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #2a9d8f, #34b8a8)",
              borderRadius: 4,
              transition: "width 1.2s ease-out",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            ${currentEquity.toFixed(2)} / ${maxEquity.toFixed(2)} ({pct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Block/Drawdown bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18 }}>{"\ud83d\udee1\ufe0f"}</span>
        <div
          style={{
            flex: 1,
            height: 18,
            background: "rgba(95,168,211,0.1)",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, #5fa8d3, #7bbde0)",
              borderRadius: 4,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {"\u56DE\u64A4"}: 0%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TradeExecution() {
  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #16213e 0%, #1a2540 50%, #16213e 100%)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Section title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 16, color: "#8b8b9e", letterSpacing: 2 }}>
            {"\u2694\ufe0f"} {"\u6267\u884C\u4EA4\u6613"}
          </span>
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 36,
              fontWeight: 700,
              color: "#d4a574",
              margin: "8px 0 0",
            }}
          >
            {"\u4ea4\u6613\u6267\u884c + \u98ce\u63a7"}
          </h2>
        </div>

        {/* Two columns */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 40,
          }}
        >
          <TradeCard />
          <RelicBar />
        </div>

        {/* HP Bar */}
        <PortfolioHpBar />
      </div>
    </section>
  );
}
