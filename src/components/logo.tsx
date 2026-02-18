import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'horizontal' | 'stacked';
}

const LogoComponent: React.FC<LogoProps> = ({ 
  className = "h-10 w-10", 
  showText = true,
  variant = 'horizontal'
}) => {
  return (
    <div className={`flex ${variant === 'horizontal' ? 'flex-row items-center gap-3' : 'flex-col items-center gap-0'} group`}>
      <div className={`relative ${className} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 400 400"
          fill="none"
          className="w-full h-full drop-shadow-md transition-transform group-hover:scale-105 duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="textGradientLogo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#8CC63F" />
            </linearGradient>
          </defs>

          {/* Background Ring */}
          <circle cx="200" cy="200" r="195" fill="white" className="dark:fill-zinc-900" />

          {/* Outer Circuit Ring (Blue) */}
          <circle cx="200" cy="200" r="185" stroke="#0070C0" strokeWidth="12" fill="none" />
          
          {/* Circuit Details - 8 Nodes matches logo.svg */}
          <g id="circuit-nodes">
            {[
              { x: 200, y: 15 }, { x: 385, y: 200 }, { x: 200, y: 385 }, { x: 15, y: 200 },
              { x: 331, y: 69 }, { x: 331, y: 331 }, { x: 69, y: 331 }, { x: 69, y: 69 }
            ].map((pos, i) => (
              <circle key={i} cx={pos.x} cy={pos.y} r="6" fill="white" stroke="#0070C0" strokeWidth="3" />
            ))}
          </g>

          {/* Inner Ring (Lime Green) */}
          <circle cx="200" cy="200" r="160" stroke="#8CC63F" strokeWidth="8" fill="none" />

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

          {/* Integrated Text for 'stacked' variant */}
          {showText && variant === 'stacked' && (
            <g transform="translate(200, 315)">
              <text textAnchor="middle" x="0" y="0" fontFamily="sans-serif" fontWeight="900" fontSize="65" fill="url(#textGradientLogo)">ADIFA</text>
              <text textAnchor="middle" x="0" y="40" fontFamily="sans-serif" fontWeight="700" fontSize="28" fill="#2D3748" letterSpacing="4">CELL</text>
            </g>
          )}
        </svg>
      </div>
      
      {showText && variant === 'horizontal' && (
        <div className="flex flex-col justify-center">
          <span className="font-black text-2xl sm:text-3xl tracking-tight bg-linear-to-b from-[#1E3A8A] to-[#8CC63F] bg-clip-text text-transparent leading-none">
            ADIFA
          </span>
          <span className="font-bold text-xs sm:text-lg text-zinc-700 dark:text-zinc-300 tracking-[0.2em] uppercase leading-none mt-1 sm:mt-1.5 text-center">
            CELL
          </span>
        </div>
      )}
    </div>
  );
};

export const Logo = LogoComponent;


