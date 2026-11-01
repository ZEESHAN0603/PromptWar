# EventPilot AI — Phase 7 Repository & Feature Audit
## Context-Aware AI Co-Pilot (Final Development Phase)

**Audit Date**: November 1, 2026  
**Auditor**: Senior Full-Stack & AI Systems Architect  
**Branch**: `main` (Git Read-Only Enforced)  
**Verification Baseline**: 15 test suites passed (143/143 tests), Frontend builds cleanly (1.14s), Backend builds cleanly

---

## 1. Executive Summary & Existing Architecture

EventPilot AI is a modern celebration and event planning platform designed for weddings, milestone birthdays, anniversaries, corporate events, and personal celebrations. The platform has successfully developed and verified Phases 1 through 6:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Zustand (`src/store/useAppStore.ts`) + custom REST API client (`src/services/apiClient.ts`).
- **Backend API**: Node.js v18+ + Express.js + TypeScript (`backend/src/app.ts`), secured with Helmet, CORS, and centralized error and request-logging middleware (`backend/src/middleware/`).
- **Database & Persistence**: Supabase hosted PostgreSQL exclusively, accessed through Prisma ORM v6.4.1 with verified migrations for Profiles, Events, Budgets, Expenses, Guests, Tasks, Dependencies, Timeline Items, Community Vendors, Contributions, Bookmarks, Event Vendors, Personalized Ideas, Re-plan Proposals, and Plan Versions.
- **Authentication**: Supabase Auth issuing JWT Bearer tokens, verified server-side with `backend/src/middleware/auth.middleware.ts` and `backend/src/config/supabase.ts`.
- **AI Intelligence**: Google Gemini 2.5 (`@google/genai` v2.4.0) with multi-model fallback in `backend/src/services/gemini.service.ts` powering Phase 5 Personalized Ideas and Phase 6 Adaptive Re-Planning.
- **AI Microservice**: Python 3.11+ FastAPI service (`ai-service/`) running health and configuration checks.

Phase 7 is the **final development phase**, delivering a **Context-Aware AI Co-Pilot** that acts as an intelligent planning co-pilot inside each user's event workspace.

---

## 2. Feature Audit Classification

As mandated by Phase 7 guidelines, each existing capability is audited and classified using exactly one of the five required statuses:

