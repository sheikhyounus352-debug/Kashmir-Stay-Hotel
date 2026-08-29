import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Building2, 
  User,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { ChatMessage, BookingInquirySummary } from '../types';
import { speakText, stopSpeech } from '../utils/speech';
import { BookingInquiryCard } from './BookingInquiryCard';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onConfirmInquiry?: (summary: BookingInquirySummary) => void;
  onModifyInquiry?: () => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onConfirmInquiry,
  onModifyInquiry,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const isReceptionist = message.sender === 'receptionist';

  // Helper to extract inquiry summary from text if not directly on message object
  const getDerivedInquirySummary = (): BookingInquirySummary | null => {
    if (message.inquirySummary) return message.inquirySummary;

    const text = message.text;
    if (
      (text.includes('Booking Inquiry Summary') || text.includes('Check-in date') || text.includes('Check-In Date')) &&
      text.includes('Check-out') &&
      text.includes('guest')
    ) {
      // Parse fields using regex
      const checkInMatch = text.match(/(?:Check-In|Check-in)(?:\s*Date)?(?:\s*:|\*\*:\*\*|\*\*)\s*([^\n\r*]+)/i);
      const checkOutMatch = text.match(/(?:Check-Out|Check-out)(?:\s*Date)?(?:\s*:|\*\*:\*\*|\*\*)\s*([^\n\r*]+)/i);
      const guestsMatch = text.match(/(?:Number of Guests|Guests|Guest count)(?:\s*:|\*\*:\*\*|\*\*)\s*([^\n\r*]+)/i);
      const roomMatch = text.match(/(?:Preferred Room Type|Room Type|Room)(?:\s*:|\*\*:\*\*|\*\*)\s*([^\n\r*]+)/i);

      if (checkInMatch || checkOutMatch || guestsMatch) {
        const isConfirmed = text.toLowerCase().includes('confirmed by guest') || text.toLowerCase().includes('thank you for confirming');
        return {
          checkInDate: checkInMatch ? checkInMatch[1].replace(/[*_`]/g, '').trim() : 'To be provided',
          checkOutDate: checkOutMatch ? checkOutMatch[1].replace(/[*_`]/g, '').trim() : 'To be provided',
          numberOfGuests: guestsMatch ? guestsMatch[1].replace(/[*_`]/g, '').trim() : 'To be provided',
          preferredRoomType: roomMatch ? roomMatch[1].replace(/[*_`]/g, '').trim() : 'Not specified',
          isConfirmedByGuest: isConfirmed,
          status: isConfirmed ? 'guest_confirmed' : 'ready_for_confirmation',
        };
      }
    }
    return null;
  };

  const detectedSummary = getDerivedInquirySummary();

  const handleToggleSpeak = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(message.text, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className={`flex w-full gap-3 sm:gap-4 my-3 ${
        isReceptionist ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Receptionist Avatar */}
      {isReceptionist && (
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0c2f24] text-amber-300 flex items-center justify-center shadow-md border border-emerald-800">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-900 mt-1 uppercase tracking-wider">
            Reception
          </span>
        </div>
      )}

      {/* Message Bubble Card */}
      <div
        className={`max-w-[92%] sm:max-w-[84%] md:max-w-[78%] flex flex-col ${
          isReceptionist ? 'items-start' : 'items-end'
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm border text-stone-800 transition-all ${
            isReceptionist
              ? message.isError
                ? 'bg-rose-50 border-rose-200 text-rose-900 rounded-tl-xs'
                : 'bg-white border-stone-200 text-stone-800 rounded-tl-xs'
              : 'bg-[#0f3d30] text-stone-50 border-emerald-900 rounded-tr-xs shadow-md'
          }`}
        >
          {/* Header info bar inside bubble */}
          <div
            className={`flex items-center justify-between text-xs mb-2 pb-1.5 border-b gap-3 ${
              isReceptionist
                ? 'text-stone-500 border-stone-100'
                : 'text-emerald-300/80 border-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide">
                {isReceptionist ? 'AI Receptionist • Kashmir Stay Hotel' : 'Customer'}
              </span>
              {isReceptionist && !message.isError && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Grounding
                </span>
              )}
            </div>
            <span className="text-[11px] opacity-75">{message.timestamp}</span>
          </div>

          {/* Body Content */}
          {isReceptionist ? (
            <div className="prose-receptionist text-stone-800 text-sm sm:text-base selection:bg-emerald-100 selection:text-emerald-900">
              <Markdown>{message.text}</Markdown>

              {/* Render Booking Inquiry Card if detected */}
              {detectedSummary && (
                <BookingInquiryCard
                  summary={detectedSummary}
                  onConfirmInquiry={
                    onConfirmInquiry && !detectedSummary.isConfirmedByGuest
                      ? () => onConfirmInquiry(detectedSummary)
                      : undefined
                  }
                  onModifyInquiry={
                    onModifyInquiry && !detectedSummary.isConfirmedByGuest
                      ? onModifyInquiry
                      : undefined
                  }
                  isConfirmed={detectedSummary.isConfirmedByGuest}
                />
              )}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-stone-50 whitespace-pre-wrap leading-relaxed">
              {message.text}
            </p>
          )}

          {/* Action Bar for AI Responses */}
          {isReceptionist && !message.isError && (
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                {/* Voice Narration */}
                <button
                  onClick={handleToggleSpeak}
                  title={isPlayingAudio ? "Stop Voice" : "Listen to Response"}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopyText}
                  title="Copy message"
                  className="px-2 py-1 rounded-md hover:bg-stone-100 text-stone-600 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Zero-Assumption Guarantee Label */}
              <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium select-none">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Strict Zero-Assumption</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isReceptionist && (
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md font-bold">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold text-stone-500 mt-1 uppercase tracking-wider">
            Guest
          </span>
        </div>
      )}
    </div>
  );
};
