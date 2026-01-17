import React, { useState, useEffect, useRef } from 'react';
import Dice from './Dice';
import SoundManager from '../utils/SoundManager';

const TRI_ROWS = 6; // Triangle grid rows (1 to 6 dots) - remains constant for now

type Player = 'A' | 'B';
type BoxState = Player | null;
type LineState = Player | null;
type BoardType = 'square' | 'triangle';

interface GameState {
  // Common
  currentPlayer: Player;
  scores: { A: number; B: number };
  winner: Player | 'Draw' | null;
  diceValue: number;
  isRolling: boolean;
  phase: 'ROLL' | 'MOVE' | 'FINISHED';
  movesRemaining: number;
  boardType: BoardType;

  // Square State
  hLines: LineState[][];
  vLines: LineState[][];
  boxes: BoxState[][];

  // Triangle State
  t_hLines: LineState[][]; 
  t_dlLines: LineState[][];
  t_drLines: LineState[][];
  t_upBoxes: BoxState[][];
  t_invBoxes: BoxState[][];
}

interface BoardGameProps {
  isAIMode?: boolean;
  boardType: BoardType;
  gridSize?: number; 
  onGameEnd?: () => void;
}

// Dynamic state creators
const createSquareState = (size: number) => ({
  hLines: Array(size).fill(null).map(() => Array(size - 1).fill(null)),
  vLines: Array(size - 1).fill(null).map(() => Array(size).fill(null)),
  boxes: Array(size - 1).fill(null).map(() => Array(size - 1).fill(null)),
});

const INITIAL_TRIANGLE_STATE = {
  t_hLines: Array(TRI_ROWS).fill(null).map((_, r) => r > 0 ? Array(r).fill(null) : []),
  t_dlLines: Array(TRI_ROWS - 1).fill(null).map((_, r) => Array(r + 1).fill(null)),
  t_drLines: Array(TRI_ROWS - 1).fill(null).map((_, r) => Array(r + 1).fill(null)),
  t_upBoxes: Array(TRI_ROWS - 1).fill(null).map((_, r) => Array(r + 1).fill(null)),
  t_invBoxes: Array(TRI_ROWS - 1).fill(null).map((_, r) => r > 0 ? Array(r).fill(null) : []),
};

