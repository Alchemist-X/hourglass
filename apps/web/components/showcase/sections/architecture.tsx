"use client";

// Section 6: Technical architecture (4-layer diagram, StS act progression style)

interface ArchLayer {
  readonly act: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icons: readonly string[];
  readonly items: readonly string[];
  readonly borderColor: string;
  readonly bgAccent: string;
}

const LAYERS: readonly ArchLayer[] = [
  {
    act: "\u7B2C\u4E00\u5C42",
    title: "AVE Claw \u76d1\u63a7",
    subtitle: "\u4FE1\u53F7\u5C42",
    icons: ["\ud83d\udcca", "\ud83d\udcc8", "\ud83d\udc0b", "\ud83d\udcc9"],
    items: ["\u4EF7\u683C API", "K\u7EBF API", "\u9CB8\u9C7C\u8FFD\u8E2A", "\u4E70\u5356\u6BD4"],
    borderColor: "#2a9d8f",
    bgAccent: "rgba(42,157,143,0.06)",
  },
  {
    act: "\u7B2C\u4E8C\u5C42",
    title: "AI \u51b3\u7b56\u5f15\u64ce",
    subtitle: "\u5927\u8111\u5C42",
    icons: ["\ud83e\udde0"],
    items: ["\u4fe1\u53f7\u805a\u5408", "\u6982\u7387\u4f30\u7b97", "Edge \u8ba1\u7b97", "\u81EA\u52A8\u7814\u7A76"],
    borderColor: "#5fa8d3",
    bgAccent: "rgba(95,168,211,0.06)",
  },
  {
    act: "\u7B2C\u4E09\u5C42",
    title: "Polymarket \u6267\u884c+\u98ce\u63a7",
    subtitle: "\u6267\u884C\u5C42",
    icons: ["\u2694\ufe0f"],
    items: ["FOK \u8ba2\u5355", "6\u5c42\u98ce\u63a7", "\u514dGas \u7b7e\u540d", "Kelly \u4ED3\u4F4D"],
    borderColor: "#e63946",
    bgAccent: "rgba(230,57,70,0.06)",
  },
  {
    act: "\u7B2C\u56DB\u5C42",
    title: "\u5c55\u793a+\u5f52\u6863",
    subtitle: "\u5C55\u793A\u5C42",
    icons: ["\ud83c\udfc6"],
    items: ["\u4EEA\u8868\u76D8", "\u4ea4\u6613\u8bb0\u5f55", "\u8fd0\u884c\u62a5\u544a", "\u6301\u4ed3\u8ffd\u8e2a"],
    borderColor: "#d4a574",
    bgAccent: "rgba(212,165,116,0.06)",
  },
];

interface TechBadge {
  readonly name: string;
  readonly version: string;
}

const TECH_STACK: readonly TechBadge[] = [
  { name: "TypeScript", version: "5.9" },
  { name: "Next.js", version: "16" },
  { name: "Fastify", version: "5" },
  { name: "BullMQ", version: "5" },
  { name: "Drizzle", version: "ORM" },
];

const STATS: readonly { readonly label: string; readonly value: string }[] = [
  { label: "\u4ee3\u7801", value: "15,000+ \u884c" },
  { label: "\u5DE5\u4F5C\u533A", value: "12 \u5b50\u5305" },
  { label: "\u5386\u53f2\u8fd0\u884c", value: "50+" },
];

function DownArrow() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "4px 0",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 4v14M12 18l-5-5M12 18l5-5"
          stroke="#d4a574"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />
      </svg>
    </div>
  );
}

function LayerCard({ layer }: { readonly layer: ArchLayer }) {
  return (
    <div
      style={{
        border: `2px solid ${layer.borderColor}`,
        borderRadius: 8,
        background: `linear-gradient(135deg, #16213e 0%, #1a2540 100%)`,
        overflow: "hidden",
        boxShadow: `0 0 16px ${layer.borderColor}15, 0 4px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: layer.bgAccent,
          borderBottom: `1px solid ${layer.borderColor}30`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 13,
              fontWeight: 700,
              color: layer.borderColor,
              letterSpacing: 2,
              opacity: 0.8,
            }}
          >
            {layer.act}
          </span>
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#e8e8e8",
            }}
          >
            {layer.title}
          </span>
        </div>
        <span
          style={{
            fontSize: 14,
            color: "#8b8b9e",
            fontStyle: "italic",
          }}
        >
          {layer.subtitle}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>
        {/* Skill icons row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {layer.icons.map((icon, i) => (
            <div
              key={`${layer.act}-icon-${i}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1px solid ${layer.borderColor}50`,
                background: "rgba(15,15,35,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {layer.items.map((item) => (
            <span
              key={item}
              style={{
                fontSize: 14,
                color: "#e8e8e8",
                padding: "4px 10px",
                background: "rgba(15,15,35,0.4)",
                border: `1px solid ${layer.borderColor}20`,
                borderRadius: 4,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Architecture() {
  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Section title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 16, color: "#8b8b9e", letterSpacing: 2 }}>
            {"\ud83d\uddfa\ufe0f"} {"\u67B6\u6784\u56FE"}
          </span>
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#d4a574",
              margin: "8px 0 0",
            }}
          >
            {"\u56db\u5c42\u67b6\u6784"}
          </h2>
        </div>

        {/* Layer stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {LAYERS.map((layer, idx) => (
            <div key={layer.act}>
              <LayerCard layer={layer} />
              {idx < LAYERS.length - 1 && <DownArrow />}
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <h3
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 18,
              fontWeight: 600,
              color: "#8b8b9e",
              margin: "0 0 16px",
              letterSpacing: 2,
            }}
          >
            {"\u6280\u672F\u6808"}
          </h3>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                style={{
                  border: "1px solid rgba(212,165,116,0.3)",
                  borderRadius: 6,
                  background: "rgba(22,33,62,0.6)",
                  padding: "8px 14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#e8e8e8",
                  }}
                >
                  {tech.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#8b8b9e",
                    marginTop: 2,
                  }}
                >
                  {tech.version}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 32,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#d4a574",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    color: "#8b8b9e",
                    marginLeft: 6,
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
