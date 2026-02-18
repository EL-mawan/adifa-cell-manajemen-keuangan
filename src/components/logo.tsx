import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-10", showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${className} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 400 400"
          fill="none"
          className="w-full h-full drop-shadow-md transition-transform hover:scale-105 duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#8CC63F" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="2" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ring - Shadow/Glow effect */}
          <circle cx="200" cy="200" r="195" fill="white" className="dark:fill-zinc-900" />

          {/* Outer Circuit Ring (Blue) */}
          <circle cx="200" cy="200" r="185" stroke="#0070C0" strokeWidth="12" fill="none" />
          
          {/* Circuit Details - Dots and Lines on Outer Ring */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 200 + 185 * Math.cos(rad);
            const y = 200 + 185 * Math.sin(rad);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="6" fill="white" stroke="#0070C0" strokeWidth="3" />
                <path 
                  d={`M ${200 + 170 * Math.cos(rad)} ${200 + 170 * Math.sin(rad)} L ${200 + 200 * Math.cos(rad)} ${200 + 200 * Math.sin(rad)}`}
                  stroke="#0070C0" strokeWidth="2" opacity="0.6"
                />
              </g>
            )
          })}

          {/* Inner Ring (Lime Green) */}
          <circle cx="200" cy="200" r="160" stroke="#8CC63F" strokeWidth="8" fill="none" />
          {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 200 + 160 * Math.cos(rad);
            const y = 200 + 160 * Math.sin(rad);
            return (
              <circle key={`inner-${i}`} cx={x} cy={y} r="5" fill="white" stroke="#8CC63F" strokeWidth="2" />
            )
          })}

          {/* Center Content: Signal Tower / Antenna */}
          <g transform="translate(100, 80) scale(0.5)">
             {/* Signal Waves */}
             <path d="M120 180 Q80 140 120 100" stroke="#0070C0" strokeWidth="14" strokeLinecap="round" fill="none" />
             <path d="M100 200 Q40 140 100 80" stroke="#0070C0" strokeWidth="14" strokeLinecap="round" fill="none" />
             
             <path d="M280 180 Q320 140 280 100" stroke="#0070C0" strokeWidth="14" strokeLinecap="round" fill="none" />
             <path d="M300 200 Q360 140 300 80" stroke="#0070C0" strokeWidth="14" strokeLinecap="round" fill="none" />

             {/* Mast Zigzag */}
             <path d="M200 80 L180 120 L220 160 L200 200" stroke="#8CC63F" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
             
             {/* Top Ball */}
             <circle cx="200" cy="80" r="15" fill="#8CC63F" />
             
             {/* Tripod Base */}
             <path d="M200 200 L160 260 L240 260 Z" fill="#2D3748" />
             <path d="M160 260 L140 300 M240 260 L260 300" stroke="#2D3748" strokeWidth="12" strokeLinecap="round" />
          </g>

          {/* Integrated Text for when SVG is standing alone */}
          {!showText && (
            <g transform="translate(200, 320)">
              <text textAnchor="middle" x="0" y="0" fontFamily="sans-serif" fontWeight="900" fontSize="70" fill="url(#textGradient)">ADIFA</text>
              <text textAnchor="middle" x="0" y="45" fontFamily="sans-serif" fontWeight="700" fontSize="30" fill="#2D3748" letterSpacing="5">CELL</text>
            </g>
          )}
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-black text-3xl tracking-tight bg-linear-to-b from-blue-900 to-lime-500 bg-clip-text text-transparent leading-none">
            ADIFA
          </span>
          <span className="font-bold text-lg text-zinc-700 dark:text-zinc-300 tracking-widest uppercase leading-none mt-1 text-center">
            CELL
          </span>
        </div>
      )}
    </div>
  );
};


