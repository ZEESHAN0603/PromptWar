# 🌟 EventPilot AI — Autonomous Celebration & Event Architecture Platform

<p align="center">
  <img src="https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20%7C%20Pro-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 2.5" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/React-19%20%2B%20Vite%20%2B%20Tailwind%204-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-Express%20%2B%20TypeScript-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node Express" />
  <img src="https://img.shields.io/badge/Prisma-Type--Safe%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tests-168%20Passing%20(100%25)-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" />
</p>

<p align="center">
  <strong>Transforming high-stakes celebrations through personalized AI planning, deterministic financial re-balancing, community vendor curation, and context-aware agent execution.</strong>
</p>

---

## 🏆 Hackathon Executive Summary

### The Problem
Event planning is notoriously chaotic, stressful, and unforgiving. Planners and hosts juggle fragmented spreadsheets, disjointed chat apps, opaque vendor pricing, and cascading deadlines. When budgets shrink or guest lists surge, recalculating allocations and adjusting dependency schedules is error-prone, resulting in budget overruns, duplicate bookings, and venue chaos.

### The Innovation: EventPilot AI
**EventPilot AI** bridges generative creativity with deterministic financial and operational precision:
- **No Hallucinated Finances**: Financial calculations, allocations, and timeline dependencies are deterministic and mathematically guaranteed.
- **Context-Grounded AI Co-Pilot**: An autonomous assistant that inspects actual event state from PostgreSQL, proposes structured changes, and executes mutations only after explicit human confirmation.
- **Adaptive Re-Planning Engine**: Single-click scenario simulations that rebalance budgets and adjust dependent timelines with atomic concurrency protection.
- **Curated Community Ecosystem**: Peer-reviewed vendor directory with fair-pricing ratings and administrative moderation.

---

## 🏗️ System Architecture

EventPilot AI is engineered as an enterprise-grade monorepo combining a high-performance React 19 frontend, an Express + TypeScript API gateway with Prisma ORM on Supabase PostgreSQL, a Python FastAPI microservice, and Google Gemini 2.5 intelligence.

```mermaid
flowchart TD
    subgraph Client ["Client Tier (React 19 + TypeScript + Vite)"]
        UI["Modern Responsive UI\n(Tailwind CSS v4 + Lucide)"]
        Store["Zustand Global State\n(Auth, Event Context, Re-Planning, AI Chat)"]
        ClientAPI["Hardened API Client\n(JWT Bearer Injection, Auto-Retry)"]
        UI --> Store
        Store --> ClientAPI
    end

    subgraph Gateway ["Backend API Gateway (Node.js + Express + TypeScript)"]
        AuthMiddleware["JWT Authentication\n(Supabase Auth + Role Verification)"]
        Router["Validated Route Controllers\n(Zod Input & Param Schemas)"]
        Services["Domain Business Services\n(Event, Budget, Guest, Task, Vendor, Replan, Copilot)"]
        PrismaClient["Prisma ORM Client\n(Connection Pooling + Atomic Transactions)"]
        Logger["Pino Structured Logger\n(Credential & Token Redaction)"]

        ClientAPI -->|"REST / JSON"| AuthMiddleware
        AuthMiddleware --> Router
        Router --> Services
        Services --> PrismaClient
        Services --> Logger
    end

    subgraph Data ["Data & Identity Tier (Supabase Cloud)"]
        Postgres[("Supabase PostgreSQL\n(Row-Level Security, Cascade Rules, Indices)")]
        SupaAuth["Supabase GoTrue Auth\n(Identity & Session Tokens)"]
        PrismaClient --> Postgres
        AuthMiddleware -.->|"Verify Token"| SupaAuth
    end

    subgraph AI ["AI Intelligence Tier"]
        GeminiSDK["@google/genai SDK\n(Gemini 2.5 Flash / Pro Ladder)"]
        PythonService["Python 3.11 FastAPI\n(Scaffolding & Background Analytics)"]
        
        Services -->|"Idea Gen & Co-Pilot"| GeminiSDK
        Services -.->|"Internal HTTP"| PythonService
    end

    classDef primary fill:#4f46e5,stroke:#3730a3,color:#ffffff;
    classDef secondary fill:#059669,stroke:#047857,color:#ffffff;
    classDef storage fill:#0284c7,stroke:#0369a1,color:#ffffff;
    classDef ai fill:#d97706,stroke:#b45309,color:#ffffff;
    
    class UI,Store,ClientAPI primary;
    class AuthMiddleware,Router,Services,PrismaClient Gateway secondary;
    class Postgres,SupaAuth storage;
    class GeminiSDK,PythonService ai;
```

---

## ⚡ Core Breakthrough Capabilities

