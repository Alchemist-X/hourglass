"use client";

// Section 2: Why prediction markets need on-chain data
// Two comparison cards (StS card style) + testimonial + core insight

interface ComparisonItem {
  readonly icon: string;
  readonly text: string;
}

const NORMAL_TRADER: readonly ComparisonItem[] = [
  { icon: "\ud83d\udcf0", text: "\u770b\u65b0\u95fb" },
  { icon: "\ud83d\ude30", text: "\u9760\u76f4\u89c9" },
  { icon: "\u23f0", text: "\u5ef6\u8fdf\u5206\u949f" },
  { icon: "\ud83d\udc64", text: "\u624b\u52a8\u64cd\u4f5c" },
  { icon: "\ud83d\udcca", text: "\u8986\u76d6 <10 \u5e02\u573a" },
];

const HOURGLASS: readonly ComparisonItem[] = [
  { icon: "\ud83d\udcca", text: "\u770b\u94fe\u4e0a" },
  { icon: "\ud83e\udd16", text: "AI \u5206\u6790" },
  { icon: "\u26a1", text: "\u79d2\u7ea7\u54cd\u5e94" },
  { icon: "\ud83d\udd04", text: "\u6301\u4e45\u5316\u8fd0\u8425" },
  { icon: "\ud83c\udf10", text: "\u8986\u76d6 130+ \u94fe" },
];

function ComparisonCard({
  title,
  items,
  variant,
}: {
  readonly title: string;
  readonly items: readonly ComparisonItem[];
  readonly variant: "normal" | "gold";
}) {
  const borderColor = variant === "gold" ? "#d4a574" : "#8b8b9e";
  const bgGradient =
    variant === "gold"
      ? "linear-gradient(135deg, #16213e 0%, #1a2540 100%)"
      : "linear-gradient(135deg, #1a1a2e 0%, #1e1e32 100%)";
  const titleColor = variant === "gold" ? "#d4a574" : "#8b8b9e";
  const glowShadow =
    variant === "gold"
      ? "0 0 20px rgba(212, 165, 116, 0.15), 0 4px 24px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(0,0,0,0.4)";

  return (
    <div
      style={{
        flex: "1 1 280px",
        maxWidth: 360,
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        background: bgGradient,
        padding: "28px 24px",
        boxShadow: glowShadow,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Parchment texture overlay for gold card */}
      {variant === "gold" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,165,116,0.3) 2px, rgba(212,165,116,0.3) 3px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Type badge */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: variant === "gold" ? "#1a1a2e" : "#8b8b9e",
          background:
            variant === "gold"
              ? "linear-gradient(135deg, #d4a574, #b8956a)"
              : "rgba(139,139,158,0.15)",
          display: "inline-block",
          padding: "3px 12px",
          borderRadius: 3,
          marginBottom: 16,
        }}
      >
        {variant === "gold" ? "Rare" : "Common"}
      </div>

      <h3
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 22,
          fontWeight: 700,
          color: titleColor,
          margin: "0 0 20px 0",
        }}
      >
        {title}
      </h3>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li
            key={item.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: `1px solid ${variant === "gold" ? "rgba(212,165,116,0.15)" : "rgba(139,139,158,0.1)"}`,
              fontSize: 16,
              color: "#e8e8e8",
            }}
          >
            <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
              {item.icon}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VsBadge() {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #d4a574 0%, #b8956a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Cinzel, serif",
        fontSize: 18,
        fontWeight: 800,
        color: "#1a1a2e",
        boxShadow: "0 0 24px rgba(212,165,116,0.3), 0 4px 12px rgba(0,0,0,0.4)",
        flexShrink: 0,
        alignSelf: "center",
        zIndex: 1,
      }}
    >
      VS
    </div>
  );
}

