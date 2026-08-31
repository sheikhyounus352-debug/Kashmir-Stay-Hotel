import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Percent, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  TrendingUp, 
  Phone, 
  Mail, 
  Building,
  KeyRound
} from 'lucide-react';
import { TravelAgent, AgentBookingRecord, AuthSession } from '../types';

interface AdminTravelAgentsManagerProps {
  authSession: AuthSession;
}

export const AdminTravelAgentsManager: React.FC<AdminTravelAgentsManagerProps> = ({ authSession }) => {
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [allBookings, setAllBookings] = useState<AgentBookingRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'bookings'>('agents');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Agent Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingAgent, setEditingAgent] = useState<TravelAgent | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formAgencyName, setFormAgencyName] = useState<string>('');
  const [formContactPerson, setFormContactPerson] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCommission, setFormCommission] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/agents', {
        headers: {
          'Authorization': `Bearer ${authSession.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load agents.');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Error loading agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/admin/all-bookings', {
        headers: {
          'Authorization': `Bearer ${authSession.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load all agent bookings.');
      const data = await response.json();
      setAllBookings(data.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchAllBookings();
  }, [authSession.token]);

  const handleOpenAddModal = () => {
    setEditingAgent(null);
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormAgencyName('');
    setFormContactPerson('');
    setFormPhone('');
    setFormCommission(10);
    setFormStatus('active');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (agent: TravelAgent) => {
    setEditingAgent(agent);
    setFormUsername(agent.username);
    setFormEmail(agent.email);
    setFormPassword('');
    setFormAgencyName(agent.agencyName);
    setFormContactPerson(agent.contactPerson || '');
    setFormPhone(agent.phone || '');
    setFormCommission(agent.commissionPercentage);
    setFormStatus(agent.status);
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitAgentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      if (editingAgent) {
        // Edit agent
        const response = await fetch(`/api/admin/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.token}`,
          },
          body: JSON.stringify({
            agencyName: formAgencyName,
            contactPerson: formContactPerson,
            email: formEmail,
            phone: formPhone,
            commissionPercentage: formCommission,
            status: formStatus,
            ...(formPassword ? { password: formPassword } : {}),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update agent.');
        }
      } else {
        // Create agent
        if (!formUsername.trim() || !formPassword.trim()) {
          throw new Error('Username and Password are required for new agent accounts.');
        }

        const response = await fetch('/api/admin/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.token}`,
          },
          body: JSON.stringify({
            username: formUsername.trim(),
            email: formEmail.trim(),
            password: formPassword.trim(),
            agencyName: formAgencyName.trim(),
            contactPerson: formContactPerson.trim(),
            phone: formPhone.trim(),
            commissionPercentage: formCommission,
            status: formStatus,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to create agent.');
        }
      }

      setIsAddModalOpen(false);
      fetchAgents();
    } catch (err: any) {
      setModalError(err.message || 'Error saving agent record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to remove this Travel Agent partner account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete agent.');
      fetchAgents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete travel agent.');
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.agencyName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.contactPerson && a.contactPerson.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Header */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              Travel Agent Partner Management (B2B Portal)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Register authorized travel agencies, configure individualized commission rates, and track B2B reservations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('agents')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'agents'
                ? 'bg-emerald-900 text-amber-300 shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Registered Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'bookings'
                ? 'bg-emerald-900 text-amber-300 shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Agent Bookings ({allBookings.length})
          </button>
          {activeSubTab === 'agents' && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Travel Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* Agents Tab */}
      {activeSubTab === 'agents' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Agency, Username, Contact Person or Email..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
              />
            </div>
            <button
              onClick={fetchAgents}
              title="Refresh Agents List"
              className="p-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Agents List Table */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-700">Loading travel agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
              <Briefcase className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No Travel Agents Registered</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Click "Add Travel Agent" above to onboard your first partner agency.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Agency & Username</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Commission %</th>
                      <th className="py-3 px-4">Total Bookings</th>
                      <th className="py-3 px-4">Commission Earned</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block text-sm">{agent.agencyName}</span>
                          <span className="text-stone-500 text-[11px] block font-mono">@{agent.username}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          <span className="font-semibold text-stone-800 block">{agent.contactPerson || '—'}</span>
                          <span className="text-stone-500 block">{agent.email}</span>
                          {agent.phone && <span className="text-stone-400 block">{agent.phone}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            {agent.commissionPercentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          {agent.totalBookings || 0}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800">
                          ₹{agent.totalCommissionEarned ? agent.totalCommissionEarned.toLocaleString('en-IN') : '0'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            agent.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {agent.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            <span className="capitalize">{agent.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(agent)}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Agent"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="p-1.5 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Agent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Agency</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Hotel & Room</th>
                    <th className="py-3 px-4">Stay Dates</th>
                    <th className="py-3 px-4">Gross Turnover</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {allBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400 italic">
                        No agent bookings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allBookings.map((b) => (
                      <tr key={b.bookingReference} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                          {b.bookingReference}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {b.agencyName}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-800">
                          {b.guestDetails.fullName}
                          <span className="block text-[10px] text-stone-400">{b.guestDetails.mobile}</span>
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {b.hotelName} — {b.roomType}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {b.checkInDate} to {b.checkOutDate}
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-900">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          ₹{b.commissionAmount.toLocaleString('en-IN')} ({b.commissionRate}%)
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.bookingStatus === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.bookingStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {b.bookingStatus}
                          </span>
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

      {/* Add / Edit Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0c2f24] via-[#103d2f] to-[#0c2f24] text-white p-6 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold font-serif text-white">
                {editingAgent ? 'Edit Travel Agent Partner' : 'Register New Travel Agent Partner'}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                B2B Partner Credentials and Commission Percentage
              </p>
            </div>

            <form onSubmit={handleSubmitAgentForm} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Agency Name *</label>
                  <input
                    type="text"
                    required
                    value={formAgencyName}
                    onChange={(e) => setFormAgencyName(e.target.value)}
                    placeholder="e.g. Kashmir Alpine Tours"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Farooq Ahmad"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. agent@agency.com"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 94190 12345"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Username {editingAgent ? '(Immutable)' : '*'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingAgent)}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. agent_kashmir"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {editingAgent ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingAgent}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingAgent ? '••••••••' : 'Enter password'}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Commission Rate (%) *
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={formCommission}
                      onChange={(e) => setFormCommission(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-600 outline-hidden"
                  >
                    <option value="active">Active (Permit Booking Access)</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAgent ? 'Save Changes' : 'Create Agent Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
