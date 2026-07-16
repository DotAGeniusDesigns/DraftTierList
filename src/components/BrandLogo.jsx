import React from 'react';

const BrandLogo = ({ className = 'h-10 w-10', darkMode = false }) => (
    <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="ft-logo-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="0.5" stopColor="#10b981" />
                <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="ft-logo-shine" x1="8" y1="6" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.35" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
        </defs>
        <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#ft-logo-grad)" />
        <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#ft-logo-shine)" />
        <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            stroke={darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)'}
            strokeWidth="1"
        />
        <path
            d="M24 14c-5.5 0-10 3.1-10 7s4.5 7 10 7 10-3.1 10-7-4.5-7-10-7z"
            fill={darkMode ? 'rgba(15,23,42,0.85)' : 'white'}
            fillOpacity="0.95"
        />
        <path
            d="M24 16.5v11M19.5 19.5c1.8-1.2 4.2-1.2 6 0M19.5 24.5c1.8 1.2 4.2 1.2 6 0"
            stroke="#10b981"
            strokeWidth="1.4"
            strokeLinecap="round"
        />
        <path
            d="M15 11.5l3 3M33 11.5l-3 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
        />
        <circle cx="24" cy="11" r="2" fill="white" opacity="0.85" />
    </svg>
);

export default BrandLogo;
