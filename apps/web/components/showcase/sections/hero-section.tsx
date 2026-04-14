"use client";

import { useEffect, useState } from "react";
import "../sts-theme/sts-theme.css";

/* -----------------------------------------------------------
   Star field: generates deterministic positions from a seed
   so the layout is stable across renders.
   ----------------------------------------------------------- */
function generateStars(count: number): Array<{
  left: string;
  top: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
}> {
  const stars: Array<{
    left: string;
    top: string;
    size: number;
    duration: string;
    delay: string;
    opacity: number;
  }> = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 7919 + 104729) % 100000;
    stars.push({
      left: `${(seed % 1000) / 10}%`,
      top: `${((seed * 3) % 1000) / 10}%`,
      size: 1 + (seed % 3),
      duration: `${2 + (seed % 4)}s`,
      delay: `${(seed % 3000) / 1000}s`,
      opacity: 0.15 + ((seed % 50) / 100),
    });
  }
  return stars;
}

const STARS = generateStars(60);

const STAT_CARDS = [
  { value: "4", label: "个 AVE Skill", sublabel: "链上监控" },
  { value: "7", label: "个目标市场", sublabel: "Polymarket CLOB" },
  { value: "Live", label: "真实交易验证", sublabel: "链上可查" },
] as const;

/* -----------------------------------------------------------
   Stick Figure SVG Illustrations
   ----------------------------------------------------------- */

function IllustrationReasoning() {
  return (
    <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Human stick figure thinking */}
      <circle cx="30" cy="18" r="8" stroke="#e8e8e8" strokeWidth="1.5" fill="none" />
      <line x1="30" y1="26" x2="30" y2="50" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="30" y1="34" x2="18" y2="44" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="30" y1="34" x2="42" y2="44" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="30" y1="50" x2="20" y2="68" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="30" y1="50" x2="40" y2="68" stroke="#e8e8e8" strokeWidth="1.5" />
      {/* Thought bubble */}
      <ellipse cx="52" cy="10" rx="18" ry="10" stroke="#8b8b9e" strokeWidth="1" strokeDasharray="3 2" fill="none" />
      <text x="44" y="14" fontSize="8" fill="#8b8b9e">&#x1F4CA;&#x1F4C8;</text>

      {/* Approx equal sign */}
      <text x="88" y="38" fontSize="22" fill="#d4a574" fontFamily="serif" fontWeight="700">{"\u2248"}</text>

      {/* Robot stick figure thinking */}
      <rect x="122" y="10" width="16" height="16" rx="3" stroke="#d4a574" strokeWidth="1.5" fill="none" />
      <circle cx="127" cy="17" r="2" fill="#d4a574" />
      <circle cx="133" cy="17" r="2" fill="#d4a574" />
      <line x1="130" y1="26" x2="130" y2="50" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="130" y1="34" x2="118" y2="44" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="130" y1="34" x2="142" y2="44" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="130" y1="50" x2="120" y2="68" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="130" y1="50" x2="140" y2="68" stroke="#d4a574" strokeWidth="1.5" />
      {/* Thought bubble */}
      <ellipse cx="154" cy="10" rx="20" ry="10" stroke="#d4a574" strokeWidth="1" strokeDasharray="3 2" fill="none" />
      <text x="143" y="14" fontSize="8" fill="#d4a574">&#x1F4CA;&#x1F4C8;&#x1F40B;</text>
    </svg>
  );
}

function IllustrationCoverage() {
  return (
    <svg width="220" height="80" viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tired human with one screen */}
      <circle cx="25" cy="18" r="8" stroke="#e8e8e8" strokeWidth="1.5" fill="none" />
      {/* Tired eyes */}
      <line x1="22" y1="17" x2="24" y2="19" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="26" y1="17" x2="28" y2="19" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="25" y1="26" x2="25" y2="48" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="25" y1="34" x2="15" y2="42" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="25" y1="34" x2="35" y2="42" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="25" y1="48" x2="18" y2="64" stroke="#e8e8e8" strokeWidth="1.5" />
      <line x1="25" y1="48" x2="32" y2="64" stroke="#e8e8e8" strokeWidth="1.5" />
      {/* Single screen */}
      <rect x="40" y="20" width="18" height="14" rx="2" stroke="#8b8b9e" strokeWidth="1" fill="none" />
      <line x1="49" y1="34" x2="49" y2="38" stroke="#8b8b9e" strokeWidth="1" />
      {/* Zzz */}
      <text x="16" y="12" fontSize="8" fill="#8b8b9e" fontStyle="italic">z z</text>

      {/* VS text */}
      <text x="72" y="42" fontSize="14" fill="#d4a574" fontFamily="serif" fontWeight="700">vs</text>

      {/* Robot with energy */}
      <rect x="103" y="10" width="16" height="16" rx="3" stroke="#d4a574" strokeWidth="1.5" fill="none" />
      <circle cx="108" cy="17" r="2" fill="#d4a574" />
      <circle cx="114" cy="17" r="2" fill="#d4a574" />
      <line x1="111" y1="26" x2="111" y2="48" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="111" y1="34" x2="99" y2="42" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="111" y1="34" x2="123" y2="42" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="111" y1="48" x2="103" y2="64" stroke="#d4a574" strokeWidth="1.5" />
      <line x1="111" y1="48" x2="119" y2="64" stroke="#d4a574" strokeWidth="1.5" />
      {/* Energy lines */}
      <line x1="96" y1="8" x2="92" y2="4" stroke="#EFC851" strokeWidth="1.5" />
      <line x1="126" y1="8" x2="130" y2="4" stroke="#EFC851" strokeWidth="1.5" />
      <line x1="111" y1="5" x2="111" y2="0" stroke="#EFC851" strokeWidth="1.5" />

      {/* Multiple screens */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={134 + col * 16}
            y={10 + row * 16}
            width="13"
            height="12"
            rx="1"
            stroke="#d4a574"
            strokeWidth="0.7"
            fill="none"
            opacity={0.6}
          />
        ))
      )}
    </svg>
  );
}