| Capability | Scope / Audit Requirement | Audit Classification | Analysis & Justification |
|---|---|---|---|
| **Authentication** | Supabase Auth, JWT verification, bearer token parsing | **EXISTS AND WORKING** | Implemented in `backend/src/middleware/auth.middleware.ts` (`requireAuth`, `requireAdmin`). Verified with 6 unit tests in `backend/tests/auth.test.ts`. Auto-reconnect in `src/services/apiClient.ts`. |
| **User profiles** | User profile CRUD, ownership, role-based authorization | **EXISTS AND WORKING** | Implemented in `backend/src/services/user.service.ts` & `backend/src/controllers/user.controller.ts`. Verified with 6 tests in `backend/tests/profile.test.ts`. |
| **Event management** | Event CRUD, strict tenant ownership, pagination, filtering | **EXISTS AND WORKING** | Implemented in `backend/src/services/event.service.ts` & `backend/src/controllers/event.controller.ts`. Verified with 10 tests in `backend/tests/events.test.ts`. |
| **Budget planner** | Category allocations, expense vouchers, variance calculations | **EXISTS AND WORKING** | Implemented in `backend/src/services/budget.service.ts` (`getBudgetSummary`, categories, expenses). Verified with 14 tests in `backend/tests/budget.test.ts`. |
| **Guest management** | Guest records, RSVP statuses, plus-one aggregations | **EXISTS AND WORKING** | Implemented in `backend/src/services/guest.service.ts` (`getGuestSummary`, RSVP stats). Verified with 8 tests in `backend/tests/guest.test.ts`. |
| **Task management** | Task CRUD, status, priority, BFS cycle dependency detection | **EXISTS AND WORKING** | Implemented in `backend/src/services/task.service.ts`. Includes BFS cycle detection. Verified with 12 tests in `backend/tests/task.test.ts`. |
| **Timeline** | Run-of-show milestones, chronological start/end validation | **EXISTS AND WORKING** | Implemented in `backend/src/services/timeline.service.ts`. Verified with 6 tests in `backend/tests/timeline.test.ts`. |
| **Community vendors** | Approved vendor discovery, contributions, matching scores | **EXISTS AND WORKING** | Implemented in `backend/src/services/vendor.service.ts`, `event-vendor.service.ts`, `vendor-recommendation.service.ts`. Verified with 18 tests in `backend/tests/vendor.test.ts`. |
| **Personalized ideas** | Phase 5 Gemini idea synthesis, category filtering, favorites | **EXISTS AND WORKING** | Implemented in `backend/src/services/idea.service.ts` & `backend/src/services/gemini.service.ts`. Verified with 15 tests in `backend/tests/idea.test.ts`. |
| **Adaptive re-planning** | Phase 6 deterministic impact calculations, proposal history | **EXISTS AND WORKING** | Implemented in `backend/src/services/replan-calculation.service.ts`, `replan.service.ts`. Verified with 31 tests across `replan-calculation.test.ts` and `replan.test.ts`. |
| **Gemini integration** | Configured `@google/genai` singleton, model fallback | **EXISTS AND WORKING** | Implemented in `backend/src/services/gemini.service.ts` with multi-model fallback (`gemini-2.5-flash`, `gemini-3.5-flash`, `gemini-3-flash-preview`, etc.) and Zod validation. |
| **Frontend state** | Global Zustand store, offline cache, optimistic updates | **EXISTS BUT INCOMPLETE** | `src/store/useAppStore.ts` and `src/services/apiClient.ts` work excellently for Phases 1-6. However, the AI assistant UI (`src/components/ai/FloatingAIAssistant.tsx`) and logic (`src/services/aiAssistantService.ts`) currently use **hardcoded mock replies and local keyword matching** without connecting to backend APIs or real database context. |
| **API infrastructure** | Express routing, rate limiting, error formatting, standard responses | **EXISTS AND WORKING** | Implemented in `backend/src/app.ts`, `backend/src/middleware/rate-limit.middleware.ts`, `backend/src/utils/ApiResponse.ts`. The Co-Pilot route group (`/api/copilot`) is not yet registered. |
| **Documentation** | Root README, architecture docs, completion reports | **EXISTS AND WORKING** | High quality documentation exists for Phases 1-6. Needs update for Phase 7 Co-Pilot architecture and API endpoints. |

---

## 3. Relevant Existing Files & Modules

### Backend Modules (To Reuse & Extend)
- **`backend/src/services/gemini.service.ts`**: Reusable Gemini client singleton with model fallbacks, error handling, and robust JSON extraction.
- **`backend/src/services/event.service.ts`**: Reusable event ownership validation (`event.userId === userId`) and formatting.
- **`backend/src/services/budget.service.ts`**: `getBudgetSummary(userId, eventId)` provides exact budget, allocations, expenses, variance, and warnings.
- **`backend/src/services/guest.service.ts`**: `getGuestSummary(userId, eventId)` provides exact confirmed, pending, declined, and headcount numbers.
- **`backend/src/services/task.service.ts`**: `listTasks(userId, eventId, ...)` and dependency checking.
- **`backend/src/services/timeline.service.ts`**: `listTimelineItems(userId, eventId, ...)` provides scheduled milestones.
- **`backend/src/services/vendor-recommendation.service.ts`**: `getVendorRecommendationsForEvent(...)` provides approved community vendor recommendations.
- **`backend/src/services/event-vendor.service.ts`**: `listEventVendors(...)` provides booked/shortlisted workspace vendors.
- **`backend/src/services/idea.service.ts`**: `listEventIdeas(...)` provides saved and generated personalized celebration concepts.
- **`backend/src/services/replan.service.ts`**: `listProposals(...)` and `listVersions(...)` provides re-planning history and snapshots.
- **`backend/src/middleware/auth.middleware.ts`**: Strict authentication enforcement.
- **`backend/src/middleware/rate-limit.middleware.ts`**: In-memory rate limiting generator (`createRateLimiter`).

