import React from 'react';

interface EasyEngLogoProps {
  className?: string;
  src?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const EasyEngLogo: React.FC<EasyEngLogoProps> = ({ 
  className = "w-10 h-10 sm:w-11 sm:h-11",
  src,
  size,
  style
}) => {
  if (src) {
    const containerStyle: React.CSSProperties = size
      ? {
          maxWidth: `${size}px`,
          width: 'max-content',
          height: 'auto',
          maxHeight: `${size}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }
      : { ...style };

    const imgStyle: React.CSSProperties = size
      ? {
          width: `${size}px`,
          maxWidth: '100%',
          height: 'auto',
          maxHeight: `${size}px`,
          objectFit: 'contain',
          display: 'block'
        }
      : {};

    return (
      <div 
        style={containerStyle}
        className={`relative inline-flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${size ? '' : className}`}
      >
        <img 
          src={src} 
          alt="Logo" 
          style={imgStyle}
          className={`max-w-full h-auto object-contain rounded-xl drop-shadow-sm ${size ? '' : 'w-full h-full'}`} 
        />
      </div>
    );
  }

  const dynamicStyle: React.CSSProperties = size
    ? { width: `${size}px`, height: `${size}px`, maxWidth: '100%', maxHeight: `${size}px`, ...style }
    : { ...style };

  return (
    <div 
      style={dynamicStyle}
      className={`relative flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300 ${size ? '' : className}`}
    >
      {/* Outer Glow / Shadow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 rounded-2xl blur-xs opacity-50 -z-10" />

      {/* Main Emblem Container */}
      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 p-1.5 sm:p-2 shadow-md shadow-orange-500/25 border border-white/40 flex items-center justify-center overflow-hidden relative">
        {/* Subtle glass reflection highlight */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white/30 rounded-full blur-[2px] pointer-events-none" />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm select-none"
        >
          {/* Friendly English Speech Bubble Base */}
          <path
            d="M8 14C8 8.47715 12.4772 4 18 4H30C35.5228 4 40 8.47715 40 14V25C40 30.5228 35.5228 35 30 35H22.5L14 41V35C10.6863 35 8 32.3137 8 29V14Z"
            fill="white"
            className="drop-shadow-xs"
          />

          {/* Dynamic Stylized 'E' */}
          <path
            d="M17 12H31C32.1046 12 33 12.8954 33 14C33 15.1046 32.1046 16 31 16H22V19.5H29.5C30.6046 19.5 31.5 20.3954 31.5 21.5C31.5 22.6046 30.6046 23.5 29.5 23.5H22V27H31C32.1046 27 33 27.8954 33 29C33 30.1046 32.1046 31 31 31H17C15.8954 31 15 30.1046 15 29V14C15 12.8954 15.8954 12 17 12Z"
            fill="url(#eGrad)"
          />

          {/* Energetic Lightning Bolt Slicing Through */}
          <path
            d="M26 10L18 22H24L20 32L30 19H24L26 10Z"
            fill="url(#boltGrad)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Dynamic Sparkle Stars */}
          <path
            d="M36 6L37.2 9.8L41 11L37.2 12.2L36 16L34.8 12.2L31 11L34.8 9.8L36 6Z"
            fill="#FEF08A"
          />
          <circle cx="11" cy="9" r="1.5" fill="#FDE047" />

          {/* Gradients */}
          <defs>
            <linearGradient id="eGrad" x1="15" y1="12" x2="33" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EA580C" />
              <stop offset="1" stopColor="#E11D48" />
            </linearGradient>
            <linearGradient id="boltGrad" x1="18" y1="10" x2="30" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
