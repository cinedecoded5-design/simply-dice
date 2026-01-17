import React from 'react';

interface DiceProps {
  value: number;
  isRolling: boolean;
  onClick: () => void;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, onClick }) => {
  const dotMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const activeDots = dotMap[value] || [];

  return (
    <div
      onClick={onClick}
      className={`
        relative
        w-28 h-28
        flex items-center justify-center 
        cursor-pointer 
        select-none
        transition-all duration-300
        active:scale-90
        group
        ${isRolling ? 'animate-shake' : 'hover:-translate-y-2 hover:rotate-3'}
      `}
    >
      {/* Chalk Border Box */}
      <div 
        className="absolute inset-0 border-4 border-white border-dashed rounded-2xl opacity-90 transition-all duration-300 group-hover:border-solid group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
        style={{ filter: 'url(#chalk-noise)' }} 
      />
      
      {/* Subtle Inner Fill */}
      <div className="absolute inset-2 bg-white/5 rounded-xl backdrop-blur-sm" />

      {/* Dots */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full p-5 relative z-10">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div 
                className="w-4 h-4 bg-white rounded-full transition-transform duration-300 group-hover:scale-110" 
                style={{ 
                  filter: 'url(#chalk-noise)',
                  boxShadow: '0 0 6px rgba(255,255,255,0.9)'
                }} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dice;