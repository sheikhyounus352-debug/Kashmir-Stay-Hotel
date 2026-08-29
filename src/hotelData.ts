import { 
  HotelManagementData, 
  EMPTY_HOTEL_MANAGEMENT_DATA,
  VerifiedHotelKnowledge, 
  EMPTY_HOTEL_KNOWLEDGE,
  RoomEntry,
  CategoryVerificationStatus
} from './types';

// Helper to determine verification state
export function getCategoryVerificationStatus(hasContent: boolean, isVerified: boolean): CategoryVerificationStatus {
  if (!hasContent) return 'not_configured';
  if (!isVerified) return 'unverified';
  return 'verified';
}

export function getCategoryStatusDetails(status: CategoryVerificationStatus) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        subtext: 'Authorized & Active in AI Receptionist',
        badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        dotColor: 'bg-emerald-500',
      };
    case 'unverified':
      return {
        label: 'Unverified',
        subtext: 'Draft / Modified — Blocked from AI until re-verified',
        badgeColor: 'text-amber-800 bg-amber-50 border-amber-300',
        dotColor: 'bg-amber-500 animate-pulse',
      };
    case 'not_configured':
    default:
      return {
        label: 'Not Configured',
        subtext: 'Empty record — Safe fallback will be triggered',
        badgeColor: 'text-stone-600 bg-stone-100 border-stone-300',
        dotColor: 'bg-stone-400',
      };
  }
}

// In-memory data store for Hotel Management Dashboard
// Starts completely EMPTY in strict zero-assumption mode.
export let CURRENT_HOTEL_MANAGEMENT_DATA: HotelManagementData = {
  ...EMPTY_HOTEL_MANAGEMENT_DATA,
};

export function getHotelManagementData(): HotelManagementData {
  return CURRENT_HOTEL_MANAGEMENT_DATA;
}

export function setHotelManagementData(data: Partial<HotelManagementData>): HotelManagementData {
  CURRENT_HOTEL_MANAGEMENT_DATA = {
    ...CURRENT_HOTEL_MANAGEMENT_DATA,
    ...data,
    lastSaved: new Date().toISOString(),
  };
  return CURRENT_HOTEL_MANAGEMENT_DATA;
}

// Convert legacy/simple knowledge into management format if needed
export function getVerifiedKnowledge(): VerifiedHotelKnowledge {
  const m = CURRENT_HOTEL_MANAGEMENT_DATA;
  
  // Synthesize legacy format
  const generalParts: string[] = [];
  if (m.profile.isVerified) {
    if (m.profile.hotelName) generalParts.push(`Hotel Name: ${m.profile.hotelName}`);
    if (m.profile.address) generalParts.push(`Address: ${m.profile.address}`);
    if (m.profile.checkInTime) generalParts.push(`Check-In Time: ${m.profile.checkInTime}`);
    if (m.profile.checkOutTime) generalParts.push(`Check-Out Time: ${m.profile.checkOutTime}`);
  }

  const contactParts: string[] = [];
  if (m.profile.isVerified) {
    if (m.profile.phone) contactParts.push(`Phone: ${m.profile.phone}`);
    if (m.profile.email) contactParts.push(`Email: ${m.profile.email}`);
  }
  if (m.contacts.isVerified) {
    if (m.contacts.receptionContact) contactParts.push(`Reception: ${m.contacts.receptionContact}`);
    if (m.contacts.bookingContact) contactParts.push(`Reservations: ${m.contacts.bookingContact}`);
    if (m.contacts.emergencyContact) contactParts.push(`Emergency: ${m.contacts.emergencyContact}`);
    if (m.contacts.staffInstructions) contactParts.push(`Staff Guidelines: ${m.contacts.staffInstructions}`);
  }

  const roomParts: string[] = [];
  if (m.roomsVerified && Array.isArray(m.rooms) && m.rooms.length > 0) {
    m.rooms.forEach((r, idx) => {
      if (r.isVerified !== false) {
        roomParts.push(
          `[Room ${idx + 1}: ${r.roomType || 'Standard Room'}]\n` +
          `- Description: ${r.roomDescription || 'N/A'}\n` +
          `- Price/Tariff: ${r.price || 'N/A'}\n` +
          `- Capacity: ${r.maxGuests ? `${r.maxGuests} Guests` : 'N/A'}\n` +
          `- Total Rooms: ${r.numberOfRooms || 'N/A'}\n` +
          `- Facilities: ${r.availableFacilities || 'N/A'}\n` +
          `- Status: ${r.availabilityStatus || 'Available for inquiries'}`
        );
      }
    });
  }

  const facilitiesParts: string[] = [];
  if (m.facilities.isVerified) {
    if (m.facilities.facilities) facilitiesParts.push(`Hotel Facilities:\n${m.facilities.facilities}`);
    if (m.facilities.transportServices) facilitiesParts.push(`Transport & Sightseeing:\n${m.facilities.transportServices}`);
    if (m.facilities.specialServices) facilitiesParts.push(`Special Services:\n${m.facilities.specialServices}`);
    if (m.facilities.otherAmenities) facilitiesParts.push(`Other Amenities:\n${m.facilities.otherAmenities}`);
  }

  const diningParts: string[] = [];
  if (m.facilities.isVerified && m.facilities.diningServices) {
    diningParts.push(`Dining & Meals:\n${m.facilities.diningServices}`);
  }

  const policiesParts: string[] = [];
  if (m.policies.isVerified) {
    if (m.policies.cancellationPolicy) policiesParts.push(`Cancellation Policy:\n${m.policies.cancellationPolicy}`);
    if (m.policies.paymentPolicy) policiesParts.push(`Payment Policy:\n${m.policies.paymentPolicy}`);
    if (m.policies.guestIdRequirements) policiesParts.push(`ID Requirements:\n${m.policies.guestIdRequirements}`);
    if (m.policies.childrenPolicy) policiesParts.push(`Children Policy:\n${m.policies.childrenPolicy}`);
    if (m.policies.petPolicy) policiesParts.push(`Pet Policy:\n${m.policies.petPolicy}`);
    if (m.policies.otherPolicies) policiesParts.push(`Other Policies:\n${m.policies.otherPolicies}`);
  }

  const notesParts: string[] = [];
  if (m.customNotes.isVerified && m.customNotes.content) {
    notesParts.push(m.customNotes.content);
  }

  return {
    generalInfo: generalParts.join('\n'),
    contactDetails: contactParts.join('\n'),
    roomsAndPricing: roomParts.join('\n\n'),
    facilitiesAndAmenities: facilitiesParts.join('\n\n'),
    diningAndFood: diningParts.join('\n\n'),
    checkInCheckOutPolicies: policiesParts.join('\n\n'),
    additionalVerifiedNotes: notesParts.join('\n\n'),
    lastUpdated: m.lastSaved || '',
  };
}

