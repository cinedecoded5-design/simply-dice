
import React, { useState, useEffect } from 'react';
import BoardGame from './components/BoardGame';
import IntroScreen from './components/IntroScreen';
import HomeScreen from './components/HomeScreen';
import BoardSelectScreen from './components/BoardSelectScreen';
import AdGateScreen from './components/AdGateScreen';
import { DailySpinnerScreen } from './components/DailySpinnerScreen';
import { ThemeProvider } from './styles/ThemeContext';
import { getRemainingChances, consumeChanceOnGameEnd } from './utils/gameChances';
import { canSpinToday } from './utils/dailySpin';
import { logGameEvent, recordCrash } from './services/firebase';
import MusicManager from './utils/MusicManager';

// AdMob App ID per strict instructions
const ADMOB_APP_ID = 'ca-app-pub-8327141790028972~3369834487';

type Screen = 'intro' | 'dailySpinner' | 'home' | 'boardSelect' | 'game' | 'adGate';
type GameMode = 'pvp' | 'ai';
type BoardType = 'square' | 'triangle';

declare global {
  interface Window {
    AdMob?: any;
    admob?: any;
  }
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('intro');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [boardType, setBoardType] = useState<BoardType | null>(null);
  const [boardSize, setBoardSize] = useState<number>(5); // Default to 5x5
  const [chancesLeft, setChancesLeft] = useState(0); 
  
  // Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // --- BACKGROUND MUSIC LOGIC ---
  useEffect(() => {
    // Music Logic:
    // Play during Intro, Home, BoardSelect, AdGate, Spinner
    // STOP during Game
    if (screen === 'game') {
      MusicManager.stop();
    } else {
      // Small delay on intro to allow user interaction to unlock audio context first
      // But typically we can try to queue it
      MusicManager.play();
    }
  }, [screen]);

  // --- STABILITY & ANALYTICS ---
  useEffect(() => {
    // 1. Log Session Start
    logGameEvent('session_start');

    // 2. Global Error Handler (Web Crashlytics)
    const handleGlobalError = (event: ErrorEvent) => {
      recordCrash(event.error, 'window.onerror');
    };
    
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      recordCrash(event.reason, 'unhandled_promise');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  // Initialize AdMob at Startup
  useEffect(() => {
    const initAdMob = async () => {
      const AdMob = window.AdMob || window.admob;
      if (AdMob) {
        try {
          console.log('Initializing AdMob SDK...');
          await AdMob.initialize({ appId: ADMOB_APP_ID });
          console.log('AdMob SDK Initialized');
        } catch (e) {
          console.error('AdMob Initialization Error:', e);
          recordCrash(e, 'admob_init');
        }
      }
    };
    initAdMob();
  }, []);

  // Sync chances on mount and screen changes
  useEffect(() => {
    const left = getRemainingChances();
    setChancesLeft(left);
    logGameEvent('screen_view', { screen_name: screen, chances_remaining: left });
  }, [screen]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logGameEvent('network_status', { status: 'online' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      logGameEvent('network_status', { status: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleIntroComplete = () => {
    // Check daily spin eligibility
    if (canSpinToday()) {
      setScreen('dailySpinner');
    } else {
      setScreen('home');
    }
  };
  
  const handleSpinnerComplete = () => {
    // Update local chance state just in case, then go home
    setChancesLeft(getRemainingChances());
    setScreen('home');
  };

  const handlePlayClick = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('boardSelect');
    logGameEvent('select_game_mode', { mode });
  };

  const handleBoardConfirm = (selectedBoard: BoardType, size: number) => {
    setBoardType(selectedBoard);
    setBoardSize(size);
    logGameEvent('select_board', { board: selectedBoard, size: size });
    
    // Check chances before allowing game
    const chances = getRemainingChances();
    if (chances > 0) {
      setScreen('game');
    } else {
      setScreen('adGate');
    }
  };

  const handleBackToHome = () => {
    setScreen('home');
    setGameMode(null);
    setBoardType(null);
  };

  const handleAdComplete = () => {
    // Ad finished successfully, check chances (utility updates storage) and move to game
    setChancesLeft(getRemainingChances());
    setScreen('game');
  };

  const handleGameEnd = () => {
    // Decrement chance when game finishes
    consumeChanceOnGameEnd();
    setChancesLeft(getRemainingChances());
    logGameEvent('game_complete', { mode: gameMode, board: boardType, size: boardSize });
  };

  return (
    <ThemeProvider>
      {/* Offline Blocking Overlay - STRICT RULE: No offline gameplay */}
      {!isOnline && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md font-chalk text-slate-200 select-none animate-[fadeIn_0.3s_ease-out]">
          <div className="absolute inset-0 bg-chalkboard opacity-50 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center p-8 max-w-md text-center animate-shake">
            <div className="text-7xl mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              📡
            </div>
            
            <h1 className="font-sketch text-5xl text-red-400 mb-6 tracking-widest drop-shadow-md">
              OFFLINE
            </h1>
            
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
            
            <p className="text-xl font-chalk text-slate-300 mb-2">
              Connection Lost
            </p>
            
            <p className="text-sm font-sans text-slate-500 uppercase tracking-widest mb-8">
              An active internet connection is required to play.
            </p>
            
            <div className="flex items-center gap-3 px-5 py-3 border border-white/10 bg-white/5 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-400 tracking-wider">WAITING FOR NETWORK...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Content */}
      <div className={`min-h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden selection:bg-pink-500 selection:text-white transition-all duration-500 ${!isOnline ? 'blur-sm grayscale pointer-events-none' : ''}`}>
        
        {screen === 'intro' && (
          <IntroScreen onComplete={handleIntroComplete} />
        )}
        
        {screen === 'dailySpinner' && (
          <DailySpinnerScreen onComplete={handleSpinnerComplete} />
        )}

        {screen === 'home' && (
          <HomeScreen onStartGame={handlePlayClick} />
        )}

        {screen === 'boardSelect' && gameMode && (
          <BoardSelectScreen 
            gameMode={gameMode}
            onConfirm={handleBoardConfirm}
            onBack={handleBackToHome}
          />
        )}

        {screen === 'adGate' && (
          <AdGateScreen onAdComplete={handleAdComplete} />
        )}

        {screen === 'game' && boardType && gameMode && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <BoardGame 
              isAIMode={gameMode === 'ai'} 
              boardType={boardType} 
              gridSize={boardSize}
              onGameEnd={handleGameEnd}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
