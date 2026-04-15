/**
 * Section 3b: AVE Skill Cards Grid (2x2).
 *
 * Four Slay the Spire style cards, each representing one AVE monitoring
 * skill. Contains inline SVG mini-visualizations, signal bars, and
 * energy orbs -- no external chart libraries needed.
 *
 * Card types follow the STS convention:
 *   - "data" cards (green border) = informational
 *   - "signal" cards (red/gold border) = actionable signals
 */

import {
  skillCardConfigs,
  type SkillCardConfig,
  type PriceCardData,
  type KlineCardData,
  type WhaleCardData,
  type RatioCardData,
  type OhlcCandle,
} from "../data/skill-card-configs";

// ---------------------------------------------------------------------------
// Color constants (from slay-the-spire-reference.md)
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#0f0f23",
  cardBg: "#1C2128",
  cardBgInner: "#161B22",
  border: "#30363D",
  cream: "#FFF6E2",
  gold: "#EFC851",
  goldSoft: "#d4a574",
  muted: "#8B949E",
  green: "#2a9d8f",
  greenBright: "#32A050",
  red: "#e63946",
  redDark: "#B42828",
  blue: "#87CEEB",
  dataBorder: "#2E7D32",
  signalBorder: "#d4a574",
} as const;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "24px",
  maxWidth: "880px",
  margin: "0 auto",
  padding: "0 24px 40px",
};

const sectionStyle: React.CSSProperties = {
  padding: "40px 0",
};

const sectionTitle: React.CSSProperties = {
  textAlign: "center",
  fontFamily: "'Cinzel', 'Iowan Old Style', serif",
  fontSize: "16px",
  letterSpacing: "6px",
  color: "#8b8b9e",
  textTransform: "uppercase",
  marginBottom: "32px",
};

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

