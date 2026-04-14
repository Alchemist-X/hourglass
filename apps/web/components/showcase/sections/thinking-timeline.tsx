"use client";

// Section 5 addon: AI thinking process timeline
// Shows the actual thought process for the BTC $150K trade

interface TimelineStep {
  readonly timestamp: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly signal?: number;
  readonly details?: readonly string[];
}

const TIMELINE_STEPS: readonly TimelineStep[] = [
  {
    timestamp: "0.0s",
    icon: "\ud83d\udcca",
    title: "\u4ef7\u683c\u83b7\u53d6",
    description: "BTC $94,200 (\u8ddd\u76ee\u6807 +59.2%)",
    details: [
      "AVE Price API \u2192 BTC = $94,200",
      "\u76ee\u6807\u4ef7\u683c: $150,000",
      "\u9700\u8981\u6da8\u5e45: +59.2%",
    ],
  },
  {
    timestamp: "0.3s",
    icon: "\ud83d\udcc8",
    title: "K\u7ebf\u5206\u6790",
    description: "MA20>MA50, MACD\u91d1\u53c9, \u8d8b\u52bf\u770b\u6da8",
    signal: 0.73,
    details: [
      "MA20: $93,800 > MA50: $91,200",
      "MACD: \u91d1\u53c9 \u2666 \u770b\u6da8",
      "\u6ce2\u52a8\u7387: 3.2%/\u65e5",
    ],
  },
  {
    timestamp: "0.8s",
    icon: "\ud83d\udc0b",
    title: "\u9cb8\u9c7c\u626b\u63cf",
    description: "47\u7b14>$100K\u4ea4\u6613, \u51c0\u4e70\u5165+$24.2M",
    signal: 0.4,
    details: [
      "\u4e70\u5165: $42M (47\u7b14\u5927\u989d\u4ea4\u6613)",
      "\u5356\u51fa: $18M",
      "\u51c0\u4e70\u5165: +$24.2M",
    ],
  },
  {
    timestamp: "1.2s",
    icon: "\ud83d\udcc9",
    title: "\u4e70\u5356\u6bd4",
    description: "5m:1.86x, 1h:1.59x, 6h:1.14x",
    signal: 0.31,
    details: [
      "5\u5206\u949f: \u4e70/\u5356 = 1.86x",
      "1\u5c0f\u65f6: \u4e70/\u5356 = 1.59x",
      "6\u5c0f\u65f6: \u4e70/\u5356 = 1.14x",
    ],
  },
  {
    timestamp: "1.5s",
    icon: "\u26a1",
    title: "\u7efc\u5408\u5224\u65ad",
    description: "\u5F97\u5206 +0.52, \u6982\u738721% vs \u8d54\u73873.1%, Edge +17.9%",
    signal: 0.52,
    details: [
      "\u8D8B\u52BF \u00d7 0.4 + \u9CB8\u9C7C \u00d7 0.3 + \u60C5\u7EEA \u00d7 0.3 = +0.52",
      "\u6211\u4eec\u7684\u6982\u7387: 21%",
      "\u5e02\u573a\u8d54\u7387: 3.1%",
      "Edge: +17.9% \u2190 \u663e\u8457\u6b63 Edge",
    ],
  },
  {
    timestamp: "2.1s",
    icon: "\u2705",
    title: "\u6267\u884c",
    description: "\u4E70\u5165 5 \u4EFD @ $0.031, \u98ce\u63a7\u901a\u8fc7",
    details: [
      "\u7c7b\u578b: FOK (Fill-or-Kill)",
      "\u7b7e\u540d: Type 2 (\u514dGas)",
      "\u4ef7\u683c: $0.031 \u00d7 5 = $0.155",
      "TxHash: 0x3e3f...",
      "\u72b6\u6001: \u2705 \u5df2\u6210\u4ea4",
    ],
  },
];

