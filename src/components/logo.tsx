import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-10", showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${className} flex items-center justify-center shrink-0`}>
        {/* Modern Hexagonal Shape / Icon Container */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-indigo-700 rounded-2xl rotate-6 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform group-hover:rotate-12 duration-300"></div>
        <div className="absolute inset-0 bg-zinc-900 border border-white/20 rounded-2xl shadow-inner shadow-white/10 dark:bg-zinc-100 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-2/3 h-2/3 text-white dark:text-zinc-900"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* The stylized 'A' with a power/bolt element */}
            <path
              d="M12 4L4 20H8.5L10 16H14L15.5 20H20L12 4Z"
              fill="currentColor"
              className="opacity-20"
            />
            <path
              d="M12 4.5L18.5 19H14.5L13.5 16.5H10.5L9.5 19H5.5L12 4.5ZM12.7 14.5L12 12.8L11.3 14.5H12.7Z"
              fill="currentColor"
            />
            {/* Pulsing signal dot */}
            <circle cx="12" cy="11" r="1.5" fill="currentColor" className="animate-pulse" />
          </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-xl tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none">
            ADIFA <span className="text-indigo-600">CELL</span>
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none mt-1">
            PPOB SYSTEM
          </span>
        </div>
      )}
    </div>
  );
};
