import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert,
  PhoneCall, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  ArrowLeft, 
  Eye, 
  AlertCircle,
  HelpCircle,
  Check,
  RefreshCw,
  Lock,
  Calendar,
  Users,
  DollarSign,
  UtensilsCrossed,
  Car,
  Compass,
  Info,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { 
  HotelManagementData, 
  RoomEntry, 
  HotelProfileData, 
  FacilitiesData, 
  PoliciesData, 
  StaffContactData,
  CategoryVerificationStatus
} from '../types';
import { getCategoryVerificationStatus, getCategoryStatusDetails, compileKnowledgePrompt } from '../hotelData';
import { SecurityTestConsole } from './SecurityTestConsole';

interface HotelManagementDashboardProps {
  data: HotelManagementData;
  onSave: (updatedData: HotelManagementData) => Promise<void>;
  onReturnToReceptionist: () => void;
}

type ActiveSection = 'profile' | 'rooms' | 'facilities' | 'policies' | 'contacts' | 'notes' | 'preview' | 'testing';

export const HotelManagementDashboard: React.FC<HotelManagementDashboardProps> = ({
  data: initialData,
  onSave,
  onReturnToReceptionist,
}) => {
  const [formData, setFormData] = useState<HotelManagementData>(initialData);
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Format timestamp helper
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Not yet updated';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Helper to trigger save
  const handleSaveAll = async (overrideData?: HotelManagementData) => {
    setIsSaving(true);
    setSaveSuccessMessage(null);
    try {
      const dataToSave = overrideData || {
        ...formData,
        lastSaved: new Date().toISOString(),
      };
      await onSave(dataToSave);
      setFormData(dataToSave);
      setSaveSuccessMessage('All hotel records saved and synchronized with AI Receptionist.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Status computation for all 6 categories
  const profileHasContent = Boolean(
    formData.profile.hotelName || formData.profile.address || formData.profile.phone || 
    formData.profile.email || formData.profile.checkInTime || formData.profile.checkOutTime
  );
  const profileStatus: CategoryVerificationStatus = getCategoryVerificationStatus(profileHasContent, formData.profile.isVerified);
  const profileDetails = getCategoryStatusDetails(profileStatus);

  const roomsHasContent = Array.isArray(formData.rooms) && formData.rooms.length > 0;
  const roomsStatus: CategoryVerificationStatus = getCategoryVerificationStatus(roomsHasContent, formData.roomsVerified);
  const roomsDetails = getCategoryStatusDetails(roomsStatus);

  const facilitiesHasContent = Boolean(
    formData.facilities.facilities || formData.facilities.diningServices || 
    formData.facilities.transportServices || formData.facilities.specialServices || formData.facilities.otherAmenities
  );
  const facilitiesStatus: CategoryVerificationStatus = getCategoryVerificationStatus(facilitiesHasContent, formData.facilities.isVerified);
  const facilitiesDetails = getCategoryStatusDetails(facilitiesStatus);

  const policiesHasContent = Boolean(
    formData.policies.cancellationPolicy || formData.policies.paymentPolicy || 
    formData.policies.guestIdRequirements || formData.policies.childrenPolicy || formData.policies.petPolicy || formData.policies.otherPolicies
  );
  const policiesStatus: CategoryVerificationStatus = getCategoryVerificationStatus(policiesHasContent, formData.policies.isVerified);
  const policiesDetails = getCategoryStatusDetails(policiesStatus);

  const contactsHasContent = Boolean(
    formData.contacts.receptionContact || formData.contacts.bookingContact || 
    formData.contacts.emergencyContact || formData.contacts.staffInstructions
  );
  const contactsStatus: CategoryVerificationStatus = getCategoryVerificationStatus(contactsHasContent, formData.contacts.isVerified);
  const contactsDetails = getCategoryStatusDetails(contactsStatus);

  const notesHasContent = Boolean(formData.customNotes.content.trim());
  const notesStatus: CategoryVerificationStatus = getCategoryVerificationStatus(notesHasContent, formData.customNotes.isVerified);
  const notesDetails = getCategoryStatusDetails(notesStatus);

  // Count verified sections
  const totalSections = 6;
  const verifiedCount = [
    formData.profile.isVerified && profileHasContent,
    formData.roomsVerified && roomsHasContent,
    formData.facilities.isVerified && facilitiesHasContent,
    formData.policies.isVerified && policiesHasContent,
    formData.contacts.isVerified && contactsHasContent,
    formData.customNotes.isVerified && notesHasContent,
  ].filter(Boolean).length;

  // Edit Handlers with Re-verification Enforcement (Requirement 4)
  // When management modifies a category, it is marked as unverified (draft) until re-verified.
  const handleUpdateProfile = (field: keyof HotelProfileData, value: string) => {
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        [field]: value,
        isVerified: false, // Require re-verification after edit
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleVerifyProfile = (verified: boolean) => {
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        isVerified: verified,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleAddNewRoom = () => {
    const newRoom: RoomEntry = {
      id: `room-${Date.now()}`,
      roomType: '',
      roomDescription: '',
      numberOfRooms: '',
      maxGuests: '',
      price: '',
      availableFacilities: '',
      availabilityStatus: 'Available for inquiry',
      isVerified: true,
      lastUpdated: new Date().toISOString(),
    };
    const updated = {
      ...formData,
      rooms: [...formData.rooms, newRoom],
      roomsVerified: false, // Require re-verification
      roomsLastUpdated: new Date().toISOString(),
    };
    setFormData(updated);
    setSelectedRoomId(newRoom.id);
  };

  const handleUpdateRoom = (id: string, field: keyof RoomEntry, value: any) => {
    const updatedRooms = formData.rooms.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          [field]: value,
          lastUpdated: new Date().toISOString(),
        };
      }
      return r;
    });
    setFormData({
      ...formData,
      rooms: updatedRooms,
      roomsVerified: false, // Require re-verification after editing room details
      roomsLastUpdated: new Date().toISOString(),
    });
  };

  const handleDeleteRoom = (id: string) => {
    const updatedRooms = formData.rooms.filter((r) => r.id !== id);
    setFormData({
      ...formData,
      rooms: updatedRooms,
      roomsVerified: false, // Require re-verification
      roomsLastUpdated: new Date().toISOString(),
    });
    if (selectedRoomId === id) {
      setSelectedRoomId(updatedRooms[0]?.id || null);
    }
  };

  const handleVerifyRooms = (verified: boolean) => {
    setFormData({
      ...formData,
      roomsVerified: verified,
      roomsLastUpdated: new Date().toISOString(),
    });
  };

  const handleUpdateFacilities = (field: keyof FacilitiesData, value: string) => {
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities,
        [field]: value,
        isVerified: false, // Require re-verification after edit
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleVerifyFacilities = (verified: boolean) => {
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities,
        isVerified: verified,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleUpdatePolicies = (field: keyof PoliciesData, value: string) => {
    setFormData({
      ...formData,
      policies: {
        ...formData.policies,
        [field]: value,
        isVerified: false, // Require re-verification after edit
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleVerifyPolicies = (verified: boolean) => {
    setFormData({
      ...formData,
      policies: {
        ...formData.policies,
        isVerified: verified,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleUpdateContacts = (field: keyof StaffContactData, value: string) => {
    setFormData({
      ...formData,
      contacts: {
        ...formData.contacts,
        [field]: value,
        isVerified: false, // Require re-verification after edit
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleVerifyContacts = (verified: boolean) => {
    setFormData({
      ...formData,
      contacts: {
        ...formData.contacts,
        isVerified: verified,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleUpdateNotes = (value: string) => {
    setFormData({
      ...formData,
      customNotes: {
        ...formData.customNotes,
        content: value,
        isVerified: false, // Require re-verification after edit
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  const handleVerifyNotes = (verified: boolean) => {
    setFormData({
      ...formData,
      customNotes: {
        ...formData.customNotes,
        isVerified: verified,
        lastUpdated: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="flex-1 bg-[#f4f3ee] text-stone-800 flex flex-col min-h-screen">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-20 bg-[#0c2f24] text-stone-100 border-b border-emerald-950 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToReceptionist}
              className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-stone-200 hover:text-white border border-emerald-800/80 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Return to Guest Receptionist View"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to AI Receptionist</span>
            </button>

            <div className="h-6 w-[1px] bg-emerald-800/60 hidden sm:block"></div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Hotel Management
                </span>
                <span className="text-xs text-emerald-300/80 hidden md:inline">
                  • Verified Information Dashboard
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-serif-luxury font-bold text-white leading-tight">
                Kashmir Stay Hotel • Verification Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08221a] border border-emerald-900/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-stone-300">
                Verified Categories: <strong className="text-amber-300">{verifiedCount} / {totalSections}</strong>
              </span>
            </div>

            {/* Save All Button */}
            <button
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
              ) : (
                <Save className="w-4 h-4 text-stone-950" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save & Sync Records'}</span>
            </button>
          </div>
        </div>

        {/* Global Zero-Assumption Rule Banner */}
        <div className="bg-[#071c15] border-t border-emerald-950 px-4 py-2 text-xs text-stone-300 flex items-center justify-between gap-2">
          <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-stone-300">
              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                <strong className="text-amber-300">Zero-Assumption Safeguard:</strong> Only information explicitly entered and marked with <strong className="text-emerald-400">"Verified for AI"</strong> will be presented to guests by the receptionist.
              </span>
            </div>
            {formData.lastSaved && (
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                Last Synchronized: {new Date(formData.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Save Success Alert Notification */}
      {saveSuccessMessage && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 shadow-md flex items-center justify-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Management Layout */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Category Navigation */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 space-y-2">
          <div className="bg-white rounded-2xl p-3 shadow-2xs border border-stone-200/90 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Hotel Information Sections
            </div>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className={`w-4 h-4 ${activeSection === 'profile' ? 'text-amber-400' : 'text-emerald-800'}`} />
                <span>1. Hotel Profile</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${profileDetails.badgeColor}`}>
                {profileDetails.label}
              </span>
            </button>

            {/* Rooms Tab */}
            <button
              onClick={() => setActiveSection('rooms')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'rooms'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bed className={`w-4 h-4 ${activeSection === 'rooms' ? 'text-amber-400' : 'text-amber-800'}`} />
                <span>2. Rooms & Tariffs</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roomsDetails.badgeColor}`}>
                {roomsDetails.label}
              </span>
            </button>

            {/* Facilities Tab */}
            <button
              onClick={() => setActiveSection('facilities')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'facilities'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className={`w-4 h-4 ${activeSection === 'facilities' ? 'text-amber-400' : 'text-rose-800'}`} />
                <span>3. Facilities & Dining</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${facilitiesDetails.badgeColor}`}>
                {facilitiesDetails.label}
              </span>
            </button>

            {/* Policies Tab */}
            <button
              onClick={() => setActiveSection('policies')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'policies'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4 ${activeSection === 'policies' ? 'text-amber-400' : 'text-teal-800'}`} />
                <span>4. Hotel Policies</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${policiesDetails.badgeColor}`}>
                {policiesDetails.label}
              </span>
            </button>

            {/* Contacts & Staff Tab */}
            <button
              onClick={() => setActiveSection('contacts')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'contacts'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className={`w-4 h-4 ${activeSection === 'contacts' ? 'text-amber-400' : 'text-indigo-800'}`} />
                <span>5. Contacts & Staff</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${contactsDetails.badgeColor}`}>
                {contactsDetails.label}
              </span>
            </button>

            {/* Notes Tab */}
            <button
              onClick={() => setActiveSection('notes')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'notes'
                  ? 'bg-[#0c2f24] text-white shadow-sm font-semibold'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4 ${activeSection === 'notes' ? 'text-amber-400' : 'text-stone-700'}`} />
                <span>6. Additional Notes</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${notesDetails.badgeColor}`}>
                {notesDetails.label}
              </span>
            </button>

            <div className="pt-2 border-t border-stone-200 space-y-1.5">
              {/* Grounding Inspector Tab */}
              <button
                onClick={() => setActiveSection('preview')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeSection === 'preview'
                    ? 'bg-emerald-900 text-white shadow-sm font-semibold'
                    : 'bg-stone-50 hover:bg-stone-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>AI Grounding Inspector</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </button>

              {/* AI Security & Test Controls Tab */}
              <button
                onClick={() => setActiveSection('testing')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeSection === 'testing'
                    ? 'bg-[#0c2f24] text-amber-300 shadow-sm font-semibold'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 border border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>AI Security Test Controls</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Test Suite
                </span>
              </button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-emerald-950 text-stone-200 rounded-2xl p-4 border border-emerald-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Manager Guideline</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-300">
              Fill in each category as your real hotel facts become available. Toggle the <strong>"Mark as Verified"</strong> switch on each section when you are ready for the AI Receptionist to use it.
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 space-y-6">
          {/* SECTION 1: HOTEL PROFILE */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              {/* Header & Verification Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${profileDetails.badgeColor}`}>
                      Status: {profileDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.profile.lastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>Hotel Profile & Location</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official hotel name, location address, contact numbers, and check-in / check-out times.
                  </p>
                </div>

                {/* Verification Status Control */}
                <label className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={formData.profile.isVerified}
                    onChange={(e) => handleVerifyProfile(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800">Mark as Verified for AI</span>
                    <p className="text-[10px] text-stone-500">Authorize AI Receptionist access</p>
                  </div>
                </label>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {profileStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Edits Detected:</strong> Profile modifications are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyProfile(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                    <span>Hotel Name</span>
                    <span className="text-[10px] font-normal text-stone-500">Official registered name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profile.hotelName}
                    onChange={(e) => handleUpdateProfile('hotelName', e.target.value)}
                    placeholder="e.g., Kashmir Stay Hotel"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                    <span>Official Address / Location</span>
                    <span className="text-[10px] font-normal text-stone-500">Street, Area, City, Pin</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.profile.address}
                    onChange={(e) => handleUpdateProfile('address', e.target.value)}
                    placeholder="e.g., Boulevard Road, Dal Lake, Srinagar, Jammu & Kashmir 190001"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Official Phone Number</label>
                  <input
                    type="text"
                    value={formData.profile.phone}
                    onChange={(e) => handleUpdateProfile('phone', e.target.value)}
                    placeholder="e.g., +91 194 XXXXXXX / +91 9XXXXXXXXX"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Official Email Address</label>
                  <input
                    type="email"
                    value={formData.profile.email}
                    onChange={(e) => handleUpdateProfile('email', e.target.value)}
                    placeholder="e.g., reservations@kashmirstayhotel.com"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Check-In Time</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profile.checkInTime}
                    onChange={(e) => handleUpdateProfile('checkInTime', e.target.value)}
                    placeholder="e.g., 2:00 PM (14:00 hrs)"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-800" />
                    <span>Check-Out Time</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profile.checkOutTime}
                    onChange={(e) => handleUpdateProfile('checkOutTime', e.target.value)}
                    placeholder="e.g., 11:00 AM (11:00 hrs)"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      profile: {
                        hotelName: '',
                        address: '',
                        phone: '',
                        email: '',
                        checkInTime: '',
                        checkOutTime: '',
                        isVerified: false,
                        lastUpdated: '',
                      },
                    })
                  }
                  className="text-xs text-stone-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Profile Fields
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Hotel Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: ROOMS & PRICING */}
          {activeSection === 'rooms' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              {/* Header & Verification Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roomsDetails.badgeColor}`}>
                      Status: {roomsDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.roomsLastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <Bed className="w-5 h-5 text-amber-600" />
                    <span>Rooms, Tariffs & Capacities</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Add room categories, descriptions, tariffs, guest capacities, facilities, and availability.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roomsVerified}
                      onChange={(e) => handleVerifyRooms(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-800">Mark Rooms as Verified</span>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddNewRoom}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Room Category</span>
                  </button>
                </div>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {roomsStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Room Edits:</strong> Room modifications are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyRooms(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              {/* Room Cards List */}
              {formData.rooms.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Bed className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-700">No Room Categories Added Yet</h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    The hotel manager can add verified room categories (e.g. Deluxe Room, Executive Suite, Family Room) with tariffs, capacities, and facilities.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewRoom}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Room Category</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.rooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="p-4 sm:p-5 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-all space-y-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0c2f24] text-amber-300 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-sm text-stone-800">
                            {room.roomType || `Room Option #${index + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-600">Room Category / Name</label>
                          <input
                            type="text"
                            value={room.roomType}
                            onChange={(e) => handleUpdateRoom(room.id, 'roomType', e.target.value)}
                            placeholder="e.g., Deluxe Mountain View Room"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-600">Price / Nightly Tariff</label>
                          <input
                            type="text"
                            value={room.price}
                            onChange={(e) => handleUpdateRoom(room.id, 'price', e.target.value)}
                            placeholder="e.g., ₹4,500 / night + taxes"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-600">Max Guest Capacity</label>
                          <input
                            type="text"
                            value={room.maxGuests}
                            onChange={(e) => handleUpdateRoom(room.id, 'maxGuests', e.target.value)}
                            placeholder="e.g., 2 Adults, 1 Child"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-600">Total Room Count</label>
                          <input
                            type="text"
                            value={room.numberOfRooms}
                            onChange={(e) => handleUpdateRoom(room.id, 'numberOfRooms', e.target.value)}
                            placeholder="e.g., 10 Rooms"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-stone-600">Availability Status</label>
                          <input
                            type="text"
                            value={room.availabilityStatus}
                            onChange={(e) => handleUpdateRoom(room.id, 'availabilityStatus', e.target.value)}
                            placeholder="e.g., Available for inquiry / Seasonal rates apply"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-3">
                          <label className="text-[11px] font-bold text-stone-600">Room Facilities & Amenities</label>
                          <input
                            type="text"
                            value={room.availableFacilities}
                            onChange={(e) => handleUpdateRoom(room.id, 'availableFacilities', e.target.value)}
                            placeholder="e.g., Central Heating, King Bed, Mountain View Balcony, High-Speed Wi-Fi, Electric Kettle"
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-3">
                          <label className="text-[11px] font-bold text-stone-600">Room Description</label>
                          <textarea
                            rows={2}
                            value={room.roomDescription}
                            onChange={(e) => handleUpdateRoom(room.id, 'roomDescription', e.target.value)}
                            placeholder="e.g., Spacious 350 sq.ft wood-paneled room with pine furnishings and panoramic views of the Zabarwan mountains."
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleAddNewRoom}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Room Category</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Rooms & Tariffs</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: FACILITIES & DINING */}
          {activeSection === 'facilities' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${facilitiesDetails.badgeColor}`}>
                      Status: {facilitiesDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.facilities.lastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <span>Facilities, Dining & Transport</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Add verified general amenities, dining hours, breakfast details, taxi/transport services, and special guest arrangements.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={formData.facilities.isVerified}
                    onChange={(e) => handleVerifyFacilities(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800">Mark as Verified for AI</span>
                    <p className="text-[10px] text-stone-500">Authorize AI Receptionist access</p>
                  </div>
                </label>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {facilitiesStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Facilities Edits:</strong> Changes are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyFacilities(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>General Hotel Facilities</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.facilities.facilities}
                    onChange={(e) => handleUpdateFacilities('facilities', e.target.value)}
                    placeholder="e.g., 24-hour power backup / generator, central heating in winter, elevator access, high-speed Wi-Fi, on-site complimentary parking, luggage room, lawn garden."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-rose-800" />
                    <span>Dining & Restaurant Services</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.facilities.diningServices}
                    onChange={(e) => handleUpdateFacilities('diningServices', e.target.value)}
                    placeholder="e.g., In-house restaurant serving authentic Kashmiri Wazwan, Indian, and Continental cuisines. Breakfast buffet from 7:30 AM to 10:30 AM. Room service available until 10:30 PM."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-indigo-800" />
                    <span>Transport & Travel Services</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.facilities.transportServices}
                    onChange={(e) => handleUpdateFacilities('transportServices', e.target.value)}
                    placeholder="e.g., Srinagar International Airport pickup/drop assistance on advance request, local sightseeing car rentals to Gulmarg, Pahalgam, and Sonamarg."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    <span>Special Guest Services & Amenities</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.facilities.specialServices}
                    onChange={(e) => handleUpdateFacilities('specialServices', e.target.value)}
                    placeholder="e.g., Daily housekeeping, laundry service (same-day on request), doctor on call, electric kettle with complimentary Kashmiri Kahwa tea setup."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      facilities: {
                        facilities: '',
                        diningServices: '',
                        transportServices: '',
                        specialServices: '',
                        otherAmenities: '',
                        isVerified: false,
                        lastUpdated: '',
                      },
                    })
                  }
                  className="text-xs text-stone-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Facilities
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Facilities</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: POLICIES */}
          {activeSection === 'policies' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${policiesDetails.badgeColor}`}>
                      Status: {policiesDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.policies.lastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>Official Hotel Policies</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure verified cancellation terms, payment modes, guest identification rules, children, and pet guidelines.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={formData.policies.isVerified}
                    onChange={(e) => handleVerifyPolicies(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800">Mark as Verified for AI</span>
                    <p className="text-[10px] text-stone-500">Authorize AI Receptionist access</p>
                  </div>
                </label>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {policiesStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Policies Edits:</strong> Changes are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyPolicies(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700">Cancellation & Refund Policy</label>
                  <textarea
                    rows={2}
                    value={formData.policies.cancellationPolicy}
                    onChange={(e) => handleUpdatePolicies('cancellationPolicy', e.target.value)}
                    placeholder="e.g., Free cancellation up to 48 hours prior to check-in. Cancellations within 48 hours incur 1 night charge."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Payment Policy & Methods</label>
                  <textarea
                    rows={2}
                    value={formData.policies.paymentPolicy}
                    onChange={(e) => handleUpdatePolicies('paymentPolicy', e.target.value)}
                    placeholder="e.g., Credit cards (Visa/Mastercard/Amex), UPI, Debit Cards, and Cash accepted at front desk."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Guest ID Requirements</label>
                  <textarea
                    rows={2}
                    value={formData.policies.guestIdRequirements}
                    onChange={(e) => handleUpdatePolicies('guestIdRequirements', e.target.value)}
                    placeholder="e.g., Valid Government-issued photo ID (Aadhaar, Passport, Driving License, Voter ID) required for all adults at check-in (PAN card not accepted)."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Children & Extra Bed Policy</label>
                  <textarea
                    rows={2}
                    value={formData.policies.childrenPolicy}
                    onChange={(e) => handleUpdatePolicies('childrenPolicy', e.target.value)}
                    placeholder="e.g., Children up to 5 years stay free sharing existing bedding. Extra mattress/bed available on request with supplementary charge."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Pet Policy</label>
                  <textarea
                    rows={2}
                    value={formData.policies.petPolicy}
                    onChange={(e) => handleUpdatePolicies('petPolicy', e.target.value)}
                    placeholder="e.g., Pets are not permitted on hotel premises / Guide dogs permitted with prior notice."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      policies: {
                        cancellationPolicy: '',
                        paymentPolicy: '',
                        guestIdRequirements: '',
                        childrenPolicy: '',
                        petPolicy: '',
                        otherPolicies: '',
                        isVerified: false,
                        lastUpdated: '',
                      },
                    })
                  }
                  className="text-xs text-stone-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Policies
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Policies</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: CONTACTS & STAFF */}
          {activeSection === 'contacts' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${contactsDetails.badgeColor}`}>
                      Status: {contactsDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.contacts.lastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-amber-600" />
                    <span>Contact Points & Staff Instructions</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official phone numbers for reception, booking desk, emergency contacts, and special instructions for the AI receptionist.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={formData.contacts.isVerified}
                    onChange={(e) => handleVerifyContacts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800">Mark as Verified for AI</span>
                    <p className="text-[10px] text-stone-500">Authorize AI Receptionist access</p>
                  </div>
                </label>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {contactsStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Contacts Edits:</strong> Changes are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyContacts(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Reception / Front Desk Contact</label>
                  <input
                    type="text"
                    value={formData.contacts.receptionContact}
                    onChange={(e) => handleUpdateContacts('receptionContact', e.target.value)}
                    placeholder="e.g., Front Desk direct extension: 101, Mobile: +91 9419XXXXXX (24 Hours)"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Booking / Reservations Desk Contact</label>
                  <input
                    type="text"
                    value={formData.contacts.bookingContact}
                    onChange={(e) => handleUpdateContacts('bookingContact', e.target.value)}
                    placeholder="e.g., reservations@kashmirstayhotel.com, WhatsApp: +91 7006XXXXXX (9 AM - 8 PM)"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">24/7 Emergency / Duty Manager Line</label>
                  <input
                    type="text"
                    value={formData.contacts.emergencyContact}
                    onChange={(e) => handleUpdateContacts('emergencyContact', e.target.value)}
                    placeholder="e.g., Duty Manager Hotline: +91 9419XXXXXX (24/7 on premises)"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Staff Guidance & Special Directives</label>
                  <textarea
                    rows={3}
                    value={formData.contacts.staffInstructions}
                    onChange={(e) => handleUpdateContacts('staffInstructions', e.target.value)}
                    placeholder="e.g., If guest arrives late after 10 PM, advise them that night reception is on duty. For corporate group inquiries, ask them to write to sales desk."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      contacts: {
                        receptionContact: '',
                        bookingContact: '',
                        emergencyContact: '',
                        staffInstructions: '',
                        isVerified: false,
                        lastUpdated: '',
                      },
                    })
                  }
                  className="text-xs text-stone-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Contacts
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Contacts</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: ADDITIONAL NOTES */}
          {activeSection === 'notes' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${notesDetails.badgeColor}`}>
                      Status: {notesDetails.label}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      Last Updated: {formatTimestamp(formData.customNotes.lastUpdated)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>Additional Verified Notes & Factsheet</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Add custom facts, seasonal announcements, nearby tourist spots, or specific hotel guidelines.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={formData.customNotes.isVerified}
                    onChange={(e) => handleVerifyNotes(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-emerald-800"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-stone-800">Mark as Verified for AI</span>
                    <p className="text-[10px] text-stone-500">Authorize AI Receptionist access</p>
                  </div>
                </label>
              </div>

              {/* Unverified / Draft Warning Notice */}
              {notesStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      <strong>Unverified Notes Edits:</strong> Factsheet changes are blocked from the AI Receptionist until verified by management.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyNotes(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Authorize for AI</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={formData.customNotes.content}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  placeholder="Paste or type any additional verified information here. For example:&#10;- Nearby attractions: Dal Lake Shikara Ghat #2 is 5 minutes walk. Nishat Garden is 12 minutes drive.&#10;- Winter Heating: Heating is provided through central boilers from 6:00 PM to 9:00 AM daily."
                  className="w-full text-xs sm:text-sm p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-stone-50/50 leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      customNotes: { content: '', isVerified: false, lastUpdated: '' },
                    })
                  }
                  className="text-xs text-stone-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear Notes
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  className="px-4 py-2 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: AI GROUNDING INSPECTOR */}
          {activeSection === 'preview' && (
            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xs border border-stone-200/90 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif-luxury font-bold text-[#0c2f24] flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-700" />
                    <span>AI Grounding Inspector</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This displays the exact verified knowledge prompt compiled for the AI Receptionist.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Strict Zero-Assumption Active
                </span>
              </div>

              {/* Status matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">1. Profile</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.profile.isVerified && profileHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">2. Rooms</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.roomsVerified && roomsHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {formData.rooms.length} Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">3. Facilities</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.facilities.isVerified && facilitiesHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">4. Policies</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.policies.isVerified && policiesHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">5. Contacts</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.contacts.isVerified && contactsHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-medium text-stone-500">6. Notes</span>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {formData.customNotes.isVerified && notesHasContent ? (
                      <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Excluded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inspector Content Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700">
                  Compiled Grounding Text for AI Receptionist:
                </label>
                <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-stone-800">
                  {compileKnowledgePrompt()}
                </pre>
              </div>

              <div className="flex justify-end pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onReturnToReceptionist}
                  className="px-5 py-2.5 rounded-xl bg-[#0c2f24] hover:bg-[#134939] text-amber-300 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Test Receptionist with this Knowledge</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 8: AI SECURITY & TEST CONTROLS */}
          {activeSection === 'testing' && (
            <SecurityTestConsole
              data={formData}
              onNavigateToCategory={(cat) => setActiveSection(cat as ActiveSection)}
            />
          )}
        </div>
      </main>
    </div>
  );
};
