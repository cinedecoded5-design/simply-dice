import React, { useState } from 'react';
import SoundManager from '../utils/SoundManager';

interface BoardSelectScreenProps {
  gameMode: 'pvp' | 'ai';
  onConfirm: (boardType: 'square' | 'triangle', size: number) => void;
  onBack: () => void;
}

// Updated friendly options
const BOARD_OPTIONS = [
  {
    type: 'square' as const,
    size: 5,
    label: 'Classic Board',
    subLabel: '5x5 Grid',
    description: 'Classic & Cozy. The perfect classroom strategy game.',
    difficulty: 'Normal'
  }
];

// --- CSS Animations & Keyframes ---
const CHALK_STYLES = `
  @keyframes chalkPopIn {
    0% { opacity: 0; transform: translateY(60px) scale(0.9) rotate(-4deg); }
    100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  }
  @keyframes chalkBounce {
    0% { transform: scale(1); }
    40% { transform: scale(1.05) translateY(-12px) rotate(1deg); }
    80% { transform: scale(0.98) translateY(2px) rotate(-1deg); }
    100% { transform: scale(1) translateY(0); }
  }
  @keyframes dustBurst {
    0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.8; }
    100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity: 0; }
  }
  
  .animate-chalk-pop { animation: chalkPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .animate-bounce-click { animation: chalkBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
`;

// --- Components ---

