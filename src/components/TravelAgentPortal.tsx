import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Printer, 
  Download, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Percent, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  LogOut, 
  User, 
  Filter, 
  RefreshCw,
  Ban,
  ArrowRight,
  BedDouble,
  CreditCard
} from 'lucide-react';
import { 
  AgentAuthSession, 
  TravelAgent, 
  AgentBookingRecord, 
  AgentCommissionSummary,
  HotelSearchCriteria 
} from '../types';

interface TravelAgentPortalProps {
  agentSession: AgentAuthSession;
  onLogout: () => void;
  onSwitchToGuestView?: () => void;
  onReturnToReceptionist?: () => void;
}

export const TravelAgentPortal: React.FC<TravelAgentPortalProps> = ({
  agentSession,
  onLogout,
  onSwitchToGuestView,
  onReturnToReceptionist,
}) => {
  const handleReturn = onReturnToReceptionist || onSwitchToGuestView || (() => {});
  const [activeTab, setActiveTab] = useState<'search' | 'bookings' | 'commission'>('search');
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoadingHotels, setIsLoadingHotels] = useState<boolean>(true);
  
  // Search Criteria
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [searchHotelName, setSearchHotelName] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [checkOutDate, setCheckOutDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );
  const [numberOfRooms, setNumberOfRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  // Bookings State
  const [bookings, setBookings] = useState<AgentBookingRecord[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState<string>('');

  // Commission Summary State
  const [commissionSummary, setCommissionSummary] = useState<AgentCommissionSummary | null>(null);
  const [isLoadingCommission, setIsLoadingCommission] = useState<boolean>(false);

  // Booking Modal State
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Guest details form state
  const [guestFullName, setGuestFullName] = useState<string>('');
  const [guestMobile, setGuestMobile] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Confirmed booking voucher modal
  const [confirmedBooking, setConfirmedBooking] = useState<AgentBookingRecord | null>(null);
  const [viewVoucherBooking, setViewVoucherBooking] = useState<AgentBookingRecord | null>(null);

  // Cancellation modal
  const [cancellingBooking, setCancellingBooking] = useState<AgentBookingRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Load verified hotels
  const fetchHotels = async () => {
    setIsLoadingHotels(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchLocation) queryParams.append('location', searchLocation);
      if (searchHotelName) queryParams.append('hotelName', searchHotelName);

      const response = await fetch(`/api/agent/hotels?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${agentSession.token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load verified hotel inventory.');
      const data = await response.json();
      setHotels(data.hotels || []);
    } catch (err) {
      console.error('Error fetching verified hotels:', err);
    } finally {
      setIsLoadingHotels(false);
    }
  };

  // Load agent bookings
  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const response = await fetch('/api/agent/bookings', {
        headers: {
          'Authorization': `Bearer ${agentSession.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load bookings.');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Load commission summary
  const fetchCommissionSummary = async () => {
    setIsLoadingCommission(true);
    try {
      const response = await fetch('/api/agent/commission-summary', {
        headers: {
          'Authorization': `Bearer ${agentSession.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load commission summary.');
      const data = await response.json();
      setCommissionSummary(data);
    } catch (err) {
      console.error('Error fetching commission:', err);
    } finally {
      setIsLoadingCommission(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchBookings();
    fetchCommissionSummary();
  }, [agentSession.token]);

  // Calculate pricing
  const calculateBookingFinancials = (room: any) => {
    if (!room) return { nights: 1, roomRate: 0, totalAmount: 0, commissionAmount: 0, payableAmount: 0 };
    
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const nights = isNaN(diff) ? 1 : diff;

    const rate = room.numericPrice || parseFloat(String(room.price).replace(/[^0-9.]/g, '')) || 0;
    const totalAmount = Math.round(rate * numberOfRooms * nights * 100) / 100;
    const commissionPercentage = agentSession.agent.commissionPercentage || 10;
    const commissionAmount = Math.round((totalAmount * commissionPercentage / 100) * 100) / 100;
    const payableAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

    return { nights, roomRate: rate, totalAmount, commissionAmount, payableAmount };
  };

  const handleOpenBookingModal = (hotel: any, room: any) => {
    setSelectedHotel(hotel);
    setSelectedRoom(room);
    setBookingError(null);
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel || !selectedRoom) return;

    if (!guestFullName.trim()) {
      setBookingError('Please provide the guest full name.');
      return;
    }
    if (!guestMobile.trim()) {
      setBookingError('Please provide the guest mobile number.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    const financials = calculateBookingFinancials(selectedRoom);

    try {
      const response = await fetch('/api/agent/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agentSession.token}`,
        },
        body: JSON.stringify({
          hotelId: selectedHotel.id,
          hotelName: selectedHotel.hotelName,
          roomId: selectedRoom.id,
          roomType: selectedRoom.roomType,
          roomRate: financials.roomRate,
          checkInDate,
          checkOutDate,
          numberOfRooms,
          numberOfGuests: adults + children,
          guestDetails: {
            fullName: guestFullName.trim(),
            mobile: guestMobile.trim(),
            email: guestEmail.trim(),
            adults,
            children,
            specialRequests: specialRequests.trim(),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm booking.');
      }

      // Reset & show confirmation voucher
      setIsBookingModalOpen(false);
      setConfirmedBooking(data.booking);
      setGuestFullName('');
      setGuestMobile('');
      setGuestEmail('');
      setSpecialRequests('');

      // Refresh bookings & commission
      fetchBookings();
      fetchCommissionSummary();
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred while creating the booking.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/agent/bookings/${cancellingBooking.bookingReference}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agentSession.token}`,
        },
        body: JSON.stringify({
          reason: cancellationReason.trim() || 'Cancelled per guest request',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel booking.');
      }

      setCancellingBooking(null);
      setCancellationReason('');
      fetchBookings();
      fetchCommissionSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus !== 'all' && b.bookingStatus.toLowerCase() !== bookingFilterStatus.toLowerCase()) {
      return false;
    }
    if (bookingSearchQuery.trim()) {
      const q = bookingSearchQuery.toLowerCase();
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      const matchName = b.guestDetails.fullName.toLowerCase().includes(q);
      const matchPhone = b.guestDetails.mobile.includes(q);
      const matchHotel = b.hotelName.toLowerCase().includes(q);
      return matchRef || matchName || matchPhone || matchHotel;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      {/* Top Banner / Agent Agency Identity */}
      <div className="bg-gradient-to-r from-[#0c2f24] via-[#124233] to-[#0c2f24] text-white border-b border-emerald-900/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Briefcase className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-wide text-white">
                    {agentSession.agent.agencyName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Verified Partner
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-emerald-200 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Agent: {agentSession.agent.contactPerson || agentSession.agent.username}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Commission Rate: <strong className="text-amber-300 font-bold">{agentSession.agent.commissionPercentage}%</strong></span>
                  </span>
                  {agentSession.agent.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{agentSession.agent.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleReturn}
                className="px-3.5 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-xs font-semibold text-emerald-100 border border-emerald-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Guest Front Desk</span>
              </button>
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-xs font-semibold text-rose-200 border border-rose-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-emerald-900/50">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search & Book Hotel</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Bookings & Vouchers</span>
              {bookings.length > 0 && (
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'bookings' ? 'bg-stone-950 text-amber-400' : 'bg-emerald-900 text-emerald-200'
                }`}>
                  {bookings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'commission'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Commission Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================================================================== */}
        {/* TAB 1: SEARCH & BOOK HOTEL */}
        {/* ==================================================================== */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Filter Bar */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-700" />
                <span>Verified Hotel Search & Stay Dates</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Check-in Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Check-out Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Rooms & Guests</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={numberOfRooms}
                        onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                      >
                        {[1, 2, 3, 4, 6, 8, 12, 16].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchHotels}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>Check Availability</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Zero-Assumption Inventory List */}
            {isLoadingHotels ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-stone-700">Loading verified hotel records...</p>
                <p className="text-xs text-stone-500 mt-1">Filtering verified and published inventory only.</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
                <Building2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800">No Verified Hotel Available</h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                  Under strict zero-assumption policy, only hotels that have been officially verified and published by the administrator are shown. Please contact hotel administration.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {hotels.map((hotel) => (
                  <div 
                    key={hotel.id} 
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 transition-all hover:shadow-md"
                  >
                    {/* Hotel Header Card */}
                    <div className="bg-gradient-to-r from-emerald-950 via-[#0e3529] to-emerald-950 text-white p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Verified Official Hotel
                            </span>
                            <span className="text-xs text-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Zero-Assumption Verified</span>
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                            {hotel.hotelName}
                          </h3>
                          {hotel.address && (
                            <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{hotel.address}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800">
                          <div>
                            <span className="text-stone-400 block text-[10px]">Check-in</span>
                            <span className="font-bold text-amber-300">{hotel.checkInTime}</span>
                          </div>
                          <div className="w-px h-6 bg-emerald-800"></div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Check-out</span>
                            <span className="font-bold text-amber-300">{hotel.checkOutTime}</span>
                          </div>
                          {hotel.phone && (
                            <>
                              <div className="w-px h-6 bg-emerald-800"></div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">Desk Phone</span>
                                <span className="font-bold text-stone-200">{hotel.phone}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Room Types Grid */}
                    <div className="p-6">
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-emerald-700" />
                        <span>Available Verified Room Types ({hotel.rooms?.length || 0})</span>
                      </h4>

                      {(!hotel.rooms || hotel.rooms.length === 0) ? (
                        <p className="text-xs text-stone-500 italic p-4 bg-stone-50 rounded-xl">
                          No room categories are currently verified for direct agent booking.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {hotel.rooms.map((room: any) => {
                            const financials = calculateBookingFinancials(room);
                            return (
                              <div 
                                key={room.id}
                                className="border border-stone-200 rounded-2xl p-5 bg-stone-50 hover:bg-white hover:border-emerald-600 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="font-bold text-stone-900 text-base">
                                        {room.roomType}
                                      </h5>
                                      <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                                        Max: {room.maxGuests} Guests • {room.numberOfRooms} Rooms
                                      </p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                                      {room.availabilityStatus || 'Available'}
                                    </span>
                                  </div>

                                  {room.roomDescription && (
                                    <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                                      {room.roomDescription}
                                    </p>
                                  )}

                                  {room.availableFacilities && (
                                    <div className="mt-3 pt-2 border-t border-stone-200/80">
                                      <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                                        Amenities
                                      </span>
                                      <p className="text-xs text-stone-700 mt-0.5 line-clamp-1">
                                        {room.availableFacilities}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Financial Summary & Booking CTA */}
                                <div className="mt-5 pt-3 border-t border-stone-200">
                                  <div className="flex items-baseline justify-between">
                                    <div>
                                      <span className="text-xs text-stone-500">Official Rate:</span>
                                      <p className="text-lg font-bold text-stone-950 font-serif">
                                        ₹{room.numericPrice ? room.numericPrice.toLocaleString('en-IN') : room.price}
                                        <span className="text-xs font-normal text-stone-500"> / night</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        Earn ₹{financials.commissionAmount.toLocaleString('en-IN')} ({agentSession.agent.commissionPercentage}%)
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleOpenBookingModal(hotel, room)}
                                    className="w-full mt-3 py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Book for Guest</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hotel Policies Accordion / Info Footer */}
                      {(hotel.cancellationPolicy || hotel.paymentPolicy) && (
                        <div className="mt-6 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950">
                          <h5 className="font-bold text-emerald-900 flex items-center gap-1 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Verified Hotel Booking Policies</span>
                          </h5>
                          {hotel.cancellationPolicy && (
                            <p className="mt-1">
                              <strong>Cancellation:</strong> {hotel.cancellationPolicy}
                            </p>
                          )}
                          {hotel.paymentPolicy && (
                            <p className="mt-0.5">
                              <strong>Payment:</strong> {hotel.paymentPolicy}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MY BOOKINGS & VOUCHERS */}
        {/* ==================================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    placeholder="Search by Booking Ref, Guest Name, or Hotel..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <button
                  onClick={fetchBookings}
                  title="Refresh Bookings"
                  className="p-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      bookingFilterStatus === st
                        ? 'bg-emerald-900 text-amber-300 shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table / List */}
            {isLoadingBookings ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-stone-700">Loading your reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
                <FileText className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800">No Bookings Found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                  {bookings.length === 0
                    ? "You have not made any guest reservations yet. Use the 'Search & Book Hotel' tab to create your first booking!"
                    : "No bookings match your current search and filter criteria."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Guest Details</th>
                        <th className="py-3 px-4">Hotel & Room</th>
                        <th className="py-3 px-4">Stay Dates</th>
                        <th className="py-3 px-4">Financials</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredBookings.map((b) => {
                        const isConfirmed = b.bookingStatus === 'Confirmed';
                        const isCancelled = b.bookingStatus === 'Cancelled';
                        return (
                          <tr key={b.bookingReference} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                              {b.bookingReference}
                              <span className="block text-[10px] font-sans font-normal text-stone-400">
                                {new Date(b.createdDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-stone-900 block">{b.guestDetails.fullName}</span>
                              <span className="text-stone-500 text-[11px] block">{b.guestDetails.mobile}</span>
                              <span className="text-[10px] text-stone-400">{b.numberOfGuests} Guests • {b.numberOfRooms} Room(s)</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-stone-900 block">{b.hotelName}</span>
                              <span className="text-emerald-800 text-[11px] font-medium">{b.roomType}</span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px]">
                              <span className="font-medium text-stone-800 block">In: {b.checkInDate}</span>
                              <span className="text-stone-500 block">Out: {b.checkOutDate}</span>
                              <span className="text-[10px] font-bold text-emerald-700">{b.numberOfNights} Night(s)</span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px]">
                              <span className="font-bold text-stone-900 block">₹{b.totalAmount.toLocaleString('en-IN')} Gross</span>
                              <span className="text-emerald-700 font-semibold block">Commission: ₹{b.commissionAmount.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-stone-500 block">Net: ₹{b.finalPayableAmount.toLocaleString('en-IN')}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isConfirmed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isCancelled
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-stone-100 text-stone-700'
                              }`}>
                                {b.bookingStatus}
                              </span>
                              {isCancelled && b.cancellationReason && (
                                <span className="block text-[9px] text-rose-600 mt-0.5 truncate max-w-[120px]" title={b.cancellationReason}>
                                  {b.cancellationReason}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => setViewVoucherBooking(b)}
                                className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                Voucher
                              </button>
                              {isConfirmed && (
                                <button
                                  onClick={() => setCancellingBooking(b)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: COMMISSION SUMMARY */}
        {/* ==================================================================== */}
        {activeTab === 'commission' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Commission</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold font-serif text-emerald-950">
                  ₹{commissionSummary?.totalCommissionEarned ? commissionSummary.totalCommissionEarned.toLocaleString('en-IN') : '0'}
                </p>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  At {commissionSummary?.commissionPercentage || agentSession.agent.commissionPercentage}% agreed rate
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Booking Volume</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold font-serif text-stone-900">
                  ₹{commissionSummary?.totalBookingVolume ? commissionSummary.totalBookingVolume.toLocaleString('en-IN') : '0'}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">Gross guest reservation turnover</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Confirmed Bookings</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold font-serif text-stone-900">
                  {commissionSummary?.confirmedBookings || 0}
                </p>
                <span className="text-[11px] text-stone-500 mt-1 block">Active verified reservations</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Partner Status</span>
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-2xl font-bold font-serif text-emerald-900">Active</p>
                <span className="text-[11px] text-stone-500 mt-1 block">{agentSession.agent.agencyName}</span>
              </div>
            </div>

            {/* Detailed Commission Statement */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Agent Commission Statement</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official booking commissions tracked per reservation under verified room rates.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Booking Ref</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Hotel & Room</th>
                      <th className="py-2.5 px-3">Gross Turnover</th>
                      <th className="py-2.5 px-3">Commission Rate</th>
                      <th className="py-2.5 px-3 text-right">Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed').length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                          No confirmed bookings yet. Commissions will automatically appear here upon booking confirmation.
                        </td>
                      </tr>
                    ) : (
                      bookings
                        .filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Completed')
                        .map((b) => (
                          <tr key={b.bookingReference}>
                            <td className="py-3 px-3 text-stone-500">
                              {new Date(b.createdDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-950">
                              {b.bookingReference}
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-900">
                              {b.guestDetails.fullName}
                            </td>
                            <td className="py-3 px-3 text-stone-600">
                              {b.hotelName} - {b.roomType}
                            </td>
                            <td className="py-3 px-3 font-semibold text-stone-900">
                              ₹{b.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-emerald-800 font-bold">
                              {b.commissionRate}%
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-700 text-right">
                              +₹{b.commissionAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* INSTANT BOOKING MODAL */}
      {/* ==================================================================== */}
      {isBookingModalOpen && selectedHotel && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#0e3529] to-emerald-950 text-white p-6 relative">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Instant Travel Agent Booking
              </span>
              <h3 className="text-xl font-bold font-serif text-white mt-1">
                {selectedHotel.hotelName} — {selectedRoom.roomType}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Stay: {checkInDate} to {checkOutDate} • {numberOfRooms} Room(s)
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateBooking} className="p-6 space-y-5">
              {bookingError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Booking Submission Error</p>
                    <p className="text-rose-700 mt-0.5">{bookingError}</p>
                  </div>
                </div>
              )}

              {/* Financial Calculation Breakdown */}
              {(() => {
                const fin = calculateBookingFinancials(selectedRoom);
                return (
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-700">
                      <span>Room Rate ({selectedRoom.roomType}):</span>
                      <span className="font-semibold">₹{fin.roomRate.toLocaleString('en-IN')} / night</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-700">
                      <span>Duration & Quantity:</span>
                      <span className="font-semibold">{fin.nights} Night(s) × {numberOfRooms} Room(s)</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-900 pt-1 border-t border-emerald-200/80 font-bold">
                      <span>Total Gross Tariff:</span>
                      <span>₹{fin.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-800 font-bold bg-emerald-100/90 p-2 rounded-xl">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        <span>Agent Commission ({agentSession.agent.commissionPercentage}%):</span>
                      </span>
                      <span>+₹{fin.commissionAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-900 font-bold pt-1">
                      <span>Net Payable to Hotel:</span>
                      <span className="text-sm font-serif">₹{fin.payableAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Guest Details Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Guest & Voucher Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Primary Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestFullName}
                      onChange={(e) => setGuestFullName(e.target.value)}
                      placeholder="e.g. Tariq Ahmad Khan"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Primary Guest Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Guest Email Address (Optional for voucher delivery)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. tariq@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Special Requests / Food Preferences / Arrival Note
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Ground floor preferred, vegetarian breakfast, late arrival at 6 PM"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Confirm & Issue Booking Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VOUCHER / BOOKING CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {(confirmedBooking || viewVoucherBooking) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const b = (confirmedBooking || viewVoucherBooking)!;
              return (
                <div>
                  {/* Voucher Header */}
                  <div className="bg-gradient-to-r from-[#0c2f24] via-[#103d2f] to-[#0c2f24] text-white p-6 relative">
                    <button
                      onClick={() => {
                        setConfirmedBooking(null);
                        setViewVoucherBooking(null);
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Official Hotel Booking Voucher
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-serif text-white mt-1">
                      {b.hotelName}
                    </h3>
                    <p className="font-mono text-sm font-bold text-amber-300 mt-1">
                      Booking Reference: {b.bookingReference}
                    </p>
                  </div>

                  {/* Voucher Details Body */}
                  <div className="p-6 space-y-4 text-xs">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase">Booking Status</span>
                        <span className="font-bold text-emerald-800 text-sm">{b.bookingStatus}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 block text-[10px] uppercase">Issued By</span>
                        <span className="font-bold text-stone-900">{b.agencyName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-semibold">Primary Guest</span>
                        <span className="font-bold text-stone-900 text-sm">{b.guestDetails.fullName}</span>
                        <span className="text-stone-600 block">{b.guestDetails.mobile}</span>
                        {b.guestDetails.email && <span className="text-stone-500 block">{b.guestDetails.email}</span>}
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-semibold">Accommodation</span>
                        <span className="font-bold text-emerald-950 text-sm">{b.roomType}</span>
                        <span className="text-stone-600 block">{b.numberOfRooms} Room(s) • {b.numberOfGuests} Guest(s)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-semibold">Check-in Date</span>
                        <span className="font-bold text-stone-900 text-sm">{b.checkInDate}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-semibold">Check-out Date</span>
                        <span className="font-bold text-stone-900 text-sm">{b.checkOutDate}</span>
                        <span className="text-stone-500 text-[10px]">({b.numberOfNights} Nights)</span>
                      </div>
                    </div>

                    {b.guestDetails.specialRequests && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-stone-500 block text-[10px] uppercase font-semibold">Special Requests</span>
                        <p className="text-stone-800 mt-0.5">{b.guestDetails.specialRequests}</p>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="p-3.5 bg-emerald-950 text-emerald-100 rounded-xl space-y-1">
                      <div className="flex justify-between">
                        <span className="text-stone-300">Gross Tariff:</span>
                        <span className="font-bold text-white">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-amber-300 font-bold">
                        <span>Agent Commission ({b.commissionRate}%):</span>
                        <span>₹{b.commissionAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-emerald-800 text-white font-bold text-sm">
                        <span>Net Payable to Hotel:</span>
                        <span>₹{b.finalPayableAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Voucher</span>
                      </button>
                      <button
                        onClick={() => {
                          setConfirmedBooking(null);
                          setViewVoucherBooking(null);
                        }}
                        className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CANCELLATION MODAL */}
      {/* ==================================================================== */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900">Cancel Booking</h3>
                <p className="text-xs text-stone-500 font-mono">{cancellingBooking.bookingReference}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Are you sure you want to cancel the reservation for <strong>{cancellingBooking.guestDetails.fullName}</strong> at {cancellingBooking.hotelName}?
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cancellation Reason
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Guest travel plan changed"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-rose-600 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
