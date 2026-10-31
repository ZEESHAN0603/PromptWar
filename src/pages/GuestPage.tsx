import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  SlidersHorizontal,
  Utensils,
  HeartHandshake,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GuestItem, RSVPStatus } from '../types';

interface GuestPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const GuestPage: React.FC<GuestPageProps> = ({ onOpenAdaptiveModal }) => {
  const {
    getCurrentEvent,
    getCurrentGuests,
    addGuest,
    updateGuest,
    deleteGuest,
  } = useAppStore();

  const event = getCurrentEvent();
  const guests = getCurrentGuests();

  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Add Guest Modal
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState<GuestItem['category']>('family');
  const [accompanying, setAccompanying] = useState<number>(0);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('pending');
  const [dietary, setDietary] = useState('Vegetarian');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [notes, setNotes] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  // Editing state
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);

  if (!event) return null;

  // Stats
  const confirmed = guests.filter((g) => g.rsvpStatus === 'confirmed');
  const pending = guests.filter((g) => g.rsvpStatus === 'pending');
  const declined = guests.filter((g) => g.rsvpStatus === 'declined');
  const totalInvitedCount = guests.reduce((sum, g) => sum + 1 + g.accompanyingGuests, 0);
  const expectedAttendance = confirmed.reduce((sum, g) => sum + 1 + g.accompanyingGuests, 0);

  // Filtered list
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.dietaryPreference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRsvp = rsvpFilter === 'all' || g.rsvpStatus === rsvpFilter;
    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter;

    return matchesSearch && matchesRsvp && matchesCategory;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addGuest(event.id, {
      name: name.trim(),
      contact: contact.trim(),
      category,
      accompanyingGuests: accompanying,
      rsvpStatus,
      dietaryPreference: dietary,
      specialNeeds: specialNeeds.trim(),
      notes: notes.trim(),
      tableNumber: tableNumber.trim(),
    });

    setName('');
    setContact('');
    setAccompanying(0);
    setSpecialNeeds('');
    setNotes('');
    setTableNumber('');
    setIsAdding(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;

    updateGuest(event.id, editingGuest.id, {
      name: editingGuest.name,
      contact: editingGuest.contact,
      category: editingGuest.category,
      accompanyingGuests: editingGuest.accompanyingGuests,
      rsvpStatus: editingGuest.rsvpStatus,
      dietaryPreference: editingGuest.dietaryPreference,
      specialNeeds: editingGuest.specialNeeds,
      notes: editingGuest.notes,
      tableNumber: editingGuest.tableNumber,
    });

    setEditingGuest(null);
  };

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Hospitality & RSVP
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Guest List Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track RSVPs, seating, dietary restrictions, and attendance for{' '}
            <strong className="text-slate-700 dark:text-slate-300">{event.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenAdaptiveModal && (
            <button
              onClick={onOpenAdaptiveModal}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adaptive Re-Plan</span>
            </button>
          )}

          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">Expected Attendance</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {expectedAttendance} <span className="text-xs font-normal text-slate-400 font-sans">confirmed pax</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Event target: <strong className="font-mono">{event.expectedGuests} pax</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">Confirmed Parties</div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {confirmed.length} <span className="text-xs font-normal text-slate-400 font-sans">parties</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {Math.round((confirmed.length / Math.max(1, guests.length)) * 100)}% confirmation rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">Pending Responses</div>
          <div className="text-xl font-bold font-mono text-amber-500">
            {pending.length} <span className="text-xs font-normal text-slate-400 font-sans">awaiting reply</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Follow-up reminders recommended
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1">Declined</div>
          <div className="text-xl font-bold font-mono text-slate-400">
            {declined.length} <span className="text-xs font-normal text-slate-400 font-sans">unable to attend</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Freed seating capacity
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or dietary preference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={rsvpFilter}
            onChange={(e) => setRsvpFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All RSVP Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="colleague">Colleague</option>
            <option value="vip">VIP Guest</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* 4. ADD GUEST FORM */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              Add Guest Invitation Record
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guest / Party Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh & Geeta Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact (Email / Phone)
              </label>
              <input
                type="text"
                placeholder="ramesh@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="vip">VIP</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accompanying Guests (+count)
              </label>
              <input
                type="number"
                min="0"
                value={accompanying}
                onChange={(e) => setAccompanying(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                RSVP Status
              </label>
              <select
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as RSVPStatus)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dietary Preference
              </label>
              <input
                type="text"
                placeholder="e.g. Pure Jain / Vegetarian / Nut allergy"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accessibility / Table Assignment Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Table 2 · Needs wheelchair ramp assistance"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Save Guest Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. GUEST TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500">
                <th className="py-3 px-4 font-semibold">Guest / Party</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-center">Party Size</th>
                <th className="py-3 px-4 font-semibold">RSVP Status</th>
                <th className="py-3 px-4 font-semibold">Dietary</th>
                <th className="py-3 px-4 font-semibold">Seating / Special Care</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No guests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => {
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {g.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{g.contact || 'No contact'}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 capitalize">
                        {g.category}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        1 + {g.accompanyingGuests} ({1 + g.accompanyingGuests})
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            g.rsvpStatus === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : g.rsvpStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {g.rsvpStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {g.dietaryPreference || 'Standard'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {g.tableNumber && <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">[{g.tableNumber}]</span>}
                        {g.specialNeeds || g.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteGuest(event.id, g.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove guest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