function SignalOrb({ value }: { readonly value: number }) {
  const isPositive = value >= 0;
  const color = isPositive ? "#2a9d8f" : "#e63946";
  const glowColor = isPositive
    ? "rgba(42, 157, 143, 0.5)"
    : "rgba(230, 57, 70, 0.5)";

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, ${isPositive ? "#1a6b61" : "#8b1a25"} 70%, ${isPositive ? "#0e3d38" : "#4a0e14"} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 12px ${glowColor}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {value >= 0 ? "+" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
}

function TimelineNode({
  step,
  isLast,
}: {
  readonly step: TimelineStep;
  readonly isLast: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 20, position: "relative" }}>
      {/* Left: timestamp */}
      <div
        style={{
          width: 60,
          flexShrink: 0,
          textAlign: "right",
          paddingTop: 8,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 14,
            fontWeight: 600,
            color: "#d4a574",
          }}
        >
          [{step.timestamp}]
        </span>
      </div>

      {/* Center: connector line + node */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 24,
          flexShrink: 0,
        }}
      >
        {/* Node circle */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid #d4a574",
            background: "#16213e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            zIndex: 1,
            marginTop: 8,
          }}
        >
          {step.icon}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              background:
                "repeating-linear-gradient(180deg, #d4a574 0, #d4a574 4px, transparent 4px, transparent 8px)",
              minHeight: 20,
            }}
          />
        )}
      </div>

      {/* Right: step details card */}
      <div
        style={{
          flex: 1,
          border: "1px solid rgba(212,165,116,0.15)",
          borderRadius: 8,
          background: "rgba(22,33,62,0.6)",
          padding: "14px 18px",
          marginBottom: isLast ? 0 : 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: step.details ? 10 : 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 17,
                fontWeight: 600,
                color: "#e8e8e8",
              }}
            >
              {step.title}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#8b8b9e",
                marginLeft: 8,
              }}
            >
              {"\u2014"} {step.description}
            </span>
          </div>
          {step.signal !== undefined && <SignalOrb value={step.signal} />}
        </div>

        {step.details && (
          <div
            style={{
              borderTop: "1px solid rgba(212,165,116,0.08)",
              paddingTop: 8,
            }}
          >
            {step.details.map((detail) => (
              <div
                key={detail}
                style={{
                  fontSize: 13,
                  color: "#8b8b9e",
                  padding: "3px 0",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {detail}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ThinkingTimeline() {
  return (
    <section
      style={{
        padding: "60px 24px 80px",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Section title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 16, color: "#8b8b9e", letterSpacing: 2 }}>
            {"\ud83e\udde0"} {"\u601D\u8003\u8FC7\u7A0B"}
          </span>
          <h3
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#d4a574",
              margin: "8px 0 4px",
            }}
          >
            AI {"\u601d\u8003\u8fc7\u7a0b"}
          </h3>
          <p style={{ fontSize: 16, color: "#8b8b9e", margin: 0 }}>
            {"\u4ee5 \"BTC hit $150K\" \u4e3a\u4f8b\uff0c\u5c55\u793a\u5b8c\u6574\u63a8\u7406 \u2192 \u6267\u884c\u94fe"}
          </p>
        </div>

        {/* Timeline */}
        <div>
          {TIMELINE_STEPS.map((step, idx) => (
            <TimelineNode
              key={step.timestamp}
              step={step}
              isLast={idx === TIMELINE_STEPS.length - 1}
            />
          ))}
        </div>

        {/* Total time emphasis */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: "20px 24px",
            border: "2px solid rgba(212,165,116,0.2)",
            borderRadius: 8,
            background: "rgba(212,165,116,0.04)",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 38,
              fontWeight: 700,
              color: "#d4a574",
              textShadow: "0 0 20px rgba(212,165,116,0.3)",
            }}
          >
            ~2.1 {"\u79d2"}
          </div>
          <div style={{ fontSize: 16, color: "#8b8b9e", marginTop: 4 }}>
            {"\u4ece\u4fe1\u53f7\u91c7\u96c6\u5230\u6210\u4ea4 \u2014 \u79d2\u7ea7\u54cd\u5e94"}
          </div>
        </div>
      </div>
    </section>
  );
}
