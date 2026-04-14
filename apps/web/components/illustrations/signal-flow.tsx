"use client";

interface SignalFlowIllustrationProps {
  readonly className?: string;
}

export function SignalFlowIllustration({
  className,
}: SignalFlowIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Signal flow illustration showing data pipeline through AVE skills"
    >
      <defs>
        <linearGradient
          id="sf-flow-gradient"
          x1="0"
          y1="100"
          x2="400"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7B3FE4" />
          <stop offset="35%" stopColor="#3B82F6" />
          <stop offset="70%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        <linearGradient id="sf-node1-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" />
          <stop offset="100%" stopColor="#9B59E6" />
        </linearGradient>
        <linearGradient id="sf-node2-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B4FE4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="sf-node3-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="sf-node4-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        <filter id="sf-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sf-soft-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>
        {`
          @keyframes sf-pulse-1 {
            0%, 100% { r: 22; opacity: 1; }
            50% { r: 25; opacity: 0.85; }
          }
          @keyframes sf-pulse-2 {
            0%, 100% { r: 22; opacity: 1; }
            50% { r: 25; opacity: 0.85; }
          }
          @keyframes sf-pulse-3 {
            0%, 100% { r: 22; opacity: 1; }
            50% { r: 25; opacity: 0.85; }
          }
          @keyframes sf-pulse-4 {
            0%, 100% { r: 22; opacity: 1; }
            50% { r: 25; opacity: 0.85; }
          }
          @keyframes sf-ring-expand {
            0% { r: 26; opacity: 0.5; }
            100% { r: 38; opacity: 0; }
          }
          @keyframes sf-dash-flow {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          .sf-node-1 { animation: sf-pulse-1 2.5s ease-in-out infinite; }
          .sf-node-2 { animation: sf-pulse-2 2.5s ease-in-out 0.3s infinite; }
          .sf-node-3 { animation: sf-pulse-3 2.5s ease-in-out 0.6s infinite; }
          .sf-node-4 { animation: sf-pulse-4 2.5s ease-in-out 0.9s infinite; }
          .sf-ring-1 { animation: sf-ring-expand 2.5s ease-out infinite; }
          .sf-ring-2 { animation: sf-ring-expand 2.5s ease-out 0.3s infinite; }
          .sf-ring-3 { animation: sf-ring-expand 2.5s ease-out 0.6s infinite; }
          .sf-ring-4 { animation: sf-ring-expand 2.5s ease-out 0.9s infinite; }
          .sf-dash-line { animation: sf-dash-flow 1.5s linear infinite; }
        `}
      </style>

      {/* Background decorative curves */}
      <path
        d="M 0 160 Q 100 120 200 100 T 400 60"
        stroke="url(#sf-flow-gradient)"
        strokeWidth="1"
        opacity="0.15"
        fill="none"
      />
      <path
        d="M 0 180 Q 100 140 200 120 T 400 80"
        stroke="url(#sf-flow-gradient)"
        strokeWidth="1"
        opacity="0.1"
        fill="none"
      />

      {/* Main flowing path connecting nodes */}
      <path
        d="M 55 100 C 100 100, 110 70, 145 70 C 180 70, 170 130, 215 130 C 250 130, 240 70, 285 70 C 320 70, 310 100, 345 100"
        stroke="url(#sf-flow-gradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        filter="url(#sf-glow)"
      />

      {/* Animated dash overlay on path */}
      <path
        d="M 55 100 C 100 100, 110 70, 145 70 C 180 70, 170 130, 215 130 C 250 130, 240 70, 285 70 C 320 70, 310 100, 345 100"
        stroke="url(#sf-flow-gradient)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5 15"
        className="sf-dash-line"
        opacity="0.6"
      />

      {/* Node 1: Aggregator (chart icon) */}
      <circle cx="55" cy="100" r="26" fill="#7B3FE4" opacity="0.08" className="sf-ring-1" />
      <circle cx="55" cy="100" fill="url(#sf-node1-grad)" className="sf-node-1" filter="url(#sf-glow)" />
      <g transform="translate(55, 100)">
        <rect x="-10" y="-8" width="4" height="16" rx="1" fill="white" opacity="0.9" />
        <rect x="-4" y="-4" width="4" height="12" rx="1" fill="white" opacity="0.9" />
        <rect x="2" y="-12" width="4" height="20" rx="1" fill="white" opacity="0.9" />
      </g>

      {/* Node 2: Trend (upward arrow) */}
      <circle cx="145" cy="70" r="26" fill="#5B5FE4" opacity="0.08" className="sf-ring-2" />
      <circle cx="145" cy="70" fill="url(#sf-node2-grad)" className="sf-node-2" filter="url(#sf-glow)" />
      <g transform="translate(145, 70)">
        <path d="M -8 6 L 0 -10 L 8 6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="0" y1="-8" x2="0" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Node 3: Whale (whale silhouette) */}
      <circle cx="255" cy="130" r="26" fill="#3B82F6" opacity="0.08" className="sf-ring-3" />
      <circle cx="255" cy="130" fill="url(#sf-node3-grad)" className="sf-node-3" filter="url(#sf-glow)" />
      <g transform="translate(255, 130)">
        <path
          d="M -10 2 Q -8 -6 -2 -8 Q 4 -10 8 -6 Q 10 -3 10 0 Q 10 4 6 6 Q 2 8 -2 7 Q -6 6 -8 4 Q -10 3 -10 2 Z M 9 -2 Q 12 -4 12 -1 Q 12 1 10 2"
          fill="white"
          opacity="0.9"
        />
      </g>

      {/* Node 4: Risk (shield) */}
      <circle cx="345" cy="100" r="26" fill="#14B8A6" opacity="0.08" className="sf-ring-4" />
      <circle cx="345" cy="100" fill="url(#sf-node4-grad)" className="sf-node-4" filter="url(#sf-glow)" />
      <g transform="translate(345, 100)">
        <path
          d="M 0 -10 L 8 -6 L 8 2 Q 8 8 0 12 Q -8 8 -8 2 L -8 -6 Z"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0.9"
          strokeLinejoin="round"
        />
        <path d="M 0 -4 L 0 5 M -4 1 L 4 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Labels */}
      <text x="55" y="140" textAnchor="middle" fill="#7B3FE4" fontSize="9" fontWeight="500" opacity="0.8">
        Aggregator
      </text>
      <text x="145" y="48" textAnchor="middle" fill="#5B5FE4" fontSize="9" fontWeight="500" opacity="0.8">
        Trend
      </text>
      <text x="255" y="168" textAnchor="middle" fill="#3B82F6" fontSize="9" fontWeight="500" opacity="0.8">
        Whale
      </text>
      <text x="345" y="140" textAnchor="middle" fill="#14B8A6" fontSize="9" fontWeight="500" opacity="0.8">
        Risk
      </text>
    </svg>
  );
}
