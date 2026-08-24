import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textClassName?: string;
  lang?: 'en' | 'ar';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-10 h-10',
  lang = 'en'
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Qawafil Al Majd Logo"
      >
        <defs>
          <clipPath id="logoSunClip">
            <circle cx="100" cy="98" r="66" />
          </clipPath>
        </defs>

        {/* Crimson Red Sun Base with Cloud Cutouts */}
        <g clipPath="url(#logoSunClip)">
          <rect x="20" y="20" width="160" height="160" fill="#DC2626" />
          {/* Top Cloud Cutout */}
          <path d="M 20,68 Q 60,68 70,62 Q 78,54 90,58 Q 102,62 108,68 L 180,68 L 180,75 L 105,75 Q 98,75 92,72 Q 80,68 68,75 L 20,75 Z" fill="#FFFFFF" />
          {/* Middle Cloud Cutout */}
          <path d="M 20,93 L 132,93 Q 140,86 150,88 Q 160,90 180,88 L 180,97 L 145,97 Q 138,97 132,95 L 20,95 Z" fill="#FFFFFF" />
        </g>

        {/* Ground Baseline / Speed Track */}
        <ellipse cx="102" cy="155" rx="72" ry="2.5" fill="#18181B" />
        <rect x="32" y="153.5" width="138" height="2" rx="1" fill="#18181B" />

        {/* VIP Coach Bus Body */}
        <g>
          {/* White Main Frame */}
          <path
            d="M 52,104 C 52,101 54,98 58,98 L 94,98 C 106,99 150,116 166,123 C 169,124 170,126 170,130 L 170,143 C 170,146 168,147 165,147 L 158,147 C 157,141 152,137 146,137 C 140,137 135,141 134,147 L 112,147 C 111,141 106,137 100,137 C 94,137 89,141 88,147 L 56,147 C 53,147 50,145 49,142 L 47,118 C 47,112 49,105 52,104 Z"
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Front Cabin Windshield */}
          <path
            d="M 54,105 L 84,105 C 86,105 87,106 87,108 L 86,128 C 86,130 84,131 82,132 L 51,135 C 49,135 48,134 48,132 L 49,114 C 49,109 51,106 54,105 Z"
            fill="#18181B"
          />

          {/* Side Mirror */}
          <path d="M 44,110 C 42,110 40,112 40,116 L 41,123 C 41,125 43,126 45,125 L 47,123 L 47,115 L 45,110 Z" fill="#18181B" />
          <path d="M 47,112 L 50,114" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />

          {/* Glass Glare Highlight */}
          <path d="M 75,108 L 79,108 L 76,129 L 73,129 Z" fill="#FFFFFF" opacity="0.35" />

          {/* Panoramic Side Windows */}
          <path
            d="M 91,106 L 163,126 C 165,127 166,128 166,130 L 165,139 L 90,133 C 89,133 89,132 89,130 L 89,108 C 89,106 90,106 91,106 Z"
            fill="#18181B"
          />

          {/* Window Dividers */}
          <line x1="105" y1="110" x2="104" y2="134" stroke="#FFFFFF" strokeWidth="1.8" />
          <line x1="119" y1="114" x2="118" y2="135" stroke="#FFFFFF" strokeWidth="1.8" />
          <line x1="133" y1="118" x2="132" y2="136.5" stroke="#FFFFFF" strokeWidth="1.8" />
          <line x1="147" y1="122" x2="146" y2="138" stroke="#FFFFFF" strokeWidth="1.8" />

          {/* Coach Accent Line */}
          <path d="M 92,137 Q 120,139 164,142" stroke="#18181B" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* Headlights */}
          <path d="M 49,139 L 55,138 L 54,141 L 49,141 Z" fill="#18181B" />
          <path d="M 75,137 L 83,136 L 82,139 L 76,140 Z" fill="#18181B" />

          {/* Wheels */}
          <circle cx="100" cy="147" r="7.5" fill="#18181B" />
          <circle cx="100" cy="147" r="4.2" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.2" />
          <circle cx="100" cy="147" r="1.5" fill="#18181B" />

          <circle cx="146" cy="147" r="7.5" fill="#18181B" />
          <circle cx="146" cy="147" r="4.2" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.2" />
          <circle cx="146" cy="147" r="1.5" fill="#18181B" />
        </g>
      </svg>
    </div>
  );
};
export default BrandLogo;
