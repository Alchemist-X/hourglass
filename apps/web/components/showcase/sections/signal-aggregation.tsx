/**
 * Section 3c: Signal Aggregation + Edge Calculation.
 *
 * "Boss battle settlement" — shows:
 * 1. Four signals flowing into a weighted sum
 * 2. Overall signal bar (boss HP bar style)
 * 3. Three comparison circles: our probability, market odds, edge
 * 4. AI reasoning quote box (parchment style)
 *
 * Data mapping follows ave-signal-to-probability.ts ProbabilityEstimate.
 */

import { skillCardConfigs, OVERALL_SCORE, OVERALL_LABEL } from "../data/skill-card-configs";
import { edgeCalculation, aiReasoning } from "../data/mock-trade-data";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const C = {
  bg: "#1a1a2e",
  cardBg: "#16213e",
  border: "#30363D",
  cream: "#FFF6E2",
  gold: "#d4a574",
  goldBright: "#EFC851",
  muted: "#8b8b9e",
  green: "#2a9d8f",
  greenGlow: "rgba(42,157,143,0.4)",
  red: "#e63946",
  parchment: "#f0e6d3",
  parchmentDark: "#d4c4a8",
  ink: "#1a1a2e",
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignalAggregation() {
  return (
    <section
      style={{
        padding: "40px 24px 80px",
        maxWidth: "880px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
      }}
    >
      {/* Weighted formula */}
      <WeightedFormula />

      {/* Overall signal bar */}
      <OverallSignalBar score={OVERALL_SCORE} label={OVERALL_LABEL} />

      {/* Edge calculation */}
      <EdgeCalculation />

      {/* AI reasoning */}
      <AiReasoningBox />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Weighted Formula: PRICE*0.1 + KLINE*0.4 + WHALE*0.3 + RATIO*0.3
// ---------------------------------------------------------------------------

function WeightedFormula() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Cinzel', 'Iowan Old Style', serif",
          fontSize: "16px",
          letterSpacing: "6px",
          color: C.muted,
          textTransform: "uppercase",
          marginBottom: "28px",
        }}
      >
        {"\u4FE1\u53F7\u805A\u5408"}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {skillCardConfigs.map((cfg, i) => {
          const weighted = cfg.signalValue * cfg.weight;
          return (
            <span key={cfg.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {i > 0 && (
                <span style={{ color: C.muted, fontSize: "18px", margin: "0 4px" }}>+</span>
              )}
              <SignalOrb value={cfg.signalValue} size={36} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "14px",
                  color: C.cream,
                }}
              >
                <span style={{ color: C.muted }}>{cfg.title.split(" ")[0]}</span>
                {"\u00D7"}
                {cfg.weight}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  color: C.muted,
                }}
              >
                ({weighted >= 0 ? "+" : ""}
                {weighted.toFixed(3)})
              </span>
            </span>
          );
        })}

        <span style={{ color: C.gold, fontSize: "22px", margin: "0 8px" }}>=</span>

        <SignalOrb value={OVERALL_SCORE} size={48} isGold />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Orb (reusable, supports gold variant)
// ---------------------------------------------------------------------------

function SignalOrb({
  value,
  size,
  isGold = false,
}: {
  readonly value: number;
  readonly size: number;
  readonly isGold?: boolean;
}) {
  const positive = value > 0.05;
  const negative = value < -0.05;

  let fillStart: string;
  let fillEnd: string;
  let glow: string;

  if (isGold) {
    fillStart = "#EFC851";
    fillEnd = "#8B6914";
    glow = "rgba(239,200,81,0.5)";
  } else if (positive) {
    fillStart = "#2a9d8f";
    fillEnd = "#0e3d38";
    glow = "rgba(42,157,143,0.4)";
  } else if (negative) {
    fillStart = "#e63946";
    fillEnd = "#4a0e14";
    glow = "rgba(230,57,70,0.4)";
  } else {
    fillStart = "#8b8b9e";
    fillEnd = "#4a4a5e";
    glow = "rgba(139,139,158,0.3)";
  }

  const fontSize = size <= 36 ? 10 : 14;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${fillStart}, ${fillEnd})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 ${size / 3}px ${glow}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          color: C.cream,
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
// Overall Signal Bar (Boss HP bar style)
// ---------------------------------------------------------------------------

