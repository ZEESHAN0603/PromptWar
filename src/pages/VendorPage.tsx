import React, { useState, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Phone,
  Globe,
  Trash2,
  SlidersHorizontal,
  Info,
  Scale,
  Star,
  X,
  Check,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Tag,
  AlertTriangle,
  FileText,
  DollarSign,
  Heart,
  Eye,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  CommunityVendor,
  CommunityVendorCategory,
  UserEventBookingStatus,
  UserEventVendor,
  CurrencyCode,
} from '../types';
import { formatCurrency } from '../utils/formatters';

const ALL_CATEGORIES: CommunityVendorCategory[] = [
  'Wedding Venues',
  'Catering & Food',
  'Decoration & Florals',
  'Photography & Videography',
  'Entertainment',
  'Makeup & Beauty',
  'Transportation',
  'Event Equipment',
  'Other Services',
];

const BOOKING_STATUS_OPTIONS: UserEventBookingStatus[] = [
  'Interested',
  'Researching',
  'Contacted Independently',
  'Quote Received',
  'Shortlisted',
  'Booked',
  'Not Selected',
];

const EXPERIENCE_TYPES = [
  'Personally Used This Vendor',
  'Visited This Vendor',
  'Received a Quotation',
  'Recommended by Someone',
  'Found Through Another Source',
] as const;

