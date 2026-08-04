import React from 'react';

const BrandLogo = ({ className = 'h-10 w-10' }) => (
    <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <rect x="2" y="2" width="44" height="44" rx="11" fill="#0f172a" />
        <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="11"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeOpacity="0.35"
        />
        {/* F — emerald */}
        <path
            d="M13 11h11v3.5H16.5v5.25H23V23H16.5v14H13V11z"
            fill="#10b981"
        />
        {/* T — white */}
        <path
            d="M27 11h12v3.5H33.25v17.5H29.5V14.5H27V11z"
            fill="#ffffff"
        />
    </svg>
);

export default BrandLogo;