function Testimonial() {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(240,230,211,0.08) 0%, rgba(240,230,211,0.04) 100%)",
        border: "1px solid rgba(212,165,116,0.2)",
        borderRadius: 8,
        padding: "28px 32px",
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        maxWidth: 720,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Gold quote mark */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 20,
          fontFamily: "Cinzel, serif",
          fontSize: 48,
          color: "rgba(212,165,116,0.2)",
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        {"\u201c"}
      </div>

      {/* Avatar placeholder */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #d4a574 0%, #8b6914 100%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "#1a1a2e",
          fontWeight: 700,
          boxShadow: "0 0 12px rgba(212,165,116,0.2)",
        }}
      >
        D
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: "#e8e8e8",
            margin: "0 0 12px 0",
            fontStyle: "italic",
          }}
        >
          {"\u201c\u94fe\u4e0a\u6570\u636e\u8ba9\u6211\u770b\u5230\u4e86\u9884\u6d4b\u5e02\u573a\u91cc\u522b\u4eba\u770b\u4e0d\u5230\u7684\u4fe1\u53f7\u3002\u4e4b\u524d\u6211\u8981\u76ef 20 \u4e2a Telegram \u7fa4\u624d\u80fd\u6355\u6349\u9cb8\u9c7c\u52a8\u5411\u3002\u73b0\u5728 Hourglass \u81ea\u52a8\u5e2e\u6211\u8ffd\u8e2a 130+ \u6761\u94fe\uff0c\u8fde\u7761\u89c9\u90fd\u5728\u8fd0\u884c\u3002\u201d"}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#8b8b9e",
            margin: 0,
          }}
        >
          {"\u2014\u2014 DeFi \u4ea4\u6613\u5458, \u65e9\u671f\u7528\u6237"}
        </p>
      </div>
    </div>
  );
}

function CoreInsight() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        borderLeft: "4px solid #d4a574",
        paddingLeft: 24,
      }}
    >
      <p
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 24,
          fontWeight: 700,
          color: "#e8e8e8",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {"\u94fe\u4e0a\u6570\u636e\u662f\u9884\u6d4b\u5e02\u573a\u7684\u5148\u884c\u6307\u6807"}
      </p>
      <p
        style={{
          fontSize: 15,
          color: "#8b8b9e",
          lineHeight: 1.7,
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        {"\u9cb8\u9c7c\u5728\u4e70\u5165 \u2192 \u4ef7\u683c\u8fd8\u6ca1\u52a8 \u2192 \u8d54\u7387\u8fd8\u6ca1\u8c03\u6574 \u2192 Hourglass \u5c31\u5df2\u7ecf\u53d1\u73b0\u4e86 edge\u3002"}
      </p>
    </div>
  );
}

export function ProblemSolution() {
  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
        position: "relative",
      }}
    >
      {/* Subtle parchment overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(240,230,211,0.5) 4px, rgba(240,230,211,0.5) 5px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section title */}
        <h2
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 32,
            fontWeight: 700,
            color: "#d4a574",
            textAlign: "center",
            margin: "0 0 48px 0",
          }}
        >
          {"\u4e3a\u4ec0\u4e48\u9884\u6d4b\u5e02\u573a\u9700\u8981\u94fe\u4e0a\u6570\u636e\uff1f"}
        </h2>

        {/* Comparison cards */}
        <div
          style={{
            display: "flex",
            gap: 0,
            justifyContent: "center",
            alignItems: "stretch",
            flexWrap: "wrap",
            marginBottom: 48,
          }}
        >
          <ComparisonCard
            title={"\u666e\u901a\u4ea4\u6613\u8005"}
            items={NORMAL_TRADER}
            variant="normal"
          />
          <VsBadge />
          <ComparisonCard
            title="Hourglass"
            items={HOURGLASS}
            variant="gold"
          />
        </div>

        {/* Testimonial */}
        <div style={{ marginBottom: 48 }}>
          <Testimonial />
        </div>

        {/* Core insight */}
        <CoreInsight />
      </div>
    </section>
  );
}
