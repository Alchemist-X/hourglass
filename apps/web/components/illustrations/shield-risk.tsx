"use client";

interface ShieldRiskIllustrationProps {
  readonly className?: string;
}

export function ShieldRiskIllustration({
  className,
}: ShieldRiskIllustrationProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Risk protection shield with layered defenses"
    >
      <defs>
        <linearGradient id="sr-shield-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="sr-ring-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="sr-ring-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="sr-ring-grad-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="sr-inner-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#7B3FE4" />
        </linearGradient>

        <filter id="sr-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sr-soft">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        <clipPath id="sr-shield-clip">
          <path d="M 150 50 L 210 80 L 210 160 Q 210 220 150 250 Q 90 220 90 160 L 90 80 Z" />
        </clipPath>
      </defs>

      <style>
        {`
          @keyframes sr-ring-rotate-1 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes sr-ring-rotate-2 {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes sr-ring-rotate-3 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes sr-shield-pulse {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; }
          }
          @keyframes sr-check-draw {
            0% { stroke-dashoffset: 20; }
            50%, 100% { stroke-dashoffset: 0; }
          }
          @keyframes sr-icon-appear {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.9; }
          }
          .sr-ring-1 { animation: sr-ring-rotate-1 20s linear infinite; transform-origin: 150px 150px; }
          .sr-ring-2 { animation: sr-ring-rotate-2 25s linear infinite; transform-origin: 150px 150px; }
          .sr-ring-3 { animation: sr-ring-rotate-3 30s linear infinite; transform-origin: 150px 150px; }
          .sr-shield { animation: sr-shield-pulse 3s ease-in-out infinite; }
          .sr-check { animation: sr-check-draw 3s ease-in-out infinite; }
          .sr-rule-1 { animation: sr-icon-appear 3s ease-in-out infinite; }
          .sr-rule-2 { animation: sr-icon-appear 3s ease-in-out 0.5s infinite; }
          .sr-rule-3 { animation: sr-icon-appear 3s ease-in-out 1s infinite; }
          .sr-rule-4 { animation: sr-icon-appear 3s ease-in-out 1.5s infinite; }
        `}
      </style>

      {/* Background glow */}
      <circle cx="150" cy="150" r="100" fill="#14B8A6" opacity="0.04" filter="url(#sr-soft)" />

      {/* Concentric risk rings */}
      <g className="sr-ring-3">
        <circle cx="150" cy="150" r="130" stroke="url(#sr-ring-grad-3)" strokeWidth="1" fill="none" strokeDasharray="8 12" />
        {/* Ring 3 risk rule markers */}
        <circle cx="150" cy="20" r="5" fill="#7B3FE4" opacity="0.15" />
        <circle cx="280" cy="150" r="5" fill="#7B3FE4" opacity="0.15" />
        <circle cx="150" cy="280" r="5" fill="#7B3FE4" opacity="0.15" />
        <circle cx="20" cy="150" r="5" fill="#7B3FE4" opacity="0.15" />
      </g>

      <g className="sr-ring-2">
        <circle cx="150" cy="150" r="105" stroke="url(#sr-ring-grad-2)" strokeWidth="1.5" fill="none" strokeDasharray="6 10" />
        {/* Ring 2 markers */}
        <circle cx="150" cy="45" r="6" fill="#3B82F6" opacity="0.2" />
        <circle cx="255" cy="150" r="6" fill="#3B82F6" opacity="0.2" />
        <circle cx="150" cy="255" r="6" fill="#3B82F6" opacity="0.2" />
        <circle cx="45" cy="150" r="6" fill="#3B82F6" opacity="0.2" />
      </g>

      <g className="sr-ring-1">
        <circle cx="150" cy="150" r="80" stroke="url(#sr-ring-grad-1)" strokeWidth="2" fill="none" strokeDasharray="4 8" />
      </g>

      {/* Shield shape */}
      <g className="sr-shield" filter="url(#sr-glow)">
        <path
          d="M 150 60 L 205 87 L 205 158 Q 205 212 150 240 Q 95 212 95 158 L 95 87 Z"
          fill="url(#sr-shield-grad)"
          opacity="0.12"
        />
        <path
          d="M 150 60 L 205 87 L 205 158 Q 205 212 150 240 Q 95 212 95 158 L 95 87 Z"
          stroke="url(#sr-inner-grad)"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
      </g>

      {/* Inner shield geometric pattern */}
      <g clipPath="url(#sr-shield-clip)" opacity="0.25">
        <line x1="110" y1="100" x2="190" y2="100" stroke="#14B8A6" strokeWidth="0.5" />
        <line x1="105" y1="120" x2="195" y2="120" stroke="#14B8A6" strokeWidth="0.5" />
        <line x1="100" y1="140" x2="200" y2="140" stroke="#3B82F6" strokeWidth="0.5" />
        <line x1="100" y1="160" x2="200" y2="160" stroke="#3B82F6" strokeWidth="0.5" />
        <line x1="105" y1="180" x2="195" y2="180" stroke="#7B3FE4" strokeWidth="0.5" />
        <line x1="115" y1="200" x2="185" y2="200" stroke="#7B3FE4" strokeWidth="0.5" />
        {/* Vertical crosshatch */}
        <line x1="130" y1="70" x2="130" y2="230" stroke="#14B8A6" strokeWidth="0.5" />
        <line x1="150" y1="60" x2="150" y2="245" stroke="#3B82F6" strokeWidth="0.5" />
        <line x1="170" y1="70" x2="170" y2="230" stroke="#14B8A6" strokeWidth="0.5" />
      </g>

      {/* Center checkmark */}
      <path
        d="M 138 150 L 147 160 L 164 138"
        stroke="#14B8A6"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sr-check"
        strokeDasharray="20"
        filter="url(#sr-glow)"
      />

      {/* Risk rule icons around the shield */}
      {/* Position sizing */}
      <g className="sr-rule-1" transform="translate(60, 80)">
        <circle r="14" fill="#7B3FE4" opacity="0.08" />
        <text textAnchor="middle" y="4" fill="#7B3FE4" fontSize="11">%</text>
      </g>
      <text x="60" y="102" textAnchor="middle" fill="#7B3FE4" fontSize="6" opacity="0.6">Sizing</text>

      {/* Stop loss */}
      <g className="sr-rule-2" transform="translate(240, 80)">
        <circle r="14" fill="#3B82F6" opacity="0.08" />
        <path d="M -5 -3 L 5 -3 M -5 3 L 5 3 M 0 -6 L 0 6" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <text x="240" y="102" textAnchor="middle" fill="#3B82F6" fontSize="6" opacity="0.6">Stop Loss</text>

      {/* Max exposure */}
      <g className="sr-rule-3" transform="translate(60, 220)">
        <circle r="14" fill="#14B8A6" opacity="0.08" />
        <rect x="-5" y="-5" width="10" height="10" rx="2" stroke="#14B8A6" strokeWidth="1.2" fill="none" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="#14B8A6" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <text x="60" y="242" textAnchor="middle" fill="#14B8A6" fontSize="6" opacity="0.6">Exposure</text>

      {/* Drawdown */}
      <g className="sr-rule-4" transform="translate(240, 220)">
        <circle r="14" fill="#F59E0B" opacity="0.08" />
        <path d="M -4 -4 L 0 0 L 4 -2 L 4 4 L -4 4 Z" stroke="#F59E0B" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </g>
      <text x="240" y="242" textAnchor="middle" fill="#F59E0B" fontSize="6" opacity="0.6">Drawdown</text>
    </svg>
  );
}