function IllustrationSpeed() {
  return (
    <svg width="220" height="80" viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lightning bolt (news event) */}
      <polygon points="40,4 32,34 42,32 36,56 52,22 42,24" fill="#EFC851" opacity="0.9" />
      <text x="40" y="70" fontSize="8" fill="#8b8b9e" textAnchor="middle">{"\u4E8B\u4EF6"}</text>

      {/* Arrow to robot - fast */}
      <line x1="58" y1="24" x2="95" y2="24" stroke="#2a9d8f" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
      <text x="76" y="18" fontSize="9" fill="#2a9d8f" textAnchor="middle" fontFamily="monospace">1s</text>

      {/* Robot */}
      <rect x="100" y="16" width="16" height="16" rx="3" stroke="#d4a574" strokeWidth="1.5" fill="none" />
      <circle cx="105" cy="23" r="2" fill="#d4a574" />
      <circle cx="111" cy="23" r="2" fill="#d4a574" />
      <text x="108" y="48" fontSize="8" fill="#d4a574" textAnchor="middle">AI</text>

      {/* Arrow to human - slow */}
      <line x1="58" y1="52" x2="95" y2="52" stroke="#e63946" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowRed)" />
      <text x="76" y="48" fontSize="9" fill="#e63946" textAnchor="middle" fontFamily="monospace">3min+</text>

      {/* Human */}
      <circle cx="108" cy="52" r="8" stroke="#8b8b9e" strokeWidth="1.5" fill="none" />
      <text x="108" y="74" fontSize="8" fill="#8b8b9e" textAnchor="middle">{"\u4EBA\u7C7B"}</text>

      {/* Arrow markers */}
      <defs>
        <marker id="arrowGreen" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0,0 6,2 0,4" fill="#2a9d8f" />
        </marker>
        <marker id="arrowRed" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0,0 6,2 0,4" fill="#e63946" />
        </marker>
      </defs>
    </svg>
  );
}

/* -----------------------------------------------------------
   Key Point Card
   ----------------------------------------------------------- */

