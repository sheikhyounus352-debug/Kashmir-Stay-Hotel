// Type definitions for Kashmir Stay Hotel AI Receptionist & Hotel Management Dashboard

export type CategoryVerificationStatus = 'not_configured' | 'unverified' | 'verified';

export interface SecurityAssertionResult {
  id: string;
  name: string;
  description: string;
  categoryTested: string;
  testQuery: string;
  expectedBehavior: string;
  actualResponse: string;
  passed: boolean;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  details?: string;
  timestamp: string;
}

export interface SecurityTestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: SecurityAssertionResult[];
}

export interface BookingInquirySummary {
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: string;
  preferredRoomType: string;
  isConfirmedByGuest?: boolean;
  status?: 'ready_for_confirmation' | 'guest_confirmed' | 'in_progress';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'receptionist';
  text: string;
  timestamp: string;
  isError?: boolean;
  groundingStatus?: 'verified_records' | 'safe_fallback' | 'greeting' | 'booking_inquiry' | 'inquiry_summary' | 'guest_confirmed';
  verifiedCategoriesCount?: number;
  inquirySummary?: BookingInquirySummary;
}

export interface RoomEntry {
  id: string;
  roomType: string;
  roomDescription: string;
  numberOfRooms: string;
  maxGuests: string;
  price: string;
  availableFacilities: string;
  availabilityStatus: string;
  isVerified: boolean;
  lastUpdated?: string;
}

export interface HotelProfileData {
  hotelName: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  isVerified: boolean;
  lastUpdated?: string;
}

export interface FacilitiesData {
  facilities: string;
  diningServices: string;
  transportServices: string;
  specialServices: string;
  otherAmenities: string;
  isVerified: boolean;
  lastUpdated?: string;
}

export interface PoliciesData {
  cancellationPolicy: string;
  paymentPolicy: string;
  guestIdRequirements: string;
  childrenPolicy: string;
  petPolicy: string;
  otherPolicies: string;
  isVerified: boolean;
  lastUpdated?: string;
}

export interface StaffContactData {
  receptionContact: string;
  bookingContact: string;
  emergencyContact: string;
  staffInstructions: string;
  isVerified: boolean;
  lastUpdated?: string;
}

export interface HotelManagementData {
  profile: HotelProfileData;
  rooms: RoomEntry[];
  roomsVerified: boolean;
  roomsLastUpdated?: string;
  facilities: FacilitiesData;
  policies: PoliciesData;
  contacts: StaffContactData;
  customNotes: {
    content: string;
    isVerified: boolean;
    lastUpdated?: string;
  };
  lastSaved?: string;
}

export const EMPTY_HOTEL_MANAGEMENT_DATA: HotelManagementData = {
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
  rooms: [],
  roomsVerified: false,
  roomsLastUpdated: '',
  facilities: {
    facilities: '',
    diningServices: '',
    transportServices: '',
    specialServices: '',
    otherAmenities: '',
    isVerified: false,
    lastUpdated: '',
  },
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
  contacts: {
    receptionContact: '',
    bookingContact: '',
    emergencyContact: '',
    staffInstructions: '',
    isVerified: false,
    lastUpdated: '',
  },
  customNotes: {
    content: '',
    isVerified: false,
    lastUpdated: '',
  },
  lastSaved: '',
};

// Legacy/Unified representation for compatibility
export interface VerifiedHotelKnowledge {
  generalInfo: string;
  contactDetails: string;
  roomsAndPricing: string;
  facilitiesAndAmenities: string;
  diningAndFood: string;
  checkInCheckOutPolicies: string;
  additionalVerifiedNotes: string;
  lastUpdated?: string;
}

export const EMPTY_HOTEL_KNOWLEDGE: VerifiedHotelKnowledge = {
  generalInfo: '',
  contactDetails: '',
  roomsAndPricing: '',
  facilitiesAndAmenities: '',
  diningAndFood: '',
  checkInCheckOutPolicies: '',
  additionalVerifiedNotes: '',
  lastUpdated: '',
};

