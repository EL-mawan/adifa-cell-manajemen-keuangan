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
          viewBox="0 0 100 100"
          fill="none"
          className="w-full h-full drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
           {/* Background Circle (White/Transparent) */}
           <circle cx="50" cy="50" r="48" className="fill-white dark:fill-zinc-900" />
           
           {/* Outer Circuit Ring (Blue) */}
           <path 
             d="M50 5 A45 45 0 1 1 49.9 5" 
             className="stroke-[#0070C0] dark:stroke-[#3b82f6]" 
             strokeWidth="6" 
             strokeLinecap="round" 
           />
           {/* Circuit Nodes (Dots on Blue Ring) */}
           <circle cx="50" cy="5" r="3" className="fill-white stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="2" />
           <circle cx="95" cy="50" r="3" className="fill-white stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="2" />
           <circle cx="50" cy="95" r="3" className="fill-white stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="2" />
           <circle cx="5" cy="50" r="3" className="fill-white stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="2" />

           {/* Inner Ring (Lime Green) */}
           <path 
             d="M50 12 A38 38 0 1 1 49.9 12" 
             className="stroke-[#8CC63F] dark:stroke-[#a3e635]" 
             strokeWidth="4" 
             strokeLinecap="round"
             opacity="0.9" 
           />

           {/* Signal Tower (Center) */}
           {/* Base */}
           <path 
             d="M35 70 L65 70 L50 55 Z" 
             className="fill-[#2c3e50] dark:fill-white" 
           />
           {/* Mast */}
           <rect x="48" y="35" width="4" height="25" className="fill-[#8CC63F] dark:fill-[#a3e635]" rx="2" />
           {/* Antenna Ball */}
           <circle cx="50" cy="35" r="4" className="fill-[#8CC63F] dark:fill-[#a3e635]" />

           {/* Signals (Blue Waves) */}
           <path d="M35 45 Q30 35 35 25" className="stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="4" strokeLinecap="round" fill="none" />
           <path d="M28 50 Q20 35 28 20" className="stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="4" strokeLinecap="round" fill="none" />
           
           <path d="M65 45 Q70 35 65 25" className="stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="4" strokeLinecap="round" fill="none" />
           <path d="M72 50 Q80 35 72 20" className="stroke-[#0070C0] dark:stroke-[#3b82f6]" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-black text-xl tracking-wide text-[#0070C0] dark:text-[#3b82f6] leading-none text-left">
            ADIFA
          </span>
          <div className="flex items-center gap-1 leading-none mt-0.5">
            <span className="font-bold text-sm text-[#2c3e50] dark:text-zinc-100 tracking-[0.2em] uppercase">
              CELL
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
