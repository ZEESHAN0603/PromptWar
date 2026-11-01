export type EventCategory =
  | 'Wedding'
  | 'Birthday'
  | 'Anniversary'
  | 'Engagement'
  | 'Baby shower'
  | 'Corporate event'
  | 'Community gathering'
  | 'Festival'
  | 'Graduation'
  | 'Other';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type RSVPStatus = 'pending' | 'confirmed' | 'declined';

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'entertainment'
  | 'transportation'
  | 'accommodation'
  | 'other';

export type CommunityVendorCategory =
  | 'Wedding Venues'
  | 'Catering & Food'
  | 'Decoration & Florals'
  | 'Photography & Videography'
  | 'Entertainment'
  | 'Makeup & Beauty'
  | 'Transportation'
  | 'Event Equipment'
  | 'Other Services';

export type BookingStatus =
  | 'researching'
  | 'contacted'
  | 'quotation_received'
  | 'shortlisted'
  | 'confirmed'
  | 'rejected';

export type UserEventBookingStatus =
  | 'Interested'
  | 'Researching'
  | 'Contacted Independently'
  | 'Quote Received'
  | 'Shortlisted'
  | 'Booked'
  | 'Not Selected';

export interface CommunityVendor {
  id: string;
  name: string;
  slug?: string;
  category: string;
  description?: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  businessAddress?: string;
  publicPhone?: string;
  publicEmail?: string;
  website?: string;
  websiteUrl?: string;
  socialLinks?: any;
  serviceAreas?: string[];
  eventTypes?: string[];
  priceInformation?: {
    startingPrice?: number;
    maxPrice?: number;
    priceRange?: string;
    pricingModel?: string;
    currency?: string;
  };
  reportedPriceMin?: number;
  reportedPriceMax?: number;
  reportedQuotation?: number;
  currency?: string;
  packageInclusions?: string[];
  additionalCharges?: string[];
  suitableEventTypes?: string[];
  contributorExperienceType?:
    | 'Personally Used This Vendor'
    | 'Visited This Vendor'
    | 'Received a Quotation'
    | 'Recommended by Someone'
    | 'Found Through Another Source';
  publicFeedback?: string;
  submittedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  status?: 'approved' | 'pending' | 'rejected' | 'suspended';
  moderationStatus?: 'approved' | 'pending_review' | 'rejected' | 'needs_more_info';
  isDemoRecord?: boolean;
  contributedBy?: string;
  submittedBy?: string;
  rating?: number;
}

export interface MySavedVendor {
  id: string;
  userId: string;
  vendorId: string;
  personalNotes?: string | null;
  savedAt: string;
  vendor: CommunityVendor;
}

export interface EventVendorRecord {
  id: string;
  eventId: string;
  vendorId: string;
  category: string;
  selectionStatus: 'shortlisted' | 'contacted' | 'quoted' | 'hired' | 'rejected';
  contactStatus: 'not_contacted' | 'contacted' | 'meeting_scheduled' | 'proposal_received' | 'contract_signed';
  estimatedCost: number;
  actualCost?: number | null;
  currency: string;
  privateNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vendor?: CommunityVendor;
  expenses?: any[];
}

export interface RecommendationScoreBreakdown {
  categoryMatch: { matched: boolean; score: number; maxScore: number };
  cityMatch: { matched: boolean; score: number; maxScore: number };
  serviceAreaMatch: { matched: boolean; score: number; maxScore: number };
  eventTypeMatch: { matched: boolean; score: number; maxScore: number };
  budgetMatch: {
    matched: boolean;
    score: number;
    maxScore: number;
    startingPrice?: number;
    budgetLimit?: number;
  };
}

export interface RecommendedVendorItem {
  vendor: CommunityVendor;
  score: number;
  scoreDetails: RecommendationScoreBreakdown;
  reasons: string[];
}

export interface UserEventVendor {
  id: string;
  eventId: string;
  vendorId?: string; // Links to community vendor if saved from community
  name: string;
  category: string;
  city?: string;
  publicPhone?: string;
  website?: string;
  reportedPrice?: number;
  privateNotes: string;
  independentlyReceivedQuote?: number;
  estimatedExpense?: number;
  actualExpense?: number;
  bookingStatus: UserEventBookingStatus;
  packageInclusions?: string[];
  savedAt: string;
}