function OverallSignalBar({ score, label }: { readonly score: number; readonly label: string }) {
  // Map score from [-1, +1] to [0%, 100%]
  const pct = ((score + 1) / 2) * 100;
  const barColor = score > 0.05 ? C.green : score < -0.05 ? C.red : C.muted;

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: C.muted,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        {"\u7EFC\u5408\u4FE1\u53F7"}
      </div>

      {/* Bar */}
      <div
        style={{
          height: "12px",
          borderRadius: "6px",
          background: `linear-gradient(90deg, ${C.red}55 0%, ${C.muted}33 50%, ${C.green}55 100%)`,
          position: "relative",
          marginBottom: "8px",
        }}
      >
        {/* Fill from center */}
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            borderRadius: "6px",
            background: barColor,
            left: score >= 0 ? "50%" : `${pct}%`,
            width: `${Math.abs(score) * 50}%`,
            boxShadow: `0 0 8px ${barColor}88`,
          }}
        />
        {/* Marker */}
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `8px solid ${C.cream}`,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
          }}
        />
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
          color: C.muted,
        }}
      >
        <span>-1.0</span>
        <span>0.0</span>
        <span
          style={{
            color: barColor,
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {label} (+{score.toFixed(2)})
        </span>
        <span>+1.0</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edge Calculation — three comparison circles
// ---------------------------------------------------------------------------

function EdgeCalculation() {
  const edge = edgeCalculation;

  return (
    <div
      style={{
        background: C.cardBg,
        border: `2px solid ${C.gold}`,
        borderRadius: "12px",
        padding: "32px 24px",
        boxShadow: `0 0 40px rgba(212,165,116,0.1)`,
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', 'Iowan Old Style', serif",
          fontSize: "16px",
          letterSpacing: "4px",
          color: C.gold,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        {"\u8FB9\u9645\u4F18\u52BF\u8BA1\u7B97"}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "48px",
          flexWrap: "wrap",
        }}
      >
        <ProbabilityCircle label={"\u6211\u4EEC\u7684\u6982\u7387"} value={edge.ourProbabilityPct} color={C.green} subLabel="AVE \u4FE1\u53F7" />

        <div
          style={{
            fontSize: "28px",
            color: C.muted,
            fontWeight: 300,
          }}
        >
          vs
        </div>

        <ProbabilityCircle label={"\u5E02\u573A\u8D54\u7387"} value={edge.marketOddsPct} color={C.muted} subLabel="Polymarket" />

        <div
          style={{
            fontSize: "28px",
            color: C.muted,
            fontWeight: 300,
          }}
        >
          =
        </div>

        <EdgeCircle value={edge.edgePct} />
      </div>
    </div>
  );
}

function ProbabilityCircle({
  label,
  value,
  color,
  subLabel,
}: {
  readonly label: string;
  readonly value: string;
  readonly color: string;
  readonly subLabel: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>{label}</div>
      <div
        style={{
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          border: `3px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}11`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "32px",
            fontWeight: 700,
            color: C.cream,
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ fontSize: "12px", color: C.muted, marginTop: "8px" }}>{subLabel}</div>
    </div>
  );
}

function EdgeCircle({ value }: { readonly value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: C.gold, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>{"\u8FB9\u9645\u4F18\u52BF"} (Edge)</div>
      <div
        style={{
          width: "130px",
          height: "130px",
          borderRadius: "50%",
          border: `3px solid ${C.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle, rgba(42,157,143,0.15), rgba(42,157,143,0.02))`,
          boxShadow: `0 0 30px ${C.greenGlow}, 0 0 60px rgba(42,157,143,0.15)`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "36px",
            fontWeight: 700,
            color: C.green,
            textShadow: `0 0 20px ${C.greenGlow}`,
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ fontSize: "12px", color: C.muted, marginTop: "8px" }}>{"\u4FE1\u606F\u4F18\u52BF"}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Reasoning Box (parchment style)
// ---------------------------------------------------------------------------

function AiReasoningBox() {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.parchment}, ${C.parchmentDark})`,
        borderRadius: "12px",
        padding: "28px 32px",
        position: "relative",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      {/* Gold quote marks */}
      <span
        style={{
          position: "absolute",
          top: "12px",
          left: "16px",
          fontSize: "48px",
          fontFamily: "Georgia, serif",
          color: C.gold,
          opacity: 0.4,
          lineHeight: 1,
        }}
      >
        {"\u201C"}
      </span>

      <div
        style={{
          fontSize: "18px",
          lineHeight: 1.8,
          color: C.ink,
          fontStyle: "italic",
          padding: "8px 24px 0",
        }}
      >
        {aiReasoning.text}
      </div>

      <div
        style={{
          textAlign: "right",
          marginTop: "16px",
          paddingRight: "24px",
          fontSize: "15px",
          color: C.gold,
          fontWeight: 600,
        }}
      >
        {"\u2014"} {aiReasoning.attribution}
      </div>
    </div>
  );
}
