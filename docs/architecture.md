# EventPilot AI System Architecture — Complete Multi-Phase Specification

**Platform Version**: EventPilot AI 1.0 (Phases 1–7 Final Architecture)  
**Last Updated**: November 1, 2026  
**Status**: Production Ready & Fully Verified

---

## 1. System Overview

EventPilot AI employs a decoupled multi-tier architecture connecting a modern React 19 frontend client to an Express.js TypeScript backend, a Supabase-hosted PostgreSQL database, and Google Gemini AI engines.

```mermaid
flowchart TD
    subgraph Frontend["React 19 Frontend (:3000)"]
        UI["UI Pages\n(Dashboard, Budget, Guests, Tasks,\nTimeline, Vendors, Ideas, Settings)"]
        CoPilotUI["Context-Aware AI Co-Pilot\n(Floating Assistant & Action Confirmation)"]
        AdaptiveUI["Adaptive Re-Planning Studio\n(Simulation & Version Comparison)"]
        Store["Zustand Global Store\n(useAppStore & sync slices)"]
        SupaClient["Supabase Auth Client\n(@supabase/supabase-js)"]
        APIClient["API Client\n(apiClient.ts with Bearer Token)"]
    end

    subgraph SupabaseAuth["Supabase Authentication"]
        AuthService["Supabase Auth Service\n(auth.users JWT Issuer)"]
    end

    subgraph Backend["Express.js TypeScript Backend (:5000)"]
        AuthMW["requireAuth Middleware\n(JWT Verification)"]
        RateLimiter["Rate Limiters\n(In-Memory Sliding Window)"]
        
        UserRouter["/api/users Router\n(Profiles)"]
        EventRouter["/api/events Router\n(Event CRUD & Workspace)"]
        BudgetRouter["/api/events/:id/budget\n(Categories, Expenses, Variance)"]
        GuestRouter["/api/events/:id/guests\n(RSVP, Headcount)"]
        TaskRouter["/api/events/:id/tasks\n(Tasks, BFS Cycle Guard)"]
        TimelineRouter["/api/events/:id/timeline\n(Run-of-show Milestones)"]
        VendorRouter["/api/vendors Router\n(Community Discovery & Recommendations)"]
        IdeaRouter["/api/events/:id/ideas\n(Personalized Ideas Engine)"]
        ReplanRouter["/api/events/:id/replan\n(Adaptive Engine & Versions)"]
        CopilotRouter["/api/copilot Router\n(Context-Aware AI Co-Pilot)"]
        
        CopilotOrch["Copilot Orchestration Service\n(System Prompt & Allowlisted Tools)"]
        ContextService["Copilot Context Service\n(8 Scoped Retrieval Functions)"]
        ConfirmationEngine["Two-Step Action Confirmation Engine"]
        
        PrismaORM["Prisma Client ORM\n(Singleton v6.4.1)"]
    end

    subgraph ExternalAI["AI Engines"]
        GeminiClient["Google Gemini 2.5 SDK\n(@google/genai Multi-Model Fallback)"]
        AIService["Python FastAPI AI Microservice\n(:8000)"]
    end

    subgraph Database["Supabase PostgreSQL (Hosted)"]
        ProfilesTable[("profiles Table")]
        EventsTable[("events Table")]
        CategoriesTable[("budget_categories Table")]
        ExpensesTable[("expenses Table")]
        GuestsTable[("guests Table")]
        TasksTable[("tasks Table")]
        DependenciesTable[("task_dependencies Table")]
        TimelineTable[("timeline_items Table")]
        CommunityVendorsTable[("community_vendors Table")]
        ContributionsTable[("vendor_contributions Table")]
        EventVendorsTable[("event_vendors Table")]
        IdeasTable[("personalized_ideas Table")]
        ReplanProposalsTable[("event_replan_proposals Table")]
        PlanVersionsTable[("event_plan_versions Table")]
        CopilotConversationsTable[("copilot_conversations Table")]
        CopilotMessagesTable[("copilot_messages Table")]
    end

    UI --> Store
    CoPilotUI --> Store
    AdaptiveUI --> Store
    Store --> SupaClient
    Store --> APIClient
    SupaClient <-->|"Sign In / Token Refresh"| AuthService
    APIClient -->|"HTTP + Bearer JWT"| AuthMW
    AuthMW <-->|"Verify JWT via getUser()"| AuthService
    AuthMW --> RateLimiter

    RateLimiter --> UserRouter
    RateLimiter --> EventRouter
    RateLimiter --> VendorRouter
    RateLimiter --> CopilotRouter

    EventRouter --> BudgetRouter
    EventRouter --> GuestRouter
    EventRouter --> TaskRouter
    EventRouter --> TimelineRouter
    EventRouter --> IdeaRouter
    EventRouter --> ReplanRouter

    IdeaRouter --> GeminiClient
    ReplanRouter --> GeminiClient

    CopilotRouter --> CopilotOrch
    CopilotOrch --> ContextService
    ContextService --> PrismaORM
    CopilotOrch --> GeminiClient
    CopilotOrch --> ConfirmationEngine

    ConfirmationEngine --> TaskRouter
    ConfirmationEngine --> TimelineRouter
    ConfirmationEngine --> IdeaRouter
    ConfirmationEngine --> ReplanRouter

    UserRouter --> PrismaORM
    EventRouter --> PrismaORM
    BudgetRouter --> PrismaORM
    GuestRouter --> PrismaORM
    TaskRouter --> PrismaORM
    TimelineRouter --> PrismaORM
    VendorRouter --> PrismaORM
    IdeaRouter --> PrismaORM
    ReplanRouter --> PrismaORM
    CopilotRouter --> PrismaORM

    PrismaORM <--> Database
```

