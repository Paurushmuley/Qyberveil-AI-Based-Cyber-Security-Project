import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  withTagline?: boolean;
  className?: string;
  glow?: boolean;
}

export const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="qv-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>

      <linearGradient id="qv-surface" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#030712" />
      </linearGradient>

      <linearGradient id="qv-core-beam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#A5F3FC" stopOpacity="1" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
      </linearGradient>

      <filter id="qv-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer Ambient Glow Aura */}
    <path
      d="M50 10 L82 23 V50 C82 69 50 88 50 88 C50 88 18 69 18 50 V23 Z"
      fill="url(#qv-cyan-glow)"
      opacity="0.25"
      filter="url(#qv-glow-filter)"
    />

    {/* Shield Base Background */}
    <path
      d="M50 12 L80 24 V49 C80 67 50 85 50 85 C50 85 20 67 20 49 V24 Z"
      fill="url(#qv-surface)"
      stroke="url(#qv-cyan-glow)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* High-tech Shield Bevel Facets */}
    <path d="M50 14 L22 25 V49 C22 66 50 83 50 83 V14 Z" fill="#0284C7" opacity="0.08" />
    <path d="M50 14 L78 25 V49 C78 66 50 83 50 83 V14 Z" fill="#38BDF8" opacity="0.15" />

    {/* Stylized Quantum 'Q' & Orbital Veil Arc */}
    <path
      d="M50 25 C36.2 25 25 36.2 25 50 C25 63.8 36.2 75 50 75 C57.8 75 64.7 71.4 69.3 65.8 L76 72.5 C77.5 74 80 72.9 80 70.8 V60 C80 58.9 79.1 58 78 58 H67.2 C65.1 58 64 60.5 65.5 62 L69.8 66.3 C65.2 70.5 58.5 72.5 51 72 C39 71.2 30.2 60.8 31 48.8 C31.7 37.8 40.8 29 51.8 29 C60 29 67.2 34 70 41.5 C70.6 43 72.3 43.8 73.8 43.2 C75.3 42.6 76.1 40.9 75.5 39.4 C72 30 62.5 25 50 25 Z"
      fill="url(#qv-cyan-glow)"
    />

    {/* Core Cyber Diamond Scanner Matrix */}
    <polygon
      points="50,37 61,48 50,59 39,48"
      fill="#030712"
      stroke="#38BDF8"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

    {/* Central Pulsing Aperture / Reticle */}
    <circle cx="50" cy="48" r="4" fill="url(#qv-core-beam)" />
    <circle cx="50" cy="48" r="1.5" fill="#FFFFFF" />

    {/* Verification Tech Ticks on Shield Crest */}
    <line x1="50" y1="16" x2="50" y2="21" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
    <line x1="33" y1="26" x2="36" y2="30" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <line x1="67" y1="26" x2="64" y2="30" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

    {/* Dynamic Q-tail Cyber Accent */}
    <path d="M74 65 L84 75" stroke="url(#qv-core-beam)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="85" cy="76" r="2" fill="#22D3EE" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = false,
  withTagline = false,
  className = '',
  glow = true,
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-base', tag: 'text-[9px]' },
    sm: { icon: 'w-8 h-8', text: 'text-lg', tag: 'text-[10px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', tag: 'text-xs' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', tag: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center space-x-2.5 sm:space-x-3 select-none ${className}`}>
      <div className={`relative ${currentSize.icon} shrink-0`}>
        {glow && (
          <div className="absolute inset-0 bg-cyan-400/25 rounded-xl blur-md -z-10 animate-pulse" />
        )}
        <LogoIcon className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]" />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight text-white font-mono leading-none ${currentSize.text}`}>
            Qyber<span className="text-cyan-400">veil</span>
          </span>
          {withTagline && (
            <span className={`text-slate-400 font-sans tracking-tight mt-1 ${currentSize.tag}`}>
              Discover vulnerabilities. Understand risk. Secure with confidence.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
