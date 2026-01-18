import React, { useState, useEffect, useRef } from 'react';
import { grantChances } from '../utils/gameChances';
import { logGameEvent, verifyAdRewardOnBackend, auth } from '../services/firebase';

// --- ADMOB CONFIGURATION (STRICT) ---
const ADMOB_CONFIG = {
  // App ID should be handled in initialization, but good to have reference
  appId: 'ca-app-pub-8327141790028972~3369834487',
  // Exact Rewarded Ad Unit ID
  rewardedAdUnitId: 'ca-app-pub-8327141790028972/6561946360',
};

interface AdGateScreenProps {
  onAdComplete: () => void;
}

type AdState = 'IDLE' | 'LOADING' | 'PLAYING' | 'COMPLETED' | 'ERROR';

const AdGateScreen: React.FC<AdGateScreenProps> = ({ onAdComplete }) => {
  const [adState, setAdState] = useState<AdState>('IDLE');
  const [countdown, setCountdown] = useState(15);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNative, setIsNative] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    logGameEvent('ad_gate_view');
  }, []);

  // --- NATIVE ADMOB LOGIC ---
  const loadNativeAd = async () => {
    const AdMob = window.AdMob || window.admob;

    if (!AdMob) return false;

    try {
      // NOTE: Initialize should ideally be done in App.tsx at startup.
      // We proceed to request the ad.

      console.log('Requesting Rewarded Ad:', ADMOB_CONFIG.rewardedAdUnitId);

      // Syntax depends on plugin (admob-plus vs capacitor-community)
      // We try the common 'prepareRewardVideoAd' pattern.
      await AdMob.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.rewardedAdUnitId,
        autoShow: false
      });

      return true;
    } catch (e) {
      console.error('Native Ad failed to prepare:', e);
      logGameEvent('ad_load_fail', { error: String(e), native: true });
      return false; // Fallback to web if native fails
    }
  };

  const showNativeAd = async () => {
    const AdMob = window.AdMob || window.admob;
    if (AdMob) {
      try {
        await AdMob.showRewardVideoAd();
        logGameEvent('ad_show', { native: true });
        return true;
      } catch (e) {
        console.error('Failed to show native ad:', e);
        // If show fails, we might want to revert state or error out
        setAdState('ERROR');
        setErrorMsg('Failed to show ad. Please try again.');
        logGameEvent('ad_show_fail', { error: String(e) });
        return false;
      }
    }
    return false;
  };

  // Setup Native Listeners
  useEffect(() => {
    const AdMob = window.AdMob || window.admob;
    if (AdMob) {
      // Listener for Reward Earned - CRITICAL: Only grant chances here
      const handleReward = (data: any) => {
        console.log('Native Reward Earned:', data);
        handleAdSuccess();
      };

      // Listener for Ad Close
      const handleDismiss = () => {
        console.log('Ad Dismissed');
        // If the ad is closed and we haven't marked it as completed (rewarded), reset.
        // We check a ref or state wrapper in a real scenario, but here rely on state update speed.
        // Note: handleReward usually fires before dismiss.
        // If adState is COMPLETED, we are good. If PLAYING, user closed early.
        setAdState((current) => {
          if (current !== 'COMPLETED') {
            logGameEvent('ad_dismissed_early');
            return 'IDLE';
          }
          return current;
        });
      };

      // Listener for Ad Load
      const handleLoad = () => {
        console.log('Ad Loaded');
        setAdState('PLAYING'); // Ready to play
        showNativeAd();
      };

      // Attach listeners (Supporting multiple plugin variants)
      const events = [
        'onRewardVideoAdReward', 'onRewardedVideoAdReward', 'admob.rewarded.reward',
        'onRewardVideoAdLoad', 'admob.rewarded.load',
        'onRewardVideoAdDismiss', 'admob.rewarded.dismiss'
      ];

      // Helper to attach
      document.addEventListener('onRewardVideoAdReward', handleReward);
      document.addEventListener('onRewardedVideoAdReward', handleReward);
      document.addEventListener('admob.rewarded.reward', handleReward);

      document.addEventListener('onRewardVideoAdLoad', handleLoad);
      document.addEventListener('admob.rewarded.load', handleLoad);

      document.addEventListener('onRewardVideoAdDismiss', handleDismiss);
      document.addEventListener('admob.rewarded.dismiss', handleDismiss);

      return () => {
        document.removeEventListener('onRewardVideoAdReward', handleReward);
        document.removeEventListener('onRewardedVideoAdReward', handleReward);
        document.removeEventListener('admob.rewarded.reward', handleReward);

        document.removeEventListener('onRewardVideoAdLoad', handleLoad);
        document.removeEventListener('admob.rewarded.load', handleLoad);

        document.removeEventListener('onRewardVideoAdDismiss', handleDismiss);
        document.removeEventListener('admob.rewarded.dismiss', handleDismiss);
      };
    }
  }, []);


  // --- MAIN LOAD HANDLER ---
  const loadAd = async () => {
    setAdState('LOADING');
    setErrorMsg('');
    logGameEvent('ad_request_start');

    // 1. Try Native AdMob First
    if (window.AdMob || window.admob) {
      const success = await loadNativeAd();
      if (success) {
        setIsNative(true);
        // Timeout safeguard
        setTimeout(() => {
          setAdState((curr) => {
            if (curr === 'LOADING') {
              console.warn("Native ad timed out, falling back to web sim");
              logGameEvent('ad_timeout_fallback');
              startWebSimulation();
              return 'LOADING'; // Will be overridden by startWebSimulation state changes
            }
            return curr;
          });
        }, 8000);
        return;
      }
    }

    // 2. Fallback to Web Simulation (Dev Mode Only)
    // This allows testing the flow in browser
    console.warn('Native AdMob not found. Using Web Simulation.');
    startWebSimulation();
  };

  const startWebSimulation = () => {
    setIsNative(false);
    setTimeout(() => {
      // 5% failure rate simulation
      if (Math.random() > 0.95) {
        setAdState('ERROR');
        setErrorMsg('Ad inventory unavailable. Please try again.');
        logGameEvent('ad_load_fail', { reason: 'simulation_random_fail' });
      } else {
        setAdState('PLAYING');
        logGameEvent('ad_show', { native: false });
      }
    }, 1500);
  };


  // --- SIMULATION EFFECTS (Browser Only) ---
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    // Only run countdown for Web Simulation
    if (adState === 'PLAYING' && !isNative) {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => {
          console.warn("Autoplay prevented", e);
        });
      }

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAdSuccess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [adState, isNative]);


  const handleAdSuccess = () => {
    // STRICT: Grant exactly 3 chances
    grantChances(3);
    setAdState('COMPLETED');

    logGameEvent('ad_reward_claimed', { amount: 3 });

    // Verification Hook (Backend Hook)
    if (auth.currentUser) {
      verifyAdRewardOnBackend(auth.currentUser.uid, 'video_ad', 3);
    }

    // Auto-proceed after short delay
    setTimeout(() => {
      onAdComplete();
    }, 1500);
  };

  const handleSkip = () => {
    setAdState('IDLE');
    setCountdown(15);
    setErrorMsg('Reward not granted. You must watch the entire video.');
    logGameEvent('ad_skipped');
  };

  // --- RENDER ---

  // Native Ad View (Invisible overlay while native UI takes over)
  if (isNative && adState === 'PLAYING') {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
        <div className="text-white font-sans flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p>Showing Ad...</p>
        </div>
      </div>
    );
  }

  // Web Simulation View
  if (adState === 'PLAYING') {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center font-sans">
        <div className="relative w-full max-w-4xl aspect-video bg-black border-y border-gray-800">
          {/* Google Sample Video for Web Simulation */}
          <video
            ref={videoRef}
            src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            className="w-full h-full object-cover opacity-80"
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => console.error("Video failed to load", e)}
          />

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold border border-white/10">
            Reward in: {countdown}s
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1">
            <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
              ADVERTISEMENT (SIMULATION)
            </div>
            <div className="text-[10px] text-white/50 font-mono">
              ID: {ADMOB_CONFIG.rewardedAdUnitId.substring(0, 10)}...
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="absolute top-4 left-4 text-white/70 hover:text-white text-sm underline"
          >
            Skip (Forfeit Reward)
          </button>
        </div>
      </div>
    );
  }

  // Interstitial Gate UI
  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-slate-950 font-chalk text-slate-200 animate-[fadeIn_0.3s_ease-out] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img src="/background_main_1768702512324.png" className="w-full h-full object-cover opacity-50" alt="BG" />
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
      </div>

      <div className="max-w-md w-full p-8 text-center relative z-10">

        <div className="text-6xl mb-6 animate-float">
          📺
        </div>

        <h2 className="font-sketch text-4xl text-white mb-4 tracking-widest">
          {adState === 'COMPLETED' ? 'UNLOCKED!' : 'OUT OF MOVES'}
        </h2>

        {adState === 'COMPLETED' ? (
          <div className="animate-pop-in">
            <p className="text-xl text-[var(--primary)] mb-2 font-bold">3 Chances Granted</p>
            <div className="w-16 h-16 border-4 border-[var(--primary)] rounded-full flex items-center justify-center mx-auto mt-6">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Watch one short video ad to unlock <br />
              <span className="text-white font-bold border-b border-[var(--primary)]">3 game chances</span>.
            </p>

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                {errorMsg}
              </div>
            )}

            {adState === 'LOADING' ? (
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className="w-8 h-8 border-4 border-white/20 border-t-[var(--secondary)] rounded-full animate-spin"></div>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {isNative ? 'Loading AdMob...' : 'Loading Ad...'}
                </span>
              </div>
            ) : (
              <button
                onClick={loadAd}
                className="w-full py-4 bg-[var(--primary)] text-slate-900 font-sketch text-xl uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(248,113,113,0.3)]"
              >
                Watch Ad & Unlock
              </button>
            )}

            <div className="mt-8 text-[10px] text-slate-700 font-sans opacity-50">
              Powered by Google AdMob
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdGateScreen;