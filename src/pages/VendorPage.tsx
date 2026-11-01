import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
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
import { apiClient } from '../services/apiClient';
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
    user,
    events,
    currentEventId,
    communityVendors,
    savedVendors,
    eventVendors,
    vendorRecommendations,
    vendorLoading,
    vendorError,
    fetchCommunityVendors,
    fetchSavedVendors,
    fetchEventVendors,
    fetchVendorRecommendations,
    saveToMyVendors,
    removeSavedVendor,
    assignVendorToEvent,
    deleteEventVendorRecord,
    submitCommunityVendorContribution,
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

  // Tab State
  const [activeTab, setActiveTab] = useState<'recommended' | 'my_vendors' | 'add_vendor'>('recommended');
  const [recommendationViewMode, setRecommendationViewMode] = useState<'recommended' | 'directory'>('recommended');

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
  const [adminPending, setAdminPending] = useState<any[]>([]);
  const [loadingAdminPending, setLoadingAdminPending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add Vendor
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CommunityVendorCategory>('Wedding Venues');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formPriceMin, setFormPriceMin] = useState<string>('');
  const [formPriceMax, setFormPriceMax] = useState<string>('');
  const [formQuotation, setFormQuotation] = useState<string>('');
  const [formInclusions, setFormInclusions] = useState('');
  const [formServiceAreas, setFormServiceAreas] = useState('');
  const [formSuitableEvents, setFormSuitableEvents] = useState<string[]>(['Wedding', 'Reception']);
  const [formExpType, setFormExpType] = useState<typeof EXPERIENCE_TYPES[number]>('Personally Used This Vendor');
  const [formFeedback, setFormFeedback] = useState('');
  const [formConsent, setFormConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  useEffect(() => {
    fetchCommunityVendors();
    fetchSavedVendors();
    if (event?.id) {
      fetchEventVendors(event.id);
      fetchVendorRecommendations(event.id, categoryFilter !== 'All' ? categoryFilter : undefined);
    }
  }, [event?.id, categoryFilter]);

  const userVendors = useMemo(() => {
    if (!event) return [];
    return userEventVendors[event.id] || [];
  }, [event, userEventVendors]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminPending = async () => {
    try {
      setLoadingAdminPending(true);
      const res = await apiClient.getAdminPendingContributions();
      if (res?.contributions) {
        setAdminPending(res.contributions);
      }
    } catch (err) {
      console.warn('loadAdminPending error:', err);
    } finally {
      setLoadingAdminPending(false);
    }
  };

  useEffect(() => {
    if (showModerationDrawer) {
      loadAdminPending();
    }
  }, [showModerationDrawer]);

  const handleAdminReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.reviewVendorContribution(id, { action });
      showToast(`Contribution ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setAdminPending((prev) => prev.filter((p) => p.id !== id));
      await fetchCommunityVendors();
    } catch (err: any) {
      showToast(err.message || `Failed to ${action} contribution.`);
    }
  };

  // Distinct cities from community vendors
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    communityVendors.forEach((v) => {
      if (v.city) set.add(v.city);
    });
    return Array.from(set).sort();
  }, [communityVendors]);

  // Raw filtered community vendors (full directory)
  const approvedCommunityVendors = useMemo(() => {
    return communityVendors.filter((v: any) => {
      const status = v.status || v.moderationStatus;
      if (status !== 'approved' && !v.isDemoRecord) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.publicFeedback && v.publicFeedback.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
      const matchesCity = cityFilter === 'All' || v.city === cityFilter;

      let matchesPrice = true;
      const startingPrice =
        v.priceInformation?.startingPrice ??
        v.reportedQuotation ??
        v.reportedPriceMin ??
        0;
      if (priceFilter === 'under_50k') matchesPrice = startingPrice < 50000;
      else if (priceFilter === '50k_200k') matchesPrice = startingPrice >= 50000 && startingPrice <= 200000;
      else if (priceFilter === '200k_500k') matchesPrice = startingPrice > 200000 && startingPrice <= 500000;
      else if (priceFilter === 'above_500k') matchesPrice = startingPrice > 500000;

      return matchesSearch && matchesCat && matchesCity && matchesPrice;
    });
  }, [communityVendors, searchQuery, categoryFilter, cityFilter, priceFilter]);

  // Event Recommendations from engine
  const eventRecommendations = useMemo(() => {
    if (!event?.id) return [];
    return vendorRecommendations[event.id] || [];
  }, [event?.id, vendorRecommendations]);

  // Displayed Vendors: In 'recommended' mode, show strictly recommendations for celebration; in 'directory' mode, show all community catalog
  const displayedVendors = useMemo(() => {
    if (recommendationViewMode === 'directory' || !event?.id) {
      return approvedCommunityVendors.map((vendor: any) => {
        const rec = eventRecommendations.find(
          (r) => r.vendor.id === vendor.id || r.vendor.name?.toLowerCase() === vendor.name?.toLowerCase()
        );
        return {
          vendor,
          score: rec?.score ?? 0,
          scoreDetails: rec?.scoreDetails,
          reasons: rec?.reasons ?? [],
        };
      });
    }

    // Recommended mode: filter recommendations according to active search/category/city/price filters
    return eventRecommendations
      .filter((rec) => {
        const v = rec.vendor;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.city && v.city.toLowerCase().includes(q)) ||
          (v.category && v.category.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q));

        const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
        const matchesCity = cityFilter === 'All' || v.city === cityFilter;

        let matchesPrice = true;
        const startingPrice =
          v.priceInformation?.startingPrice ??
          v.reportedQuotation ??
          v.reportedPriceMin ??
          0;
        if (priceFilter === 'under_50k') matchesPrice = startingPrice < 50000;
        else if (priceFilter === '50k_200k') matchesPrice = startingPrice >= 50000 && startingPrice <= 200000;
        else if (priceFilter === '200k_500k') matchesPrice = startingPrice > 200000 && startingPrice <= 500000;
        else if (priceFilter === 'above_500k') matchesPrice = startingPrice > 500000;

        return matchesSearch && matchesCat && matchesCity && matchesPrice;
      })
      .sort((a, b) => b.score - a.score);
  }, [
    recommendationViewMode,
    event?.id,
    eventRecommendations,
    approvedCommunityVendors,
    searchQuery,
    categoryFilter,
    cityFilter,
    priceFilter,
  ]);

  // Check if vendor already saved in My Vendors
  const isSavedToMyVendors = (vendorId: string) => {
    return savedVendors.some(
      (sv) => sv.vendorId === vendorId || sv.vendor?.id === vendorId
    );
  };

  // Check if vendor already saved in current Event
  const isSavedToEvent = (vendorId: string) => {
    if (!event?.id) return false;
    const list = eventVendors[event.id] || [];
    return list.some(
      (ev) => ev.vendorId === vendorId || ev.vendor?.id === vendorId
    );
  };

  const handleToggleSaveToMyVendors = async (vendor: any) => {
    const saved = savedVendors.find(
      (sv) => sv.vendorId === vendor.id || sv.vendor?.id === vendor.id
    );
    if (saved) {
      try {
        await removeSavedVendor(saved.id);
        showToast(`Removed "${vendor.name}" from My Vendors.`);
      } catch (err: any) {
        showToast(err.message || 'Failed to remove from saved vendors.');
      }
    } else {
      try {
        await saveToMyVendors(vendor.id);
        showToast(`Saved "${vendor.name}" to My Vendors.`);
      } catch (err: any) {
        showToast(err.message || 'Failed to save vendor to My Vendors.');
      }
    }
  };

  const handleToggleAssignToEvent = async (vendor: any) => {
    if (!event?.id) {
      showToast('Please select or create a celebration to assign this vendor.');
      return;
    }
    const assigned = (eventVendors[event.id] || []).find(
      (ev) => ev.vendorId === vendor.id || ev.vendor?.id === vendor.id
    );
    if (assigned) {
      try {
        await deleteEventVendorRecord(event.id, assigned.id);
        showToast(`Removed "${vendor.name}" from celebration.`);
      } catch (err: any) {
        showToast(err.message || 'Failed to remove vendor from celebration.');
      }
    } else {
      try {
        await assignVendorToEvent(event.id, {
          vendorId: vendor.id,
          category: vendor.category || 'General',
          selectionStatus: 'shortlisted',
          contactStatus: 'not_contacted',
        });
        showToast(`Added "${vendor.name}" to celebration!`);
      } catch (err: any) {
        showToast(err.message || 'Failed to assign vendor to celebration.');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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

    const mapExpToRel = (exp: string) => {
      switch (exp) {
        case 'Personally Used This Vendor': return 'personally_used';
        case 'Visited This Vendor': return 'visited';
        case 'Received a Quotation': return 'received_quote';
        case 'Recommended by Someone': return 'recommended';
        default: return 'found_elsewhere';
      }
    };

    setIsSubmitting(true);
    try {
      const res = await submitCommunityVendorContribution({
        name: formName.trim(),
        category: formCategory,
        city: formCity.trim(),
        state: formState.trim() || undefined,
        address: formAddress.trim() || undefined,
        description: formDescription.trim() || formFeedback.trim() || undefined,
        publicPhone: formPhone.trim() || undefined,
        publicEmail: formEmail.trim() || undefined,
        websiteUrl: formWebsite.trim() || undefined,
        priceInformation: (formPriceMin || formPriceMax || formQuotation) ? {
          startingPrice: formPriceMin ? Number(formPriceMin) : (formQuotation ? Number(formQuotation) : undefined),
          maxPrice: formPriceMax ? Number(formPriceMax) : undefined,
          currency: currency || 'INR',
        } : undefined,
        serviceAreas: formServiceAreas ? formServiceAreas.split(',').map((s) => s.trim()).filter(Boolean) : [formCity.trim()],
        eventTypes: formSuitableEvents.length > 0 ? formSuitableEvents : undefined,
        relationshipType: mapExpToRel(formExpType),
        sourceDescription: formExpType,
        privateNotes: formFeedback.trim() || undefined,
        consentConfirmed: true,
      });

      if (res?.duplicateWarnings?.length) {
        setDuplicateWarning(res.duplicateWarnings[0]);
      }

      showToast('Vendor contribution submitted successfully! Your submission will be reviewed and published.');
      setFormName('');
      setFormCity('');
      setFormState('');
      setFormAddress('');
      setFormDescription('');
      setFormPhone('');
      setFormEmail('');
      setFormWebsite('');
      setFormPriceMin('');
      setFormPriceMax('');
      setFormQuotation('');
      setFormInclusions('');
      setFormServiceAreas('');
      setFormFeedback('');
      setFormConsent(false);
      await fetchCommunityVendors();
      setActiveTab('recommended');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit vendor contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
            Discover service providers contributed by our community for your celebrations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModerationDrawer(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Moderation Queue {adminPending.length > 0 && `(${adminPending.length})`}</span>
            </button>
          )}
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
            {recommendationViewMode === 'recommended' && event?.id ? displayedVendors.length : approvedCommunityVendors.length}
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
          <span>My Vendors ({savedVendors.length})</span>
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
          {/* Active Celebration Context & Mode Switcher */}
          {event && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Celebration Context:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{event.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Location: <strong>{event.location}</strong> • Type: <strong>{event.type || event.category || 'Wedding'}</strong> • Budget: <strong>{formatCurrency(Number(event.budget || event.totalBudget || 0), currency)}</strong>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-slate-800 shadow-2xs shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setRecommendationViewMode('recommended')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    recommendationViewMode === 'recommended'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recommendations ({eventRecommendations.length})</span>
                </button>
                <button
                  onClick={() => setRecommendationViewMode('directory')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    recommendationViewMode === 'directory'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>All Catalog ({approvedCommunityVendors.length})</span>
                </button>
              </div>
            </div>
          )}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  {recommendationViewMode === 'recommended' && event
                    ? `Showing vendors recommended for ${event.name} based on location, budget, and celebration requirements.`
                    : 'Vendor details, pricing, and contacts are shared by community members for reference.'}
                </span>
              </div>
              <span className="font-mono text-slate-400 shrink-0">
                {displayedVendors.length} {displayedVendors.length === 1 ? 'vendor' : 'vendors'} displayed
              </span>
            </div>
          </div>

          {/* Vendors Grid */}
          {displayedVendors.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {recommendationViewMode === 'recommended'
                  ? 'No matching recommendations for this filter'
                  : 'No approved vendors match your filters'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {recommendationViewMode === 'recommended'
                  ? 'Try selecting "All Categories" or switch to "All Catalog" to explore all community service providers across India.'
                  : 'No approved vendors match your criteria. You can contribute a vendor to help grow the EventPilot AI community.'}
              </p>
              {recommendationViewMode === 'recommended' ? (
                <button
                  onClick={() => {
                    setRecommendationViewMode('directory');
                    setCategoryFilter('All');
                    setCityFilter('All');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Browse All Community Catalog ({approvedCommunityVendors.length})</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('add_vendor')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a Vendor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedVendors.map(({ vendor, score, reasons }: any) => {
                const isSavedMy = isSavedToMyVendors(vendor.id);
                const isAddedEv = isSavedToEvent(vendor.id);
                const pricingMin = vendor.priceInformation?.startingPrice ?? vendor.reportedQuotation ?? vendor.reportedPriceMin;
                const pricingMax = vendor.priceInformation?.maxPrice ?? vendor.reportedPriceMax;
                const displayEventTypes = vendor.eventTypes?.length ? vendor.eventTypes : (vendor.suitableEventTypes || []);
                const displayAreas = vendor.serviceAreas?.length ? vendor.serviceAreas : (vendor.city ? [vendor.city] : []);
                const displayDesc = vendor.description || vendor.publicFeedback;
                const displayWebsite = vendor.websiteUrl || vendor.website;

                return (
                  <div
                    key={vendor.id}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between hover:border-indigo-400/80 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded">
                            {vendor.category}
                          </span>
                          {score > 0 && (
                            <span
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"
                              title={`Recommendation Match Score: ${score}%`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                              <span>{score}% Match</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {vendor.rating && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{vendor.rating}</span>
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}
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
                        {displayDesc && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {displayDesc}
                          </p>
                        )}

                        {/* Recommendation Match Reasons */}
                        {reasons && reasons.length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-[11px] space-y-1">
                            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Why Recommended:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {reasons.slice(0, 3).map((reason: string, rIdx: number) => (
                                <span
                                  key={rIdx}
                                  className="bg-white/90 dark:bg-slate-900/90 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {vendor.contributorExperienceType && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{vendor.contributorExperienceType}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-medium">
                          Reported Pricing / Quotation
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {pricingMin
                            ? pricingMax && pricingMax !== pricingMin
                              ? `${formatCurrency(pricingMin, currency)} - ${formatCurrency(pricingMax, currency)}`
                              : `Est. ${formatCurrency(pricingMin, currency)}`
                            : 'Price on request'}
                        </div>
                      </div>

                      {/* Suitable Events & Service Areas */}
                      <div className="space-y-1.5 text-xs">
                        {displayEventTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {displayEventTypes.slice(0, 3).map((st: string) => (
                              <span
                                key={st}
                                className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        )}

                        {displayAreas.length > 0 && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Areas: {displayAreas.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Public Contact */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {vendor.publicPhone && (
                            <a
                              href={`tel:${vendor.publicPhone}`}
                              className="inline-flex items-center gap-1 hover:text-indigo-600 font-mono text-[11px]"
                            >
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{vendor.publicPhone}</span>
                            </a>
                          )}
                          {vendor.publicEmail && (
                            <a
                              href={`mailto:${vendor.publicEmail}`}
                              className="inline-flex items-center gap-1 hover:text-indigo-600 text-[11px]"
                            >
                              <span>{vendor.publicEmail}</span>
                            </a>
                          )}
                        </div>
                        {displayWebsite && (
                          <a
                            href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
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
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedVendorForModal(vendor)}
                        className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      {/* Action 1: Save to My Vendors */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSaveToMyVendors(vendor);
                        }}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ${
                          isSavedMy
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={isSavedMy ? 'Saved to My Vendors (Click to remove)' : 'Save to My Vendors list'}
                      >
                        {isSavedMy ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 shrink-0" />
                            <span>Save to My Vendors</span>
                          </>
                        )}
                      </button>

                      {/* Action 2: Add to Event */}
                      {event?.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAssignToEvent(vendor);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ml-auto ${
                            isAddedEv
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                          title={isAddedEv ? 'Assigned to celebration' : 'Assign vendor to this celebration'}
                        >
                          {isAddedEv ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>Added to Event</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span>Add to Event</span>
                            </>
                          )}
                        </button>
                      )}
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

      {/* TAB 2: MY VENDORS */}
      {activeTab === 'my_vendors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Vendors Directory
              </h2>
              <p className="text-xs text-slate-500">
                Track your saved community vendors and vendors assigned to your celebrations.
              </p>
            </div>
          </div>

          {/* Section 1: Saved Vendors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
              <span>Saved to My Vendors ({savedVendors.length})</span>
            </h3>

            {savedVendors.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <Bookmark className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  You have not saved any vendors to your list yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVendors.map((sv: any) => {
                  const v = sv.vendor || {};
                  return (
                    <div
                      key={sv.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                            {v.category || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Saved {new Date(sv.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {v.name || 'Vendor'}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{v.city || 'Location on request'}</span>
                          {v.publicPhone && <span>· {v.publicPhone}</span>}
                        </div>
                        {sv.personalNotes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <strong>Note:</strong> {sv.personalNotes}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {event?.id && (
                          <button
                            onClick={() => handleToggleAssignToEvent(v.id ? v : { id: sv.vendorId, name: v.name, category: v.category })}
                            className={`py-1 px-2.5 rounded text-xs font-semibold flex items-center gap-1 ${
                              isSavedToEvent(sv.vendorId)
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isSavedToEvent(sv.vendorId) ? 'Added to Celebration' : 'Add to Celebration'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => removeSavedVendor(sv.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 ml-auto"
                          title="Remove from My Vendors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Celebration Vendors */}
          {event?.id && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assigned to {event.name} ({(eventVendors[event.id] || []).length})</span>
              </h3>

              {(eventVendors[event.id] || []).length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No vendors assigned to this celebration yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(eventVendors[event.id] || []).map((ev: any) => {
                    const v = ev.vendor || {};
                    return (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded mr-2">
                              {ev.category || v.category || 'General'}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {v.name || 'Assigned Vendor'}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteEventVendorRecord(event.id, ev.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 self-end sm:self-center"
                            title="Remove from celebration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Status:</span>
                            <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                              {(ev.selectionStatus || 'shortlisted').replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Estimated Cost:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {ev.estimatedCost ? formatCurrency(Number(ev.estimatedCost), currency) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Actual Cost:</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {ev.actualCost ? formatCurrency(Number(ev.actualCost), currency) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Business Address
                </label>
                <input
                  type="text"
                  placeholder="e.g., #45, 12th Main Road, Indiranagar"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Description / Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe this vendor's specialty, service style, or key highlights..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    Public Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., contact@vendorname.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
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

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Areas (comma-separated cities / regions)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bengaluru, Mysore, Chennai"
                  value={formServiceAreas}
                  onChange={(e) => setFormServiceAreas(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting to Directory...' : 'Submit Vendor to Community'}</span>
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
                {(() => {
                  const pMin =
                    (selectedVendorForModal as any).priceInformation?.startingPrice ??
                    selectedVendorForModal.reportedQuotation ??
                    selectedVendorForModal.reportedPriceMin;
                  const pMax =
                    (selectedVendorForModal as any).priceInformation?.maxPrice ??
                    selectedVendorForModal.reportedPriceMax;
                  if (pMin) {
                    if (pMax && pMax !== pMin) {
                      return `${formatCurrency(pMin, currency)} - ${formatCurrency(pMax, currency)}`;
                    }
                    return `Est. ${formatCurrency(pMin, currency)}`;
                  }
                  return 'Price upon request';
                })()}
              </div>
            </div>

            {/* Description / Feedback */}
            {(() => {
              const desc = (selectedVendorForModal as any).description || selectedVendorForModal.publicFeedback;
              if (!desc) return null;
              return (
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Vendor Description & Community Feedback
                  </div>
                  <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                    {desc}
                  </p>
                </div>
              );
            })()}

            {/* Service Areas & Event Types */}
            {(() => {
              const areas = (selectedVendorForModal as any).serviceAreas;
              const types = (selectedVendorForModal as any).eventTypes;
              if (!areas?.length && !types?.length) return null;
              return (
                <div className="space-y-2 text-xs">
                  {types?.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Suitable Celebrations:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {types.map((t: string) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {areas?.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Service Areas: {areas.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Contact Coordinates */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                {selectedVendorForModal.publicPhone && (
                  <div className="text-slate-700 dark:text-slate-300">
                    Phone: <strong className="font-mono">{selectedVendorForModal.publicPhone}</strong>
                  </div>
                )}
                {((selectedVendorForModal as any).publicEmail || (selectedVendorForModal as any).contactEmail) && (
                  <div className="text-slate-600 dark:text-slate-400">
                    Email: {(selectedVendorForModal as any).publicEmail || (selectedVendorForModal as any).contactEmail}
                  </div>
                )}
                {((selectedVendorForModal as any).address || selectedVendorForModal.businessAddress) && (
                  <div className="text-slate-500 text-[11px]">
                    {(selectedVendorForModal as any).address || selectedVendorForModal.businessAddress}
                  </div>
                )}
                {((selectedVendorForModal as any).websiteUrl || selectedVendorForModal.website) && (
                  <div>
                    <a
                      href={((selectedVendorForModal as any).websiteUrl || selectedVendorForModal.website).startsWith('http')
                        ? ((selectedVendorForModal as any).websiteUrl || selectedVendorForModal.website)
                        : `https://${(selectedVendorForModal as any).websiteUrl || selectedVendorForModal.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Visit Website</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const isModalSaved = isSavedToMyVendors(selectedVendorForModal.id);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleSaveToMyVendors(selectedVendorForModal);
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
                          <span>Save to My Vendors</span>
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
              Community vendor submissions awaiting administrative moderation before public directory listing.
            </p>

            {loadingAdminPending ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading pending vendor contributions...
              </div>
            ) : adminPending.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  All community submissions reviewed
                </p>
                <p className="text-[11px] text-slate-500">
                  There are no pending vendor contributions waiting in the moderation queue.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminPending.map((item) => {
                  const v = item.vendor || {};
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {v.name || 'Vendor Submission'}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            Pending Review
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {v.category} · {v.city} · Relationship: <span className="font-mono text-slate-600 dark:text-slate-400">{item.relationshipType}</span>
                        </div>
                        {item.privateNotes && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                            "{item.privateNotes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAdminReview(item.id, 'approve')}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleAdminReview(item.id, 'reject')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
