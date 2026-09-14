import React from 'react';
import { motion } from 'motion/react';

interface GroksonMascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showBubble?: boolean;
  bubbleText?: string;
}

export const GroksonMascot: React.FC<GroksonMascotProps> = ({
  className = '',
  size = 'hero',
  showBubble = true,
  bubbleText = 'STATUS: OPERATIONAL',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    hero: 'w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 max-w-full',
  };

  return (
    <div className={`relative inline-flex items-center justify-center max-w-full ${className}`}>
      {/* Official Telemetry Status Tag */}
      {showBubble && size === 'hero' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="absolute -top-2 right-1 sm:right-4 z-20 pointer-events-none max-w-[90%]"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/95 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-2xl font-mono text-[10px] sm:text-[11px] text-zinc-300">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse shrink-0" />
            <span className="tracking-wider sm:tracking-widest uppercase font-semibold text-white truncate">
              {bubbleText}
            </span>
          </div>
        </motion.div>
      )}

      {/* Official Geometric Neural Core */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className={`relative ${sizeMap[size]} flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] select-none"
        >
          <defs>
            {/* Strict Titanium & Obsidian Gradients */}
            <linearGradient id="coreMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#252a36" />
              <stop offset="40%" stopColor="#151820" />
              <stop offset="100%" stopColor="#0a0c10" />
            </linearGradient>

            <linearGradient id="facetHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>

            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>

            <radialGradient id="ambientCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient soft glow */}
          <circle cx="160" cy="160" r="140" fill="url(#ambientCoreGlow)" />

          {/* Outer Calibration Ring */}
          <circle
            cx="160"
            cy="160"
            r="135"
            stroke="url(#ringGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Secondary Precision Ring with Angle Markers */}
          <circle
            cx="160"
            cy="160"
            r="115"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="1"
          />

          {/* Angle Tick Marks */}
          <g stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5">
            <line x1="160" y1="20" x2="160" y2="30" />
            <line x1="160" y1="290" x2="160" y2="300" />
            <line x1="20" y1="160" x2="30" y2="160" />
            <line x1="290" y1="160" x2="300" y2="160" />
            {/* Diagonals */}
            <line x1="60" y1="60" x2="68" y2="68" />
            <line x1="260" y1="60" x2="252" y2="68" />
            <line x1="60" y1="260" x2="68" y2="252" />
            <line x1="260" y1="260" x2="252" y2="252" />
          </g>

          {/* Rotating Geometric Orbital Octagon Frame */}
          <g transform="rotate(22 160 160)">
            <polygon
              points="160,50 238,82 270,160 238,238 160,270 82,238 50,160 82,82"
              stroke="#ffffff"
              strokeOpacity="0.15"
              strokeWidth="1.5"
              fill="none"
            />
          </g>

          {/* Central Faceted Hexagonal Monolith Core */}
          <polygon
            points="160,65 240,112 240,208 160,255 80,208 80,112"
            fill="url(#coreMetalGrad)"
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth="2"
          />

          {/* Top Facet Shading */}
          <polygon
            points="160,65 240,112 160,160 80,112"
            fill="url(#facetHighlight)"
          />

          {/* Bottom Left Facet */}
          <polygon
            points="80,112 160,160 160,255 80,208"
            fill="#090a0e"
            fillOpacity="0.6"
          />

          {/* Bottom Right Facet */}
          <polygon
            points="240,112 160,160 160,255 240,208"
            fill="#12151d"
            fillOpacity="0.8"
          />

          {/* Facet Edge Crisp Lines */}
          <line x1="160" y1="65" x2="160" y2="160" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="80" y1="112" x2="160" y2="160" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
          <line x1="240" y1="112" x2="160" y2="160" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
          <line x1="160" y1="160" x2="160" y2="255" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />

          {/* Inner Official Grokson Emblem 'G' */}
          <g transform="translate(160, 160) scale(0.68) translate(-50, -52)">
            {/* Emblem circular backplate */}
            <circle cx="50" cy="50" r="44" fill="#0c0e14" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" />
            
            {/* Precision Grokson G Path */}
            <path
              d="M 64 22 C 40 22 24 35 24 53 C 24 71 39 82 62 82 C 73 82 82 78 87 72 L 75 60 C 72 63 67 66 61 66 C 48 66 39 59 39 52 C 39 44 48 37 63 37 C 72 37 78 40 82 43 L 89 29 C 82 25 74 22 64 22 Z"
              fill="#ffffff"
            />
            <path
              d="M 52 47 L 85 47 L 76 60 L 59 60 Z"
              fill="#ffffff"
            />
          </g>

          {/* Telemetry Corner Accents */}
          <text x="32" y="38" fill="#64748b" fontFamily="monospace" fontSize="8" letterSpacing="0.1em">SYS:01</text>
          <text x="250" y="38" fill="#64748b" fontFamily="monospace" fontSize="8" letterSpacing="0.1em">CORE.256</text>
          <text x="32" y="295" fill="#64748b" fontFamily="monospace" fontSize="8" letterSpacing="0.1em">AUTH:OK</text>
          <text x="250" y="295" fill="#64748b" fontFamily="monospace" fontSize="8" letterSpacing="0.1em">TLS.v1.3</text>
        </svg>
      </motion.div>
    </div>
  );
};
