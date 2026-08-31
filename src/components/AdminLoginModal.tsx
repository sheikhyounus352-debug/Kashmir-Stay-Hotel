import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  X
} from 'lucide-react';
import { AuthSession } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser && !cleanPass) {
      setErrorMessage('Please enter your administrator username and password.');
      return;
    }
    if (!cleanUser) {
      setErrorMessage('Please enter your administrator username or email.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid Login Credentials');
      }

      const authSession: AuthSession = {
        token: data.token,
        user: data.user,
        expiresAt: data.expiresAt,
      };

      onLoginSuccess(authSession);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid Login Credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0c2f24] via-[#103d2f] to-[#0c2f24] text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Restricted Admin Access
              </span>
              <h3 id="admin-login-title" className="text-lg font-serif-luxury font-bold text-white">
                Hotel Manager Authentication
              </h3>
            </div>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            Only authorized hotel managers and administrators may access the Hotel Management Portal, edit records, or publish verified data.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Administrator Username / Email
            </label>
            <div className="relative">
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter username or email"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent bg-stone-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Administrator Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent bg-stone-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Authorize & Login</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Rule Guard Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>Server-side authorization enforced. Unauthenticated mutations are blocked.</span>
        </div>
      </div>
    </div>
  );
};
