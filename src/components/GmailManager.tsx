import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Inbox, 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Clock,
  ChevronRight,
  Reply,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../services/gmailAuth';
import { 
  getGmailProfile, 
  listGmailMessages, 
  getGmailMessageDetail, 
  sendGmailEmail, 
  trashGmailMessage,
  GmailMessageSummary,
  GmailMessageDetail,
  GmailUserProfile 
} from '../services/gmailApi';
import { BookingInquirySummary } from '../types';

interface GmailManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialInquiryToSend?: BookingInquirySummary | null;
  hotelEmail?: string;
}

export const GmailManager: React.FC<GmailManagerProps> = ({
  isOpen,
  onClose,
  initialInquiryToSend,
  hotelEmail = 'info@kashmirstayhotel.com',
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mail state
  const [profile, setProfile] = useState<GmailUserProfile | null>(null);
  const [folder, setFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Compose State
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Destructive Confirmation Dialog State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'send' | 'trash';
    targetId?: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Initialize Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When initial inquiry is passed, populate compose modal
  useEffect(() => {
    if (initialInquiryToSend && isOpen) {
      setComposeTo(hotelEmail);
      setComposeSubject(`Booking Inquiry: ${initialInquiryToSend.preferredRoomType || 'Room'} (${initialInquiryToSend.checkInDate} to ${initialInquiryToSend.checkOutDate})`);
      setComposeBody(
        `Dear Kashmir Stay Hotel Reservations Team,\n\n` +
        `I would like to submit the following booking inquiry:\n\n` +
        `• Check-In Date: ${initialInquiryToSend.checkInDate}\n` +
        `• Check-Out Date: ${initialInquiryToSend.checkOutDate}\n` +
        `• Number of Guests: ${initialInquiryToSend.numberOfGuests}\n` +
        `• Preferred Room Type: ${initialInquiryToSend.preferredRoomType}\n\n` +
        `*Notice: This is a booking inquiry only and is not a confirmed reservation.*\n` +
        `Please let me know room availability and reservation details.\n\n` +
        `Warm regards,\n${currentUser?.displayName || 'Hotel Guest'}`
      );
      setIsComposing(true);
    }
  }, [initialInquiryToSend, isOpen, hotelEmail, currentUser]);

  // Load messages when authenticated
  const loadMessages = async (currentFolder = folder, query = searchQuery) => {
    if (!authToken) return;
    setIsLoadingMessages(true);
    setStatusFeedback(null);
    try {
      const q = currentFolder === 'SENT' ? `in:sent ${query}` : `in:inbox ${query}`;
      const data = await listGmailMessages({ query: q.trim(), maxResults: 15 });
      setMessages(data.messages);
      
      // Also fetch profile in background
      getGmailProfile().then(setProfile).catch(() => {});
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setStatusFeedback({ text: err.message || 'Failed to load emails.', type: 'error' });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (authToken && isOpen) {
      loadMessages(folder, searchQuery);
    }
  }, [authToken, folder, isOpen]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAuthToken(result.accessToken);
        setAuthError(null);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setAuthError(err.message || 'Sign in could not be completed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAuthToken(null);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setIsComposing(false);
  };

  // Open single message
  const handleOpenMessage = async (msgSummary: GmailMessageSummary) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getGmailMessageDetail(msgSummary.id);
      setSelectedMessage(detail);
    } catch (err: any) {
      setStatusFeedback({ text: err.message || 'Failed to open message.', type: 'error' });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Trigger Confirmation before Sending Email
  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      setStatusFeedback({ text: 'Please enter a recipient email address.', type: 'error' });
      return;
    }
    if (!composeSubject.trim()) {
      setStatusFeedback({ text: 'Please enter an email subject.', type: 'error' });
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'send',
      description: `Are you sure you want to send this email to "${composeTo}" with subject "${composeSubject}"?`,
      onConfirm: async () => {
        setConfirmationModal(null);
        setIsSending(true);
        try {
          await sendGmailEmail({
            to: composeTo,
            subject: composeSubject,
            bodyText: composeBody,
          });
          setStatusFeedback({ text: `Email sent successfully to ${composeTo}! ✉️`, type: 'success' });
          setIsComposing(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          if (folder === 'SENT') {
            loadMessages('SENT');
          }
        } catch (err: any) {
          setStatusFeedback({ text: err.message || 'Failed to send email.', type: 'error' });
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  // Trigger Confirmation before Trashing Email
  const requestTrashMessage = (messageId: string, subject: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'trash',
      targetId: messageId,
      description: `Are you sure you want to move the email "${subject}" to trash?`,
      onConfirm: async () => {
        setConfirmationModal(null);
        try {
          await trashGmailMessage(messageId);
          setStatusFeedback({ text: 'Email moved to trash.', type: 'info' });
          setSelectedMessage(null);
          loadMessages(folder);
        } catch (err: any) {
          setStatusFeedback({ text: err.message || 'Failed to trash email.', type: 'error' });
        }
      },
    });
  };

  // Quick Template Selection
  const applyTemplate = (type: 'inquiry_reply' | 'welcome' | 'inquiry_summary') => {
    if (type === 'inquiry_reply') {
      setComposeSubject('Re: Hotel Stay & Room Booking Inquiry — Kashmir Stay Hotel');
      setComposeBody(
        `Dear Guest,\n\n` +
        `Thank you for contacting Kashmir Stay Hotel.\n\n` +
        `We have received your stay inquiry. Our front desk team is reviewing room availability and verified seasonal pricing for your requested dates.\n\n` +
        `Please note: This correspondence is part of your inquiry and is not a confirmed reservation. Our reservations manager will contact you shortly to assist with finalizing your stay.\n\n` +
        `Warm regards,\nFront Desk & Guest Relations\nKashmir Stay Hotel`
      );
    } else if (type === 'welcome') {
      setComposeSubject('Welcome to Kashmir Stay Hotel — Guest Information & Arrival Guide');
      setComposeBody(
        `Dear Guest,\n\n` +
        `Warm greetings from Kashmir Stay Hotel! 🌸\n\n` +
        `We are delighted to welcome you to the paradise on earth. If you have any questions regarding check-in times, Kashmiri dining, local transport, or hotel amenities, our 24/7 front desk is always at your service.\n\n` +
        `Wishing you a pleasant and memorable stay!\n\n` +
        `Warm regards,\nKashmir Stay Hotel Team`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-emerald-800/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-stone-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="bg-[#0c2f24] px-4 sm:px-6 py-3 border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-md">
              <Mail className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-crest font-bold text-sm sm:text-base text-stone-50">
                  Kashmir Stay Hotel — Gmail Communications Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900 text-emerald-300 border border-emerald-700">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-emerald-300/90">
                Official email dispatch, guest inquiries & hotel correspondence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full border border-emerald-400" 
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-stone-200 font-medium max-w-[140px] truncate">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Sign out of Google"
                  className="ml-1 p-1 hover:bg-emerald-900 rounded text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-stone-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Gmail Manager"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {statusFeedback && (
          <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            statusFeedback.type === 'success' 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : statusFeedback.type === 'error'
              ? 'bg-red-950 text-red-300 border-red-800'
              : 'bg-stone-800 text-stone-200 border-stone-700'
          }`}>
            <div className="flex items-center gap-2">
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{statusFeedback.text}</span>
            </div>
            <button 
              onClick={() => setStatusFeedback(null)}
              className="text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Container */}
        {!authToken ? (
          /* Unauthenticated State: Official Sign-in With Google */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-stone-900/90 overflow-y-auto">
            <div className="max-w-md w-full p-8 rounded-2xl bg-stone-950 border border-emerald-900/80 shadow-xl space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-stone-950" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-stone-100">
                  Connect Gmail to Kashmir Stay Hotel
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Sign in with your Google account to read, compose, and send hotel inquiries, reservation details, and guest correspondence securely.
                </p>
              </div>

              {/* Zero-Assumption Mode Shield Indicator */}
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-900 text-left text-xs text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-200">Zero-Assumption Privacy:</strong>
                  <span className="text-emerald-300/80 block mt-0.5">
                    Tokens are kept in memory only and never stored in localStorage. Explicit confirmation is required before any email is sent or deleted.
                  </span>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 text-left">
                  {authError}
                </div>
              )}

              {/* Official Google Sign-in Button */}
              <div className="pt-2 flex justify-center">
                <button 
                  id="gsi-sign-in-btn"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="gsi-material-button w-full justify-center py-2.5 px-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper flex items-center justify-center gap-3">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents font-medium text-sm text-stone-800">
                      {isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Workspace View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Controls & Folders */}
            <div className="w-full md:w-64 bg-stone-950 border-b md:border-b-0 md:border-r border-emerald-950 p-3 sm:p-4 flex flex-col justify-between flex-shrink-0 space-y-4">
              <div className="space-y-4">
                {/* Compose Button */}
                <button
                  id="compose-email-btn"
                  onClick={() => {
                    setIsComposing(true);
                    setSelectedMessage(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Compose Email</span>
                </button>

                {/* Folder Navigation */}
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setFolder('INBOX');
                      setIsComposing(false);
                      setSelectedMessage(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      folder === 'INBOX' && !isComposing
                        ? 'bg-emerald-900/80 text-amber-300 font-semibold'
                        : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Inbox className="w-4 h-4" />
                      <span>Inbox</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setFolder('SENT');
                      setIsComposing(false);
                      setSelectedMessage(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      folder === 'SENT' && !isComposing
                        ? 'bg-emerald-900/80 text-amber-300 font-semibold'
                        : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4" />
                      <span>Sent Messages</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Account / Sync Status Box */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-stone-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300">Connected Account</span>
                  <button
                    onClick={() => loadMessages(folder)}
                    title="Refresh emails"
                    className="text-stone-400 hover:text-amber-300 transition-colors cursor-pointer p-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                </div>
                <p className="text-[11px] text-stone-200 font-medium truncate">
                  {currentUser?.email}
                </p>
                {profile && (
                  <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1 border-t border-emerald-950">
                    <span>Total Messages:</span>
                    <span className="text-amber-300 font-bold">{profile.messagesTotal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Main Panel */}
            <div className="flex-1 flex flex-col bg-stone-900 overflow-hidden">
              {/* If Composing */}
              {isComposing ? (
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsComposing(false)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-sm text-stone-100">
                        New Hotel Email Message
                      </h4>
                    </div>

                    {/* Quick Template Picker */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-stone-400 text-[11px] hidden sm:inline">Templates:</span>
                      <button
                        type="button"
                        onClick={() => applyTemplate('inquiry_reply')}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-emerald-900 text-[11px] text-amber-300 font-medium transition-colors cursor-pointer border border-stone-700"
                      >
                        Inquiry Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('welcome')}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-emerald-900 text-[11px] text-emerald-300 font-medium transition-colors cursor-pointer border border-stone-700"
                      >
                        Welcome Guide
                      </button>
                    </div>
                  </div>

                  <form onSubmit={requestSendEmail} className="space-y-3.5 flex-1 flex flex-col">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        To (Recipient Email):
                      </label>
                      <input
                        type="email"
                        required
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        placeholder="guest@example.com or frontdesk@kashmirstayhotel.com"
                        className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Subject:
                      </label>
                      <input
                        type="text"
                        required
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                        placeholder="e.g., Booking Inquiry: Deluxe Room (15-18 Oct)"
                        className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        Message Body:
                      </label>
                      <textarea
                        required
                        rows={10}
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        placeholder="Write your email message here..."
                        className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                      ></textarea>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-stone-800">
                      <button
                        type="button"
                        onClick={() => setIsComposing(false)}
                        className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSending}
                        className="px-5 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-amber-400" />
                        <span>{isSending ? 'Sending...' : 'Review & Send Email'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : selectedMessage ? (
                /* Selected Message Detail View */
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to list</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsComposing(true);
                          setComposeTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                          setComposeSubject(selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`);
                          setComposeBody(`\n\n--- On ${selectedMessage.date}, ${selectedMessage.from} wrote:\n> ${selectedMessage.bodyText.slice(0, 300)}...`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>

                      <button
                        onClick={() => requestTrashMessage(selectedMessage.id, selectedMessage.subject)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-300 hover:text-red-200 transition-colors cursor-pointer"
                        title="Delete email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subject and Sender Info */}
                  <div className="space-y-2 bg-stone-950 p-4 rounded-xl border border-stone-800">
                    <h3 className="text-base sm:text-lg font-bold text-stone-100">
                      {selectedMessage.subject}
                    </h3>
                    <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2 pt-1 border-t border-stone-850">
                      <div>
                        <strong className="text-stone-300">From:</strong> {selectedMessage.from}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500">
                        <Clock className="w-3 h-3" />
                        <span>{selectedMessage.date}</span>
                      </div>
                    </div>
                    {selectedMessage.to && (
                      <div className="text-xs text-stone-400">
                        <strong className="text-stone-300">To:</strong> {selectedMessage.to}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 bg-stone-950 p-4 sm:p-5 rounded-xl border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto">
                    {selectedMessage.bodyText || selectedMessage.snippet || '(No content in message body)'}
                  </div>
                </div>
              ) : (
                /* Message List View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search and Action Bar */}
                  <div className="p-3 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadMessages(folder, searchQuery)}
                        placeholder="Search emails by keyword, sender, or subject..."
                        className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      onClick={() => loadMessages(folder, searchQuery)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-amber-400' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>

                  {/* Message Items */}
                  <div className="flex-1 overflow-y-auto divide-y divide-stone-800/80">
                    {isLoadingMessages ? (
                      <div className="p-12 text-center text-stone-400 space-y-3">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                        <p className="text-xs">Fetching emails from Gmail...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-12 text-center text-stone-400 space-y-2">
                        <Inbox className="w-8 h-8 mx-auto text-stone-600" />
                        <h5 className="font-semibold text-stone-300 text-sm">No emails found</h5>
                        <p className="text-xs max-w-sm mx-auto text-stone-500">
                          {searchQuery ? `No messages matched "${searchQuery}".` : 'Your mailbox in this folder is currently empty.'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => handleOpenMessage(msg)}
                          className={`p-3.5 sm:p-4 hover:bg-stone-800/60 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                            msg.isUnread ? 'bg-stone-850/40 font-medium' : ''
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold truncate max-w-[200px] ${
                                msg.isUnread ? 'text-amber-300' : 'text-stone-200'
                              }`}>
                                {msg.from.replace(/<.*>/, '').trim() || msg.from}
                              </span>
                              {msg.isUnread && (
                                <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-500 text-stone-950 font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                              {msg.subject}
                            </h5>
                            <p className="text-xs text-stone-400 truncate max-w-2xl">
                              {msg.snippet}
                            </p>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] text-stone-500 whitespace-nowrap">
                              {msg.date.split(' ').slice(0, 4).join(' ') || msg.date}
                            </span>
                            <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-stone-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Confirmation Dialog for Destructive Actions */}
        {confirmationModal && confirmationModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-950 border border-amber-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-100">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h4 className="font-bold text-base text-stone-100">
                  {confirmationModal.type === 'send' ? 'Confirm Sending Email' : 'Confirm Deleting Email'}
                </h4>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {confirmationModal.description}
              </p>

              {confirmationModal.type === 'send' && (
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-400 space-y-1">
                  <div><strong>To:</strong> {composeTo}</div>
                  <div><strong>Subject:</strong> {composeSubject}</div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setConfirmationModal(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmationModal.onConfirm}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                    confirmationModal.type === 'send'
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      : 'bg-red-700 hover:bg-red-600 text-white'
                  }`}
                >
                  {confirmationModal.type === 'send' ? 'Yes, Send Email' : 'Yes, Move to Trash'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