### Frontend Modules (To Upgrade)
- **`src/services/apiClient.ts`**: Extend with Phase 7 Co-Pilot endpoints (`copilotChat`, `getCopilotConversations`, `createCopilotConversation`, `deleteCopilotConversation`, `previewCopilotAction`, `confirmCopilotAction`).
- **`src/services/aiAssistantService.ts`**: Transition from mock keyword matching to real backend API integration.
- **`src/components/ai/FloatingAIAssistant.tsx`**: Upgrade from mock widget to full context-aware planning co-pilot with message history, action previews, confirmation dialogs, and suggested prompts.
- **`src/components/layout/AppLayout.tsx`**: Host the upgraded Co-Pilot launcher and workspace integration.
- **`src/types/index.ts`**: Extend with Phase 7 Co-Pilot models, message types, and action preview structures.

---

## 4. Reusable Services and Allowlisted Tools

The backend Co-Pilot orchestration will reuse existing services to power 8 allowlisted context tools:

1. `getEventOverview(userId, eventId)` → Reuses `EventService.getEventById`
2. `getBudgetSummary(userId, eventId)` → Reuses `BudgetService.getBudgetSummary`
3. `getGuestSummary(userId, eventId)` → Reuses `GuestService.getGuestSummary`
4. `getTaskSummary(userId, eventId)` → Reuses `TaskService.listTasks`
5. `getTimelineSummary(userId, eventId)` → Reuses `TimelineService.listTimelineItems`
6. `getApprovedVendors(userId, eventId)` → Reuses `event-vendor.service` and `vendor-recommendation.service`
7. `getSavedIdeas(userId, eventId)` → Reuses `idea.service.ts` (`listEventIdeas`)
8. `getReplanningHistory(userId, eventId)` → Reuses `ReplanService.listProposals` and `ReplanService.listVersions`

All data access is backend-controlled with strict user ownership verification. No direct SQL or Prisma queries are ever exposed to the LLM.

---

## 5. Missing Functionality to Implement

1. **Backend Co-Pilot Foundation**:
   - `backend/src/types/copilot.types.ts`: Domain types for Co-Pilot conversation, messages, tool execution, action previews, and action confirmation.
   - `backend/src/validators/copilot.validator.ts`: Zod schemas for chat inputs, conversation lifecycle, action preview, and action confirmation.
   - `backend/src/services/copilot-context.service.ts`: Scoped context retrieval layer.
   - `backend/src/services/copilot-tools.service.ts`: Allowlisted tool execution engine.
   - `backend/src/services/copilot.service.ts`: AI prompt orchestration, Gemini conversation handling, read-only facts synthesis, and action preview generation.
   - `backend/src/controllers/copilot.controller.ts`: REST request handling.
   - `backend/src/routes/copilot.routes.ts`: Routes registered under `/api/copilot` in `backend/src/app.ts`.

2. **Conversation Persistence (Optional & Additive)**:
   - `CopilotConversation` and `CopilotMessage` Prisma models for storing multi-turn chat history.
   - Requires non-destructive additive migration submitted for user approval prior to application.

3. **Two-Step Confirmed Actions Engine**:
   - Read-only default: Co-Pilot never mutates data directly from conversational text.
   - For write requests (e.g. creating a task, updating a task, adding a timeline milestone, saving an idea, or drafting a re-planning proposal):
     - Step 1: AI produces structured `actionPreview` with parameters and human-readable explanation.
     - Step 2: User explicitly reviews and clicks Confirm in the UI.
     - Step 3: Backend re-verifies ownership, validates inputs via Zod, and delegates execution exclusively to the existing, proven domain service (`TaskService`, `TimelineService`, `IdeaService`, `ReplanService`).

