import React from 'react';
import { 
  Calendar, 
  Users, 
  BedDouble, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Sparkles,
  Send
} from 'lucide-react';
import { BookingInquirySummary } from '../types';

interface BookingInquiryCardProps {
  summary: BookingInquirySummary;
  onConfirmInquiry?: () => void;
  onModifyInquiry?: () => void;
  isConfirmed?: boolean;
}

export const BookingInquiryCard: React.FC<BookingInquiryCardProps> = ({
  summary,
  onConfirmInquiry,
  onModifyInquiry,
  isConfirmed = false,
}) => {
  const confirmed = isConfirmed || summary.isConfirmedByGuest || summary.status === 'guest_confirmed';

  return (
    <div className="mt-3.5 mb-2 w-full rounded-xl bg-gradient-to-b from-stone-50 to-white border border-stone-200/90 shadow-sm overflow-hidden text-stone-800">
      {/* Card Header */}
      <div className="bg-[#0c2f24] text-stone-100 px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Booking Inquiry Summary
            </h4>
            <span className="text-[10px] text-amber-300 font-medium">
              Kashmir Stay Hotel • Front Desk Inquiry
            </span>
          </div>
        </div>

        {confirmed ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
            Confirmed by Guest
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-300" />
            Awaiting Confirmation
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Check-In */}
          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-100/70 text-emerald-800 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Check-In Date
              </span>
              <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                {summary.checkInDate || 'To be specified'}
              </p>
            </div>
          </div>

          {/* Check-Out */}
          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-100/70 text-emerald-800 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Check-Out Date
              </span>
              <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                {summary.checkOutDate || 'To be specified'}
              </p>
            </div>
          </div>

          {/* Guests */}
          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-100/70 text-amber-800 flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Number of Guests
              </span>
              <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                {summary.numberOfGuests || 'To be specified'}
              </p>
            </div>
          </div>

          {/* Preferred Room */}
          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-100/70 text-amber-800 flex-shrink-0">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Preferred Room Type
              </span>
              <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                {summary.preferredRoomType || 'Flexible / Standard'}
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Legal & Safety Disclaimer */}
        <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="font-bold text-amber-950">Important Notice:</strong>{' '}
            <span>This is an inquiry only and is not a confirmed reservation.</span>
            <span className="text-amber-800 block mt-0.5">
              Room availability and rates must be verified and confirmed by hotel management.
            </span>
          </div>
        </div>

        {/* Interactive Action Controls */}
        {!confirmed && onConfirmInquiry && (
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
            <button
              id="confirm-inquiry-btn"
              type="button"
              onClick={onConfirmInquiry}
              className="w-full sm:flex-1 py-2 px-3.5 rounded-lg bg-[#0c2f24] hover:bg-[#134939] active:bg-[#08221a] text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Confirm Inquiry Details</span>
            </button>

            {onModifyInquiry && (
              <button
                id="modify-inquiry-btn"
                type="button"
                onClick={onModifyInquiry}
                className="w-full sm:w-auto py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer border border-stone-200"
              >
                <span>Edit Details</span>
              </button>
            )}
          </div>
        )}

        {confirmed && (
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-900 font-medium">
            ✨ Inquiry confirmed by guest. Noted for hotel staff review.
          </div>
        )}
      </div>
    </div>
  );
};
