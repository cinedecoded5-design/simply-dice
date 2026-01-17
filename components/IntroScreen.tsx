import React, { useEffect, useState } from 'react';
import BearLogo from './BearLogo';
import SoundManager from '../utils/SoundManager';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Attempt to init audio context silently if possible, though user gesture is usually required
    // We mainly rely on the tap handler below
    const timer = setTimeout(() => {
      handleComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    if (exiting) return;
    setExiting(true);
    SoundManager.playClick();
    setTimeout(onComplete, 600);
  };

  return (
    <div
      onClick={handleComplete}
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        overflow-hidden cursor-pointer
        transition-all duration-700 ease-out
        ${exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
      `}
    >
      {/* --- Premium Background Layer --- */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        {/* Deep Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-black opacity-90" />
        
        {/* Ambient Glow */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_farthest-corner_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-transparent animate-[spin_45s_linear_infinite] opacity-60" />
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
        }} />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${exiting ? 'translate-y-10' : 'translate-y-0'}`}>
        
        {/* Mascot */}
        <div className="relative mb-10 animate-pop-in">
          <BearLogo className="w-56 h-56 relative z-10 animate-float drop-shadow-2xl" />
          {/* Subtle glow behind logo */}
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-75 animate-pulse-glow z-0" />
        </div>

        {/* Text Container */}
        <div className="text-center space-y-4">
          <h1 className="font-sketch text-5xl md:text-7xl text-white opacity-0 animate-[slideUp_0.8s_0.2s_forwards] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ filter: 'url(#chalk-noise)' }}>
            Simply
            <span className="text-[var(--primary)] mx-3">Dice</span>
          </h1>

          <p className="font-chalk text-slate-400 text-xl tracking-widest uppercase opacity-0 animate-[slideUp_0.8s_0.4s_forwards] text-shadow-sm">
            Classroom Classics
          </p>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-12 font-chalk text-slate-500 text-sm animate-[fadeIn_1s_1s_forwards] tracking-wider z-10">
        Tap the board to start
      </div>
    </div>
  );
};

export default IntroScreen;