import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          {/* ⚠️ Modificado: stopColor en lugar de stop-color */}
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="#1e1e24" />
      <path d="M160 160 H352 L256 256 Z" fill="url(#logoGrad)" opacity="0.9" />
      {/* ⚠️ Modificados: strokeWidth y strokeLinejoin */}
      <path d="M160 352 H352 L256 256 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="24" strokeLinejoin="round" />
      {/* ⚠️ Modificados: strokeWidth y strokeLinecap */}
      <line x1="210" y1="300" x2="302" y2="300" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
      <line x1="190" y1="324" x2="322" y2="324" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
      <path d="M140 140 H372" stroke="#ffffff" strokeWidth="28" strokeLinecap="round" />
      <path d="M140 372 H372" stroke="#ffffff" strokeWidth="28" strokeLinecap="round" />
    </svg>
  );
};