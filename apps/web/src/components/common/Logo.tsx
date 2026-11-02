import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  withTagline?: boolean;
  className?: string;
  glow?: boolean;
}

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
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      <div className={`relative ${currentSize.icon} shrink-0`}>
        {glow && (
          <div className="absolute inset-0 bg-cyan-400/25 rounded-xl blur-md -z-10 animate-pulse" />
        )}
        <img
          src="/qyberveil-logo.svg"
          alt="Qyberveil Shield Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]"
        />
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
