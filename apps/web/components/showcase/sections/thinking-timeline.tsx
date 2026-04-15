"use client";

// Section 5 addon: AI thinking process timeline
// Shows the actual thought process for the ETH $2,400-$2,500 range trade

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
    title: "价格获取",
    description: "ETH $2,319.43（距离 $2,400-$2,500 区间下沿 3.5%）",
    details: [
      "AVE Price API → ETH = $2,319.43",
      "目标区间: $2,400 - $2,500",
      "距离下沿: 3.5%",
    ],
  },
  {
    timestamp: "0.3s",
    icon: "\ud83d\udcc8",
    title: "K线分析",
    description: "ETH MA20 > MA50, MACD 金叉, 趋势得分 +0.55",
    signal: 0.55,
    details: [
      "MA20: $2,305 > MA50: $2,240",
      "MACD: 金叉 ♦ 看涨",
      "波动率: 2.8%/日",
    ],
  },
  {
    timestamp: "0.8s",
    icon: "\ud83d\udc0b",
    title: "鲸鱼扫描",
    description: "ETH 过去 1h 净买入 +$1.8M, 鲸鱼得分 +0.32",
    signal: 0.32,
    details: [
      "买入: $3.2M",
      "卖出: $1.4M",
      "净买入: +$1.8M (1h)",
    ],
  },
  {
    timestamp: "1.2s",
    icon: "\ud83d\udcc9",
    title: "买卖比",
    description: "5m:1.4x, 1h:1.25x, 6h:1.1x, 情绪得分 +0.28",
    signal: 0.28,
    details: [
      "5分钟: 买/卖 = 1.4x",
      "1小时: 买/卖 = 1.25x",
      "6小时: 买/卖 = 1.1x",
    ],
  },
  {
    timestamp: "1.5s",
    icon: "\u26a1",
    title: "综合判断",
    description: "综合分 +0.42, 我们估算 36% vs 赔率 17%, Edge +18%",
    signal: 0.42,
    details: [
      "趋势 × 0.4 + 鲸鱼 × 0.3 + 情绪 × 0.3 = +0.42",
      "我们的概率: 36%",
      "市场赔率: 17%",
      "Edge: +18% (已扣 2% 手续费) ← 显著正 Edge",
    ],
  },
  {
    timestamp: "2.1s",
    icon: "\u2705",
    title: "执行",
    description: "BUY 5 shares YES @ $0.17, 风控通过",
    details: [
      "类型: FOK (Fill-or-Kill)",
      "签名: Type 2 (免Gas)",
      "价格: $0.17 × 5 = $0.85",
      "TxHash: 0x3e3f...",
      "状态: ✅ 已成交",
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
            {"以 \"ETH $2,400-$2,500 on Apr 16\" 为例，展示完整推理 → 执行链"}
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
