"use client";

import { useEffect, useRef, useState } from "react";
import { HourglassHeroIllustration } from "../../illustrations/hourglass-hero";
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
  { value: "4", label: "AVE Skills", sublabel: "Chain Monitoring" },
  { value: "7", label: "Target Markets", sublabel: "Polymarket CLOB" },
  { value: "Live", label: "Real Trading", sublabel: "On-chain Verified" },
] as const;

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
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
          maxWidth: 800,
          width: "100%",
          gap: 0,
        }}
      >
        {/* Hourglass Illustration */}
        <div
          style={{
            width: "min(400px, 70vw)",
            marginBottom: 8,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.95)",
            transition: "opacity 1s cubic-bezier(0.22, 1, 0.36, 1), transform 1s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 40px rgba(212, 165, 116, 0.08))",
          }}
        >
          <HourglassHeroIllustration />
        </div>

        {/* Title */}
        <h1
          className="sts-title sts-title--hero"
          style={{
            margin: 0,
            textAlign: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span style={{ marginRight: "0.15em" }} role="img" aria-label="hourglass">
            &#9203;
          </span>
          HOURGLASS
        </h1>

        {/* Tagline */}
        <p
          className="sts-body"
          style={{
            margin: "16px 0 0",
            textAlign: "center",
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "var(--sts-text-cream)",
            fontWeight: 400,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          Chain Signal-Driven Prediction Market Trading Agent
        </p>

        {/* Subtitle */}
        <p
          className="sts-body sts-body--muted"
          style={{
            margin: "8px 0 0",
            textAlign: "center",
            fontSize: "clamp(13px, 2vw, 16px)",
            fontStyle: "italic",
            maxWidth: 560,
            lineHeight: 1.6,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          Leveraging AVE Claw on-chain data to discover edges on Polymarket
          that others cannot see
        </p>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(12px, 2vw, 20px)",
            marginTop: 40,
            width: "100%",
            maxWidth: 560,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
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
            transition: "opacity 1s 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
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
          fontSize: "clamp(12px, 1.5vw, 14px)",
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
          fontSize: "clamp(8px, 1vw, 10px)",
          textAlign: "center",
        }}
      >
        {sublabel}
      </span>
    </div>
  );
}
