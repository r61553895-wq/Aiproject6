import React from 'react';

interface GroksonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const GroksonLogo: React.FC<GroksonLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { icon: 24, text: 'text-sm' },
    md: { icon: 32, text: 'text-lg' },
    lg: { icon: 44, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-4xl' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 font-display select-none ${className}`}>
      {/* Grokson Stylized 'G' Emblem matching the uploaded photo */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: current.icon, height: current.icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
        >
          {/* Background subtle glow */}
          <circle cx="50" cy="50" r="46" fill="#0b0e14" />
          
          {/* Stylized geometric Grokson 'G' path with sharp slanted cut */}
          <path
            d="M 64 22 C 40 22 24 35 24 53 C 24 71 39 82 62 82 C 73 82 82 78 87 72 L 75 60 C 72 63 67 66 61 66 C 48 66 39 59 39 52 C 39 44 48 37 63 37 C 72 37 78 40 82 43 L 89 29 C 82 25 74 22 64 22 Z"
            fill="#ffffff"
          />
          {/* Inner horizontal arrow/bar */}
          <path
            d="M 52 47 L 85 47 L 76 60 L 59 60 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {showText && (
        <span
          className={`font-black tracking-[0.22em] text-white uppercase ${current.text}`}
          style={{ letterSpacing: '0.22em' }}
        >
          GROKSON
        </span>
      )}
    </div>
  );
};
