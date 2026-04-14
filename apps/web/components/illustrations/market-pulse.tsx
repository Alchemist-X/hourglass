"use client";

interface MarketPulseIllustrationProps {
  readonly className?: string;
}

export function MarketPulseIllustration({
  className,
}: MarketPulseIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Market pulse monitoring with candlestick chart and whale detection"
    >
      <defs>
        <linearGradient id="mp-bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mp-pulse-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7B3FE4" />
          <stop offset="40%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="mp-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mp-bullish" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#10D9A0" />
        </linearGradient>
        <linearGradient id="mp-bearish" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>

        <filter id="mp-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="mp-soft">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <style>
        {`
          @keyframes mp-pulse-draw {
            0% { stroke-dashoffset: 600; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes mp-candle-grow {
            0% { transform: scaleY(0); }
            100% { transform: scaleY(1); }
          }
          @keyframes mp-whale-swim {
            0%, 100% { transform: translateX(0px); }
            50% { transform: translateX(4px); }
          }
          @keyframes mp-signal-blink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .mp-pulse-line {
            animation: mp-pulse-draw 4s ease-out forwards;
            stroke-dasharray: 600;
          }
          .mp-whale { animation: mp-whale-swim 4s ease-in-out infinite; }
          .mp-signal { animation: mp-signal-blink 1.5s ease-in-out infinite; }
        `}
      </style>

      {/* Background area */}
      <rect x="30" y="20" width="350" height="200" rx="8" fill="url(#mp-bg-grad)" />

      {/* Grid lines */}
      <g opacity="0.1" stroke="#7B3FE4" strokeWidth="0.5">
        <line x1="30" y1="60" x2="380" y2="60" />
        <line x1="30" y1="100" x2="380" y2="100" />
        <line x1="30" y1="140" x2="380" y2="140" />
        <line x1="30" y1="180" x2="380" y2="180" />
        <line x1="80" y1="20" x2="80" y2="220" />
        <line x1="150" y1="20" x2="150" y2="220" />
        <line x1="220" y1="20" x2="220" y2="220" />
        <line x1="290" y1="20" x2="290" y2="220" />
        <line x1="360" y1="20" x2="360" y2="220" />
      </g>

      {/* Candlestick chart */}
      {/* Candle 1 - bearish */}
      <g>
        <line x1="65" y1="80" x2="65" y2="155" stroke="#EF4444" strokeWidth="1" opacity="0.7" />
        <rect x="60" y="90" width="10" height="40" rx="1" fill="url(#mp-bearish)" opacity="0.8" />
      </g>
      {/* Candle 2 - bearish */}
      <g>
        <line x1="90" y1="95" x2="90" y2="165" stroke="#EF4444" strokeWidth="1" opacity="0.7" />
        <rect x="85" y="105" width="10" height="35" rx="1" fill="url(#mp-bearish)" opacity="0.8" />
      </g>
      {/* Candle 3 - bullish */}
      <g>
        <line x1="115" y1="85" x2="115" y2="170" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="110" y="100" width="10" height="45" rx="1" fill="url(#mp-bullish)" opacity="0.8" />
      </g>
      {/* Candle 4 - bullish */}
      <g>
        <line x1="140" y1="70" x2="140" y2="150" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="135" y="80" width="10" height="50" rx="1" fill="url(#mp-bullish)" opacity="0.8" />
      </g>
      {/* Candle 5 - bearish */}
      <g>
        <line x1="165" y1="75" x2="165" y2="145" stroke="#EF4444" strokeWidth="1" opacity="0.7" />
        <rect x="160" y="85" width="10" height="35" rx="1" fill="url(#mp-bearish)" opacity="0.8" />
      </g>
      {/* Candle 6 - bullish large */}
      <g>
        <line x1="190" y1="60" x2="190" y2="140" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="185" y="70" width="10" height="55" rx="1" fill="url(#mp-bullish)" opacity="0.9" />
      </g>
      {/* Candle 7 - bullish */}
      <g>
        <line x1="215" y1="50" x2="215" y2="120" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="210" y="55" width="10" height="45" rx="1" fill="url(#mp-bullish)" opacity="0.8" />
      </g>
      {/* Candle 8 - bearish small */}
      <g>
        <line x1="240" y1="55" x2="240" y2="110" stroke="#EF4444" strokeWidth="1" opacity="0.7" />
        <rect x="235" y="65" width="10" height="25" rx="1" fill="url(#mp-bearish)" opacity="0.8" />
      </g>
      {/* Candle 9 - bullish */}
      <g>
        <line x1="265" y1="45" x2="265" y2="105" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="260" y="50" width="10" height="40" rx="1" fill="url(#mp-bullish)" opacity="0.8" />
      </g>
      {/* Candle 10 - bullish */}
      <g>
        <line x1="290" y1="40" x2="290" y2="95" stroke="#14B8A6" strokeWidth="1" opacity="0.7" />
        <rect x="285" y="42" width="10" height="38" rx="1" fill="url(#mp-bullish)" opacity="0.9" />
      </g>

      {/* Flowing pulse wave overlaid on chart */}
      <path
        d="M 40 150 Q 65 130 90 140 Q 115 150 140 110 Q 165 120 190 85 Q 215 65 240 75 Q 265 60 290 50 Q 315 45 340 48 Q 360 50 375 55"
        stroke="url(#mp-pulse-grad)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className="mp-pulse-line"
        filter="url(#mp-glow)"
      />

      {/* Pulse area fill */}
      <path
        d="M 40 150 Q 65 130 90 140 Q 115 150 140 110 Q 165 120 190 85 Q 215 65 240 75 Q 265 60 290 50 Q 315 45 340 48 Q 360 50 375 55 L 375 220 L 40 220 Z"
        fill="url(#mp-area-grad)"
        opacity="0.5"
      />

      {/* Whale silhouette (subtle, integrated into the lower portion) */}
      <g className="mp-whale" opacity="0.12">
        <path
          d="M 220 185 Q 230 175 245 172 Q 260 170 275 172 Q 290 175 300 182 Q 310 190 308 198 Q 305 205 295 208 Q 280 212 265 210 Q 250 208 240 203 Q 230 198 225 192 Q 222 188 220 185 Z"
          fill="#3B82F6"
        />
        {/* Tail */}
        <path
          d="M 220 185 Q 210 178 205 170 Q 210 175 215 180 Q 210 185 205 192 Q 210 188 215 186 Z"
          fill="#3B82F6"
        />
        {/* Eye */}
        <circle cx="290" cy="185" r="2" fill="#3B82F6" opacity="0.8" />
      </g>

      {/* Bullish signal indicator */}
      <g className="mp-signal" transform="translate(340, 48)">
        <circle r="8" fill="#14B8A6" opacity="0.15" />
        <circle r="4" fill="#14B8A6" opacity="0.3" />
        <circle r="2" fill="#14B8A6" />
      </g>

      {/* Volume bars at bottom */}
      <g opacity="0.25">
        <rect x="60" y="200" width="10" height="15" rx="1" fill="#EF4444" />
        <rect x="85" y="205" width="10" height="10" rx="1" fill="#EF4444" />
        <rect x="110" y="195" width="10" height="20" rx="1" fill="#14B8A6" />
        <rect x="135" y="190" width="10" height="25" rx="1" fill="#14B8A6" />
        <rect x="160" y="202" width="10" height="13" rx="1" fill="#EF4444" />
        <rect x="185" y="182" width="10" height="33" rx="1" fill="#14B8A6" />
        <rect x="210" y="192" width="10" height="23" rx="1" fill="#14B8A6" />
        <rect x="235" y="200" width="10" height="15" rx="1" fill="#EF4444" />
        <rect x="260" y="188" width="10" height="27" rx="1" fill="#14B8A6" />
        <rect x="285" y="185" width="10" height="30" rx="1" fill="#14B8A6" />
      </g>

      {/* Whale alert label */}
      <g opacity="0.6">
        <rect x="230" y="162" width="60" height="14" rx="4" fill="#3B82F6" opacity="0.1" />
        <text x="260" y="172" textAnchor="middle" fill="#3B82F6" fontSize="7" fontWeight="500">
          Whale Detected
        </text>
      </g>

      {/* Price label on signal */}
      <g opacity="0.7">
        <rect x="348" y="36" width="40" height="14" rx="4" fill="#14B8A6" opacity="0.1" />
        <text x="368" y="46" textAnchor="middle" fill="#14B8A6" fontSize="7" fontWeight="600">
          Bullish
        </text>
      </g>

      {/* Y-axis price labels */}
      <g opacity="0.3" fill="#7B3FE4" fontSize="7">
        <text x="25" y="63" textAnchor="end">$1.00</text>
        <text x="25" y="103" textAnchor="end">$0.75</text>
        <text x="25" y="143" textAnchor="end">$0.50</text>
        <text x="25" y="183" textAnchor="end">$0.25</text>
      </g>
    </svg>
  );
}
