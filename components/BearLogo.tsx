import React from 'react';

interface BearLogoProps {
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const BearLogo: React.FC<BearLogoProps> = ({ className = "w-32 h-32", onClick, interactive = false }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${className} ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-300' : ''}`}
      onClick={onClick}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'url(#chalk-noise)' }}
    >
      {/* Chalk Outline Style */}
      
      {/* Ears */}
      <circle cx="40" cy="50" r="30" stroke="white" strokeWidth="3" fill="none" strokeDasharray="60 10" strokeLinecap="round" />
      <circle cx="160" cy="50" r="30" stroke="white" strokeWidth="3" fill="none" strokeDasharray="60 10" strokeLinecap="round" />

      {/* Head */}
      <path d="M 30 140 C 30 50, 170 50, 170 140 C 170 190, 30 190, 30 140" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <g className="animate-float">
        <circle cx="70" cy="90" r="8" fill="white" fillOpacity="0.8" />
        <circle cx="130" cy="90" r="8" fill="white" fillOpacity="0.8" />

        {/* Muzzle Area */}
        <ellipse cx="100" cy="125" rx="35" ry="25" stroke="white" strokeWidth="2" strokeDasharray="5 5" fill="none" />
        
        {/* Nose */}
        <circle cx="100" cy="115" r="10" fill="white" fillOpacity="0.9" />

        {/* Smile */}
        <path d="M100 125 L100 135 M85 135 Q100 150 115 135" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export default BearLogo;