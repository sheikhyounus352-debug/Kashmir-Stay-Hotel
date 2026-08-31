import React, { useState } from 'react';
import { 
  Briefcase, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  X,
  User,
  Sparkles
} from 'lucide-react';
import { AgentAuthSession } from '../types';

interface TravelAgentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AgentAuthSession) => void;
}

export const TravelAgentLoginModal: React.FC<TravelAgentLoginModalProps> = ({
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
      setErrorMessage('Please enter your travel agent username/email and password.');
      return;
    }
    if (!cleanUser) {
      setErrorMessage('Please enter your travel agent username or email.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Please enter your travel agent password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid Travel Agent credentials.');
      }

      const agentSession: AgentAuthSession = {
        token: data.token,
        agent: data.agent,
        expiresAt: data.expiresAt,
      };

      onLoginSuccess(agentSession);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid Travel Agent credentials.');
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
        aria-labelledby="agent-login-title"
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
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 id="agent-login-title" className="text-xl font-bold font-serif tracking-wide text-white">
                Travel Agent Portal
              </h2>
              <p className="text-xs text-emerald-200">
                Partner Booking & Commission Management
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body / Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div 
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div>
            <label 
              htmlFor="agent-username-input" 
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Agent Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="agent-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. agent1 or agent@kashmirstay.com"
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-sm text-stone-900 transition-all outline-hidden"
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="agent-password-input" 
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Agent Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="agent-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your partner account password"
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-sm text-stone-900 transition-all outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-amber-300 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Login to Agent Portal</span>
              </>
            )}
          </button>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Agent Session</span>
            </span>
            <span>24h Token Validity</span>
          </div>
        </form>
      </div>
    </div>
  );
};
