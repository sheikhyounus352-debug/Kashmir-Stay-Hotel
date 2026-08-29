import React from 'react';
import { 
  Bed, 
  Clock, 
  Sparkles, 
  CalendarCheck, 
  UserCheck, 
  HelpCircle,
  MessageSquareQuote
} from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const COMMON_HOTEL_INQUIRIES = [
  {
    id: 'room-inquiry',
    label: 'Room Inquiry',
    prompt: 'Can you tell me about the available rooms and room types at Kashmir Stay Hotel?',
    icon: <Bed className="w-3.5 h-3.5 text-amber-700" />,
  },
  {
    id: 'booking-inquiry',
    label: 'Booking Inquiry',
    prompt: 'I would like to book a room for 2 guests from this Friday to Sunday.',
    icon: <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />,
  },
  {
    id: 'human-staff',
    label: 'Speak with Staff',
    prompt: 'Can I speak directly to the hotel front desk receptionist or human staff?',
    icon: <UserCheck className="w-3.5 h-3.5 text-indigo-700" />,
  },
  {
    id: 'timings',
    label: 'Check-in / Out Times',
    prompt: 'What are the official check-in and check-out times at Kashmir Stay Hotel?',
    icon: <Clock className="w-3.5 h-3.5 text-teal-700" />,
  },
  {
    id: 'facilities',
    label: 'Facilities & Services',
    prompt: 'What facilities, heating arrangements, and dining options are provided?',
    icon: <Sparkles className="w-3.5 h-3.5 text-rose-700" />,
  },
  {
    id: 'unknown-query',
    label: 'Unverified Info Test',
    prompt: 'Do you offer private rooftop helicopter transfers and jacuzzi suites?',
    icon: <HelpCircle className="w-3.5 h-3.5 text-stone-600" />,
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
          <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-700" />
          <span>Quick Inquiries for AI Receptionist</span>
        </span>
        <span className="text-[11px] text-stone-500 font-medium">Click to test receptionist response</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {COMMON_HOTEL_INQUIRIES.map((item) => (
          <button
            key={item.id}
            id={`quick-prompt-${item.id}`}
            onClick={() => onSelectPrompt(item.prompt)}
            disabled={disabled}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 active:bg-emerald-100 text-stone-700 hover:text-emerald-950 border border-stone-200 hover:border-emerald-300 shadow-2xs text-left transition-all duration-150 group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-stone-50 group-hover:bg-white border border-stone-200 group-hover:border-emerald-200 shadow-2xs flex-shrink-0 transition-colors">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate leading-tight group-hover:text-emerald-900">
                {item.label}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
