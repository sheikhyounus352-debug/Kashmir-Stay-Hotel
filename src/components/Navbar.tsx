import React from 'react';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Database, 
  Compass, 
  ShieldCheck, 
  PlusCircle, 
  FileCheck, 
  LayoutDashboard, 
  MessageSquareQuote, 
  SlidersHorizontal,
  Lock,
  Unlock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { VerifiedHotelKnowledge, AuthSession } from '../types';

interface NavbarProps {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenKnowledgeManager: () => void;
  knowledge: VerifiedHotelKnowledge;
  activeView: 'receptionist' | 'management';
  onChangeView: (view: 'receptionist' | 'management') => void;
  authSession: AuthSession | null;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  autoSpeak,
  onToggleAutoSpeak,
  onOpenKnowledgeManager,
  knowledge,
  activeView,
  onChangeView,
  authSession,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  const hasKnowledge = Object.entries(knowledge).some(
    ([key, val]) => key !== 'lastUpdated' && typeof val === 'string' && val.trim().length > 0
  );

  const handleManagementClick = () => {
    if (!authSession) {
      onOpenAdminLogin();
    } else {
      onChangeView('management');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0c2f24] text-stone-100 border-b border-emerald-900/50 shadow-md">
      {/* Top Protocol Status Bar */}
      <div className="bg-[#08221a] px-4 py-1.5 text-xs text-emerald-200/90 border-b border-emerald-950 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">
            Strict Zero-Assumption Mode: AI Receptionist answers strictly from verified & published records.
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {authSession ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-700 text-[11px] font-bold">
                <UserCheck className="w-3 h-3 text-amber-400" />
                <span>Admin Logged In ({authSession.user.username})</span>
              </span>
              <button
                onClick={onAdminLogout}
                className="flex items-center gap-1 text-stone-400 hover:text-stone-200 text-[11px] font-medium transition-colors cursor-pointer"
                title="Log out of Admin Portal"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg flex items-center justify-center text-stone-950 flex-shrink-0">
            <div className="w-full h-full bg-[#0c2f24] rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-crest text-lg sm:text-xl font-bold tracking-wider text-stone-50">
                KASHMIR STAY HOTEL
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded-full">
                Front Desk
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-300/90 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>24/7 AI Reception & Management Portal</span>
            </div>
          </div>
        </div>

        {/* Primary View Switcher Navigation */}
        <div className="flex items-center bg-[#071f17] p-1 rounded-xl border border-emerald-900/70 shadow-inner">
          <button
            id="nav-receptionist-tab"
            onClick={() => onChangeView('receptionist')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'receptionist'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>AI Receptionist</span>
          </button>

          <button
            id="nav-management-tab"
            onClick={handleManagementClick}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'management'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Hotel Management</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950/80 text-amber-300 border border-emerald-800">
              Admin
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Narration Toggle (only in Receptionist view) */}
          {activeView === 'receptionist' && (
            <button
              id="voice-toggle-btn"
              onClick={onToggleAutoSpeak}
              title={autoSpeak ? "Voice Narration is ON" : "Voice Narration is OFF"}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                autoSpeak
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-950/60 text-stone-300 border-emerald-900/80 hover:bg-emerald-900/50"
              }`}
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline">Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span className="hidden md:inline">Voice OFF</span>
                </>
              )}
            </button>
          )}

          {/* Quick Manage / Login Button */}
          <button
            id="open-knowledge-btn"
            onClick={handleManagementClick}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md ${
              activeView === 'management'
                ? "bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 cursor-pointer"
                : authSession
                ? "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold border border-amber-600 cursor-pointer"
                : "bg-emerald-900 hover:bg-emerald-800 text-amber-300 border border-emerald-700 cursor-pointer"
            }`}
          >
            {activeView === 'management' ? (
              <>
                <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                <span>Guest View</span>
              </>
            ) : authSession ? (
              <>
                <SlidersHorizontal className="w-4 h-4 text-stone-950" />
                <span>Open Dashboard</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Admin Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