// 1. Chalk Dust Particle Effect
const DustEffect = () => {
  // Generate random particles
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 12;
    const dist = 30 + Math.random() * 40;
    return {
      dx: `${Math.cos(angle) * dist}px`,
      dy: `${Math.sin(angle) * dist}px`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 0.1
    };
  });

  return (
    <div className="absolute top-1/2 left-1/2 w-0 h-0 z-50 pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/40"
          style={{
            width: p.size,
            height: p.size,
            '--dx': p.dx,
            '--dy': p.dy,
            animation: `dustBurst 0.5s ease-out forwards ${p.delay}s`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// 2. Chalk Grid Visual
const ChalkGridPreview = ({ isSelected }: { isSelected: boolean }) => (
  <div className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-slate-500 bg-black/20'}`} style={{ filter: 'url(#chalk-roughness)' }}>
    <div className="grid grid-cols-3 gap-3">
      {[...Array(9)].map((_, i) => (
        <div 
          key={i} 
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSelected ? 'bg-[var(--primary)] shadow-[0_0_4px_currentColor]' : 'bg-slate-500'}`}
        />
      ))}
    </div>
    {/* Decorative chalk lines connecting dots */}
    <div className={`absolute top-[26%] left-[26%] w-[48%] h-0.5 transition-colors duration-300 ${isSelected ? 'bg-[var(--primary)]' : 'bg-slate-600'}`} />
    <div className={`absolute top-[26%] left-[26%] w-0.5 h-[48%] transition-colors duration-300 ${isSelected ? 'bg-[var(--primary)]' : 'bg-slate-600'}`} />
  </div>
);

// 3. Main Selection Card
interface SelectionCardProps {
  option: typeof BOARD_OPTIONS[0];
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ option, isSelected, index, onClick }) => {
  const [interactKey, setInteractKey] = useState(0);

  const handleTap = () => {
    setInteractKey(prev => prev + 1);
    onClick();
  };

  return (
    <div
      onClick={handleTap}
      style={{ animationDelay: `${index * 150}ms` }}
      className={`
        relative w-72 h-96 cursor-pointer group select-none
        flex flex-col items-center justify-center
        opacity-0 animate-chalk-pop fill-mode-forwards
        transition-all duration-300 ease-out
        ${isSelected ? 'z-10 scale-105' : 'scale-95 opacity-60 hover:opacity-80 hover:scale-100'}
      `}
    >
      {/* Animation Wrapper for Bounce */}
      <div key={interactKey} className={`relative w-full h-full ${isSelected ? 'animate-bounce-click' : ''}`}>
        
        {/* Dust Burst Trigger */}
        {isSelected && <DustEffect />}

        {/* --- Card Structure --- */}
        <div className={`
          absolute inset-0 bg-[#1e293b] rounded-[2rem] border-4
          transition-all duration-300 shadow-2xl
          flex flex-col items-center p-6 text-center
          ${isSelected 
            ? 'border-[var(--primary)] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] translate-y-[-10px]' 
            : 'border-white/20 border-dashed hover:border-white/40'
          }
        `}
        style={{ filter: isSelected ? 'none' : 'url(#chalk-roughness)' }}
        >
          {/* Card Texture */}
          <div className="absolute inset-0 rounded-[2rem] opacity-10 pointer-events-none mix-blend-overlay" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
          }} />

          {/* Selection Checkmark Badge */}
          <div className={`
            absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center
            border-2 bg-[#1e293b] transition-all duration-300 z-20
            ${isSelected ? 'scale-100 opacity-100 border-[var(--primary)] rotate-12' : 'scale-0 opacity-0 border-white'}
          `}>
             <span className="text-xl text-[var(--primary)]">✓</span>
          </div>

          {/* Visual Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-4">
            
            <ChalkGridPreview isSelected={isSelected} />

            <div>
              <h3 className={`font-sketch text-3xl mb-1 tracking-widest uppercase transition-colors duration-300 ${isSelected ? 'text-white drop-shadow-md' : 'text-slate-400'}`}>
                {option.label}
              </h3>
              <div className={`text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-dashed transition-all duration-300 ${isSelected ? 'bg-[var(--primary)] text-slate-900 border-transparent' : 'border-white/20 text-slate-500'}`}>
                {option.subLabel}
              </div>
            </div>

            <p className="text-sm font-chalk text-slate-400 leading-relaxed px-2">
              {option.description}
            </p>
          </div>

          {/* Bottom Hint */}
          <div className={`mt-auto pt-4 text-[10px] uppercase tracking-widest font-bold transition-opacity duration-300 ${isSelected ? 'opacity-100 text-[var(--primary)]' : 'opacity-0'}`}>
            Ready to Play
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---
const BoardSelectScreen: React.FC<BoardSelectScreenProps> = ({ gameMode, onConfirm, onBack }) => {
  const [currentBoardIndex, setCurrentBoardIndex] = useState(0);

  const handleSelect = (index: number) => {
    setCurrentBoardIndex(index);
    SoundManager.playClick();
  };

  const handleStart = () => {
    const selected = BOARD_OPTIONS[currentBoardIndex];
    SoundManager.playClick();
    onConfirm(selected.type, selected.size);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1c20] font-chalk text-slate-200 overflow-hidden">
      <style>{CHALK_STYLES}</style>

      {/* --- Chalkboard Background --- */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#1a1c20]">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d3748_0%,_#1a202c_100%)] opacity-80" />
         {/* Noise Texture */}
         <div className="absolute inset-0 opacity-[0.08]" style={{ 
           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
         }} />
      </div>

      {/* --- Top Navigation --- */}
      <div className="relative z-10 flex-none pt-12 pb-4 px-6 flex items-center justify-between">
        <button 
          onClick={() => { SoundManager.playClick(); onBack(); }}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center group-hover:border-white transition-colors">
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 top-14 text-center">
           <h2 className="font-sketch text-4xl text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform -rotate-1">
             Pick a Board
           </h2>
           <div className="w-24 h-1 bg-white/10 mx-auto mt-2 rounded-full" />
        </div>
        
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* --- Card Area --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-6 perspective-[1000px]">
        <div className="flex justify-center items-center gap-8 flex-wrap">
          {BOARD_OPTIONS.map((option, index) => (
            <SelectionCard 
              key={index}
              index={index}
              option={option}
              isSelected={index === currentBoardIndex}
              onClick={() => handleSelect(index)}
            />
          ))}
        </div>
      </div>

      {/* --- Action Bar --- */}
      <div className="relative z-10 flex-none px-6 pb-12 pt-6 flex flex-col items-center">
         <button
            onClick={handleStart}
            className="
              relative w-full max-w-xs py-5 px-8 rounded-xl
              bg-white text-slate-900 
              font-sketch text-2xl uppercase tracking-[0.2em] font-bold
              shadow-[0_0_20px_rgba(255,255,255,0.2)]
              hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1
              active:scale-95 active:translate-y-1
              transition-all duration-200
              group overflow-hidden
            "
          >
            {/* Button Dust Effect on Hover */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <span className="relative z-10 flex items-center justify-center gap-3">
              Start Game
              <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
         </button>
      </div>

    </div>
  );
};

export default BoardSelectScreen;