const BoardGame: React.FC<BoardGameProps> = ({ isAIMode = false, boardType, gridSize = 5, onGameEnd }) => {
  // Styles for standard 5x5 board
  const styles = {
    dot: "w-3 h-3 shadow-[0_0_5px_rgba(255,255,255,0.5)]",
    hLineContainer: "h-10 w-16 md:w-20",
    hLineBorder: "border-b-4",
    vLineContainer: "w-3 md:w-4 h-16 md:h-20",
    vLineBorder: "border-l-4",
    box: "w-16 md:w-20 h-16 md:h-20",
    boxText: "text-4xl",
    diceScale: "scale-100",
  };

  const [gameState, setGameState] = useState<GameState>(() => ({
    currentPlayer: 'A',
    scores: { A: 0, B: 0 },
    winner: null,
    diceValue: 1,
    isRolling: false,
    phase: 'ROLL',
    movesRemaining: 0,
    boardType: boardType,
    ...createSquareState(gridSize),
    ...INITIAL_TRIANGLE_STATE,
  }));

  const [scorePopA, setScorePopA] = useState(false);
  const [scorePopB, setScorePopB] = useState(false);
  const prevScoreA = useRef(0);
  const prevScoreB = useRef(0);
  const prevPlayer = useRef<Player>('A');
  const hasTriggeredEnd = useRef(false);
  const hasInteracted = useRef(false);

  // --- Initialize Audio Context on first interaction ---
  const ensureAudioContext = () => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      SoundManager.initAudioContext();
    }
  };

  const resetGame = () => {
    ensureAudioContext();
    SoundManager.playSwitch();
    setGameState({
      currentPlayer: 'A',
      scores: { A: 0, B: 0 },
      winner: null,
      diceValue: 1,
      isRolling: false,
      phase: 'ROLL',
      movesRemaining: 0,
      boardType: boardType,
      ...createSquareState(gridSize),
      ...INITIAL_TRIANGLE_STATE,
    });
    prevScoreA.current = 0;
    prevScoreB.current = 0;
    prevPlayer.current = 'A';
    hasTriggeredEnd.current = false;
  };

  const rollDice = () => {
    ensureAudioContext();
    if (gameState.winner || gameState.phase !== 'ROLL' || gameState.isRolling) return;

    SoundManager.playRoll();
    setGameState(prev => ({ ...prev, isRolling: true }));

    setTimeout(() => {
      SoundManager.playDiceStop();
      const newVal = Math.floor(Math.random() * 6) + 1;
      setGameState(prev => ({
        ...prev,
        isRolling: false,
        diceValue: newVal,
        phase: 'MOVE',
        movesRemaining: newVal
      }));
    }, 600);
  };

  const handleSquareLineClick = (type: 'h' | 'v', r: number, c: number) => {
    setGameState(prev => {
      if (type === 'h' && prev.hLines[r][c] !== null) return prev;
      if (type === 'v' && prev.vLines[r][c] !== null) return prev;

      // Robust Deep Clone
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'h') newState.hLines[r][c] = prev.currentPlayer;
      if (type === 'v') newState.vLines[r][c] = prev.currentPlayer;

      newState.movesRemaining -= 1;
      let boxesCompleted = 0;

      for (let br = 0; br < gridSize - 1; br++) {
        for (let bc = 0; bc < gridSize - 1; bc++) {
          if (newState.boxes[br][bc] === null) {
            const top = newState.hLines[br][bc] !== null;
            const bottom = newState.hLines[br + 1][bc] !== null;
            const left = newState.vLines[br][bc] !== null;
            const right = newState.vLines[br][bc + 1] !== null;

            if (top && bottom && left && right) {
              newState.boxes[br][bc] = prev.currentPlayer;
              boxesCompleted++;
            }
          }
        }
      }
      return updateTurnState(newState, boxesCompleted, (gridSize - 1) * (gridSize - 1));
    });
  };

  const handleTriangleLineClick = (type: 'h' | 'dl' | 'dr', r: number, c: number) => {
    setGameState(prev => {
      let isAvailable = false;
      if (type === 'h' && prev.t_hLines[r] && prev.t_hLines[r][c] === null) isAvailable = true;
      if (type === 'dl' && prev.t_dlLines[r] && prev.t_dlLines[r][c] === null) isAvailable = true;
      if (type === 'dr' && prev.t_drLines[r] && prev.t_drLines[r][c] === null) isAvailable = true;

      if (!isAvailable) return prev;

      const newState = JSON.parse(JSON.stringify(prev));
      if (type === 'h') newState.t_hLines[r][c] = prev.currentPlayer;
      if (type === 'dl') newState.t_dlLines[r][c] = prev.currentPlayer;
      if (type === 'dr') newState.t_drLines[r][c] = prev.currentPlayer;

      newState.movesRemaining -= 1;
      let boxesCompleted = 0;

      // Upright Triangles
      for (let tr = 0; tr < TRI_ROWS - 1; tr++) {
        for (let tc = 0; tc <= tr; tc++) {
          if (newState.t_upBoxes[tr][tc] === null) {
            const legL = newState.t_dlLines[tr][tc] !== null;
            const legR = newState.t_drLines[tr][tc] !== null;
            const base = newState.t_hLines[tr + 1] && newState.t_hLines[tr + 1][tc] !== null;
            if (legL && legR && base) {
              newState.t_upBoxes[tr][tc] = prev.currentPlayer;
              boxesCompleted++;
            }
          }
        }
      }

      // Inverted Triangles
      for (let tr = 1; tr < TRI_ROWS - 1; tr++) {
        for (let tc = 0; tc < tr; tc++) {
          if (newState.t_invBoxes[tr][tc] === null) {
            const top = newState.t_hLines[tr][tc] !== null;
            const legL = newState.t_drLines[tr][tc] !== null;
            const legR = newState.t_dlLines[tr][tc + 1] !== null;
            if (top && legL && legR) {
              newState.t_invBoxes[tr][tc] = prev.currentPlayer;
              boxesCompleted++;
            }
          }
        }
      }

      const totalUp = (TRI_ROWS * (TRI_ROWS - 1)) / 2;
      const totalInv = ((TRI_ROWS - 1) * (TRI_ROWS - 2)) / 2;
      return updateTurnState(newState, boxesCompleted, totalUp + totalInv);
    });
  };

  const updateTurnState = (newState: GameState, boxesCompleted: number, totalBoxes: number) => {
    if (boxesCompleted > 0) {
      newState.scores[newState.currentPlayer] += boxesCompleted;
    }

    const totalScore = newState.scores.A + newState.scores.B;
    if (totalScore === totalBoxes) {
      if (newState.scores.A > newState.scores.B) newState.winner = 'A';
      else if (newState.scores.B > newState.scores.A) newState.winner = 'B';
      else newState.winner = 'Draw';
      newState.phase = 'FINISHED';
    } else if (newState.movesRemaining === 0) {
      newState.currentPlayer = newState.currentPlayer === 'A' ? 'B' : 'A';
      newState.phase = 'ROLL';
      newState.diceValue = 1;
    }
    return newState;
  };

  const handleInteraction = (action: () => void) => {
    ensureAudioContext();
    if (gameState.winner || gameState.phase !== 'MOVE' || gameState.movesRemaining <= 0 || gameState.isRolling || (!isAIMode && gameState.isRolling) || (isAIMode && gameState.currentPlayer === 'B')) {
      if (gameState.movesRemaining <= 0 && gameState.phase === 'MOVE') SoundManager.playInvalid();
      return;
    }
    SoundManager.playDraw();
    action();
  };

  // -----------------------------------------------------------------------------------------
  // AI Helper Functions
  // -----------------------------------------------------------------------------------------

  const countSquareLines = (r: number, c: number, h: LineState[][], v: LineState[][]) => {
    let count = 0;
    if (h[r] && h[r][c] !== null) count++;
    if (h[r + 1] && h[r + 1][c] !== null) count++;
    if (v[r] && v[r][c] !== null) count++;
    if (v[r] && v[r][c + 1] !== null) count++;
    return count;
  };

  const simulateSquareMoveGain = (baseState: GameState, moveType: 'h' | 'v', r: number, c: number): number => {
    const simState = JSON.parse(JSON.stringify(baseState));
    if (moveType === 'h') simState.hLines[r][c] = 'B'; else simState.vLines[r][c] = 'B';
    
    let gainedBoxes = 0;
    const stack: {r: number, c: number}[] = [];
    
    const checkAndPush = (br: number, bc: number) => {
        if (br >= 0 && br < gridSize - 1 && bc >= 0 && bc < gridSize - 1) {
             if (simState.boxes[br][bc] === null) {
                 const lines = countSquareLines(br, bc, simState.hLines, simState.vLines);
                 if (lines >= 4) {
                     simState.boxes[br][bc] = 'B';
                     stack.push({r: br, c: bc});
                 }
             }
        }
    };

    if (moveType === 'h') { 
        if (r < gridSize - 1) checkAndPush(r, c); 
        if (r > 0) checkAndPush(r - 1, c); 
    } else { 
        if (c < gridSize - 1) checkAndPush(r, c); 
        if (c > 0) checkAndPush(r, c - 1); 
    }
    
    const processed = new Set<string>();
    while (stack.length > 0) {
        const current = stack.pop()!;
        const key = `${current.r},${current.c}`;
        if (processed.has(key)) continue;
        processed.add(key);
        gainedBoxes++;
        
        const sr = current.r; const sc = current.c;
        const fillLine = (type: 'h'|'v', lr: number, lc: number) => {
             if (type === 'h') {
                 if (simState.hLines[lr][lc] === null) {
                     simState.hLines[lr][lc] = 'B';
                     if (lr < gridSize - 1) checkAndPush(lr, lc);
                     if (lr > 0) checkAndPush(lr - 1, lc);
                 }
             } else {
                 if (simState.vLines[lr][lc] === null) {
                     simState.vLines[lr][lc] = 'B';
                     if (lc < gridSize - 1) checkAndPush(lr, lc);
                     if (lc > 0) checkAndPush(lr, lc - 1);
                 }
             }
        };

        fillLine('h', sr, sc);
        fillLine('h', sr + 1, sc);
        fillLine('v', sr, sc);
        fillLine('v', sr, sc + 1);
    }
    return gainedBoxes;
  };

  const executeSquareAIMove = () => {
    const legalMoves: { type: 'h' | 'v'; r: number; c: number }[] = [];
    
    for (let r = 0; r < gridSize; r++) { for (let c = 0; c < gridSize - 1; c++) { if (gameState.hLines[r][c] === null) legalMoves.push({ type: 'h', r, c }); } }
    for (let r = 0; r < gridSize - 1; r++) { for (let c = 0; c < gridSize; c++) { if (gameState.vLines[r][c] === null) legalMoves.push({ type: 'v', r, c }); } }
    
    if (legalMoves.length === 0) return;
    
    const scoringMoves: typeof legalMoves = [];
    const safeMoves: { move: typeof legalMoves[0], maxLinesAfter: number }[] = [];
    const badMoves: { move: typeof legalMoves[0], givenChainSize: number }[] = [];
    
    for (const move of legalMoves) {
        let completesBox = false; let givesBox = false; let maxLines = 0;
        const boxesToCheck = [];
        
        if (move.type === 'h') { if (move.r < gridSize - 1) boxesToCheck.push({r: move.r, c: move.c}); if (move.r > 0) boxesToCheck.push({r: move.r - 1, c: move.c}); } 
        else { if (move.c < gridSize - 1) boxesToCheck.push({r: move.r, c: move.c}); if (move.c > 0) boxesToCheck.push({r: move.r, c: move.c - 1}); }
        
        for (const b of boxesToCheck) {
            const currentLines = countSquareLines(b.r, b.c, gameState.hLines, gameState.vLines);
            const newLines = currentLines + 1;
            if (newLines === 4) completesBox = true; if (newLines === 3) givesBox = true; if (newLines > maxLines) maxLines = newLines;
        }
        
        if (completesBox) scoringMoves.push(move); 
        else if (givesBox) badMoves.push({ move, givenChainSize: simulateSquareMoveGain(gameState, move.type, move.r, move.c) }); 
        else safeMoves.push({ move, maxLinesAfter: maxLines });
    }
    
    if (scoringMoves.length > 0) { 
      const choice = scoringMoves[Math.floor(Math.random() * scoringMoves.length)]; 
      handleSquareLineClick(choice.type, choice.r, choice.c); 
      return; 
    }
    
    if (safeMoves.length > 0) { 
      safeMoves.sort((a, b) => a.maxLinesAfter - b.maxLinesAfter); 
      const best = safeMoves.filter(m => m.maxLinesAfter === safeMoves[0].maxLinesAfter); 
      const choice = best[Math.floor(Math.random() * best.length)].move; 
      handleSquareLineClick(choice.type, choice.r, choice.c); 
      return; 
    }
    
    if (badMoves.length > 0) { 
      badMoves.sort((a, b) => a.givenChainSize - b.givenChainSize); 
      const best = badMoves.filter(m => m.givenChainSize === badMoves[0].givenChainSize); 
      const choice = best[Math.floor(Math.random() * best.length)].move; 
      handleSquareLineClick(choice.type, choice.r, choice.c); 
      return; 
    }
  };

  const countTriangleLines = (type: 'up' | 'inv', r: number, c: number, state = gameState) => {
    let count = 0;
    if (type === 'up') { if (state.t_dlLines[r][c] !== null) count++; if (state.t_drLines[r][c] !== null) count++; if (state.t_hLines[r+1][c] !== null) count++; } 
    else { if (state.t_hLines[r][c] !== null) count++; if (state.t_drLines[r][c] !== null) count++; if (state.t_dlLines[r][c+1] !== null) count++; }
    return count;
  };

  const simulateTriangleMoveGain = (baseState: GameState, moveType: 'h' | 'dl' | 'dr', r: number, c: number): number => {
      const simState = JSON.parse(JSON.stringify(baseState));
      if (moveType === 'h') simState.t_hLines[r][c] = 'B'; else if (moveType === 'dl') simState.t_dlLines[r][c] = 'B'; else simState.t_drLines[r][c] = 'B';
      let gainedBoxes = 0;
      const stack: {type: 'up'|'inv', r: number, c: number}[] = [];
      const checkTri = (type: 'up'|'inv', tr: number, tc: number) => {
          if (type === 'up') { if (simState.t_upBoxes[tr] && simState.t_upBoxes[tr][tc] === null) { if (countTriangleLines('up', tr, tc, simState) >= 2) stack.push({type: 'up', r: tr, c: tc}); } } 
          else { if (simState.t_invBoxes[tr] && simState.t_invBoxes[tr][tc] === null) { if (countTriangleLines('inv', tr, tc, simState) >= 2) stack.push({type: 'inv', r: tr, c: tc}); } }
      };
      if (moveType === 'h') { if (r < TRI_ROWS && c < r) checkTri('inv', r, c); if (r > 0 && c <= r - 1) checkTri('up', r - 1, c); } 
      else if (moveType === 'dl') { if (c <= r) checkTri('up', r, c); if (c > 0) checkTri('inv', r, c - 1); } 
      else if (moveType === 'dr') { if (c <= r) checkTri('up', r, c); if (c < r) checkTri('inv', r, c); }
      const processed = new Set<string>();
      while (stack.length > 0) {
          const current = stack.pop()!;
          const key = `${current.type},${current.r},${current.c}`;
          if (processed.has(key)) continue;
          processed.add(key);
          gainedBoxes++;
          if (current.type === 'up') { if (simState.t_dlLines[current.r][current.c] === null) simState.t_dlLines[current.r][current.c] = 'OPP'; if (simState.t_drLines[current.r][current.c] === null) simState.t_drLines[current.r][current.c] = 'OPP'; if (simState.t_hLines[current.r+1][current.c] === null) simState.t_hLines[current.r+1][current.c] = 'OPP'; } 
          else { if (simState.t_hLines[current.r][current.c] === null) simState.t_hLines[current.r][current.c] = 'OPP'; if (simState.t_drLines[current.r][current.c] === null) simState.t_drLines[current.r][current.c] = 'OPP'; if (simState.t_dlLines[current.r][current.c+1] === null) simState.t_dlLines[current.r][current.c+1] = 'OPP'; }
          if (current.type === 'up') { if (current.c > 0) checkTri('inv', current.r, current.c - 1); if (current.c < current.r) checkTri('inv', current.r, current.c); if (current.r < TRI_ROWS - 1) checkTri('inv', current.r + 1, current.c); } 
          else { if (current.r > 0) checkTri('up', current.r - 1, current.c); checkTri('up', current.r, current.c); checkTri('up', current.r, current.c + 1); }
      }
      return gainedBoxes;
  };

  const executeTriangleAIMove = () => {
    const legalMoves: { type: 'h' | 'dl' | 'dr'; r: number; c: number }[] = [];
    for (let r = 1; r < TRI_ROWS; r++) { for (let c = 0; c < r; c++) { if (gameState.t_hLines[r][c] === null) legalMoves.push({ type: 'h', r, c }); } }
    for (let r = 0; r < TRI_ROWS - 1; r++) { for (let c = 0; c <= r; c++) { if (gameState.t_dlLines[r][c] === null) legalMoves.push({ type: 'dl', r, c }); if (gameState.t_drLines[r][c] === null) legalMoves.push({ type: 'dr', r, c }); } }
    if (legalMoves.length === 0) return;
    const scoringMoves: typeof legalMoves = []; const safeMoves: { move: typeof legalMoves[0], maxLinesAfter: number }[] = []; const badMoves: { move: typeof legalMoves[0], givenChainSize: number }[] = [];
    for (const move of legalMoves) {
      let completesBox = false; let givesBox = false; let maxLines = 0;
      const checkBox = (type: 'up'|'inv', br: number, bc: number) => { const lines = countTriangleLines(type, br, bc); const newLines = lines + 1; if (newLines === 3) completesBox = true; if (newLines === 2) givesBox = true; if (newLines > maxLines) maxLines = newLines; };
      if (move.type === 'h') { if (move.r < TRI_ROWS && move.c < move.r) checkBox('inv', move.r, move.c); if (move.r > 0 && move.c <= move.r - 1) checkBox('up', move.r - 1, move.c); } 
      else if (move.type === 'dl') { if (move.c <= move.r) checkBox('up', move.r, move.c); if (move.c > 0) checkBox('inv', move.r, move.c - 1); } 
      else if (move.type === 'dr') { if (move.c <= move.r) checkBox('up', move.r, move.c); if (move.c < move.r) checkBox('inv', move.r, move.c); }
      if (completesBox) scoringMoves.push(move); else if (givesBox) badMoves.push({ move, givenChainSize: simulateTriangleMoveGain(gameState, move.type, move.r, move.c) }); else safeMoves.push({ move, maxLinesAfter: maxLines });
    }
    if (scoringMoves.length > 0) { const choice = scoringMoves[Math.floor(Math.random() * scoringMoves.length)]; handleTriangleLineClick(choice.type, choice.r, choice.c); } 
    else if (safeMoves.length > 0) { safeMoves.sort((a, b) => a.maxLinesAfter - b.maxLinesAfter); const best = safeMoves.filter(m => m.maxLinesAfter === safeMoves[0].maxLinesAfter); const choice = best[Math.floor(Math.random() * best.length)].move; handleTriangleLineClick(choice.type, choice.r, choice.c); } 
    else if (badMoves.length > 0) { badMoves.sort((a, b) => a.givenChainSize - b.givenChainSize); const best = badMoves.filter(m => m.givenChainSize === badMoves[0].givenChainSize); const choice = best[Math.floor(Math.random() * best.length)].move; handleTriangleLineClick(choice.type, choice.r, choice.c); }
  };

  const executeAIMove = () => {
    if (gameState.boardType === 'square') {
      executeSquareAIMove();
    } else {
      executeTriangleAIMove();
    }
  };

  // --- AI LOGIC ---
  useEffect(() => {
    if (!isAIMode || gameState.currentPlayer !== 'B' || gameState.winner) return;

    if (gameState.phase === 'ROLL' && !gameState.isRolling) {
      const actualTimer = setTimeout(rollDice, 800);
      return () => clearTimeout(actualTimer);
    }

    if (gameState.phase === 'MOVE' && gameState.movesRemaining > 0 && !gameState.isRolling) {
      const timer = setTimeout(executeAIMove, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.phase, gameState.movesRemaining, gameState.isRolling, isAIMode]);

  useEffect(() => {
    if (gameState.scores.A > prevScoreA.current) {
      setScorePopA(true);
      SoundManager.playBoxComplete();
      setTimeout(() => setScorePopA(false), 300);
    }
    prevScoreA.current = gameState.scores.A;
  }, [gameState.scores.A]);

  useEffect(() => {
    if (gameState.scores.B > prevScoreB.current) {
      setScorePopB(true);
      SoundManager.playBoxComplete();
      setTimeout(() => setScorePopB(false), 300);
    }
    prevScoreB.current = gameState.scores.B;
  }, [gameState.scores.B]);

  useEffect(() => {
    if (gameState.currentPlayer !== prevPlayer.current) {
      setTimeout(() => SoundManager.playSwitch(), 300);
    }
    prevPlayer.current = gameState.currentPlayer;
  }, [gameState.currentPlayer]);

  useEffect(() => {
    if (gameState.winner) {
      const weWon = gameState.winner === 'A';
      const draw = gameState.winner === 'Draw';
      if (draw) {
         // Maybe a draw sound? For now, box complete is decent
         SoundManager.playBoxComplete();
      } else if (weWon || !isAIMode) {
         SoundManager.playWin();
      } else {
         SoundManager.playLose();
      }

      if (!hasTriggeredEnd.current && onGameEnd) {
        hasTriggeredEnd.current = true;
        onGameEnd();
      }
    }
  }, [gameState.winner, onGameEnd, isAIMode]);

  const isA = gameState.currentPlayer === 'A';
  const isWinner = !!gameState.winner;
  const isInteractive = gameState.phase === 'MOVE' && !gameState.isRolling && !isWinner;
  const isHumanTurn = isAIMode ? gameState.currentPlayer === 'A' : true;
  const canInteract = isInteractive && isHumanTurn;

  const getLineClass = (owner: LineState, type: 'h' | 'v') => {
    if (owner) {
      const colorClass = owner === 'A' ? 'border-[var(--primary)]' : 'border-[var(--secondary)]';
      // Add animation based on line type
      const animationClass = type === 'h' ? 'animate-draw-h' : 'animate-draw-v';
      return `${colorClass} opacity-100 chalk-border ${animationClass}`;
    }
    if (canInteract) {
      const hoverClass = gameState.currentPlayer === 'A' ? 'group-hover:border-[var(--primary)]' : 'group-hover:border-[var(--secondary)]';
      return `border-white/10 ${hoverClass} group-hover:opacity-40 border-dashed`;
    }
    return 'border-white/5 border-dashed';
  };

  const getDotClass = (isActive: boolean) => {
    return `${styles.dot} rounded-full bg-white/80 z-10 relative`;
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden text-slate-200 font-chalk select-none bg-chalkboard">

      {isWinner && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all" />}

      {/* HEADER */}
      <div className="relative z-20 w-full pt-8 pb-2 px-6 flex items-center justify-between">
        <div className={`flex flex-col items-start min-w-[100px] transition-opacity ${isA ? 'opacity-100' : 'opacity-40'}`}>
          <span className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-400">
            Player 1
          </span>
          <div className={`text-3xl font-sketch text-[var(--primary)] transition-transform duration-300 ${scorePopA ? 'scale-150' : 'scale-100'}`} style={{ textShadow: isA ? '0 0 10px var(--primary)' : 'none' }}>
            {gameState.scores.A}
          </div>
        </div>

        <div className="text-sm font-bold opacity-30 tracking-[0.3em]">VS</div>

        <div className={`flex flex-col items-end min-w-[100px] transition-opacity ${!isA ? 'opacity-100' : 'opacity-40'}`}>
           <span className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-400">
            {isAIMode ? 'CPU' : 'Player 2'}
          </span>
           <div className={`text-3xl font-sketch text-[var(--secondary)] transition-transform duration-300 ${scorePopB ? 'scale-150' : 'scale-100'}`} style={{ textShadow: !isA ? '0 0 10px var(--secondary)' : 'none' }}>
            {gameState.scores.B}
          </div>
        </div>
      </div>

      {/* DICE ZONE */}
      <div className="flex-none w-full py-6 flex flex-col items-center justify-center relative z-30">
        <div className={`transition-transform duration-300 ${isA ? 'scale-100' : 'scale-90 opacity-80'} ${styles.diceScale}`}>
          <Dice
            value={gameState.diceValue}
            isRolling={gameState.isRolling}
            onClick={rollDice}
          />
        </div>
        <div className="mt-4 h-8 flex items-center justify-center">
            {gameState.phase === 'ROLL' && !gameState.isRolling && (isHumanTurn || !isAIMode) && (
              <span className="text-[var(--primary)] animate-pulse font-bold tracking-widest uppercase text-sm">Tap to Roll</span>
            )}
            {gameState.phase === 'MOVE' && (
              <span className="text-white font-sketch text-xl tracking-widest">
                {gameState.movesRemaining} Move{gameState.movesRemaining > 1 ? 's' : ''} Left
              </span>
            )}
        </div>
      </div>

      {/* BOARD AREA */}
      <div className="flex-1 flex items-center justify-center relative z-10 w-full overflow-hidden">
        <div className={`relative transition-all duration-500 ${isWinner ? 'scale-95 opacity-50' : 'scale-100'}`}>
          
          <div className="flex flex-col items-center p-4">
             {Array.from({ length: gridSize }).map((_, rowIdx) => (
                <React.Fragment key={`sq-row-${rowIdx}`}>
                  <div className="flex items-center justify-center">
                    {Array.from({ length: gridSize }).map((_, colIdx) => (
                      <React.Fragment key={`sq-dot-${rowIdx}-${colIdx}`}>
                        {/* Dot */}
                        <div className={getDotClass(true)} style={{ filter: 'url(#chalk-noise)' }} />
                        
                        {/* H Line */}
                        {colIdx < gridSize - 1 && (
                          <div
                            onClick={() => handleInteraction(() => handleSquareLineClick('h', rowIdx, colIdx))}
                            className={`relative ${styles.hLineContainer} flex items-center justify-center group ${canInteract ? 'cursor-pointer' : ''}`}
                          >
                            <div className={`h-0 w-full ${styles.hLineBorder} rounded-sm transition-all duration-200 ${getLineClass(gameState.hLines[rowIdx][colIdx], 'h')}`} style={{ transform: 'rotate(-1deg)' }} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* V Lines & Boxes */}
                  {rowIdx < gridSize - 1 && (
                    <div className="flex items-center justify-center">
                      {Array.from({ length: gridSize }).map((_, colIdx) => (
                        <React.Fragment key={`sq-v-${rowIdx}-${colIdx}`}>
                          {/* V Line */}
                          <div
                            onClick={() => handleInteraction(() => handleSquareLineClick('v', rowIdx, colIdx))}
                            className={`relative ${styles.vLineContainer} flex justify-center group ${canInteract ? 'cursor-pointer' : ''}`}
                          >
                             <div className={`w-0 h-full ${styles.vLineBorder} rounded-sm transition-all duration-200 ${getLineClass(gameState.vLines[rowIdx][colIdx], 'v')}`} style={{ transform: 'rotate(1deg)' }} />
                          </div>
                          
                          {/* Box Content */}
                          {colIdx < gridSize - 1 && (
                            <div
                              className={`${styles.box} flex items-center justify-center transition-all duration-500`}
                            >
                              {gameState.boxes[rowIdx][colIdx] && (
                                <div className="animate-pop-in relative w-full h-full flex items-center justify-center">
                                  {/* Chalk Scribble Fill */}
                                  <div className={`absolute inset-2 ${gameState.boxes[rowIdx][colIdx] === 'A' ? 'bg-[var(--primary)]' : 'bg-[var(--secondary)]'} animate-chalk-fill`} 
                                       style={{ 
                                         maskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                                         borderRadius: '4px',
                                         opacity: 0.3
                                       }} 
                                  />
                                  <span className={`${styles.boxText} font-sketch z-10 ${gameState.boxes[rowIdx][colIdx] === 'A' ? 'text-[var(--primary)]' : 'text-[var(--secondary)]'}`}>
                                    {gameState.boxes[rowIdx][colIdx]}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
          </div>

        </div>
      </div>

      {/* WINNER OVERLAY */}
      {isWinner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-[#1a1a1a] border-4 border-white/20 p-8 w-full max-w-sm relative text-center" style={{ borderRadius: '25px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <h2 className="font-sketch text-4xl mb-6 text-white tracking-widest uppercase">
              {gameState.winner === 'Draw' ? 'Draw!' : `${gameState.winner === 'A' ? 'Player 1' : 'CPU'} Wins!`}
            </h2>
            
            <div className="flex justify-center gap-12 mb-8">
              <div className="text-center">
                <div className="text-xs uppercase font-bold text-slate-500 mb-2">Player 1</div>
                <div className="text-5xl font-sketch text-[var(--primary)]">{gameState.scores.A}</div>
              </div>
              <div className="text-center">
                 <div className="text-xs uppercase font-bold text-slate-500 mb-2">{isAIMode ? 'CPU' : 'Player 2'}</div>
                <div className="text-5xl font-sketch text-[var(--secondary)]">{gameState.scores.B}</div>
              </div>
            </div>

            <button onClick={() => resetGame()} className="w-full py-4 bg-white text-black font-sketch text-xl uppercase tracking-widest hover:bg-slate-200 transition-colors rounded-lg" onMouseDown={() => SoundManager.playClick()}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardGame;