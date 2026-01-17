import { auth, syncGameState } from '../services/firebase';

// Key for local storage
const CHANCE_STORAGE_KEY = 'sd_game_chances';
const MAX_CHANCES_PER_AD = 3;

/**
 * Helper to trigger background sync without blocking UI
 */
const backgroundSync = (newChances: number) => {
  const user = auth.currentUser;
  if (user) {
    // Fire and forget
    syncGameState(user.uid, newChances).catch(() => {});
  }
};

export const getRemainingChances = (): number => {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(CHANCE_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    return 0;
  }
};

export const grantChances = (amount: number = MAX_CHANCES_PER_AD) => {
  try {
    const current = getRemainingChances();
    const newTotal = current + amount;
    
    localStorage.setItem(CHANCE_STORAGE_KEY, newTotal.toString());
    
    // Sync to backend
    backgroundSync(newTotal);
    
    return newTotal;
  } catch (e) {
    console.error("Failed to save chances", e);
    return 0;
  }
};

export const consumeChanceOnGameEnd = (): number => {
  const current = getRemainingChances();
  if (current > 0) {
    const newVal = current - 1;
    localStorage.setItem(CHANCE_STORAGE_KEY, newVal.toString());
    
    // Sync to backend
    backgroundSync(newVal);
    
    return newVal;
  }
  return 0;
};

// Dev toggle for testing
export const dev_grantUnlimited = () => {
  localStorage.setItem(CHANCE_STORAGE_KEY, '999');
};