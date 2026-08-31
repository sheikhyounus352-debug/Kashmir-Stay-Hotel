import { 
  HotelManagementData, 
  EMPTY_HOTEL_MANAGEMENT_DATA,
  VerifiedHotelKnowledge, 
  EMPTY_HOTEL_KNOWLEDGE,
  RoomEntry,
  CategoryVerificationStatus,
  CategoryLifecycleStatus
} from './types';

// Helper to determine verification state
export function getCategoryVerificationStatus(
  hasContent: boolean, 
  isVerified: boolean, 
  isPublished: boolean = false
): CategoryLifecycleStatus {
  if (!hasContent) return 'not_configured';
  if (!isVerified) return 'draft';
  if (!isPublished) return 'verified';
  return 'published';
}

export function getCategoryStatusDetails(status: CategoryLifecycleStatus | CategoryVerificationStatus) {
  switch (status) {
    case 'published':
      return {
        label: 'Published & Active',
        subtext: 'Verified & Live in AI Receptionist',
        badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        dotColor: 'bg-emerald-500',
      };
    case 'verified':
      return {
        label: 'Verified (Ready to Publish)',
        subtext: 'Approved by Manager — Publish to activate for guests',
        badgeColor: 'text-blue-800 bg-blue-50 border-blue-300',
        dotColor: 'bg-blue-500',
      };
    case 'draft':
    case 'unverified':
      return {
        label: 'Draft / Unverified',
        subtext: 'Pending verification — Blocked from AI Receptionist',
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

// Publish all currently verified records so they become active for the AI Receptionist
export function publishAllVerified(): HotelManagementData {
  const m = CURRENT_HOTEL_MANAGEMENT_DATA;
  const updated: HotelManagementData = {
    ...m,
    profile: {
      ...m.profile,
      isPublished: Boolean(m.profile.isVerified),
    },
    rooms: m.rooms.map((r) => ({
      ...r,
      isPublished: Boolean(r.isVerified),
    })),
    roomsPublished: Boolean(m.roomsVerified),
    facilities: {
      ...m.facilities,
      isPublished: Boolean(m.facilities.isVerified),
    },
    policies: {
      ...m.policies,
      isPublished: Boolean(m.policies.isVerified),
    },
    contacts: {
      ...m.contacts,
      isPublished: Boolean(m.contacts.isVerified),
    },
    customNotes: {
      ...m.customNotes,
      isPublished: Boolean(m.customNotes.isVerified),
    },
    lastSaved: new Date().toISOString(),
  };
  CURRENT_HOTEL_MANAGEMENT_DATA = updated;
  return CURRENT_HOTEL_MANAGEMENT_DATA;
}

// Convert legacy/simple knowledge into management format if needed
// Only includes categories that are BOTH verified and published
export function getVerifiedKnowledge(): VerifiedHotelKnowledge {
  const m = CURRENT_HOTEL_MANAGEMENT_DATA;
  
  // Synthesize legacy format strictly from verified and published data
  const generalParts: string[] = [];
  if (m.profile.isVerified && m.profile.isPublished) {
    if (m.profile.hotelName?.trim()) generalParts.push(`Hotel Name: ${m.profile.hotelName.trim()}`);
    if (m.profile.address?.trim()) generalParts.push(`Address: ${m.profile.address.trim()}`);
    if (m.profile.checkInTime?.trim()) generalParts.push(`Check-In Time: ${m.profile.checkInTime.trim()}`);
    if (m.profile.checkOutTime?.trim()) generalParts.push(`Check-Out Time: ${m.profile.checkOutTime.trim()}`);
  }

  const contactParts: string[] = [];
  if (m.profile.isVerified && m.profile.isPublished) {
    if (m.profile.phone?.trim()) contactParts.push(`Phone: ${m.profile.phone.trim()}`);
    if (m.profile.email?.trim()) contactParts.push(`Email: ${m.profile.email.trim()}`);
  }
  if (m.contacts.isVerified && m.contacts.isPublished) {
    if (m.contacts.receptionContact?.trim()) contactParts.push(`Reception: ${m.contacts.receptionContact.trim()}`);
    if (m.contacts.bookingContact?.trim()) contactParts.push(`Reservations: ${m.contacts.bookingContact.trim()}`);
    if (m.contacts.emergencyContact?.trim()) contactParts.push(`Emergency: ${m.contacts.emergencyContact.trim()}`);
    if (m.contacts.staffInstructions?.trim()) contactParts.push(`Staff Guidelines: ${m.contacts.staffInstructions.trim()}`);
  }

  const roomParts: string[] = [];
  if (m.roomsVerified && m.roomsPublished && Array.isArray(m.rooms) && m.rooms.length > 0) {
    m.rooms.forEach((r, idx) => {
      if (r.isVerified && r.isPublished) {
        const details: string[] = [];
        if (r.roomDescription?.trim()) details.push(`- Description: ${r.roomDescription.trim()}`);
        if (r.price?.trim()) details.push(`- Price/Tariff: ${r.price.trim()}`);
        if (r.maxGuests?.trim()) details.push(`- Capacity: ${r.maxGuests.trim()}`);
        if (r.numberOfRooms?.trim()) details.push(`- Total Rooms: ${r.numberOfRooms.trim()}`);
        if (r.availableFacilities?.trim()) details.push(`- Facilities: ${r.availableFacilities.trim()}`);
        if (r.availabilityStatus?.trim()) details.push(`- Status: ${r.availabilityStatus.trim()}`);

        const header = r.roomType?.trim() ? `[Room ${idx + 1}: ${r.roomType.trim()}]` : `[Room Option ${idx + 1}]`;
        roomParts.push(`${header}${details.length > 0 ? '\n' + details.join('\n') : ''}`);
      }
    });
  }

  const facilitiesParts: string[] = [];
  if (m.facilities.isVerified && m.facilities.isPublished) {
    if (m.facilities.facilities?.trim()) facilitiesParts.push(`Hotel Facilities:\n${m.facilities.facilities.trim()}`);
    if (m.facilities.transportServices?.trim()) facilitiesParts.push(`Transport & Sightseeing:\n${m.facilities.transportServices.trim()}`);
    if (m.facilities.specialServices?.trim()) facilitiesParts.push(`Special Services:\n${m.facilities.specialServices.trim()}`);
    if (m.facilities.otherAmenities?.trim()) facilitiesParts.push(`Other Amenities:\n${m.facilities.otherAmenities.trim()}`);
  }

  const diningParts: string[] = [];
  if (m.facilities.isVerified && m.facilities.isPublished && m.facilities.diningServices?.trim()) {
    diningParts.push(`Dining & Meals:\n${m.facilities.diningServices.trim()}`);
  }

  const policiesParts: string[] = [];
  if (m.policies.isVerified && m.policies.isPublished) {
    if (m.policies.cancellationPolicy?.trim()) policiesParts.push(`Cancellation Policy:\n${m.policies.cancellationPolicy.trim()}`);
    if (m.policies.paymentPolicy?.trim()) policiesParts.push(`Payment Policy:\n${m.policies.paymentPolicy.trim()}`);
    if (m.policies.guestIdRequirements?.trim()) policiesParts.push(`ID Requirements:\n${m.policies.guestIdRequirements.trim()}`);
    if (m.policies.childrenPolicy?.trim()) policiesParts.push(`Children Policy:\n${m.policies.childrenPolicy.trim()}`);
    if (m.policies.petPolicy?.trim()) policiesParts.push(`Pet Policy:\n${m.policies.petPolicy.trim()}`);
    if (m.policies.otherPolicies?.trim()) policiesParts.push(`Other Policies:\n${m.policies.otherPolicies.trim()}`);
  }

  const notesParts: string[] = [];
  if (m.customNotes.isVerified && m.customNotes.isPublished && m.customNotes.content?.trim()) {
    notesParts.push(m.customNotes.content.trim());
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
  // Map legacy knowledge into management structure strictly without inventing or assuming any data
  const updated: Partial<HotelManagementData> = {};

  if (typeof data.generalInfo === 'string') {
    const hasGeneral = Boolean(data.generalInfo.trim());
    updated.profile = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.profile,
      address: data.generalInfo.trim(),
      isVerified: hasGeneral,
      isPublished: hasGeneral,
      lastUpdated: hasGeneral ? new Date().toISOString() : '',
    };
  }
  if (typeof data.contactDetails === 'string') {
    const hasContact = Boolean(data.contactDetails.trim());
    updated.contacts = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.contacts,
      receptionContact: data.contactDetails.trim(),
      isVerified: hasContact,
      isPublished: hasContact,
      lastUpdated: hasContact ? new Date().toISOString() : '',
    };
  }
  if (typeof data.facilitiesAndAmenities === 'string' || typeof data.diningAndFood === 'string') {
    const facStr = (data.facilitiesAndAmenities || '').trim();
    const dinStr = (data.diningAndFood || '').trim();
    const hasFac = Boolean(facStr || dinStr);
    updated.facilities = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.facilities,
      facilities: facStr || (hasFac ? CURRENT_HOTEL_MANAGEMENT_DATA.facilities.facilities : ''),
      diningServices: dinStr || (hasFac ? CURRENT_HOTEL_MANAGEMENT_DATA.facilities.diningServices : ''),
      isVerified: hasFac,
      isPublished: hasFac,
      lastUpdated: hasFac ? new Date().toISOString() : '',
    };
  }
  if (typeof data.checkInCheckOutPolicies === 'string') {
    const hasPol = Boolean(data.checkInCheckOutPolicies.trim());
    updated.policies = {
      ...CURRENT_HOTEL_MANAGEMENT_DATA.policies,
      cancellationPolicy: data.checkInCheckOutPolicies.trim(),
      isVerified: hasPol,
      isPublished: hasPol,
      lastUpdated: hasPol ? new Date().toISOString() : '',
    };
  }
  if (typeof data.additionalVerifiedNotes === 'string') {
    const hasNotes = Boolean(data.additionalVerifiedNotes.trim());
    updated.customNotes = {
      content: data.additionalVerifiedNotes.trim(),
      isVerified: hasNotes,
      isPublished: hasNotes,
      lastUpdated: hasNotes ? new Date().toISOString() : '',
    };
  }

  setHotelManagementData(updated);
  return getVerifiedKnowledge();
}

/**
 * Compiles ONLY explicitly VERIFIED & PUBLISHED records into the AI Receptionist system prompt.
 * If any section is draft, unverified, unpublished, or empty, it is completely omitted.
 */
export function compileKnowledgePrompt(knowledge?: VerifiedHotelKnowledge): string {
  const m = CURRENT_HOTEL_MANAGEMENT_DATA;
  const sections: string[] = [];

  // 1. Hotel Profile (Only if isVerified === true AND isPublished === true)
  if (m.profile.isVerified && m.profile.isPublished) {
    const profileLines: string[] = [];
    if (m.profile.hotelName?.trim()) profileLines.push(`Hotel Name: ${m.profile.hotelName.trim()}`);
    if (m.profile.address?.trim()) profileLines.push(`Address: ${m.profile.address.trim()}`);
    if (m.profile.phone?.trim()) profileLines.push(`Phone: ${m.profile.phone.trim()}`);
    if (m.profile.email?.trim()) profileLines.push(`Email: ${m.profile.email.trim()}`);
    if (m.profile.checkInTime?.trim()) profileLines.push(`Standard Check-In Time: ${m.profile.checkInTime.trim()}`);
    if (m.profile.checkOutTime?.trim()) profileLines.push(`Standard Check-Out Time: ${m.profile.checkOutTime.trim()}`);

    if (profileLines.length > 0) {
      sections.push(`[VERIFIED & PUBLISHED HOTEL PROFILE & LOCATION]\n${profileLines.join('\n')}`);
    }
  }

  // 2. Rooms & Tariffs (Only if roomsVerified === true AND roomsPublished === true)
  if (m.roomsVerified && m.roomsPublished && Array.isArray(m.rooms) && m.rooms.length > 0) {
    const roomBlocks: string[] = [];
    m.rooms.forEach((r, i) => {
      if (r.isVerified && r.isPublished) {
        const lines: string[] = [];
        if (r.roomType?.trim()) lines.push(`Room Category: ${r.roomType.trim()}`);
        if (r.roomDescription?.trim()) lines.push(`Description: ${r.roomDescription.trim()}`);
        if (r.price?.trim()) lines.push(`Price / Tariff: ${r.price.trim()}`);
        if (r.maxGuests?.trim()) lines.push(`Max Guests / Capacity: ${r.maxGuests.trim()}`);
        if (r.numberOfRooms?.trim()) lines.push(`Available Room Count: ${r.numberOfRooms.trim()}`);
        if (r.availableFacilities?.trim()) lines.push(`Room Facilities: ${r.availableFacilities.trim()}`);
        if (r.availabilityStatus?.trim()) lines.push(`Availability Status: ${r.availabilityStatus.trim()}`);

        if (lines.length > 0) {
          const header = r.roomType?.trim() ? `[Verified Room: ${r.roomType.trim()}]` : `[Verified Room Option ${i + 1}]`;
          roomBlocks.push(`${header}\n${lines.map((l) => `- ${l}`).join('\n')}`);
        }
      }
    });

    if (roomBlocks.length > 0) {
      sections.push(`[VERIFIED & PUBLISHED ROOMS & TARIFFS]\n${roomBlocks.join('\n\n')}`);
    }
  }

  // 3. Facilities & Services (Only if facilities.isVerified === true AND facilities.isPublished === true)
  if (m.facilities.isVerified && m.facilities.isPublished) {
    const fLines: string[] = [];
    if (m.facilities.facilities?.trim()) fLines.push(`- General Facilities: ${m.facilities.facilities.trim()}`);
    if (m.facilities.diningServices?.trim()) fLines.push(`- Dining & Meal Services: ${m.facilities.diningServices.trim()}`);
    if (m.facilities.transportServices?.trim()) fLines.push(`- Transport & Travel Services: ${m.facilities.transportServices.trim()}`);
    if (m.facilities.specialServices?.trim()) fLines.push(`- Special & Guest Services: ${m.facilities.specialServices.trim()}`);
    if (m.facilities.otherAmenities?.trim()) fLines.push(`- Other Hotel Amenities: ${m.facilities.otherAmenities.trim()}`);

    if (fLines.length > 0) {
      sections.push(`[VERIFIED & PUBLISHED FACILITIES, DINING & SERVICES]\n${fLines.join('\n')}`);
    }
  }

  // 4. Policies (Only if policies.isVerified === true AND policies.isPublished === true)
  if (m.policies.isVerified && m.policies.isPublished) {
    const pLines: string[] = [];
    if (m.policies.cancellationPolicy?.trim()) pLines.push(`- Cancellation Policy: ${m.policies.cancellationPolicy.trim()}`);
    if (m.policies.paymentPolicy?.trim()) pLines.push(`- Payment Policy & Accepted Methods: ${m.policies.paymentPolicy.trim()}`);
    if (m.policies.guestIdRequirements?.trim()) pLines.push(`- Guest ID & Check-In Verification: ${m.policies.guestIdRequirements.trim()}`);
    if (m.policies.childrenPolicy?.trim()) pLines.push(`- Children & Extra Bed Policy: ${m.policies.childrenPolicy.trim()}`);
    if (m.policies.petPolicy?.trim()) pLines.push(`- Pet Policy: ${m.policies.petPolicy.trim()}`);
    if (m.policies.otherPolicies?.trim()) pLines.push(`- Other Hotel Rules & Policies: ${m.policies.otherPolicies.trim()}`);

    if (pLines.length > 0) {
      sections.push(`[VERIFIED & PUBLISHED HOTEL POLICIES]\n${pLines.join('\n')}`);
    }
  }

  // 5. Contacts & Staff (Only if contacts.isVerified === true AND contacts.isPublished === true)
  if (m.contacts.isVerified && m.contacts.isPublished) {
    const cLines: string[] = [];
    if (m.contacts.receptionContact?.trim()) cLines.push(`- Reception Front Desk Contact: ${m.contacts.receptionContact.trim()}`);
    if (m.contacts.bookingContact?.trim()) cLines.push(`- Reservations & Booking Contact: ${m.contacts.bookingContact.trim()}`);
    if (m.contacts.emergencyContact?.trim()) cLines.push(`- 24/7 Emergency / Duty Manager Contact: ${m.contacts.emergencyContact.trim()}`);
    if (m.contacts.staffInstructions?.trim()) cLines.push(`- Official Staff Instructions: ${m.contacts.staffInstructions.trim()}`);

    if (cLines.length > 0) {
      sections.push(`[VERIFIED & PUBLISHED CONTACTS & STAFF GUIDELINES]\n${cLines.join('\n')}`);
    }
  }

  // 6. Custom Verified Notes (Only if customNotes.isVerified === true AND customNotes.isPublished === true)
  if (m.customNotes.isVerified && m.customNotes.isPublished && m.customNotes.content?.trim()) {
    sections.push(`[ADDITIONAL VERIFIED & PUBLISHED MANAGEMENT NOTES]\n${m.customNotes.content.trim()}`);
  }

  if (sections.length === 0) {
    return 'NO VERIFIED HOTEL INFORMATION HAS BEEN PROVIDED YET. The hotel database is currently completely empty and unverified.';
  }

  return sections.join('\n\n');
}


