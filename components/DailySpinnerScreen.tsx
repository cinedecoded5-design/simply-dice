import React, { useState, useRef, useEffect } from 'react';
import { grantChances } from '../utils/gameChances';
import { markSpinComplete } from '../utils/dailySpin';
import SoundManager from '../utils/SoundManager';

interface DailySpinnerScreenProps {
  onComplete: () => void;
}

// --- CONFIGURATION ---
const WHEEL_SIZE = 340; 
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 20; 

// Segments configuration
const SEGMENTS = [
  { value: 5, label: '+5', color: '#fbbf24', text: '#000' }, // Gold
  { value: 1, label: '+1', color: '#ef4444', text: '#fff' }, // Red
  { value: 2, label: '+2', color: '#3b82f6', text: '#fff' }, // Blue
  { value: 3, label: '+3', color: '#22c55e', text: '#fff' }, // Green
  { value: 1, label: '+1', color: '#ef4444', text: '#fff' }, // Red
  { value: 2, label: '+2', color: '#3b82f6', text: '#fff' }, // Blue
  { value: 3, label: '+3', color: '#22c55e', text: '#fff' }, // Green
  { value: 1, label: '+1', color: '#ef4444', text: '#fff' }, // Red
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length;

// --- PHYSICS CONSTANTS (TUNED FOR SUSPENSE) ---
const TOTAL_SPINS = 10;          // More rotations for high energy
const ACCEL_RATE = 12.0;         // Immediate "Power Spin" start (was 1.5)
const MAX_SPEED = 65;            // Very fast max speed
const BRAKING_DIST = 1000;       // Long braking zone for suspense (~2.7 rotations)
const MIN_CRAWL_SPEED = 0.05;    // Extremely slow crawl at the very end

// Helper to convert polar to cartesian for SVG paths
const getCoordinatesForPercent = (percent: number, radius: number) => {
  const x = CENTER + radius * Math.cos(2 * Math.PI * percent);
  const y = CENTER + radius * Math.sin(2 * Math.PI * percent);
  return [x, y];
};

export const DailySpinnerScreen: React.FC<DailySpinnerScreenProps> = ({ onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [totalChances, setTotalChances] = useState(0);

  // Refs for animation loop
  const wheelRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentRotationRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0);
  const lastSegmentRef = useRef<number>(-1);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    SoundManager.playClick();
    SoundManager.playSpinStart(); 
    setIsSpinning(true);
    
    currentRotationRef.current = 0;
    currentSpeedRef.current = 0;
    lastSegmentRef.current = -1;

    // 1. Determine Winner
    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const wonSegment = SEGMENTS[winningIndex];
    setRewardAmount(wonSegment.value);

    // 2. Calculate Target Angle
    // The pointer is at 270 degrees (Top). 
    // We want the center of the winning segment to land at 270.
    const segmentCenter = (winningIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
    
    // We need to rotate the wheel such that 'segmentCenter' aligns with 270.
    // Target Rotation = (360 * Spins) + (270 - segmentCenter)
    // We add randomness (+/- Jitter) so it doesn't always land dead center
    const jitter = (Math.random() * 20) - 10; // +/- 10 degrees randomness
    let targetDelta = 270 - segmentCenter + jitter;
    
    // Normalize positive
    while (targetDelta < 0) targetDelta += 360;

    const totalTargetRotation = (360 * TOTAL_SPINS) + targetDelta;

    // 3. Physics Loop
    const animate = () => {
      const currentRot = currentRotationRef.current;
      const remainingDistance = totalTargetRotation - currentRot;

      // --- PHASE 1: POWER SPIN (ACCELERATION) ---
      if (remainingDistance > BRAKING_DIST) {
        // Accelerate extremely fast to max speed
        if (currentSpeedRef.current < MAX_SPEED) {
          currentSpeedRef.current = Math.min(currentSpeedRef.current + ACCEL_RATE, MAX_SPEED);
        }
      } 
      // --- PHASE 2: SUSPENSE ZONE (DECELERATION) ---
      else {
        // t goes from 1.0 (start of brake) down to 0.0 (stopped)
        const t = remainingDistance / BRAKING_DIST;
        
        // Exponential decay for dramatic braking.
        // Math.pow(t, 3.0) creates a curve that drops speed rapidly at first,
        // then lingers in the low numbers for a long time (the crawl).
        const idealSpeed = MAX_SPEED * Math.pow(t, 3.0);
        
        // Clamp to min crawl speed to prevent infinite stall
        currentSpeedRef.current = Math.max(idealSpeed, MIN_CRAWL_SPEED);
      }

      // Safety stop: If we are extremely close and speed is at crawl minimum
      if (remainingDistance <= 0.5) {
        finishSpin(totalTargetRotation, wonSegment.value);
        return;
      }

      // Apply Velocity
      const newRot = currentRot + currentSpeedRef.current;
      currentRotationRef.current = newRot;

      // Render
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${newRot}deg)`;
      }

      // Audio Trigger (Tick Sound)
      // Check if we crossed a segment boundary relative to the pointer (270deg)
      // The angle under the pointer is (270 - rotation) % 360
      let pointerAngle = (270 - newRot) % 360; 
      if (pointerAngle < 0) pointerAngle += 360;
      
      const currentSegmentIndex = Math.floor(pointerAngle / SEGMENT_ANGLE);
      
      if (currentSegmentIndex !== lastSegmentRef.current && lastSegmentRef.current !== -1) {
        // Only tick if speed is reasonable (don't buzz like a saw at max speed)
        // Adjust tick volume or frequency based on speed could be cool, but standard tick is fine.
        SoundManager.playTick();
      }
      lastSegmentRef.current = currentSegmentIndex;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const finishSpin = (finalAngle: number, amount: number) => {
    // Snap exact
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
    }
    
    // Delay reward popup slightly for impact (0.5s pause)
    setTimeout(() => {
      const newTotal = grantChances(amount);
      setTotalChances(newTotal);
      markSpinComplete();
      SoundManager.playFanfare();
      setIsSpinning(false);
      setShowReward(true);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-chalk text-slate-200 overflow-hidden select-none">
       {/* Background */}
       <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] opacity-90" />
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ 
           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
         }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md px-6">
        
        {/* Header */}
        <div className="text-center space-y-2 animate-slideDown">
          <h2 className="font-sketch text-5xl text-white tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
            Daily <span className="text-[var(--primary)]">Spin</span>
          </h2>
          <div className="flex items-center justify-center gap-2 opacity-80">
            <div className="h-px w-8 bg-white/40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300">Try Your Luck</p>
            <div className="h-px w-8 bg-white/40" />
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative group">
          {/* Pointer (Triangle) */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
             {/* Pointer Glow */}
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/40 blur-md rounded-full -z-10" />
             {/* Metal Pointer Body */}
             <div className="w-8 h-12">
               <svg viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M16 48L0 12C0 5.37258 7.16344 0 16 0C24.8366 0 32 5.37258 32 12L16 48Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
                 <circle cx="16" cy="12" r="4" fill="#94a3b8" />
               </svg>
             </div>
          </div>

          {/* Wheel Frame (Outer Glow) */}
          <div className="relative rounded-full p-2 bg-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]">
            
            {/* ROTATING SVG WHEEL */}
            <div 
              ref={wheelRef}
              className="rounded-full relative overflow-hidden"
              style={{ 
                width: WHEEL_SIZE, 
                height: WHEEL_SIZE, 
                willChange: 'transform' // Performance optimization
              }}
            >
              <svg 
                viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} 
                className="w-full h-full drop-shadow-2xl"
              >
                <defs>
                  {/* Glossy gradient for segments */}
                  <radialGradient id="segmentShine" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="60%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.2" />
                  </radialGradient>
                  {/* Gold Rim Gradient */}
                  <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="25%" stopColor="#fcd34d" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="75%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                {/* Outer Rim (Metallic) */}
                <circle 
                  cx={CENTER} 
                  cy={CENTER} 
                  r={RADIUS + 10} 
                  fill="#1e293b" 
                  stroke="url(#goldRim)" 
                  strokeWidth="12"
                  filter="drop-shadow(0px 0px 4px rgba(0,0,0,0.5))"
                />

                {/* Segments */}
                <g>
                  {SEGMENTS.map((seg, i) => {
                    const startAngle = (i / SEGMENTS.length);
                    const endAngle = ((i + 1) / SEGMENTS.length);
                    
                    const [startX, startY] = getCoordinatesForPercent(startAngle, RADIUS);
                    const [endX, endY] = getCoordinatesForPercent(endAngle, RADIUS);
                    
                    const largeArcFlag = endAngle - startAngle > 0.5 ? 1 : 0;
                    
                    const pathData = [
                      `M ${CENTER} ${CENTER}`,
                      `L ${startX} ${startY}`,
                      `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      `Z`
                    ].join(' ');

                    return (
                      <g key={i}>
                        {/* Base Color */}
                        <path 
                          d={pathData}
                          fill={seg.color}
                        />
                        {/* Glossy Overlay */}
                        <path 
                          d={pathData}
                          fill="url(#segmentShine)"
                        />
                        {/* Separator Line */}
                        <path 
                          d={pathData}
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Text Labels & Icons */}
                <g>
                   {SEGMENTS.map((seg, i) => {
                     // Calculate center angle of the segment in degrees
                     const angle = (i * 45) + 22.5;
                     
                     return (
                       <g key={`text-${i}`} transform={`rotate(${angle}, ${CENTER}, ${CENTER})`}>
                         <text
                           x={CENTER + RADIUS * 0.75} 
                           y={CENTER}
                           dy="0.35em" 
                           textAnchor="middle"
                           fill={seg.text}
                           className="font-sketch font-bold text-3xl"
                           style={{ 
                             textShadow: '0 2px 0 rgba(0,0,0,0.1)',
                             filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' 
                            }}
                           transform={`rotate(90, ${CENTER + RADIUS * 0.75}, ${CENTER})`} 
                         >
                           {seg.label}
                         </text>
                       </g>
                     );
                   })}
                </g>
                
                {/* Pegs */}
                <g>
                  {SEGMENTS.map((_, i) => {
                     const [cx, cy] = getCoordinatesForPercent(i / SEGMENTS.length, RADIUS - 8);
                     return (
                       <g key={`peg-${i}`}>
                         <circle 
                           cx={cx}
                           cy={cy}
                           r="4"
                           fill="#e2e8f0"
                           stroke="#475569"
                           strokeWidth="1"
                         />
                         <circle 
                           cx={cx}
                           cy={cy}
                           r="1.5"
                           fill="#94a3b8"
                         />
                       </g>
                     );
                  })}
                </g>
              </svg>
            </div>
            
            {/* Center Hub */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
               <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border-4 border-slate-500">
                 <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center shadow-inner">
                    <div className="w-6 h-1 bg-slate-400/50 rounded-full transform rotate-45" />
                    <div className="w-6 h-1 bg-slate-400/50 rounded-full transform -rotate-45 absolute" />
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Spin Button */}
        <div className="h-20 w-full flex justify-center mt-4">
            <button
              onClick={handleSpin}
              disabled={isSpinning || showReward}
              className={`
                relative w-full max-w-[220px] py-4 rounded-xl transition-all duration-200 transform
                ${isSpinning 
                  ? 'opacity-80 cursor-default scale-[0.98] grayscale-[0.5]' 
                  : 'hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.6)]'
                }
              `}
            >
              <div className="absolute inset-0 bg-[var(--primary)] rounded-xl opacity-90 shadow-inner" />
              <div className="absolute inset-0 border-t-2 border-white/30 rounded-xl" />
              <div className="absolute inset-0 border-b-2 border-black/20 rounded-xl" />
              
              <span className="relative z-10 font-sketch text-2xl text-[#1a1c20] uppercase tracking-widest flex items-center justify-center gap-2 font-bold">
                 {isSpinning ? 'Good Luck!' : 'Spin To Win'}
              </span>
            </button>
        </div>
      </div>

      {/* --- REWARD WIN MODAL --- */}
      {showReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]" />
          
          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {[...Array(30)].map((_, i) => (
               <div 
                  key={i} 
                  className="absolute w-3 h-3 rounded-sm animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: ['#f87171', '#60a5fa', '#fbbf24', '#4ade80'][Math.floor(Math.random() * 4)],
                    animationDuration: `${2 + Math.random() * 2}s`,
                    animationDelay: `-${Math.random()}s`,
                    opacity: 0.8
                  }}
               />
             ))}
          </div>

          <div className="relative bg-[#1e293b] border-2 border-[var(--primary)] p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-sm w-full text-center animate-pop-in overflow-hidden">
            
            <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-transparent via-white/5 to-transparent animate-[spin_8s_linear_infinite] pointer-events-none" />

            <div className="relative z-10">
                <div className="text-7xl mb-4 animate-bounce drop-shadow-lg">
                  🎉
                </div>
                
                <h3 className="font-sketch text-4xl text-white mb-2 tracking-wide uppercase text-shadow-sm">
                  Jackpot!
                </h3>
                
                <p className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-6">
                  Daily Reward Claimed
                </p>

                <div className="bg-[#0f172a] rounded-2xl p-6 mb-8 border border-white/10 shadow-inner relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                   <div className="absolute inset-0 bg-[var(--primary)] opacity-5" />
                   <div className="relative z-10">
                     <div className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">You Won</div>
                     <div className="text-6xl font-sketch text-[var(--primary)] drop-shadow-[0_2px_10px_rgba(var(--primary-rgb),0.5)]">
                       +{rewardAmount}
                     </div>
                     <div className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-bold">Chances</div>
                   </div>
                </div>

                <div className="text-xs text-slate-500 font-mono mb-6 bg-white/5 inline-block px-4 py-2 rounded-full">
                   New Balance: <span className="text-white font-bold">{totalChances}</span>
                </div>

                <button
                  onClick={() => {
                    SoundManager.playClick();
                    onComplete();
                  }}
                  className="w-full py-4 bg-white text-slate-900 font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-slate-200 transition-colors shadow-lg active:scale-95 duration-200"
                >
                  Continue
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for simple slide down animation used in header */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};