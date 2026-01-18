import React, { useState, useEffect } from 'react';
import BearLogo from './BearLogo';
import { useTheme } from '../styles/ThemeContext';
import { getRemainingChances } from '../utils/gameChances';
import SoundManager from '../utils/SoundManager';
import MusicManager from '../utils/MusicManager';

interface HomeScreenProps {
  onStartGame: (mode: 'pvp' | 'ai') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!SoundManager.getMuted());
  const { currentTheme, setTheme, availableThemes } = useTheme();

  // We read chances here for display, but App.tsx handles the actual gating logic
  const chances = getRemainingChances();

  useEffect(() => {
    // Ensure sound settings match local storage
    const isMuted = SoundManager.getMuted();
    setSoundEnabled(!isMuted);
    // Ensure music manager matches sound manager on mount
    MusicManager.setMuted(isMuted);
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);

    // Toggle both SFX and BGM
    const isMuted = !newState;
    SoundManager.setMuted(isMuted);
    MusicManager.setMuted(isMuted);

    if (newState) {
      SoundManager.playClick();
    }
  };

  const playClick = () => {
    SoundManager.playClick();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-between py-8 px-6 relative overflow-hidden font-chalk bg-slate-950">

      {/* --- Premium Background Layer --- */}
      <div className="absolute inset-0 z-0">
        <img
          src="/background_main_1768702512324.png"
          className="w-full h-full object-cover opacity-60"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-transparent to-black/90" />
      </div>

      {/* --- Header Section --- */}
      <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full max-w-md animate-[slideDown_0.8s_cubic-bezier(0.2,0.8,0.2,1)]">
        <div className="relative group cursor-pointer active:scale-95 transition-transform" onClick={() => { setShowSettings(true); playClick(); }}>
          <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 animate-float transition-transform duration-300 group-hover:rotate-1">
            <img
              src="/bear_mascot_home_v2.png"
              className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
              alt="Simply Dice Bear"
            />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20 inset-shadow-lg pointer-events-none" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 px-4 py-1.5 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 backdrop-blur-md shadow-lg">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Settings</span>
          </div>
        </div>

        <h1 className="mt-10 font-sketch text-6xl md:text-7xl text-white tracking-widest text-center drop-shadow-2xl" style={{ filter: 'url(#chalk-noise)' }}>
          Simply <span className="text-[var(--primary)] relative inline-block">Dice
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-[var(--primary)] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </span>
        </h1>

        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="flex items-center gap-4 opacity-60">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
            <p className="text-slate-300 font-bold text-xs tracking-[0.3em] uppercase">Dots & Boxes</p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
          </div>
          <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm ${chances === 0 ? 'text-red-300 bg-red-900/20' : 'text-slate-400 bg-white/5'}`}>
            Chances Left: {chances}
          </div>
        </div>
      </div>

      {/* --- Chalk Buttons --- */}
      <div className="w-full max-w-sm flex flex-col gap-6 mb-12 z-10 animate-[slideUp_0.8s_0.2s_both]">
        {/* 1. Play Local */}
        <button
          onClick={() => { onStartGame('pvp'); playClick(); }}
          className="group relative w-full h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 border-2 border-[var(--primary)] rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300" style={{ filter: 'url(#chalk-noise)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}></div>
          <div className="absolute inset-0 bg-[var(--primary)] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl" />

          <div className="flex items-center justify-between px-8 h-full">
            <div className="flex flex-col items-start gap-1">
              <span className="text-3xl font-sketch text-[var(--primary)] group-hover:text-white transition-colors duration-300 drop-shadow-md">PLAY LOCAL</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase group-hover:text-[var(--primary)] transition-colors">Challenge a Friend</span>
            </div>
            <div className="w-12 h-12 border-2 border-[var(--primary)] rounded-full flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:bg-[var(--primary)] group-hover:text-black transition-all duration-300 shadow-md">
              <span className="font-bold text-xs">P v P</span>
            </div>
          </div>
        </button>

        {/* 2. Play Solo */}
        <button
          onClick={() => { onStartGame('ai'); playClick(); }}
          className="group relative w-full h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 border-2 border-[var(--secondary)] rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300" style={{ filter: 'url(#chalk-noise)', borderRadius: '15px 225px 15px 255px / 255px 15px 225px 15px' }}></div>
          <div className="absolute inset-0 bg-[var(--secondary)] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl" />

          <div className="flex items-center justify-between px-8 h-full">
            <div className="flex flex-col items-start gap-1">
              <span className="text-3xl font-sketch text-[var(--secondary)] group-hover:text-white transition-colors duration-300 drop-shadow-md">PLAY SOLO</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase group-hover:text-[var(--secondary)] transition-colors">Challenge CPU</span>
            </div>
            <div className="w-12 h-12 border-2 border-[var(--secondary)] rounded-full flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:bg-[var(--secondary)] group-hover:text-black transition-all duration-300 shadow-md">
              <span className="font-bold text-xs">AI</span>
            </div>
          </div>
        </button>
      </div>

      {/* --- Settings Panel (Chalkboard Style - kept mostly same but ensuring backdrop works) --- */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => { setShowSettings(false); playClick(); }} />
          <div className="relative w-full max-w-md bg-[#1e1e1e] border-t border-white/10 rounded-t-[40px] p-10 animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

            <div className="flex items-center justify-between mb-10 mt-2">
              <h2 className="font-sketch text-4xl text-white">Chalk Box</h2>
              <button onClick={() => { setShowSettings(false); playClick(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="text-slate-400 font-bold text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Select Chalk Color</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                  {availableThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => { setTheme(theme.id); playClick(); }}
                      className={`
                        w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center relative
                        ${currentTheme === theme.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}
                      `}
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                      {currentTheme === theme.id && (
                        <div className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-lg font-bold text-white tracking-wide">Sound Effects</span>
                <button
                  onClick={handleToggleSound}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 border-2 ${soundEnabled ? 'bg-[var(--primary)] border-[var(--primary)]' : 'bg-transparent border-slate-600'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="text-center pt-2 opacity-30 text-[10px] font-bold uppercase tracking-[0.3em]">
                Simply Dice v1.1
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;