export interface EventModel {
  id: string;
  name: string;
  category: EventCategory;
  occasionDescription: string;
  date: string; // YYYY-MM-DD
  location: string;
  expectedGuests: number;
  guestBreakdown: {
    adults: number;
    children: number;
    elderly: number;
  };
  dietaryPreferences: string[];
  accessibilityRequirements: string[];
  preferences: {
    atmosphere: string;
    style: string;
    food: string;
    decoration: string;
    photography: string;
    entertainment: string;
    cultural: string;
  };
  priorities: {
    foodQuality: number; // 1-5
    guestExperience: number;
    venue: number;
    decoration: number;
    photography: number;
    entertainment: number;
    accessibility: number;
  };
  mustHaves: string[];
  avoidances: string[];
  totalBudget: number;
  preferredSpendingLevel: 'budget' | 'balanced' | 'premium' | 'luxury';
  currency: CurrencyCode;
  completionPercentage: number;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'archived';
  theme?: string;
  type?: string;
  budget?: number | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategoryItem {
  id: string;
  name: string;
  allocated: number;
  actual: number;
  notes: string;
  isCustom?: boolean;
}

export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  priority: PriorityLevel;
  status: TaskStatus;
  dependencies: string[]; // IDs of tasks that must be completed first
  estimatedCost?: number;
  assignedTo?: string;
  completedAt?: string;
}

export interface GuestItem {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  category: 'family' | 'friend' | 'colleague' | 'vip' | 'other';
  accompanyingGuests: number;
  rsvpStatus: RSVPStatus;
  dietaryPreference: string;
  specialNeeds: string;
  notes: string;
  tableNumber?: string;
}

export interface VendorItem {
  id: string;
  eventId: string;
  name: string;
  serviceCategory: VendorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  quotedPrice: number;
  capacity?: number;
  packageInclusions: string[];
  exclusions: string[];
  additionalCharges: string[];
  notes: string;
  bookingStatus: BookingStatus;
  rating?: number;
}

export interface IdeaItem {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  estimatedBudgetRange: string;
  matchReason: string;
  alternatives: string[];
  isSaved: boolean;
  tags: string[];
  content?: any;
  generationId?: string;
  colorPalette?: string[];
  implementationTips?: string[];
  budgetSuitability?: string;
  createdAt?: string;
}

export interface AIMessage {
  id: string;
  eventId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'replan' | 'add_task' | 'rebalance_budget' | 'compare_vendors';
    label: string;
    payload?: any;
  };
  recommendations?: string[];
}

export interface PlanVersionChange {
  field: string;
  oldValue: string | number;
  newValue: string | number;
  impactDescription: string;
}

export interface PlanVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v2.0"
  eventId: string;
  timestamp: string;
  reason: string;
  changes: PlanVersionChange[];
  totalBudget: number;
  allocatedBudget: number;
  expectedGuests: number;
  eventDate: string;
  notes: string;
}

export interface AdaptiveImpactReport {
  changesDetected: {
    field: string;
    from: string | number;
    to: string | number;
    difference?: string | number;
  }[];
  budgetImpact: {
    oldTotal: number;
    newTotal: number;
    difference: number;
    reallocatedCategories: {
      category: string;
      oldAmount: number;
      newAmount: number;
      delta: number;
      adjustmentReason: string;
    }[];
    feasibilityScore: 'healthy' | 'tight' | 'critical';
  };
  timelineImpact: {
    daysShift: number; // positive = earlier, negative = postponed
    urgentTasks: {
      id: string;
      title: string;
      oldDue: string;
      newDue: string;
      priority: PriorityLevel;
    }[];
    overdueRiskCount: number;
    compressedWeeks: number;
  };
  guestAndCateringImpact: {
    guestDelta: number;
    estimatedCateringCostDelta: number;
    venueCapacityAdequate: boolean;
    recommendation: string;
  };
  vendorImpact: {
    impactedCategories: string[];
    actionItems: string[];
  };
  recommendedAlternatives: string[];
  unchangedSummary: string[];
}