function KeyPoint({
  title,
  illustration,
  mounted,
  delay,
}: {
  readonly title: string;
  readonly illustration: React.ReactNode;
  readonly mounted: boolean;
  readonly delay: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "20px 12px",
        background: "rgba(22, 33, 62, 0.4)",
        border: "1px solid rgba(212, 165, 116, 0.2)",
        borderRadius: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.8s ${delay} cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s ${delay} cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div style={{ overflow: "hidden" }}>{illustration}</div>
      <span
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "#e8e8e8",
          textAlign: "center",
        }}
      >
        {title}
      </span>
    </div>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--sts-bg-deep)",
        overflow: "hidden",
        padding: "60px 24px 80px",
      }}
    >
      {/* Star particles background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {STARS.map((star, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              background: `rgba(212, 165, 116, ${star.opacity})`,
              borderRadius: "50%",
              animation: `starTwinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Subtle radial gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(212, 165, 116, 0.04) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 880,
          width: "100%",
          gap: 0,
        }}
      >
        {/* Title */}
        <h1
          className="sts-title sts-title--hero"
          style={{
            margin: 0,
            textAlign: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s 0.1s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.1s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span style={{ marginRight: "0.15em" }} role="img" aria-label="hourglass">
            &#9203;
          </span>
          HOURGLASS
        </h1>

        {/* Subtitle — large and clear */}
        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            fontSize: "clamp(22px, 3.5vw, 30px)",
            color: "var(--sts-text-cream)",
            fontWeight: 600,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s 0.25s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
            lineHeight: 1.4,
          }}
        >
          {"\u7528 AVE Skill \u5728\u9884\u6D4B\u5E02\u573A\u83B7\u5F97\u4FE1\u606F\u4F18\u52BF"}
        </p>

        {/* Explanation block */}
        <p
          className="sts-body sts-body--muted"
          style={{
            margin: "16px 0 0",
            textAlign: "center",
            fontSize: "clamp(15px, 2vw, 18px)",
            maxWidth: 680,
            lineHeight: 1.8,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {"\u7CFB\u7EDF\u56F4\u7ED5 Market Pulse \u6838\u5FC3\u7EC4\u4EF6\u8BBE\u8BA1\uFF1A\u8BA9 AI \u81EA\u4E3B\u8BC4\u4F30\u4E8B\u4EF6\u53D1\u751F\u7684\u6982\u7387\uFF0C\u52A8\u6001\u5730\u4ECE\u4FE1\u606F\u6E90\u6536\u96C6\u8BC1\u636E\uFF0C\u5C06\u5176\u4E0E\u5E02\u573A\u9690\u542B\u7684\u8D54\u7387\u5BF9\u6BD4\uFF0C\u7EFC\u5408\u504F\u5DEE\u503C\uFF08Edge\uFF09\u548C\u8D44\u91D1\u56DE\u62A5\u5468\u671F\u7ED9\u51FA\u4EA4\u6613\u6307\u793A\u3002"}
        </p>

        {/* 3 Key Points with stick-figure illustrations */}
        <div
          style={{
            display: "flex",
            gap: "clamp(12px, 2vw, 20px)",
            marginTop: 40,
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <KeyPoint
            title={"\u63A8\u7406\u80FD\u529B\u8D8B\u8FD1\u4EBA\u7C7B"}
            illustration={<IllustrationReasoning />}
            mounted={mounted}
            delay="0.5s"
          />
          <KeyPoint
            title={"7\u00D724 \u8986\u76D6\u6570\u5343\u5E02\u573A"}
            illustration={<IllustrationCoverage />}
            mounted={mounted}
            delay="0.6s"
          />
          <KeyPoint
            title={"\u79D2\u7EA7\u54CD\u5E94 vs \u5206\u949F\u7EA7\u5EF6\u8FDF"}
            illustration={<IllustrationSpeed />}
            mounted={mounted}
            delay="0.7s"
          />
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(12px, 2vw, 20px)",
            marginTop: 40,
            width: "100%",
            maxWidth: 600,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {STAT_CARDS.map((card) => (
            <StatMiniCard
              key={card.label}
              value={card.value}
              label={card.label}
              sublabel={card.sublabel}
            />
          ))}
        </div>

        {/* Hackathon Badge */}
        <div
          style={{
            marginTop: 48,
            opacity: mounted ? 1 : 0,
            transition: "opacity 1s 1s cubic-bezier(0.22, 1, 0.36, 1)",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <div className="sts-divider">
            <span className="sts-divider__text">
              AVE Claw Hackathon 2026
            </span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade to next section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "linear-gradient(to bottom, transparent, var(--sts-bg-main))",
          pointerEvents: "none",
          zIndex: 1,
        }}
        aria-hidden="true"
      />
    </section>
  );
}

/* -----------------------------------------------------------
   StatMiniCard — gold-bordered stat card for the hero area
   ----------------------------------------------------------- */
interface StatMiniCardProps {
  readonly value: string;
  readonly label: string;
  readonly sublabel: string;
}

function StatMiniCard({ value, label, sublabel }: StatMiniCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(14px, 2vw, 20px) clamp(8px, 1.5vw, 16px)",
        background: "rgba(22, 33, 62, 0.6)",
        border: "1.5px solid rgba(212, 165, 116, 0.35)",
        borderRadius: 8,
        backdropFilter: "blur(8px)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "rgba(212, 165, 116, 0.6)";
        el.style.boxShadow = "0 0 20px rgba(212, 165, 116, 0.12)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "rgba(212, 165, 116, 0.35)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Energy orb indicator */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--sts-gold)",
          boxShadow: "0 0 8px rgba(212, 165, 116, 0.5)",
          marginBottom: 8,
        }}
      />
      <span
        className="sts-data--lg"
        style={{
          color: "var(--sts-gold)",
          lineHeight: 1,
          textShadow: "0 0 12px rgba(212, 165, 116, 0.2)",
        }}
      >
        {value}
      </span>
      <span
        className="sts-body"
        style={{
          fontSize: "clamp(13px, 1.5vw, 16px)",
          fontWeight: 600,
          marginTop: 6,
          textAlign: "center",
          color: "var(--sts-text-cream)",
        }}
      >
        {label}
      </span>
      <span
        className="sts-label"
        style={{
          marginTop: 2,
          fontSize: "clamp(9px, 1vw, 11px)",
          textAlign: "center",
        }}
      >
        {sublabel}
      </span>
    </div>
  );
}