function cardStyle(type: "data" | "signal"): React.CSSProperties {
  const borderColor = type === "data" ? COLORS.dataBorder : COLORS.signalBorder;
  return {
    background: COLORS.cardBg,
    border: `2px solid ${borderColor}`,
    borderRadius: "12px",
    padding: "0",
    overflow: "hidden",
    position: "relative",
    boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 12px ${borderColor}33`,
  };
}

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 20px 12px",
};

const cardBodyStyle: React.CSSProperties = {
  padding: "0 20px 16px",
};

const cardFooterStyle: React.CSSProperties = {
  padding: "8px 20px 12px",
  borderTop: `1px solid ${COLORS.border}`,
  fontSize: "12px",
  fontFamily: "'JetBrains Mono', monospace",
  color: COLORS.muted,
  letterSpacing: "0.5px",
};

const typeBadgeStyle = (type: "data" | "signal"): React.CSSProperties => ({
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  padding: "2px 8px",
  borderRadius: "3px",
  background: type === "data" ? "rgba(46,125,50,0.2)" : "rgba(212,165,116,0.2)",
  color: type === "data" ? COLORS.green : COLORS.goldSoft,
  fontWeight: 600,
});

const titleStyle: React.CSSProperties = {
  fontFamily: "'Cinzel', 'Iowan Old Style', serif",
  fontSize: "16px",
  color: COLORS.cream,
  fontWeight: 600,
  letterSpacing: "1px",
  flex: 1,
};

// ---------------------------------------------------------------------------
// Energy Orb — signal score indicator (STS mana cost position)
// ---------------------------------------------------------------------------

function EnergyOrb({ value }: { readonly value: number }) {
  const isPositive = value > 0.05;
  const isNegative = value < -0.05;

  const fillStart = isPositive ? "#2a9d8f" : isNegative ? "#e63946" : "#8b8b9e";
  const fillEnd = isPositive ? "#0e3d38" : isNegative ? "#4a0e14" : "#4a4a5e";
  const glowColor = isPositive ? "rgba(42,157,143,0.5)" : isNegative ? "rgba(230,57,70,0.5)" : "rgba(139,139,158,0.3)";

  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${fillStart}, ${fillEnd})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 12px ${glowColor}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          fontWeight: 700,
          color: "#FFF6E2",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        {value >= 0 ? "+" : ""}
        {value.toFixed(2)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Bar — horizontal indicator from -1 to +1
// ---------------------------------------------------------------------------

function SignalBar({ value, label }: { readonly value: number; readonly label: string }) {
  // value is in [-1, +1], map to percentage position [0, 100]
  const pct = ((value + 1) / 2) * 100;
  const barColor = value > 0.05 ? COLORS.green : value < -0.05 ? COLORS.red : COLORS.muted;

  return (
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          height: "6px",
          borderRadius: "3px",
          background: `linear-gradient(90deg, ${COLORS.red}44, ${COLORS.muted}44, ${COLORS.green}44)`,
          position: "relative",
          marginBottom: "6px",
        }}
      >
        {/* Filled portion from center */}
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            borderRadius: "3px",
            background: barColor,
            left: value >= 0 ? "50%" : `${pct}%`,
            width: `${Math.abs(value) * 50}%`,
          }}
        />
        {/* Marker triangle */}
        <div
          style={{
            position: "absolute",
            top: "-3px",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `6px solid ${COLORS.cream}`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: "13px",
          fontFamily: "'JetBrains Mono', monospace",
          color: barColor,
          textAlign: "center",
          letterSpacing: "0.5px",
        }}
      >
        {"\u4FE1\u53F7"}: {label} ({value >= 0 ? "+" : ""}
        {value.toFixed(2)})
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Viz: Sparkline (Price card — 7 data points)
// ---------------------------------------------------------------------------

function Sparkline({ data }: { readonly data: readonly number[] }) {
  const width = 280;
  const height = 60;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${width - padding},${height} L${padding},${height} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.green} stopOpacity="0.3" />
          <stop offset="100%" stopColor={COLORS.green} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke={COLORS.green} strokeWidth="2" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={points[points.length - 1]?.split(",")[0]} cy={points[points.length - 1]?.split(",")[1]} r="3" fill={COLORS.green} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini Viz: Simplified Candlestick (K-line card)
// ---------------------------------------------------------------------------

function MiniCandlestick({ candles }: { readonly candles: readonly OhlcCandle[] }) {
  const width = 280;
  const height = 80;
  const padding = 4;

  // Use last 15 candles to keep it readable
  const visibleCandles = candles.slice(-15);
  const allPrices = visibleCandles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;

  const candleWidth = (width - 2 * padding) / visibleCandles.length;
  const bodyWidth = candleWidth * 0.6;

  const yScale = (v: number) => height - padding - ((v - min) / range) * (height - 2 * padding);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {visibleCandles.map((c, i) => {
        const x = padding + i * candleWidth + candleWidth / 2;
        const isBullish = c.close >= c.open;
        const color = isBullish ? COLORS.green : COLORS.red;
        const bodyTop = yScale(Math.max(c.open, c.close));
        const bodyBottom = yScale(Math.min(c.open, c.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        return (
          <g key={i}>
            {/* Wick */}
            <line x1={x} y1={yScale(c.high)} x2={x} y2={yScale(c.low)} stroke={color} strokeWidth="1" />
            {/* Body */}
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={isBullish ? color : color}
              fillOpacity={isBullish ? 0.8 : 1}
              stroke={color}
              strokeWidth="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini Viz: Horizontal Bar Chart (Whale card — buy vs sell)
// ---------------------------------------------------------------------------

function WhaleBarChart({ buyVolume, sellVolume }: { readonly buyVolume: number; readonly sellVolume: number }) {
  const maxVol = Math.max(buyVolume, sellVolume);
  const buyPct = (buyVolume / maxVol) * 100;
  const sellPct = (sellVolume / maxVol) * 100;

  const formatVol = (v: number) => `$${(v / 1_000_000).toFixed(0)}M`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <BarRow label={"\u4E70"} pct={buyPct} value={formatVol(buyVolume)} color={COLORS.green} />
      <BarRow label={"\u5356"} pct={sellPct} value={formatVol(sellVolume)} color={COLORS.red} />
    </div>
  );
}

function BarRow({
  label,
  pct,
  value,
  color,
}: {
  readonly label: string;
  readonly pct: number;
  readonly value: string;
  readonly color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "13px", color: COLORS.muted, width: "28px", textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: "10px", borderRadius: "5px", background: `${color}22` }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "5px", background: color, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: "13px", color: COLORS.cream, fontFamily: "'JetBrains Mono', monospace", width: "44px" }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Viz: Ratio Bars (Buy/Sell Ratio card — multi-timeframe)
// ---------------------------------------------------------------------------

function RatioBarChart({ timeframes }: { readonly timeframes: readonly { label: string; buyCount: number; sellCount: number; ratio: number }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {timeframes.slice(0, 3).map((tf) => {
        const total = tf.buyCount + tf.sellCount;
        const buyPct = total > 0 ? (tf.buyCount / total) * 100 : 50;

        return (
          <div key={tf.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: COLORS.muted, width: "24px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
              {tf.label}
            </span>
            <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: COLORS.red, display: "flex", overflow: "hidden" }}>
              <div style={{ width: `${buyPct}%`, height: "100%", background: COLORS.green, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: "13px", color: COLORS.cream, fontFamily: "'JetBrains Mono', monospace", width: "40px" }}>
              {tf.ratio.toFixed(2)}x
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card-specific content renderers
// ---------------------------------------------------------------------------

function PriceCardContent({ data }: { readonly data: PriceCardData }) {
  return (
    <>
      <div style={{ borderRadius: "8px", overflow: "hidden", background: COLORS.cardBgInner, padding: "8px 4px", marginBottom: "12px" }}>
        <Sparkline data={data.priceHistory} />
      </div>
      <DataRow label="ETH \u5F53\u524D" value={`$${data.currentPrice.toLocaleString()}`} />
      <DataRow label={"\u533A\u95F4\u4E2D\u70B9"} value={`$${data.targetPrice.toLocaleString()}`} />
      <DataRow label={"\u8DDD\u79BB\u4E0B\u6CBF"} value={data.changeNeeded} valueColor={COLORS.red} />
    </>
  );
}

function KlineCardContent({ data }: { readonly data: KlineCardData }) {
  return (
    <>
      <div style={{ borderRadius: "8px", overflow: "hidden", background: COLORS.cardBgInner, padding: "8px 4px", marginBottom: "12px" }}>
        <MiniCandlestick candles={data.klineData} />
      </div>
      <DataRow label="MA20" value={`$${data.ma20.toLocaleString()}`} valueColor={COLORS.blue} />
      <DataRow label="MA50" value={`$${data.ma50.toLocaleString()}`} valueColor={COLORS.goldSoft} />
      <DataRow label="MACD" value={`\u91D1\u53C9 \u2726 \u770B\u6DA8`} valueColor={COLORS.green} />
      <DataRow label={"\u6CE2\u52A8\u7387"} value={`${(data.volatility * 100).toFixed(1)}%/\u65E5`} />
    </>
  );
}

function WhaleCardContent({ data }: { readonly data: WhaleCardData }) {
  return (
    <>
      <div style={{ borderRadius: "8px", background: COLORS.cardBgInner, padding: "12px", marginBottom: "12px" }}>
        <WhaleBarChart buyVolume={data.buyVolume} sellVolume={data.sellVolume} />
      </div>
      <DataRow label={"\u51C0\u6D41\u5165"} value={`+$${((data.buyVolume - data.sellVolume) / 1_000_000).toFixed(1)}M`} valueColor={COLORS.green} />
      <DataRow label={"\u5927\u989D\u4EA4\u6613"} value={`${data.largeTradeCount} \u7B14`} />
      <DataRow label={"\u6700\u5927\u5355\u7B14"} value={`$${(data.transactions[0]?.amountUsd ?? 0 / 1_000_000).toFixed(1)}M (${data.transactions[0]?.source ?? "N/A"})`} />
    </>
  );
}

function RatioCardContent({ data }: { readonly data: RatioCardData }) {
  return (
    <>
      <div style={{ borderRadius: "8px", background: COLORS.cardBgInner, padding: "12px", marginBottom: "12px" }}>
        <RatioBarChart timeframes={data.timeframes} />
      </div>
      {data.timeframes.map((tf) => (
        <DataRow key={tf.label} label={tf.label} value={`${tf.buyCount} / ${tf.sellCount}  (${tf.ratio.toFixed(2)}x)`} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared data row
// ---------------------------------------------------------------------------

function DataRow({
  label,
  value,
  valueColor,
}: {
  readonly label: string;
  readonly value: string;
  readonly valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "3px 0",
        fontSize: "14px",
      }}
    >
      <span style={{ color: COLORS.muted }}>{label}</span>
      <span style={{ color: valueColor ?? COLORS.cream, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single skill card
// ---------------------------------------------------------------------------

function SkillCard({ config }: { readonly config: SkillCardConfig }) {
  return (
    <div style={cardStyle(config.type)}>
      {/* Header: orb + title + type badge */}
      <div style={cardHeaderStyle}>
        <EnergyOrb value={config.signalValue} />
        <span style={titleStyle}>
          {config.emoji} {config.title}
        </span>
        <span style={typeBadgeStyle(config.type)}>{config.type === "data" ? "\u6570\u636E" : "\u4FE1\u53F7"}</span>
      </div>

      {/* Body: visualization + data */}
      <div style={cardBodyStyle}>
        <CardContent config={config} />
        <SignalBar value={config.signalValue} label={config.signalLabel} />
      </div>

      {/* Footer: API endpoint */}
      <div style={cardFooterStyle}>{config.apiEndpoint}</div>
    </div>
  );
}

function CardContent({ config }: { readonly config: SkillCardConfig }) {
  switch (config.id) {
    case "price":
      return <PriceCardContent data={config.data as PriceCardData} />;
    case "kline":
      return <KlineCardContent data={config.data as KlineCardData} />;
    case "whale":
      return <WhaleCardContent data={config.data as WhaleCardData} />;
    case "ratio":
      return <RatioCardContent data={config.data as RatioCardData} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function SkillCardsGrid() {
  return (
    <section style={sectionStyle}>
      <div style={sectionTitle}>AVE SKILL {"\u6280\u80FD\u5361"}</div>

      <div style={gridStyle}>
        {skillCardConfigs.map((config) => (
          <SkillCard key={config.id} config={config} />
        ))}
      </div>
    </section>
  );
}
