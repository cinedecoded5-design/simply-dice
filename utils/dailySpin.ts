
const SPIN_KEY = 'sd_last_spin_date';

export const canSpinToday = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const lastSpin = localStorage.getItem(SPIN_KEY);
    const today = new Date().toDateString();
    return lastSpin !== today;
  } catch (e) {
    // Fail safe: allow spin if storage unavailable, rather than blocking features
    return true;
  }
};

export const markSpinComplete = () => {
  try {
    localStorage.setItem(SPIN_KEY, new Date().toDateString());
  } catch (e) {
    console.error("Failed to save spin date", e);
  }
};