### 1. 🤖 Context-Aware AI Co-Pilot (Interactive Assistance)
- **Database Context Grounding**: The Co-Pilot aggregates real-time event details, budget categories, remaining allocations, guest RSVPs, and task dependencies into structured prompts.
- **Allowlisted Action Previews**: When an action is requested (e.g., *"Add \$500 decor category"* or *"Invite 15 guests"*), the AI produces a structured `actionPreview` with diff highlights.
- **Two-Step Human Confirmation**: No database mutation is ever executed without an explicit confirmation dialog signed by the event owner.

### 2. ⚡ Deterministic Adaptive Re-Planning Engine
- **Instant Cascade Recalculation**: Adjusting guest counts or budgets triggers an authoritative calculation engine that rebalances categories, flags overages, and detects schedule risks.
- **Topological Task Scheduling**: BFS-based dependency cycle detection prevents circular task blockers and automatically shifts dependent milestones.
- **Atomic Concurrency Defense**: Optimistic revision tracking bumps the event revision whenever any child record (expenses, guests, tasks, timeline, vendors) changes, rejecting stale proposals with HTTP 409 Conflict.
- **Immutable Version History**: Full snapshot archiving allows instant one-click rollback to any previous celebration plan version.

### 3. 🎨 Personalized Celebration Ideas (Google Gemini 2.5)
- **Multi-Model Intelligence Ladder**: Generates culturally tailored, budget-conscious celebration ideas with graceful degradation across Gemini 2.5 Flash and Pro.
- **Structured JSON Schema**: Strict Zod response validation guarantees parseable titles, estimated cost ranges, effort levels, impact scores, and vendor category tags.
- **One-Click Persistence**: Planners can bookmark, filter, and convert AI ideas directly into tracked budget categories and tasks.

### 4. 🤝 Community Vendor Network & Moderation
- **Crowdsourced Vendor Hub**: Community-submitted wedding, gala, and party vendors categorized by city, specialty, and price tier.
- **Deterministic Match Scoring**: Proprietary scoring algorithm ranks vendors against event requirements, budget headroom, and guest capacity.
- **Role-Based Moderation**: Submitted contributions undergo review via admin workflows before publication to the public directory.

### 5. 📊 Precision Financial & Guest Operations
- **Real-Time Variance Analysis**: Live calculation of allocated vs. estimated vs. actual expenses with over-budget alert thresholds.
- **Safe Cascade Deletion**: Deleting a category unassigns expenses to an "Uncategorized" pool rather than deleting historical receipts.
- **Plus-One Headcount Aggregation**: Accurate catering projections tracking confirmed guests, plus-ones, and dietary restrictions.

### 6. 🛡️ Enterprise-Grade Security
- **Strict Anti-IDOR Authorization**: Every route verifies user event ownership; unauthorized access yields HTTP 404 to prevent resource enumeration.
- **Zero Client-Side Credential Exposure**: Gemini API keys and Supabase service-role keys reside exclusively on the backend server.
- **Clean Production Builds**: No demo fallback accounts or hardcoded credentials bundled in client distribution packages.

---

## 🛠️ Technology Stack Matrix

| Tier | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts | High-performance, responsive UI with interactive charts and dark mode |
| **State Management** | Zustand (Persistent Storage) | Unified client state for auth, events, budget, timeline, and AI chat |
| **Backend Gateway** | Node.js (v18+), Express.js, TypeScript | REST API gateway with centralized middleware and request logging |
| **Database & ORM** | Supabase-hosted PostgreSQL, Prisma ORM 5 | ACID-compliant relational storage, migrations, and connection pooling |
| **Authentication** | Supabase Auth (GoTrue), JWT Verification | Secure session management, password hashing, and token validation |
| **Generative AI** | Google Gemini 2.5 Flash / Pro (`@google/genai` SDK) | Celebration ideation, replanning advice, and conversational Co-Pilot |
| **Microservice** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn | Internal Python foundation and background processing |
| **Testing & Quality** | Vitest, Supertest, pytest, ESLint, TypeScript `tsc` | 168 Vitest integration tests + 4 Python tests (100% pass rate) |

---

## 📁 Repository Structure

