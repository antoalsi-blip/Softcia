import React from 'react';

interface LogoProps {
  className?: string;
  height?: number | string;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  height = 36,
  showBadge = true,
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 540 140"
        height={height}
        className="w-auto h-auto max-h-9 sm:max-h-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ULTIMATE SCORER"
      >
        {/* Glow / Filter definition for crisp aesthetic */}
        <defs>
          <filter id="yellowGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#FFEE00" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Text Line 1: ULTIMATE */}
        <text
          x="4"
          y="62"
          fill="#FFEE00"
          fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif"
          fontWeight="900"
          fontSize="68"
          letterSpacing="4"
          className="font-extrabold"
        >
          ULTIMATE
        </text>

        {/* Text Line 2: SC */}
        <text
          x="4"
          y="130"
          fill="#FFEE00"
          fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif"
          fontWeight="900"
          fontSize="68"
          letterSpacing="4"
          className="font-extrabold"
        >
          SC
        </text>

        {/* Stylized 'O' (Ө) in SCORER with central horizontal slot */}
        <g transform="translate(112, 75)">
          {/* Outer circle / square-rounded contour */}
          <rect
            x="4"
            y="5"
            width="44"
            height="50"
            rx="12"
            fill="none"
            stroke="#FFEE00"
            strokeWidth="12"
          />
          {/* Center horizontal bar with cut */}
          <line
            x1="8"
            y1="30"
            x2="44"
            y2="30"
            stroke="#FFEE00"
            strokeWidth="6"
            strokeLinecap="square"
          />
        </g>

        {/* Remaining letters in SCORER: RER */}
        <text
          x="166"
          y="130"
          fill="#FFEE00"
          fontFamily="'Montserrat', 'Arial Black', Impact, sans-serif"
          fontWeight="900"
          fontSize="68"
          letterSpacing="4"
          className="font-extrabold"
        >
          RER
        </text>

        {/* Right side graphic details: VOL. 01 and watermark seal */}
        {showBadge && (
          <g transform="translate(425, 12)">
            {/* VOL 01 tag */}
            <text
              x="5"
              y="22"
              fill="#FFEE00"
              fillOpacity="0.4"
              fontFamily="'Montserrat', sans-serif"
              fontWeight="800"
              fontSize="16"
              letterSpacing="2"
            >
              VOL.
            </text>
            <text
              x="5"
              y="48"
              fill="#FFEE00"
              fillOpacity="0.5"
              fontFamily="'Montserrat', sans-serif"
              fontWeight="900"
              fontSize="26"
              letterSpacing="1"
            >
              01
            </text>

            {/* Subtle Padel ball & radiating sunburst watermark seal */}
            <g transform="translate(60, 52)" opacity="0.25">
              <circle cx="28" cy="28" r="26" stroke="#FFEE00" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
              <circle cx="28" cy="28" r="21" stroke="#FFEE00" strokeWidth="1.5" fill="none" />
              {/* Ball seam curve */}
              <path
                d="M 14 16 C 24 22, 24 34, 14 40"
                stroke="#FFEE00"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 42 16 C 32 22, 32 34, 42 40"
                stroke="#FFEE00"
                strokeWidth="2"
                fill="none"
              />
              <text
                x="28"
                y="31"
                textAnchor="middle"
                fill="#FFEE00"
                fontSize="6"
                fontWeight="900"
                letterSpacing="1"
              >
                PADEL
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
export default Logo;
