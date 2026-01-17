import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ------------------------------------------------------------------
// IMPORTANT: REPLACE THIS CONFIG OBJECT WITH YOUR OWN FIREBASE CONFIG
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if config is still default/invalid to prevent 400 errors
const isConfigValid = firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                      !firebaseConfig.apiKey.includes("YOUR_API_KEY");

let app: any;
// Mock auth to prevent crashes in other components if they import it
let auth: any = { currentUser: null }; 
let db: any = null;
let analytics: any = null;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Analytics is only supported in browser environments
    analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
  } catch (error) {
    console.warn("Firebase initialization failed. Backend disabled.", error);
  }
} else {
  console.warn("Firebase configuration placeholders detected. Backend features are disabled to prevent errors.");
}

export { auth, db, analytics };

// --- Helper Functions (Non-blocking / Safe) ---

/**
 * Logs a custom event to Firebase Analytics.
 * Fails silently if offline or analytics not initialized.
 */
export const logGameEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, params);
    } catch (e) {
      // Backend failure must not crash app
      console.warn("Analytics event failed silently", e);
    }
  }
};

/**
 * Captures non-fatal errors to Analytics (Web Crashlytics equivalent).
 */
export const recordCrash = (error: any, context?: string) => {
  logGameEvent('app_exception', {
    description: error?.message || String(error),
    context: context || 'global',
    fatal: false
  });
  // Always log to console for local debugging
  console.error("Crash recorded:", error);
};

/**
 * Syncs critical game state (chances) to Firestore.
 * This is a fire-and-forget operation.
 */
export const syncGameState = async (userId: string, chances: number) => {
  if (!db) return; // Safely exit if backend is not initialized
  
  try {
    const userRef = doc(db, 'users', userId);
    // Merge true ensures we don't overwrite other user fields if they exist
    await setDoc(userRef, {
      chances: chances,
      lastActive: serverTimestamp(),
      platform: 'web'
    }, { merge: true });
  } catch (e) {
    console.warn("State sync failed silently", e);
  }
};

/**
 * specialized hook for Ad Verification
 * logs the intent and result of an ad reward
 */
export const verifyAdRewardOnBackend = async (userId: string, rewardType: string, amount: number) => {
  if (!db) return; // Safely exit if backend is not initialized

  try {
    const auditRef = doc(db, 'ad_logs', `${userId}_${Date.now()}`);
    await setDoc(auditRef, {
      userId,
      rewardType,
      amount,
      timestamp: serverTimestamp(),
      verified: false // Backend function would flip this to true later
    });
  } catch (e) {
    console.warn("Ad log failed silently", e);
  }
};

export default app;