import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize Recaptcha invisible
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
  }, []);

  const formatPhoneNumber = () => {
    return `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError("Please enter a phone number.");
      return;
    }
    setError(null);
    setLoading(true);

    const fullNumber = formatPhoneNumber();

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send SMS. Please check your config.");
      // Reset recaptcha on error so user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
            window.recaptchaVerifier.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setError(null);
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      onSuccess(); // App.tsx listens to auth state, but we can also trigger callback
    } catch (err: any) {
      console.error(err);
      setError("Invalid Code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 px-4 font-sans animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">
            {step === 'phone' ? 'Sign in to save your progress & play' : `Enter the code sent to ${formatPhoneNumber()}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                placeholder="+1"
              />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono placeholder:text-slate-600"
                placeholder="555 123 4567"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
            >
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>
            
            <div id="recaptcha-container"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-4 text-center text-2xl text-white tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-colors font-mono"
              placeholder="000000"
              maxLength={6}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-green-900/20"
            >
              {loading ? 'Verifying...' : 'Verify & Play'}
            </button>
            
            <button 
              onClick={() => {
                setStep('phone');
                setError(null);
                setOtp('');
              }}
              className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors"
            >
              Wrong number? Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add types for window object to avoid TS errors
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default AuthScreen;