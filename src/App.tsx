import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Database,
  PlusCircle,
  FileCheck,
  Loader2,
  AlertCircle,
  Info,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { QuickPrompts } from './components/QuickPrompts';
import { VerifiedKnowledgeModal } from './components/VerifiedKnowledgeModal';
import { HotelManagementDashboard } from './components/HotelManagementDashboard';
import { GmailManager } from './components/GmailManager';
import { initAuth } from './services/gmailAuth';
import { 
  ChatMessage, 
  VerifiedHotelKnowledge, 
  EMPTY_HOTEL_KNOWLEDGE,
  HotelManagementData,
  EMPTY_HOTEL_MANAGEMENT_DATA,
  BookingInquirySummary
} from './types';
import { speakText, stopSpeech, getSpeechRecognition } from './utils/speech';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg-1',
  sender: 'receptionist',
  text: `**Warm greetings and welcome to Kashmir Stay Hotel!** 🌸

I am your **AI Front Desk Receptionist**. I am here to assist you with questions regarding our hotel, rooms, services, dining, and policies based strictly on our verified hotel records.

How may I assist you today?`,
  timestamp: 'Front Desk • Live',
};

export default function App() {
  const [activeView, setActiveView] = useState<'receptionist' | 'management'>('receptionist');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState<boolean>(false);
  const [knowledge, setKnowledge] = useState<VerifiedHotelKnowledge>(EMPTY_HOTEL_KNOWLEDGE);
  const [managementData, setManagementData] = useState<HotelManagementData>(EMPTY_HOTEL_MANAGEMENT_DATA);

  // Gmail Workspace Integration State
  const [isGmailOpen, setIsGmailOpen] = useState<boolean>(false);
  const [gmailInquiryPayload, setGmailInquiryPayload] = useState<BookingInquirySummary | null>(null);
  const [hasGmailAuth, setHasGmailAuth] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Gmail Auth listener to show account connectivity status
  useEffect(() => {
    const unsub = initAuth(
      (_user, token) => {
        setHasGmailAuth(Boolean(token));
      },
      () => {
        setHasGmailAuth(false);
      }
    );
    return () => unsub();
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'receptionist') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeView]);

  // Load verified management data and knowledge from server on startup
  useEffect(() => {
    async function loadData() {
      try {
        const [resMgmt, resKnowledge] = await Promise.all([
          fetch('/api/hotel-management'),
          fetch('/api/hotel-knowledge'),
        ]);

        if (resMgmt.ok) {
          const mgmt = await resMgmt.json();
          if (mgmt && typeof mgmt === 'object') {
            setManagementData(mgmt);
          }
        }

        if (resKnowledge.ok) {
          const kn = await resKnowledge.json();
          if (kn && typeof kn === 'object') {
            setKnowledge(kn);
          }
        }
      } catch (err) {
        console.warn('Could not fetch hotel data from server:', err);
      }
    }
    loadData();
  }, []);

  // Handle Speech Recognition setup
  useEffect(() => {
    const recognition = getSpeechRecognition();
    if (recognition) {
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. You can type your questions in the box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Save Full Management Data
  const handleSaveManagementData = async (updatedData: HotelManagementData) => {
    setManagementData(updatedData);
    try {
      const response = await fetch('/api/hotel-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.derivedKnowledge) {
          setKnowledge(resData.derivedKnowledge);
        }
      }
    } catch (err) {
      console.error('Error saving hotel management records:', err);
      throw err;
    }
  };

  const handleSaveKnowledge = async (updated: VerifiedHotelKnowledge) => {
    setKnowledge(updated);
    try {
      await fetch('/api/hotel-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Error syncing knowledge with server:', err);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || inputText;
    if (!messageToSend.trim() || isLoading) return;

    stopSpeech();

    const userMessageObj: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessageObj];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: messageToSend.trim(),
          messages: newMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseText =
        data.text ||
        "I'm sorry, I don't have that information yet. Please contact our hotel staff for assistance.";

      const receptionistMessageObj: ChatMessage = {
        id: `receptionist-${Date.now()}`,
        sender: 'receptionist',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingStatus: data.groundingStatus,
        inquirySummary: data.inquirySummary,
      };

      setMessages((prev) => [...prev, receptionistMessageObj]);

      if (autoSpeak) {
        speakText(responseText);
      }
    } catch (error) {
      console.error('Error communicating with AI Receptionist:', error);
      const fallbackErrorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'receptionist',
        text: "I'm sorry, I don't have that information yet. Please contact our hotel staff for assistance.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: false,
        groundingStatus: 'safe_fallback',
      };
      setMessages((prev) => [...prev, fallbackErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmInquiry = (summary: any) => {
    const confirmationPrompt = `Yes, those details are correct. Check-in: ${summary.checkInDate}, Check-out: ${summary.checkOutDate}, Guests: ${summary.numberOfGuests}, Room: ${summary.preferredRoomType}. Please proceed with recording this inquiry.`;
    handleSendMessage(confirmationPrompt);
  };

  const handleModifyInquiry = () => {
    setInputText('I would like to update my booking inquiry dates and details: ');
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    stopSpeech();
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasVerifiedKnowledge = Object.entries(knowledge).some(
    ([key, val]) => key !== 'lastUpdated' && typeof val === 'string' && val.trim().length > 0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f5f0] text-stone-800">
      {/* Top Navigation Bar */}
      <Navbar
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => {
          if (autoSpeak) stopSpeech();
          setAutoSpeak(!autoSpeak);
        }}
        onOpenKnowledgeManager={() => setActiveView('management')}
        onOpenGmail={() => {
          setGmailInquiryPayload(null);
          setIsGmailOpen(true);
        }}
        knowledge={knowledge}
        activeView={activeView}
        onChangeView={(view) => setActiveView(view)}
        hasGmailAuth={hasGmailAuth}
      />

      {/* VIEW: HOTEL MANAGEMENT DASHBOARD */}
      {activeView === 'management' ? (
        <HotelManagementDashboard
          data={managementData}
          onSave={handleSaveManagementData}
          onReturnToReceptionist={() => setActiveView('receptionist')}
          onOpenGmail={() => {
            setGmailInquiryPayload(null);
            setIsGmailOpen(true);
          }}
        />
      ) : (
        /* VIEW: AI RECEPTIONIST (GUEST VIEW) */
        <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col gap-4">
          {/* Hotel Identity & Knowledge Manager Banner */}
          <div className="bg-gradient-to-r from-[#0c2f24] via-[#103d2f] to-[#0c2f24] text-stone-100 rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-900 text-emerald-300 border border-emerald-700 uppercase tracking-wider">
                  Official Front Desk
                </span>
                <span className="text-xs text-emerald-300/80">• Strict Grounding Active</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif-luxury font-bold text-white">
                Kashmir Stay Hotel • AI Receptionist
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                {hasVerifiedKnowledge
                  ? "The AI Receptionist is answering guest inquiries strictly using your saved verified hotel records."
                  : "No hotel information has been added yet. Use the Hotel Management portal to configure official profile, rooms, and policies."}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={() => setActiveView('management')}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                {hasVerifiedKnowledge ? (
                  <>
                    <SlidersHorizontal className="w-4 h-4 text-stone-950" />
                    <span>Open Hotel Management Dashboard</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-stone-950" />
                    <span>Configure Verified Hotel Information</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Inquiries */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-stone-200/90">
            <QuickPrompts
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              disabled={isLoading}
            />
          </div>

          {/* Chat Stream Window */}
          <div className="flex-1 bg-stone-100/70 rounded-2xl border border-stone-200 shadow-inner p-3 sm:p-5 overflow-y-auto flex flex-col min-h-[420px] max-h-[620px]">
            <div className="flex-1 space-y-1">
              {messages.map((message) => (
                <ChatMessageBubble 
                  key={message.id} 
                  message={message} 
                  onConfirmInquiry={handleConfirmInquiry}
                  onModifyInquiry={handleModifyInquiry}
                  onEmailInquiry={(summary) => {
                    setGmailInquiryPayload(summary);
                    setIsGmailOpen(true);
                  }}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 my-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0c2f24] text-amber-300 flex items-center justify-center shadow-sm">
                    <Building2 className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs shadow-2xs border border-stone-200 flex items-center gap-2 text-xs text-stone-600">
                    <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                    <span className="font-medium">
                      Consulting verified hotel records...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Input Area */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-md">
            <div className="flex items-end gap-2 sm:gap-3">
              {/* Clear Conversation */}
              <button
                id="clear-chat-btn"
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                className="p-3 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors border border-stone-200 flex-shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Voice Dictation (Speech-to-Text) */}
              <button
                id="mic-dictation-btn"
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? "Listening... Click to stop" : "Speak your question"}
                className={`p-3 rounded-xl transition-all border flex-shrink-0 cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md"
                    : "hover:bg-emerald-50 text-emerald-800 border-stone-200 hover:border-emerald-300"
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Text Input Area */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  id="receptionist-input-textarea"
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? "Listening... Speak your question."
                      : "Ask the receptionist about rooms, check-in, dining, services, or policies..."
                  }
                  className="w-full text-xs sm:text-sm py-2.5 px-3.5 pr-10 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent resize-none max-h-32 bg-stone-50/50 focus:bg-white transition-all placeholder:text-stone-500"
                />
                {isListening && (
                  <span className="absolute right-3 top-2.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>

              {/* Send Button */}
              <button
                id="send-message-btn"
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-3 rounded-xl bg-[#0c2f24] hover:bg-[#134939] active:bg-[#08221a] text-amber-300 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md flex-shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Grounding Subtext */}
            <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Grounded in verified records only • Zero guesses or unverified assumptions</span>
              </span>
              <span className="hidden sm:inline">Press Enter to send • Shift + Enter for newline</span>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-2 text-center text-xs text-stone-500 space-y-1 pb-4">
            <p className="font-semibold text-stone-700">
              Kashmir Stay Hotel • AI Receptionist
            </p>
            <p className="text-[11px] text-stone-500">
              Only hotel information explicitly entered by hotel management is used to answer guest inquiries.
            </p>
          </footer>
        </main>
      )}

      {/* Verified Knowledge Base Manager Modal (Quick editor fallback) */}
      <VerifiedKnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        knowledge={knowledge}
        onSaveKnowledge={handleSaveKnowledge}
      />

      {/* Gmail Communications Center Modal */}
      <GmailManager
        isOpen={isGmailOpen}
        onClose={() => {
          setIsGmailOpen(false);
          setGmailInquiryPayload(null);
        }}
        initialInquiryToSend={gmailInquiryPayload}
        hotelEmail={managementData.profile.email || managementData.contacts.bookingContact || 'info@kashmirstayhotel.com'}
      />
    </div>
  );
}

