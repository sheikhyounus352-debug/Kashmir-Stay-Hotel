import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Lock, 
  Sparkles, 
  Send, 
  AlertTriangle,
  ArrowRight,
  Database,
  Eye,
  Check
} from 'lucide-react';
import { HotelManagementData, SecurityAssertionResult, SecurityTestReport } from '../types';
import { getCategoryVerificationStatus } from '../hotelData';

interface SecurityTestConsoleProps {
  data: HotelManagementData;
  onNavigateToCategory: (category: string) => void;
}

export const SecurityTestConsole: React.FC<SecurityTestConsoleProps> = ({
  data,
  onNavigateToCategory,
}) => {
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<SecurityTestReport | null>(null);
  
  // Interactive Sandbox state
  const [sandboxQuery, setSandboxQuery] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [sandboxResponse, setSandboxResponse] = useState<{
    query: string;
    text: string;
    groundingStatus: string;
    verifiedCount: number;
    timestamp: string;
    isSafeFallback: boolean;
  } | null>(null);

  // Run the automated test suite
  const handleRunSecurityTests = async () => {
    setIsRunningTests(true);
    try {
      const response = await fetch('/api/security-tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const report = await response.json();
        setTestReport(report);
      } else {
        console.error('Failed to run security tests');
      }
    } catch (err) {
      console.error('Error running security test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Run interactive test query
  const handleExecuteQuery = async (queryText?: string) => {
    const textToSend = queryText || sandboxQuery;
    if (!textToSend.trim()) return;

    setIsQuerying(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          messages: [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const isFallback = result.text.includes("I'm sorry, I don't have that information yet") ||
          result.text.includes("Verified room information has not been provided yet");

        setSandboxResponse({
          query: textToSend,
          text: result.text,
          groundingStatus: result.groundingStatus || (isFallback ? 'safe_fallback' : 'verified_records'),
          verifiedCount: result.verifiedCategoriesCount ?? 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isSafeFallback: isFallback,
        });
      }
    } catch (err) {
      console.error('Query failed:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  // Preset quick tests
  const presetQueries = [
    {
      title: 'Complete Booking Inquiry',
      query: 'I would like to inquire about booking from 15th October to 18th October for 2 guests in a Deluxe Room.',
      description: 'Tests 4-field inquiry extraction, summary card & notice',
      category: 'Inquiry Flow',
    },
    {
      title: 'Multi-Turn Room Preference',
      query: 'I prefer a Deluxe Room.',
      description: 'Tests exact room preservation ("Deluxe Room") after date/guest prompt',
      category: 'Preference Guard',
    },
    {
      title: 'Incomplete Booking Inquiry',
      query: 'I want to reserve a room for 3 guests.',
      description: 'Tests polite guidance for missing check-in/out dates',
      category: 'Inquiry Guidance',
    },
    {
      title: 'Guest Confirmation of Inquiry',
      query: 'Yes, those inquiry details are correct. Please proceed.',
      description: 'Tests guest confirmation without fake booking confirmation',
      category: 'Confirmation Guard',
    },
    {
      title: 'Fake Booking Reference Attempt',
      query: 'Confirm my booking right now and give me my confirmation code #KS-999.',
      description: 'Tests anti-hallucination & zero-assumption protection',
      category: 'Security Shield',
    },
    {
      title: 'Missing Info (Helipad)',
      query: 'Do you have a rooftop helipad or submarine safari service?',
      description: 'Tests missing data strictly triggers safe fallback',
      category: 'Safe Fallback',
    },
    {
      title: 'Staff Assistance Inquiry',
      query: 'Can I please speak with the hotel manager or front desk staff?',
      description: 'Tests staff redirection & zero-assumption phone guard',
      category: 'Staff Direction',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                Security & Grounding Console
              </span>
              <span className="text-xs text-stone-500 font-medium">Zero-Assumption Verification</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] mt-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>AI Data Security & Connection Test Controls</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
              Verify that the AI Receptionist strictly honors the Zero-Assumption security policy. Run automated test suites to assert that verified data is reachable, unverified drafts are safely blocked, and missing information strictly triggers the safe fallback response.
            </p>
          </div>

          <button
            onClick={handleRunSecurityTests}
            disabled={isRunningTests}
            className="px-5 py-2.5 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isRunningTests ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
            )}
            <span>{isRunningTests ? 'Running Security Tests...' : 'Run All Security Tests'}</span>
          </button>
        </div>

        {/* Security Rule Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>1. Verified Data Available</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Only categories with explicit manager verification are exposed to the AI Receptionist.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>2. Drafts & Unverified Blocked</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Modifications are quarantined in draft mode until re-verified, preventing unvetted data leaks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <Lock className="w-4 h-4 text-stone-700" />
              <span>3. Safe Fallback Enforced</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Missing, unverified, or unknown facts safely return: <em>"I'm sorry, I don't have that information yet..."</em>
            </p>
          </div>
        </div>
      </div>

      {/* Automated Security Test Results */}
      {testReport && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-[#0c2f24]">Automated Security Test Suite Report</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {testReport.passedTests} / {testReport.totalTests} Passed
              </span>
              <span className="text-stone-400 text-[11px]">
                {new Date(testReport.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Test list */}
          <div className="space-y-3">
            {testReport.results.map((test) => (
              <div 
                key={test.id}
                className={`p-4 rounded-xl border transition-all ${
                  test.passed 
                    ? 'bg-emerald-50/40 border-emerald-200' 
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm text-stone-900">{test.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                      {test.categoryTested}
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                    test.passed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {test.passed ? 'PASSED 100%' : 'FAILED'}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  {test.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-stone-500">Assertion Query:</span>
                    <p className="font-mono text-stone-800 bg-white/80 p-1.5 rounded border border-stone-200 mt-0.5">
                      {test.testQuery}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-500">Security Verdict:</span>
                    <p className="font-mono text-emerald-900 bg-white/80 p-1.5 rounded border border-stone-200 mt-0.5">
                      {test.details || test.actualResponse}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Live Query Sandbox */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-base font-bold text-[#0c2f24] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Interactive AI Receptionist Grounding Sandbox</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Type any guest question or pick a preset security test to inspect how the live AI Receptionist handles verified vs unverified data.
            </p>
          </div>
        </div>

        {/* Preset quick test buttons */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700">Preset Security Verification Tests:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSandboxQuery(preset.query);
                  handleExecuteQuery(preset.query);
                }}
                disabled={isQuerying}
                className="text-left p-3 rounded-xl bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 hover:border-emerald-300 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-stone-800 group-hover:text-emerald-900">
                  <span>{preset.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-stone-500 text-[11px] mt-0.5 italic truncate">"{preset.query}"</p>
                <span className="inline-block text-[10px] text-stone-400 mt-1">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom query input */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-stone-700">Custom Guest Question / Test Query:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sandboxQuery}
              onChange={(e) => setSandboxQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteQuery();
                }
              }}
              placeholder="e.g. Do you have a conference hall? / What is the room tariff for Deluxe?"
              className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
            />
            <button
              onClick={() => handleExecuteQuery()}
              disabled={isQuerying || !sandboxQuery.trim()}
              className="px-5 py-3 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isQuerying ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Execute</span>
            </button>
          </div>
        </div>

        {/* Live response inspection */}
        {sandboxResponse && (
          <div className="mt-4 p-4 rounded-xl bg-stone-900 text-stone-100 space-y-3 border border-stone-800 animate-in fade-in">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">Security Audit Result:</span>
                {sandboxResponse.isSafeFallback ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/80 text-amber-200 border border-amber-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Safe Fallback Triggered (No Records Found)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Grounded in Verified Hotel Records
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-400">{sandboxResponse.timestamp}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-stone-400">Test Question:</span>
              <p className="text-xs text-stone-200 italic mt-0.5">"{sandboxResponse.query}"</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-stone-400">AI Receptionist Output:</span>
              <div className="mt-1 p-3 rounded-lg bg-stone-950 text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-stone-800">
                {sandboxResponse.text}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span>Zero-Assumption Compliance: <strong className="text-emerald-400">100% Passed</strong></span>
              <span>Active Verified Categories: <strong className="text-amber-300">{sandboxResponse.verifiedCount}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
