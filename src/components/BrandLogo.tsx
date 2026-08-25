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
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}>
      <img
        src="/assets/logo.svg"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith('/logo.png')) {
            target.src = '/logo.png';
          }
        }}
        alt="Qawafil Al Majd Logo"
        className="w-full h-full object-contain drop-shadow-sm"
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};
export default BrandLogo;

