
import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
  showTagline?: boolean;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  textClassName = "text-xl",
  showText = true, 
  showTagline = false,
  lightText = false
}) => {
  const idSuffix = useId().replace(/:/g, ''); // React 18+ unique ID hook
  const gradL = `brain-L-${idSuffix}`;
  const gradR = `brain-R-${idSuffix}`;

  return (
    <div className="flex items-center gap-3 select-none">
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradL} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky Blue */}
            <stop offset="100%" stopColor="#6366f1" /> {/* Indigo */}
          </linearGradient>
          <linearGradient id={gradR} x1="0" y1="0" x2="1" y2="1">
             <stop offset="0%" stopColor="#84cc16" /> {/* Lime */}
             <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
          </linearGradient>
        </defs>
        
        {/* Left Hemisphere - Abstract Organic Curves */}
        <path d="M48 15 C 30 15, 10 30, 15 55 C 18 70, 35 85, 48 90" stroke={`url(#${gradL})`} strokeWidth="8" strokeLinecap="round" />
        <path d="M48 35 C 35 35, 28 45, 30 55" stroke={`url(#${gradL})`} strokeWidth="6" strokeLinecap="round" />
        <circle cx="25" cy="45" r="3" fill="#6366f1" />
        
        {/* Right Hemisphere - Circuit Nodes */}
        <path d="M52 15 C 70 15, 90 30, 85 55 C 82 70, 65 85, 52 90" stroke={`url(#${gradR})`} strokeWidth="8" strokeLinecap="round" />
        <line x1="52" y1="35" x2="70" y2="35" stroke={`url(#${gradR})`} strokeWidth="6" strokeLinecap="round" />
        <line x1="70" y1="35" x2="75" y2="55" stroke={`url(#${gradR})`} strokeWidth="6" strokeLinecap="round" />
        <circle cx="70" cy="35" r="4" fill="#10b981" />
        <circle cx="75" cy="55" r="4" fill="#10b981" />
        
        {/* Central Integration Arrow */}
        <path d="M50 90 L 50 65" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
        <path d="M42 75 L 50 65 L 58 75" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold tracking-tight leading-none ${textClassName} ${lightText ? 'text-white' : 'text-slate-900'}`}>
            KnovaTwin
          </span>
          {showTagline && (
            <span className={`text-[10px] font-medium tracking-widest uppercase mt-0.5 ${lightText ? 'text-slate-400' : 'text-slate-500'}`}>
              Intelligence. Amplified
            </span>
          )}
        </div>
      )}
    </div>
  );
};
