import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Database, 
  FileText, 
  Building, 
  Phone, 
  Bed, 
  UtensilsCrossed, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { VerifiedHotelKnowledge, EMPTY_HOTEL_KNOWLEDGE } from '../types';

interface VerifiedKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledge: VerifiedHotelKnowledge;
  onSaveKnowledge: (updated: VerifiedHotelKnowledge) => Promise<void>;
}

export const VerifiedKnowledgeModal: React.FC<VerifiedKnowledgeModalProps> = ({
  isOpen,
  onClose,
  knowledge,
  onSaveKnowledge,
}) => {
  const [formData, setFormData] = useState<VerifiedHotelKnowledge>(knowledge);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  useEffect(() => {
    setFormData(knowledge);
  }, [knowledge, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveKnowledge(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save knowledge: ', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all entered hotel information? The AI receptionist will reset to having zero stored facts.')) {
      setFormData({ ...EMPTY_HOTEL_KNOWLEDGE });
    }
  };

  const hasAnyData = Object.entries(formData).some(([key, val]) => key !== 'lastUpdated' && typeof val === 'string' && val.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-900/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0c2f24] text-stone-50 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold">
                Source of Truth
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-white mt-0.5">
              Verified Hotel Information Manager
            </h2>
            <p className="text-xs text-emerald-200/80">
              Only information explicitly saved here will be known and used by the AI Receptionist.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-stone-300 hover:text-white transition-colors border border-emerald-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notice */}
        <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {hasAnyData ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified records present • Grounded mode active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-900 font-medium bg-amber-100/80 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>No hotel information entered yet • AI will reply: "I'm sorry, I don't have that information yet. Please contact our hotel staff for assistance."</span>
              </span>
            )}
          </div>

          {formData.lastUpdated && (
            <span className="text-stone-500 text-[11px]">
              Last updated: {new Date(formData.lastUpdated).toLocaleString()}
            </span>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section 1: General Info & Location */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <Building className="w-4 h-4 text-emerald-800" />
              <span>1. General Hotel Overview, Location & Landmark</span>
            </label>
            <p className="text-xs text-stone-500">
              Provide the official address, area landmarks, nearest travel hubs, or general introduction.
            </p>
            <textarea
              rows={3}
              value={formData.generalInfo}
              onChange={(e) => setFormData({ ...formData, generalInfo: e.target.value })}
              placeholder="e.g. Kashmir Stay Hotel is located on... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 2: Contact Details */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <Phone className="w-4 h-4 text-emerald-800" />
              <span>2. Official Contact Information</span>
            </label>
            <p className="text-xs text-stone-500">
              Official front desk telephone numbers, mobile/WhatsApp, email addresses, and reception operating hours.
            </p>
            <textarea
              rows={2}
              value={formData.contactDetails}
              onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
              placeholder="e.g. Front Desk Phone: ... | Email: ... | Hours: ... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 3: Rooms, Pricing & Tariffs */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <Bed className="w-4 h-4 text-emerald-800" />
              <span>3. Rooms, Rates & Nightly Tariffs</span>
            </label>
            <p className="text-xs text-stone-500">
              List the exact verified room categories, bed setups, occupancy limits, and nightly prices.
            </p>
            <textarea
              rows={3}
              value={formData.roomsAndPricing}
              onChange={(e) => setFormData({ ...formData, roomsAndPricing: e.target.value })}
              placeholder="e.g. Deluxe Room: ₹... per night, includes... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 4: Facilities & Services */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <span>4. Facilities, Heating & Guest Services</span>
            </label>
            <p className="text-xs text-stone-500">
              Heating mechanisms, hot water details, Wi-Fi, power backup, parking, transfers, or other verified services.
            </p>
            <textarea
              rows={3}
              value={formData.facilitiesAndAmenities}
              onChange={(e) => setFormData({ ...formData, facilitiesAndAmenities: e.target.value })}
              placeholder="e.g. Central heating, Wi-Fi, transport desk... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 5: Dining & Food Services */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <UtensilsCrossed className="w-4 h-4 text-emerald-800" />
              <span>5. Dining, Menus & Meal Timings</span>
            </label>
            <p className="text-xs text-stone-500">
              On-site restaurants, breakfast hours, cuisines offered, vegetarian/Jain options, room service availability.
            </p>
            <textarea
              rows={3}
              value={formData.diningAndFood}
              onChange={(e) => setFormData({ ...formData, diningAndFood: e.target.value })}
              placeholder="e.g. Breakfast served from 7:30 AM to 10:30 AM... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 6: Check-in, Check-out & House Policies */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>6. Check-in, Check-out, ID & Cancellation Policies</span>
            </label>
            <p className="text-xs text-stone-500">
              Exact check-in/out hours, required government photo IDs, cancellation rules, child/extra-bed policies.
            </p>
            <textarea
              rows={3}
              value={formData.checkInCheckOutPolicies}
              onChange={(e) => setFormData({ ...formData, checkInCheckOutPolicies: e.target.value })}
              placeholder="e.g. Check-in: 2:00 PM | Check-out: 11:00 AM | Free cancellation up to 48 hrs... (Leave blank if not yet available)"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>

          {/* Section 7: Flexible Notes / Complete Document */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>7. Additional Verified Notes / Paste Hotel Brochure Content</span>
            </label>
            <p className="text-xs text-stone-500">
              Any other specific hotel facts, FAQs, sightseeing guide, or custom hotel instructions.
            </p>
            <textarea
              rows={4}
              value={formData.additionalVerifiedNotes}
              onChange={(e) => setFormData({ ...formData, additionalVerifiedNotes: e.target.value })}
              placeholder="Paste any additional verified text or FAQ items here..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-stone-50/50 focus:bg-white resize-y"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-stone-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-200/70 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Entries</span>
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved & Synchronized with AI Receptionist!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#154637] text-amber-300 font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isSaving ? 'Saving...' : 'Save Verified Information'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
