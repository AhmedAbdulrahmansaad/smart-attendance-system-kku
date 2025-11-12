import React from 'react';

interface KKULogoProps {
  className?: string;
  size?: number;
}

export function KKULogo({ className = '', size = 100 }: KKULogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Circle - Gold */}
      <circle cx="100" cy="100" r="95" fill="#D4AF37" opacity="0.1" />
      <circle cx="100" cy="100" r="95" stroke="#D4AF37" strokeWidth="3" fill="none" />
      
      {/* Inner Circle - Green */}
      <circle cx="100" cy="100" r="80" fill="#006747" opacity="0.05" />
      <circle cx="100" cy="100" r="80" stroke="#006747" strokeWidth="2" fill="none" />
      
      {/* Crown Symbol - Representing Kingdom */}
      <g transform="translate(100, 50)">
        <path
          d="M -25 0 L -20 -15 L -10 -5 L 0 -20 L 10 -5 L 20 -15 L 25 0 L 25 10 L -25 10 Z"
          fill="#D4AF37"
          stroke="#D4AF37"
          strokeWidth="1"
        />
        <circle cx="-20" cy="-15" r="3" fill="#FFD700" />
        <circle cx="0" cy="-20" r="3" fill="#FFD700" />
        <circle cx="20" cy="-15" r="3" fill="#FFD700" />
      </g>
      
      {/* Book Symbol - Representing Education */}
      <g transform="translate(100, 90)">
        <rect x="-30" y="0" width="60" height="40" rx="3" fill="#006747" />
        <rect x="-28" y="2" width="56" height="36" rx="2" fill="#00875A" />
        <line x1="-30" y1="10" x2="30" y2="10" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <line x1="-30" y1="20" x2="30" y2="20" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <line x1="-30" y1="30" x2="30" y2="30" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="0" x2="0" y2="40" stroke="#004d35" strokeWidth="2" />
      </g>
      
      {/* Decorative Palm Branches */}
      <g transform="translate(50, 100)" opacity="0.3">
        <path
          d="M 0 0 Q -10 -20 -15 -30 Q -10 -25 0 -20"
          stroke="#006747"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 0 0 Q -15 -10 -20 -15 Q -15 -12 0 -10"
          stroke="#006747"
          strokeWidth="2"
          fill="none"
        />
      </g>
      
      <g transform="translate(150, 100) scale(-1, 1)" opacity="0.3">
        <path
          d="M 0 0 Q -10 -20 -15 -30 Q -10 -25 0 -20"
          stroke="#006747"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 0 0 Q -15 -10 -20 -15 Q -15 -12 0 -10"
          stroke="#006747"
          strokeWidth="2"
          fill="none"
        />
      </g>
      
      {/* Arabic Text KKU */}
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fill="#006747"
        fontSize="16"
        fontWeight="bold"
        fontFamily="Tajawal, Arial"
      >
        جامعة الملك خالد
      </text>
      
      {/* English Text */}
      <text
        x="100"
        y="178"
        textAnchor="middle"
        fill="#D4AF37"
        fontSize="10"
        fontWeight="600"
        fontFamily="IBM Plex Sans, Arial"
      >
        KING KHALID UNIVERSITY
      </text>
    </svg>
  );
}