export function setVerifiedKnowledge(data: Partial<VerifiedHotelKnowledge>): VerifiedHotelKnowledge {
  // Map legacy knowledge into management structure
  const updated: Partial<HotelManagementData> = {};

  if (typeof data.generalInfo === 'string') {
    updated.profile = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.profile,
      hotelName: CURRENT_HOTEL_MANAGEMENT_DATA.profile.hotelName || 'Kashmir Stay Hotel',
      address: data.generalInfo,
      isVerified: Boolean(data.generalInfo.trim()),
      lastUpdated: new Date().toISOString(),
    };
  }
  if (typeof data.contactDetails === 'string') {
    updated.contacts = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.contacts,
      receptionContact: data.contactDetails,
      isVerified: Boolean(data.contactDetails.trim()),
      lastUpdated: new Date().toISOString(),
    };
  }
  if (typeof data.facilitiesAndAmenities === 'string' || typeof data.diningAndFood === 'string') {
    updated.facilities = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.facilities,
      facilities: data.facilitiesAndAmenities || CURRENT_HOTEL_MANAGEMENT_DATA.facilities.facilities,
      diningServices: data.diningAndFood || CURRENT_HOTEL_MANAGEMENT_DATA.facilities.diningServices,
      isVerified: Boolean((data.facilitiesAndAmenities || data.diningAndFood || '').trim()),
      lastUpdated: new Date().toISOString(),
    };
  }
  if (typeof data.checkInCheckOutPolicies === 'string') {
    updated.policies = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.policies,
      cancellationPolicy: data.checkInCheckOutPolicies,
      isVerified: Boolean(data.checkInCheckOutPolicies.trim()),
      lastUpdated: new Date().toISOString(),
    };
  }
  if (typeof data.additionalVerifiedNotes === 'string') {
    updated.customNotes = {
      content: data.additionalVerifiedNotes,
      isVerified: Boolean(data.additionalVerifiedNotes.trim()),
      lastUpdated: new Date().toISOString(),
    };
  }

  setHotelManagementData(updated);
  return getVerifiedKnowledge();
}

/**
 * Compiles ONLY explicitly VERIFIED records into the AI Receptionist system prompt.
 * If any section is not marked as verified or is empty, it is completely omitted.
 */