```
EventPilot-AI/
├── src/                         # React 19 Frontend Application
│   ├── components/              # Modular UI components (Layout, Budget, Copilot, Modals)
│   ├── pages/                   # 12 Full application page views
│   ├── services/                # API client with token injection & Supabase config
│   ├── store/                   # Zustand global state slices
│   ├── types/                   # Shared TypeScript domain models
│   └── utils/                   # Currency formatters, date utilities, helpers
├── backend/                     # Node.js + Express + Prisma API Service
│   ├── prisma/                  # Prisma schema & PostgreSQL migration history
│   │   ├── migrations/          # Applied migration records
│   │   └── schema.prisma        # 14 Relational models, constraints, indices
│   ├── src/
│   │   ├── config/              # Zod env validation, Prisma singleton, Pino logger
│   │   ├── controllers/         # REST endpoint controllers (Auth, Event, Copilot, Replan)
│   │   ├── middleware/          # JWT auth guard, error handler, Pino request logger
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Domain logic (Event, Replan, Budget, Guest, Task, Gemini)
│   │   └── validators/          # Zod schema validators for request payloads
│   └── tests/                   # 16 Vitest test suites (168 integration tests)
├── ai-service/                  # Python 3.11 FastAPI Microservice
│   ├── app/                     # FastAPI app, configuration, and health endpoints
│   ├── tests/                   # Pytest test suite with TestClient
│   └── requirements.txt         # Pinned Python dependencies
├── docs/                        # Comprehensive Architecture & Audit Suite
│   ├── architecture.md          # Monorepo architecture and service design
│   ├── api-reference.md         # Complete REST API reference
│   ├── database-design.md       # Relational models and indexing strategy
│   ├── deployment-readiness.md  # Production deployment runbook & checklist
│   ├── security-audit.md        # Application security, RLS, and auth audit
│   └── production-blocker-resolution.md # Concurrency & production certification
├── .env.example                 # Frontend environment configuration template
├── package.json                 # Monorepo root scripts
└── README.md                    # Platform documentation (You are here)
```

---

## 🚀 Quick Start Guide (< 3 Minutes)

### Prerequisites
- **Node.js**: `v18.0.0+` (`v22` recommended)
- **Python**: `3.11+`
- **Supabase Account**: An active Supabase project (Free Tier supported)

### Step 1: Clone & Configure Environments
```bash
# Clone the repository
git clone https://github.com/your-org/eventpilot-ai.git
cd eventpilot-ai

# Configure frontend environment
cp .env.example .env

# Configure backend environment
cp backend/.env.example backend/.env
```

### Step 2: Install Dependencies & Validate Database
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Validate Prisma schema against Supabase
npm run prisma:validate
npm run prisma:generate
cd ..
```

### Step 3: Launch Services
```bash
# Terminal 1: Start Express Backend (Port 5000)
cd backend && npm run dev

# Terminal 2: Start React Frontend (Port 3000)
npm run dev

# Terminal 3 (Optional): Start Python AI Service (Port 8000)
cd ai-service && uvicorn app.main:app --port 8000
```
Open **[http://localhost:3000](http://localhost:3000)** to launch EventPilot AI!

---

## 🧪 Rigorous Quality & Verification

Every endpoint, calculation service, and security boundary is backed by automated tests:

```bash
# Run all 16 backend integration test suites (168 tests)
npm --prefix backend test

# Run Python AI service tests (4 tests)
cd ai-service && pytest

# Run frontend typecheck and production build
npm run lint
npm run build

# Run backend compilation check
npm --prefix backend run build
```

### Verification Matrix
- ✅ **Backend Vitest**: **168 passed (100% pass rate)** across Auth, Events, Budget, Guests, Tasks, Timeline, Vendors, Gemini Ideas, Re-Planning Concurrency, and AI Co-Pilot.
- ✅ **Python Pytest**: **4 passed (100%)** covering FastAPI lifecycle and health endpoints.
- ✅ **Frontend TypeScript**: **0 errors** (`tsc --noEmit`).
- ✅ **Frontend Production Build**: Built cleanly in **1.23s** with zero bundled demo credentials.
- ✅ **Backend TypeScript**: Dist compilation succeeded with **0 errors**.

---

## 📚 Complete Documentation Suite

For detailed technical references, inspect the curated documentation hub:
- 📖 **[System Architecture](docs/architecture.md)** — Detailed monorepo design, microservice topology, and data flow.
- 🔌 **[API Reference](docs/api-reference.md)** — Complete OpenAPI-style documentation for all REST endpoints.
- 🗄️ **[Database Design](docs/database-design.md)** — Relational schema, foreign keys, cascade rules, and indexes.
- 🛡️ **[Security Audit](docs/security-audit.md)** — Zero-trust access controls, JWT validation, and IDOR defense.
- 🚀 **[Deployment Readiness](docs/deployment-readiness.md)** — Production hosting, environment configuration, and runbook.
- 🔒 **[Production Blocker Resolution](docs/production-blocker-resolution.md)** — Engineering certification of concurrency and security fixes.

---

## 👥 Hackathon Team & Acknowledgements

Built with passion for the **AI Agent Hackathon 2026** to revolutionize celebration planning through the combined power of **Google Gemini 2.5**, **Supabase PostgreSQL**, and **Modern React**.

<p align="center">
  <sub>EventPilot AI &copy; 2026. Released under the MIT License.</sub>
</p>