interface VendorPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const VendorPage: React.FC<VendorPageProps> = ({ onOpenAdaptiveModal }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const {
    events,
    currentEventId,
    communityVendors,
    addCommunityVendor,
    updateCommunityVendorStatus,
    saveVendorToEvent,
    updateUserEventVendor,
    removeUserEventVendor,
    userEventVendors,
    currency,
  } = useAppStore();

  const activeEventId = eventId || currentEventId || events[0]?.id || '';
  const event = events.find((e) => e.id === activeEventId) || events[0];
  const userVendors = useMemo(() => {
    if (!event) return [];
    return userEventVendors[event.id] || [];
  }, [event, userEventVendors]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'recommended' | 'my_vendors' | 'add_vendor'>('recommended');

  // Search & Filters for Recommended Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(
    ALL_CATEGORIES.includes(initialCategory as any) ? initialCategory : 'All'
  );
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<string>('All');

  // Modal / Detail States
  const [selectedVendorForModal, setSelectedVendorForModal] = useState<CommunityVendor | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showModerationDrawer, setShowModerationDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add Vendor
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CommunityVendorCategory>('Wedding Venues');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formPriceMin, setFormPriceMin] = useState<string>('');
  const [formPriceMax, setFormPriceMax] = useState<string>('');
  const [formQuotation, setFormQuotation] = useState<string>('');
  const [formInclusions, setFormInclusions] = useState('');
  const [formSuitableEvents, setFormSuitableEvents] = useState<string[]>(['Wedding', 'Reception']);
  const [formExpType, setFormExpType] = useState<typeof EXPERIENCE_TYPES[number]>('Personally Used This Vendor');
  const [formFeedback, setFormFeedback] = useState('');
  const [formConsent, setFormConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<CommunityVendor | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct cities from community vendors
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    communityVendors.forEach((v) => {
      if (v.city) set.add(v.city);
    });
    return Array.from(set).sort();
  }, [communityVendors]);

  // Filtered Community Vendors
  const approvedCommunityVendors = useMemo(() => {
    return communityVendors.filter((v) => {
      if (v.moderationStatus !== 'approved' && !v.isDemoRecord) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.publicFeedback && v.publicFeedback.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
      const matchesCity = cityFilter === 'All' || v.city === cityFilter;

      let matchesPrice = true;
      const refPrice = v.reportedQuotation || v.reportedPriceMin || 0;
      if (priceFilter === 'under_50k') matchesPrice = refPrice < 50000;
      else if (priceFilter === '50k_200k') matchesPrice = refPrice >= 50000 && refPrice <= 200000;
      else if (priceFilter === '200k_500k') matchesPrice = refPrice > 200000 && refPrice <= 500000;
      else if (priceFilter === 'above_500k') matchesPrice = refPrice > 500000;

      return matchesSearch && matchesCat && matchesCity && matchesPrice;
    });
  }, [communityVendors, searchQuery, categoryFilter, cityFilter, priceFilter]);

  // Check if vendor already saved in current event
  const isVendorSavedInEvent = (vendorId: string, vendorName: string) => {
    return userVendors.some(
      (uv) => uv.vendorId === vendorId || uv.name.toLowerCase() === vendorName.toLowerCase()
    );
  };

  const handleToggleSaveToEvent = (vendor: CommunityVendor) => {
    if (!event) return;
    const existing = userVendors.find(
      (uv) => uv.vendorId === vendor.id || uv.name.toLowerCase() === vendor.name.toLowerCase()
    );
    if (existing) {
      removeUserEventVendor(event.id, existing.id);
      showToast(`Removed "${vendor.name}" from My Vendors.`);
    } else {
      saveVendorToEvent(event.id, vendor);
      showToast(`Saved "${vendor.name}" to My Vendors.`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Please enter the vendor business name.');
      return;
    }
    if (!formCity.trim()) {
      setFormError('Please provide the vendor city.');
      return;
    }
    if (!formConsent) {
      setFormError('Please acknowledge the community contribution consent checkbox.');
      return;
    }

    const res = addCommunityVendor({
      name: formName.trim(),
      category: formCategory,
      city: formCity.trim(),
      state: formState.trim() || 'Karnataka',
      businessAddress: formAddress.trim() || undefined,
      publicPhone: formPhone.trim() || undefined,
      website: formWebsite.trim() || undefined,
      reportedPriceMin: formPriceMin ? Number(formPriceMin) : undefined,
      reportedPriceMax: formPriceMax ? Number(formPriceMax) : undefined,
      reportedQuotation: formQuotation ? Number(formQuotation) : undefined,
      currency: currency || 'INR',
      packageInclusions: formInclusions
        ? formInclusions.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      suitableEventTypes: formSuitableEvents,
      contributorExperienceType: formExpType,
      publicFeedback: formFeedback.trim() || undefined,
      contributedBy: 'You',
    });

    if (!res.success && res.duplicate) {
      setDuplicateWarning(res.duplicate);
      return;
    }

    // Success
    showToast('Vendor submitted! It is in review and immediately viewable in the Moderation queue.');
    // Reset form
    setFormName('');
    setFormCity('');
    setFormState('');
    setFormAddress('');
    setFormPhone('');
    setFormWebsite('');
    setFormPriceMin('');
    setFormPriceMax('');
    setFormQuotation('');
    setFormInclusions('');
    setFormFeedback('');
    setFormConsent(false);
    setActiveTab('recommended');
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (!event) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700 dark:border-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>Community Recommendation Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Recommended Vendors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover vendors contributed by our community for your celebration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('add_vendor')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Vendor</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY 3 TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'recommended'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Recommended Vendors</span>
          <span className="text-[11px] font-mono font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500">
            {approvedCommunityVendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my_vendors')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'my_vendors'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My Vendors ({userVendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add_vendor')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'add_vendor'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Contribute a Vendor</span>
        </button>
      </div>

      {/* TAB 1: RECOMMENDED VENDORS (COMMUNITY DISCOVERY) */}
      {activeTab === 'recommended' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendors by name, city, specialty, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Categories</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* City Filter */}
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Cities</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                {/* Price Filter */}
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Budgets</option>
                  <option value="under_50k">Under ₹50,000</option>
                  <option value="50k_200k">₹50,000 - ₹2,00,000</option>
                  <option value="200k_500k">₹2,00,000 - ₹5,00,000</option>
                  <option value="above_500k">₹5,00,000+</option>
                </select>
              </div>
            </div>

            {/* Disclaimer Bar */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                Vendor details, pricing, and phone contacts are shared by community members for reference. EventPilot does not directly book or verify vendors.
              </span>
            </div>
          </div>

          {/* Vendors Grid */}
          {approvedCommunityVendors.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No matching community vendors
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Know a great venue, caterer, or photographer? Contribute them to help fellow planners in your city!
              </p>
              <button
                onClick={() => setActiveTab('add_vendor')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Contribute This Vendor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {approvedCommunityVendors.map((vendor) => {
                const isSaved = isVendorSavedInEvent(vendor.id, vendor.name);

                return (
                  <div
                    key={vendor.id}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between hover:border-indigo-400/80 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded">
                          {vendor.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {vendor.rating && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{vendor.rating}</span>
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {vendor.city}
                          </span>
                        </div>
                      </div>

                      {/* Name & Contributor Note */}
                      <div
                        onClick={() => setSelectedVendorForModal(vendor)}
                        className="cursor-pointer group/title"
                        title="Click to view vendor details"
                      >
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors">
                          {vendor.name}
                        </h3>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVendorForModal(vendor);
                          }}
                          className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 cursor-pointer group/exp hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Click to view contributor feedback and vendor details"
                        >
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded text-[11px] border border-slate-200/80 dark:border-slate-700/80 group-hover/exp:border-indigo-300 dark:group-hover/exp:border-indigo-700 group-hover/exp:bg-indigo-50 dark:group-hover/exp:bg-indigo-950/60 transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{vendor.contributorExperienceType}</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2">
                            View details
                          </span>
                        </div>
                      </div>

                      {/* Pricing Tag */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-medium">
                          Reported Pricing / Quote
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {vendor.reportedQuotation
                            ? `Est. ${formatCurrency(vendor.reportedQuotation, (vendor.currency as CurrencyCode) || currency)}`
                            : vendor.reportedPriceMin
                            ? `${formatCurrency(vendor.reportedPriceMin, (vendor.currency as CurrencyCode) || currency)} - ${formatCurrency(
                                vendor.reportedPriceMax || vendor.reportedPriceMin * 1.5,
                                (vendor.currency as CurrencyCode) || currency
                              )}`
                            : 'Price on request'}
                        </div>
                      </div>

                      {/* Suitable Events & Inclusions */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {vendor.suitableEventTypes.slice(0, 3).map((st) => (
                            <span
                              key={st}
                              className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                            >
                              {st}
                            </span>
                          ))}
                        </div>

                        {vendor.packageInclusions && vendor.packageInclusions.length > 0 && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            <strong>Includes:</strong> {vendor.packageInclusions.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Public Contact */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        {vendor.publicPhone && (
                          <a
                            href={`tel:${vendor.publicPhone}`}
                            className="inline-flex items-center gap-1 hover:text-indigo-600"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{vendor.publicPhone}</span>
                          </a>
                        )}
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Website</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVendorForModal(vendor)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSaveToEvent(vendor);
                        }}
                        className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 select-none shrink-0 ${
                          isSaved
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs hover:shadow-sm'
                        }`}
                        title={isSaved ? 'Saved to celebration (Click to remove)' : 'Save vendor to this celebration'}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 shrink-0" />
                            <span>Save to Event</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FALLBACK CARD: "Didn't find the right vendor?" */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Didn't find the right vendor for your celebration?</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Contribute a vendor you love or have personally received a quote from. Your contribution helps empower celebrations across your community.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('add_vendor')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Contribute a Vendor Now</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MY VENDORS (PRIVATE TO CURRENT EVENT) */}
      {activeTab === 'my_vendors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Saved Vendors for "{event.name}"
              </h2>
              <p className="text-xs text-slate-500">
                Track your private notes, independent quotes, and vendor booking statuses.
              </p>
            </div>

            {compareIds.length >= 2 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare Selected ({compareIds.length})</span>
              </button>
            )}
          </div>

          {userVendors.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No saved vendors yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the Recommended Vendors tab and click "Save to Event" to start tracking quotes and notes.
              </p>
              <button
                onClick={() => setActiveTab('recommended')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Browse Recommended Vendors</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userVendors.map((uv) => {
                const isCompared = compareIds.includes(uv.id);

                return (
                  <div
                    key={uv.id}
                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(uv.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            title="Select to compare"
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                            {uv.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            Saved {new Date(uv.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {uv.name}
                        </h3>
                        {uv.city && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{uv.city}</span>
                            {uv.publicPhone && (
                              <>
                                <span>·</span>
                                <span>{uv.publicPhone}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Selector & Actions */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 text-[11px]">Booking Status:</span>
                          <select
                            value={uv.bookingStatus}
                            onChange={(e) =>
                              updateUserEventVendor(event.id, uv.id, {
                                bookingStatus: e.target.value as UserEventBookingStatus,
                              })
                            }
                            className={`py-1 px-2.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              uv.bookingStatus === 'Booked'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : uv.bookingStatus === 'Quote Received'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : uv.bookingStatus === 'Shortlisted'
                                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {BOOKING_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            removeUserEventVendor(event.id, uv.id);
                            showToast(`Removed "${uv.name}" from event.`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Remove vendor from event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Editing for Independently Received Quote & Private Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Independently Received Quote ({currency})
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 150000"
                          value={uv.independentlyReceivedQuote || ''}
                          onChange={(e) =>
                            updateUserEventVendor(event.id, uv.id, {
                              independentlyReceivedQuote: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Private Notes & Specific Terms
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Includes welcome drinks, 20% advance required, contacted owner on WhatsApp..."
                          value={uv.privateNotes}
                          onChange={(e) =>
                            updateUserEventVendor(event.id, uv.id, {
                              privateNotes: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD A VENDOR (COMMUNITY CONTRIBUTION FORM) */}
      {activeTab === 'add_vendor' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Community Recommendation Guidelines:</strong> Contributed vendors are reviewed before appearing publicly in the directory. Please provide truthful information based on personal experience or verified quotations.
            </div>
          </div>

          {formError && (
            <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* SECTION A: BASIC BUSINESS INFO */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Section A: Basic Vendor Info
                </h3>
                <p className="text-xs text-slate-500">Official business name and contact coordinates.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Emerald Banquets, Gourmet Alchemy Catering"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CommunityVendorCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bengaluru, Chennai"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Karnataka, Tamil Nadu"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Public Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., +91 98450 12345"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Website or Social Profile
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., https://instagram.com/vendorname"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B: PRICING INFORMATION */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Section B: Reported Pricing Information
                </h3>
                <p className="text-xs text-slate-500">Indicative pricing to guide community planners.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Indicative Quotation ({currency})
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 180000"
                    value={formQuotation}
                    onChange={(e) => setFormQuotation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price Range Min
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 120000"
                    value={formPriceMin}
                    onChange={(e) => setFormPriceMin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price Range Max
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 250000"
                    value={formPriceMax}
                    onChange={(e) => setFormPriceMax(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Package Inclusions (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sound system, Stage decor, 3 course dinner, drone coverage"
                  value={formInclusions}
                  onChange={(e) => setFormInclusions(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* SECTION C: SUITABILITY */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Section C: Event Suitability
                </h3>
                <p className="text-xs text-slate-500">What kinds of events is this vendor best suited for?</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'Wedding',
                  'Reception',
                  'Engagement',
                  'Birthday',
                  'Anniversary',
                  'Corporate',
                  'Cocktail',
                  'Sangeet / Mehendi',
                ].map((type) => {
                  const active = formSuitableEvents.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormSuitableEvents((prev) =>
                          prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION D: CUSTOMER EXPERIENCE */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Section D: Customer Experience & Review
                </h3>
                <p className="text-xs text-slate-500">Your relationship and honest feedback about this vendor.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  How did you experience this vendor? *
                </label>
                <select
                  value={formExpType}
                  onChange={(e) => setFormExpType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {EXPERIENCE_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Feedback / Experience Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details on responsiveness, food taste, setup quality, punctuality, or any tips for future planners..."
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* SECTION E: COMMUNITY CONSENT & SUBMIT */}
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Section E: Community Consent
                </h3>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formConsent}
                  onChange={(e) => setFormConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I confirm that this vendor recommendation is based on genuine information and does not violate any terms. I understand that submissions are moderated before public listing.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('recommended')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Vendor to Community</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VENDOR DETAILS & DISCLAIMER MODAL */}
      {selectedVendorForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded">
                  {selectedVendorForModal.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedVendorForModal.name}
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedVendorForModal.city}, {selectedVendorForModal.state}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendorForModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer Banner */}
            <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Community Reference Notice:</strong> Vendor details and pricing are contributed by community members and are for informational purposes only. EventPilot does not directly book or verify vendor services.
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Reported Price & Quotations
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {selectedVendorForModal.reportedQuotation
                  ? `Reported Quote: ${formatCurrency(
                      selectedVendorForModal.reportedQuotation,
                      (selectedVendorForModal.currency as CurrencyCode) || currency
                    )}`
                  : selectedVendorForModal.reportedPriceMin
                  ? `${formatCurrency(
                      selectedVendorForModal.reportedPriceMin,
                      (selectedVendorForModal.currency as CurrencyCode) || currency
                    )} - ${formatCurrency(
                      selectedVendorForModal.reportedPriceMax || selectedVendorForModal.reportedPriceMin * 1.5,
                      (selectedVendorForModal.currency as CurrencyCode) || currency
                    )}`
                  : 'Contact vendor for pricing'}
              </div>
            </div>

            {/* Package Inclusions */}
            {selectedVendorForModal.packageInclusions &&
              selectedVendorForModal.packageInclusions.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Package Inclusions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVendorForModal.packageInclusions.map((inc, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Feedback / Review */}
            {selectedVendorForModal.publicFeedback && (
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Community Feedback ({selectedVendorForModal.contributorExperienceType})
                </div>
                <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                  "{selectedVendorForModal.publicFeedback}"
                </p>
              </div>
            )}

            {/* Contact Coordinates */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-1">
                {selectedVendorForModal.publicPhone && (
                  <div className="text-slate-700 dark:text-slate-300">
                    Phone: <strong className="font-mono">{selectedVendorForModal.publicPhone}</strong>
                  </div>
                )}
                {selectedVendorForModal.businessAddress && (
                  <div className="text-slate-500 text-[11px]">
                    {selectedVendorForModal.businessAddress}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const isModalSaved = isVendorSavedInEvent(
                    selectedVendorForModal.id,
                    selectedVendorForModal.name
                  );
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleSaveToEvent(selectedVendorForModal);
                      }}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                        isModalSaved
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isModalSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Saved in My Vendors</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save to My Event</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION QUEUE DRAWER / MODAL */}
      {showModerationDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Community Vendor Moderation Queue
                </h3>
              </div>
              <button
                onClick={() => setShowModerationDrawer(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Community submissions can be reviewed and approved to appear in the shared public directory.
            </p>

            <div className="space-y-3">
              {communityVendors.map((cv) => (
                <div
                  key={cv.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {cv.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.2 rounded ${
                          cv.moderationStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : cv.moderationStatus === 'pending_review'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                        }`}
                      >
                        {cv.moderationStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {cv.category} · {cv.city} · Submitted by: {cv.contributedBy || 'Community'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cv.moderationStatus !== 'approved' && (
                      <button
                        onClick={() => {
                          updateCommunityVendorStatus(cv.id, 'approved');
                          showToast(`Approved "${cv.name}" into public directory.`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {cv.moderationStatus !== 'rejected' && (
                      <button
                        onClick={() => {
                          updateCommunityVendorStatus(cv.id, 'rejected');
                          showToast(`Rejected "${cv.name}".`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 rounded transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE DETECTION WARNING MODAL */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Duplicate Vendor Detected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This vendor already exists in our directory.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <strong>"{duplicateWarning.name}"</strong> is already registered under{' '}
              <strong>{duplicateWarning.city}</strong> in the {duplicateWarning.category} category.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedVendorForModal(duplicateWarning);
                  setDuplicateWarning(null);
                  setActiveTab('recommended');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
              >
                View Existing Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL FOR MY VENDORS */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Compare Vendor Quotations
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userVendors
                .filter((uv) => compareIds.includes(uv.id))
                .map((uv) => (
                  <div
                    key={uv.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                        {uv.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {uv.name}
                      </h4>
                      <div className="text-slate-500 mt-0.5">{uv.city || 'Location unlisted'}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Independently Received Quote</div>
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                        {uv.independentlyReceivedQuote
                          ? formatCurrency(uv.independentlyReceivedQuote, currency)
                          : 'Pending quote'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Current Status
                      </div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {uv.bookingStatus}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                        Private Notes
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                        {uv.privateNotes || 'No private notes entered yet.'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
