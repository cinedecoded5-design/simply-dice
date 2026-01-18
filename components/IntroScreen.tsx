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
      <div className="absolute inset-0 z-0">
        <img
          src="/background_main_1768702512324.png"
          className="w-full h-full object-cover opacity-80"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${exiting ? 'translate-y-10' : 'translate-y-0'}`}>

        {/* Mascot */}
        <div className="relative mb-10 animate-pop-in flex justify-center">
          <img
            src="/bear_mascot_intro_v2.png"
            alt="Cool Bear"
            className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 animate-float filter drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          />
          {/* Subtle glow behind logo */}
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110 animate-pulse-glow z-0" />
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