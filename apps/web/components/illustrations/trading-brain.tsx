"use client";

interface TradingBrainIllustrationProps {
  readonly className?: string;
}

export function TradingBrainIllustration({
  className,
}: TradingBrainIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI trading brain analyzing market data"
    >
      <defs>
        <linearGradient id="tb-brain-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="tb-input-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0" />
          <stop offset="100%" stopColor="#7B3FE4" />
        </linearGradient>
        <linearGradient id="tb-output-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0" />
        </radialGradient>

        <filter id="tb-glow-filter">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="tb-ethereal">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <style>
        {`
          @keyframes tb-data-stream {
            0% { stroke-dashoffset: 24; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes tb-core-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.03); }
          }
          @keyframes tb-circuit-trace {
            0% { stroke-dashoffset: 40; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes tb-node-blink {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          .tb-stream-in { animation: tb-data-stream 1.8s linear infinite; }
          .tb-stream-out { animation: tb-data-stream 1.8s linear infinite reverse; }
          .tb-core { animation: tb-core-pulse 3s ease-in-out infinite; transform-origin: 200px 150px; }
          .tb-circuit { animation: tb-circuit-trace 3s linear infinite; }
          .tb-blink-1 { animation: tb-node-blink 2s ease-in-out infinite; }
          .tb-blink-2 { animation: tb-node-blink 2s ease-in-out 0.5s infinite; }
          .tb-blink-3 { animation: tb-node-blink 2s ease-in-out 1s infinite; }
        `}
      </style>

      {/* Ethereal background glow */}
      <circle cx="200" cy="150" r="120" fill="url(#tb-glow)" />
      <ellipse cx="200" cy="150" rx="80" ry="70" fill="#7B3FE4" opacity="0.04" filter="url(#tb-ethereal)" />

      {/* Input data streams (left side) */}
      <line x1="20" y1="80" x2="130" y2="120" stroke="url(#tb-input-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-in" />
      <line x1="20" y1="150" x2="130" y2="150" stroke="url(#tb-input-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-in" />
      <line x1="20" y1="220" x2="130" y2="180" stroke="url(#tb-input-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-in" />
      <line x1="30" y1="110" x2="135" y2="135" stroke="url(#tb-input-grad)" strokeWidth="1" strokeDasharray="3 6" className="tb-stream-in" opacity="0.5" />
      <line x1="30" y1="190" x2="135" y2="165" stroke="url(#tb-input-grad)" strokeWidth="1" strokeDasharray="3 6" className="tb-stream-in" opacity="0.5" />

      {/* Input data labels */}
      <g opacity="0.7">
        <rect x="4" y="72" width="40" height="16" rx="4" fill="#7B3FE4" opacity="0.1" />
        <text x="24" y="84" textAnchor="middle" fill="#7B3FE4" fontSize="7" fontWeight="500">Price</text>

        <rect x="4" y="142" width="44" height="16" rx="4" fill="#7B3FE4" opacity="0.1" />
        <text x="26" y="154" textAnchor="middle" fill="#7B3FE4" fontSize="7" fontWeight="500">Volume</text>

        <rect x="4" y="212" width="50" height="16" rx="4" fill="#7B3FE4" opacity="0.1" />
        <text x="29" y="224" textAnchor="middle" fill="#7B3FE4" fontSize="7" fontWeight="500">Sentiment</text>
      </g>

      {/* Central brain shape - outer ring */}
      <ellipse
        cx="200"
        cy="150"
        rx="72"
        ry="62"
        stroke="url(#tb-brain-grad)"
        strokeWidth="2"
        fill="none"
        className="tb-core"
        filter="url(#tb-glow-filter)"
      />

      {/* Brain circuit patterns */}
      <path
        d="M 160 130 Q 180 110 200 120 Q 220 130 240 115"
        stroke="#7B3FE4"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="6 14"
        className="tb-circuit"
        opacity="0.6"
      />
      <path
        d="M 155 155 Q 175 140 200 150 Q 225 160 245 145"
        stroke="#3B82F6"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="6 14"
        className="tb-circuit"
        opacity="0.6"
      />
      <path
        d="M 160 175 Q 180 190 200 180 Q 220 170 240 180"
        stroke="#14B8A6"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="6 14"
        className="tb-circuit"
        opacity="0.6"
      />

      {/* Brain circuit nodes */}
      <circle cx="175" cy="125" r="4" fill="#7B3FE4" className="tb-blink-1" />
      <circle cx="200" cy="140" r="5" fill="#3B82F6" className="tb-blink-2" />
      <circle cx="225" cy="130" r="3.5" fill="#7B3FE4" className="tb-blink-3" />
      <circle cx="185" cy="155" r="3" fill="#3B82F6" className="tb-blink-1" />
      <circle cx="215" cy="160" r="4" fill="#14B8A6" className="tb-blink-2" />
      <circle cx="190" cy="175" r="3.5" fill="#14B8A6" className="tb-blink-3" />
      <circle cx="210" cy="175" r="3" fill="#3B82F6" className="tb-blink-1" />

      {/* Inner core */}
      <circle cx="200" cy="150" r="16" fill="url(#tb-brain-grad)" opacity="0.15" />
      <circle cx="200" cy="150" r="8" fill="url(#tb-brain-grad)" opacity="0.3" filter="url(#tb-glow-filter)" />
      <circle cx="200" cy="150" r="3" fill="white" opacity="0.9" />

      {/* Output decision arrows (right side) */}
      <line x1="270" y1="120" x2="360" y2="90" stroke="url(#tb-output-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-out" />
      <line x1="270" y1="150" x2="370" y2="150" stroke="url(#tb-output-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-out" />
      <line x1="270" y1="180" x2="360" y2="210" stroke="url(#tb-output-grad)" strokeWidth="1.5" strokeDasharray="4 8" className="tb-stream-out" />

      {/* Arrow heads */}
      <polygon points="360,86 354,94 362,94" fill="#14B8A6" opacity="0.8" />
      <polygon points="370,146 364,154 372,154" fill="#14B8A6" opacity="0.8" />
      <polygon points="360,206 354,214 362,214" fill="#14B8A6" opacity="0.8" />

      {/* Output labels */}
      <g opacity="0.7">
        <rect x="355" y="78" width="36" height="16" rx="4" fill="#14B8A6" opacity="0.1" />
        <text x="373" y="90" textAnchor="middle" fill="#14B8A6" fontSize="7" fontWeight="500">BUY</text>

        <rect x="366" y="142" width="32" height="16" rx="4" fill="#14B8A6" opacity="0.1" />
        <text x="382" y="154" textAnchor="middle" fill="#14B8A6" fontSize="7" fontWeight="500">HOLD</text>

        <rect x="355" y="208" width="36" height="16" rx="4" fill="#F59E0B" opacity="0.1" />
        <text x="373" y="220" textAnchor="middle" fill="#F59E0B" fontSize="7" fontWeight="500">SELL</text>
      </g>

      {/* Subtle label */}
      <text x="200" y="240" textAnchor="middle" fill="#7B3FE4" fontSize="10" fontWeight="600" opacity="0.5">
        AVE Intelligence
      </text>
    </svg>
  );
}