4. **Frontend Context-Aware Co-Pilot Experience**:
   - Modern chat interface supporting Markdown, structured recommendation cards, financial stat badges, contextual suggested prompts, and action preview/confirmation modals.
   - Auto-detection of active event from route or workspace context.

5. **Automated Testing Suite**:
   - Vitest test suite `backend/tests/copilot.test.ts` covering authenticated chat, context retrieval, tool validation, unauthenticated rejection, cross-tenant isolation, prompt injection defense, rate limiting, and action confirmation flows.

---

## 6. Broken or Incomplete Functionality Identified

- **`src/services/aiAssistantService.ts`**: Contains simulated static responses that bypass the database and backend. Must be replaced with real backend calls to `/api/copilot/chat`.
- **`src/components/ai/FloatingAIAssistant.tsx`**: Uses hardcoded simulated action dispatches and does not support true streaming or backend-persisted conversations. Must be upgraded to support real context retrieval and action confirmation workflows.

---

## 7. Proposed Implementation Plan

The implementation will proceed according to the prompt's defined stages:

- **Stage 1 — Repository Audit & Design Review**: (Current stage; document `docs/phase-7-audit.md`).
- **Stage 2 — Database Schema & Migration Review**: Prepare minimal additive Prisma models for `CopilotConversation` and `CopilotMessage`. Present migration SQL for user review before running.
- **Stage 3 — Backend Co-Pilot Foundation & Context Layer**: Build `copilot.types.ts`, `copilot.validator.ts`, `copilot-context.service.ts`, `copilot-tools.service.ts`.
- **Stage 4 — Gemini Orchestration & System Prompt Engineering**: Implement 14 system prompt rules in `gemini.service.ts` / `copilot.service.ts`, tool calling orchestration, and read-only facts synthesis.
- **Stage 5 — Action Preview & Confirmation Engine**: Implement `/api/copilot/actions/preview` and `/api/copilot/actions/confirm` reusing existing services.
- **Stage 6 — Frontend Co-Pilot Interface & Integration**: Extend `apiClient.ts`, build `CopilotChat.tsx`, `CopilotMessage.tsx`, `CopilotInput.tsx`, `CopilotSuggestions.tsx`, update `FloatingAIAssistant.tsx` and workspace entrypoints.
- **Stage 7 — Testing & Verification**: Write `backend/tests/copilot.test.ts`, run all backend tests, run frontend typechecks and production builds.
- **Stage 8 — Documentation & Regression Verification**: Update `README.md`, create `docs/phase-7-copilot.md`, update `docs/architecture.md`, `docs/api-reference.md`, create `docs/phase-7-completion.md`.

---

## 8. Potential Risks and Mitigation Strategies

1. **Risk: Gemini API Rate Limits or Quota Exceeded**
   - *Mitigation*: Multi-model fallback list already established in `gemini.service.ts`. Fallback to deterministic structured summary if Gemini is unavailable, ensuring the customer is never left with an empty or broken screen.
2. **Risk: Accidental or Hallucinated Database Mutations**
   - *Mitigation*: Strict read-only default. Write actions require explicit user confirmation via a separate, authenticated `/api/copilot/actions/confirm` endpoint that revalidates user permissions.
3. **Risk: Cross-Tenant Data Access or Context Leakage**
   - *Mitigation*: Every tool execution and context retrieval verifies `event.userId === req.user.id` on the server before querying database records.
4. **Risk: Prompt Injection Attacks**
   - *Mitigation*: User messages and retrieved database records are treated as untrusted strings wrapped in designated XML/fenced tags, explicitly instructed never to override core system rules.
5. **Risk: Database Regression or Migration Failure**
   - *Mitigation*: Strictly additive SQL migration. No tables dropped, no data truncated. Migration SQL presented for explicit review before application.