---

## 2. Multi-Phase Capabilities & Business Engines

### Phase 1: Foundation & Security Scaffolding
- PostgreSQL database hosted exclusively on Supabase.
- Strict Prisma ORM singleton client pattern.
- Pino structured logging and environment variable masking.
- Centralized error and 404 middleware.

### Phase 2: Authentication & Event CRUD
- Supabase Auth issuing JWT Bearer tokens with client-side auto-refresh.
- Multi-tenant data isolation: all event queries enforce `event.userId === req.user.id`.
- User profiles synced directly to `auth.users.id`.

### Phase 3: Core Event Planning Modules
- **Budget Planner**: Dynamic category allocations, expense vouchers, variance tracking, and automated deficit alerts.
- **Guest Management**: RSVP state tracking (`pending`, `attending`, `declined`), plus-one headcount aggregation, and dietary preferences.
- **Task Management**: Milestone checklists, due date prioritization, and Breadth-First Search (BFS) dependency cycle detection.
- **Timeline**: Chronological run-of-show milestones with start/end time validation.

### Phase 4: Community Vendor Recommendation Network
- Public directory of verified, price-benchmarked community vendors.
- Transparent recommendation engine scoring vendors from 0 to 100 based on event category, city match, and budget suitability.
- Event workspace vendor assignments with cost tracking.

### Phase 5: Personalized Ideas Engine (Gemini 2.5)
- AI-synthesized celebration concepts strictly tailored to verified event type, budget, guest count, and theme.
- Category filtering and bookmarking to favorites.

### Phase 6: Adaptive Event Re-Planning Engine
- Real-time simulation and rebalancing when financial allocations, guest headcounts, or celebration dates shift.
- Deterministic impact calculation engine independent of LLMs.
- Concurrency-safe proposal lifecycle with stale-state conflict detection (`baseEventUpdatedAt`).
- Atomic Prisma transactions preserving actual expenses while updating approved dimensions.
- Immutable event plan snapshots and sequential version history (`v1.0`, `v2.0`...).

### Phase 7: Context-Aware AI Co-Pilot (Final Phase)
- **Natural-Language Event Assistance**: Answers queries using actual verified database records across all planning modules.
- **8 Backend-Scoped Context Retrieval Tools**: Scoped strictly to the authenticated user and authorized event.
- **Strict Read-Only Default**: AI cannot directly mutate database records from chat text.
- **Two-Step Confirmed Actions Engine**: Previews actions (create task, schedule milestone, save idea, draft proposal) and requires explicit user confirmation.
- **Persistent Conversation Sessions**: Stores conversation history in `copilot_conversations` and `copilot_messages` with strict user isolation.
- **Resilient Fallback**: Gracefully falls back to deterministic fact summaries if Gemini API encounters rate limits or network timeouts.

---

## 3. Security, Authorization & Tenant Isolation

1. **Authentication Enforcement**: All API endpoints require a valid Supabase Auth Bearer JWT token validated via `requireAuth`.
2. **Server-Side Ownership Verification**: Every event and conversation query verifies ownership (`userId === req.user.id`) on the server.
3. **No Direct Database Access for AI**: Gemini never receives direct SQL or Prisma access; it interacts exclusively through allowlisted context functions.
4. **Prompt Injection Neutralization**: All user inputs and database records are treated as untrusted data within strict system prompt boundaries.
5. **No Secret Leakage**: API keys, database credentials, and internal prompt templates are masked and never exposed.