export function compileKnowledgePrompt(knowledge?: VerifiedHotelKnowledge): string {
  const m = CURRENT_HOTEL_MANAGEMENT_DATA;
  const sections: string[] = [];

  // 1. Hotel Profile (Only if isVerified === true)
  if (m.profile.isVerified) {
    const profileLines: string[] = [];
    if (m.profile.hotelName) profileLines.push(`Hotel Name: ${m.profile.hotelName}`);
    if (m.profile.address) profileLines.push(`Address: ${m.profile.address}`);
    if (m.profile.phone) profileLines.push(`Phone: ${m.profile.phone}`);
    if (m.profile.email) profileLines.push(`Email: ${m.profile.email}`);
    if (m.profile.checkInTime) profileLines.push(`Standard Check-In Time: ${m.profile.checkInTime}`);
    if (m.profile.checkOutTime) profileLines.push(`Standard Check-Out Time: ${m.profile.checkOutTime}`);

    if (profileLines.length > 0) {
      sections.push(`[VERIFIED HOTEL PROFILE & LOCATION]\n${profileLines.join('\n')}`);
    }
  }

  // 2. Rooms & Tariffs (Only if roomsVerified === true)
  if (m.roomsVerified && Array.isArray(m.rooms) && m.rooms.length > 0) {
    const roomBlocks: string[] = [];
    m.rooms.forEach((r, i) => {
      if (r.isVerified !== false && (r.roomType || r.roomDescription || r.price)) {
        roomBlocks.push(
          `[Room Option ${i + 1}: ${r.roomType || 'Standard Category'}]\n` +
          `- Description: ${r.roomDescription || 'Not specified'}\n` +
          `- Price / Tariff: ${r.price || 'Not specified'}\n` +
          `- Max Guests / Capacity: ${r.maxGuests || 'Not specified'}\n` +
          `- Available Room Count: ${r.numberOfRooms || 'Not specified'}\n` +
          `- Room Facilities: ${r.availableFacilities || 'Not specified'}\n` +
          `- Availability Status: ${r.availabilityStatus || 'Available for inquiries'}`
        );
      }
    });

    if (roomBlocks.length > 0) {
      sections.push(`[VERIFIED ROOMS & TARIFFS]\n${roomBlocks.join('\n\n')}`);
    }
  }

  // 3. Facilities & Services (Only if facilities.isVerified === true)
  if (m.facilities.isVerified) {
    const fLines: string[] = [];
    if (m.facilities.facilities) fLines.push(`- General Facilities: ${m.facilities.facilities}`);
    if (m.facilities.diningServices) fLines.push(`- Dining & Meal Services: ${m.facilities.diningServices}`);
    if (m.facilities.transportServices) fLines.push(`- Transport & Travel Services: ${m.facilities.transportServices}`);
    if (m.facilities.specialServices) fLines.push(`- Special & Guest Services: ${m.facilities.specialServices}`);
    if (m.facilities.otherAmenities) fLines.push(`- Other Hotel Amenities: ${m.facilities.otherAmenities}`);

    if (fLines.length > 0) {
      sections.push(`[VERIFIED FACILITIES, DINING & SERVICES]\n${fLines.join('\n')}`);
    }
  }

  // 4. Policies (Only if policies.isVerified === true)
  if (m.policies.isVerified) {
    const pLines: string[] = [];
    if (m.policies.cancellationPolicy) pLines.push(`- Cancellation Policy: ${m.policies.cancellationPolicy}`);
    if (m.policies.paymentPolicy) pLines.push(`- Payment Policy & Accepted Methods: ${m.policies.paymentPolicy}`);
    if (m.policies.guestIdRequirements) pLines.push(`- Guest ID & Check-In Verification: ${m.policies.guestIdRequirements}`);
    if (m.policies.childrenPolicy) pLines.push(`- Children & Extra Bed Policy: ${m.policies.childrenPolicy}`);
    if (m.policies.petPolicy) pLines.push(`- Pet Policy: ${m.policies.petPolicy}`);
    if (m.policies.otherPolicies) pLines.push(`- Other Hotel Rules & Policies: ${m.policies.otherPolicies}`);

    if (pLines.length > 0) {
      sections.push(`[VERIFIED HOTEL POLICIES]\n${pLines.join('\n')}`);
    }
  }

  // 5. Contacts & Staff (Only if contacts.isVerified === true)
  if (m.contacts.isVerified) {
    const cLines: string[] = [];
    if (m.contacts.receptionContact) cLines.push(`- Reception Front Desk Contact: ${m.contacts.receptionContact}`);
    if (m.contacts.bookingContact) cLines.push(`- Reservations & Booking Contact: ${m.contacts.bookingContact}`);
    if (m.contacts.emergencyContact) cLines.push(`- 24/7 Emergency / Duty Manager Contact: ${m.contacts.emergencyContact}`);
    if (m.contacts.staffInstructions) cLines.push(`- Official Staff Instructions: ${m.contacts.staffInstructions}`);

    if (cLines.length > 0) {
      sections.push(`[VERIFIED CONTACTS & STAFF GUIDELINES]\n${cLines.join('\n')}`);
    }
  }

  // 6. Custom Verified Notes (Only if customNotes.isVerified === true)
  if (m.customNotes.isVerified && m.customNotes.content.trim()) {
    sections.push(`[ADDITIONAL VERIFIED MANAGEMENT NOTES]\n${m.customNotes.content.trim()}`);
  }

  if (sections.length === 0) {
    return 'NO VERIFIED HOTEL INFORMATION HAS BEEN PROVIDED YET. The hotel database is currently empty and unverified.';
  }

  return sections.join('\n\n');
}