export interface ExpenseItem {
  id: string;
  eventId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  title: string;
  description?: string | null;
  estimatedAmount: number;
  actualAmount?: number | null;
  expenseDate?: string | null;
  paymentStatus: 'pending' | 'partially_paid' | 'paid';
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetSummaryData {
  eventId: string;
  currency: string;
  totalBudget: number;
  totalAllocated: number;
  totalEstimatedExpenses: number;
  totalActualExpenses: number;
  remainingBudget: number;
  budgetUtilization: number;
  categoryBreakdown: Array<{
    id: string;
    name: string;
    color?: string | null;
    allocatedAmount: number;
    estimatedExpenses: number;
    actualExpenses: number;
    variance: number;
    isOverspent: boolean;
    expenseCount: number;
  }>;
  uncategorizedExpensesCount: number;
  warnings: string[];
}

export interface GuestSummaryData {
  eventId: string;
  totalGuests: number;
  attendingCount: number;
  declinedCount: number;
  pendingCount: number;
  invitedCount: number;
  totalPermittedPlusOnes: number;
  expectedAttendeesHeadcount: number;
  categoryBreakdown: Record<string, number>;
  dietaryBreakdown: Record<string, number>;
}

export interface TimelineActivityItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  category?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// Phase 6: Adaptive Re-Planning Types
export interface BackendReplanProposal {
  proposalId: string;
  eventId: string;
  status: 'READY_FOR_REVIEW' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'EXPIRED' | 'FAILED';
  proposedChanges: {
    budget?: { proposed: number };
    guestCount?: { proposed: number };
    eventDate?: { proposed: string };
  };
  impactReport: {
    summary: {
      hasBudgetChange: boolean;
      hasGuestChange: boolean;
      hasDateChange: boolean;
      overallImpactLevel: 'low' | 'moderate' | 'high' | 'critical';
      totalConflicts: number;
      totalAdjustmentsRecommended: number;
    };
    budgetImpact?: {
      existingBudget: number;
      proposedBudget: number;
      budgetDifference: number;
      percentageChange: number;
      totalAllocated: number;
      totalActualExpenses: number;
      totalEstimatedExpenses: number;
      existingRemainingBudget: number;
      proposedRemainingBudget: number;
      existingUnallocated: number;
      proposedUnallocated: number;
      isDeficit: boolean;
      deficitAmount: number;
      isAllocationOverBudget: boolean;
      allocationOverageAmount: number;
      categoryDifferences: Array<{
        categoryId: string;
        categoryName: string;
        allocatedAmount: number;
        actualSpent: number;
        estimatedTotal: number;
        variance: number;
        status: string;
      }>;
      conflicts: string[];
    } | null;
    guestImpact?: {
      existingGuestCount: number;
      proposedGuestCount: number;
      guestDifference: number;
      percentageChange: number;
      confirmedGuestCount: number;
      totalAttendingHeadcount: number;
      estimatedPlateCost: number | null;
      estimatedCateringImpact: number | null;
      capacityStatus: string;
      impactedAreas: string[];
      conflicts: string[];
    } | null;
    dateImpact?: {
      existingEventDate: string;
      proposedEventDate: string;
      daysDifference: number;
      daysRemainingProposed: number;
      tasksAfterProposedDate: Array<{
        taskId: string;
        title: string;
        dueDate: string;
        status: string;
        priority: string;
      }>;
      overdueTasks: Array<{
        taskId: string;
        title: string;
        dueDate: string;
        priority: string;
      }>;
      taskDependencyConflicts: Array<{
        taskId: string;
        taskTitle: string;
        prerequisiteTaskId: string;
        prerequisiteTitle: string;
        reason: string;
      }>;
      timelineConflicts: Array<{
        timelineItemId: string;
        title: string;
        currentStartTime: string;
        suggestedStartTime: string;
        reason: string;
      }>;
      taskRescheduleSuggestions: Array<{
        taskId: string;
        title: string;
        currentDueDate: string | null;
        proposedDueDate: string | null;
        priority: string;
        status: string;
        reason: string;
      }>;
      conflicts: string[];
    } | null;
    impactItems: Array<{
      id: string;
      module: string;
      recordId?: string | null;
      recordTitle?: string | null;
      classification: string;
      severity: string;
      reason: string;
      currentValue?: any;
      proposedValue?: any;
      recommendedAction: string;
    }>;
  };
  aiRecommendations?: {
    summary: string;
    impactLevel: 'low' | 'moderate' | 'high' | 'critical';
    recommendations: Array<{
      category: string;
      title: string;
      description: string;
      reason: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      estimatedImpact?: string | number | null;
      requiresUserApproval: boolean;
    }>;
    warnings: string[];
    alternatives: string[];
  } | null;
  baseEventUpdatedAt: string;
  isStale?: boolean;
  reason?: string | null;
  createdAt: string;
  appliedAt?: string | null;
}

export interface BackendPlanVersion {
  id: string;
  eventId: string;
  versionNumber: number;
  versionLabel: string;
  snapshot: any;
  changeSummary: any;
  sourceProposalId?: string | null;
  createdAt: string;
}

export interface VersionDifferenceItem {
  field: string;
  fromValue: any;
  toValue: any;
  difference: any;
}

export interface VersionComparisonResult {
  fromVersion: {
    id: string;
    versionNumber: number;
    label: string;
    createdAt: string;
  };
  toVersion: {
    id: string;
    versionNumber: number;
    label: string;
    createdAt: string;
  };
  differences: VersionDifferenceItem[];
}

export interface ApplyReplanPayload {
  approvedChanges: {
    budget: boolean;
    guestCount: boolean;
    eventDate: boolean;
  };
  approvedTaskChanges?: Array<{
    taskId: string;
    proposedDueDate: string;
  }>;
  approvedTimelineChanges?: Array<{
    timelineItemId: string;
    proposedStartTime: string;
  }>;
}

