# EventPilot AI — System Architecture

## 1. System Overview

EventPilot AI is an AI-powered celebration and event-planning platform. The system is architected as a cohesive monorepo composed of three primary layers:
1. **Frontend**: Vite + React 19 + TypeScript web application.
2. **Main Backend**: Node.js + Express.js + TypeScript service managing business logic, Supabase PostgreSQL data persistence, authentication integration, and security boundaries.
3. **AI Microservice**: Python 3.11+ FastAPI service providing specialized computation, machine learning pipelines, and upcoming Gemini LLM reasoning capabilities.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer"]
        WebClient["React 19 Frontend\n(Vite + Tailwind v4 + Zustand)\n:3000"]
    end

    subgraph BackendLayer ["Application Core (Node.js)"]
        APIGateway["Express Application\n(Helmet, CORS, Pino)\n:5000"]
        HealthModule["Health & Telemetry Module"]
        ConfigEnv["Zod Config Validation"]
        PrismaORM["Prisma ORM Client"]
    end

    subgraph DataLayer ["Data & Auth (Supabase)"]
        SupaAuth["Supabase Auth Engine\n(auth.users)"]
        PostgresDB[("Supabase PostgreSQL DB\n(user_profiles, events)")]
    end

    subgraph AILayer ["AI Microservice (Python)"]
        FastAPIApp["FastAPI Service\n(Pydantic v2)\n:8000"]
        AIHealth["Health Probes"]
        FutureGemini["Google Gemini 2.5 Engine\n(Phases 5-7)"]
    end

    WebClient -->|"REST API / HTTPS"| APIGateway
    WebClient -.->|"Direct Auth Session"| SupaAuth

    APIGateway --> HealthModule
    APIGateway --> ConfigEnv
    APIGateway --> PrismaORM

    PrismaORM -->|"PostgreSQL (6543 / 5432)"| PostgresDB
    SupaAuth -->|"User UUID FK Mapping"| PostgresDB

    APIGateway -->|"Internal HTTP Requests"| FastAPIApp
    FastAPIApp --> AIHealth
    FastAPIApp -.->|"LLM Reasoning"| FutureGemini
```

---

## 3. Component Responsibilities

### React Frontend (`/src`)
- Responsive user interface for event dashboards, wizards, guest management, budgets, and vendor curation.
- Manages client state via Zustand (`useAppStore.ts`).
- Communicates with the Express backend using standard REST JSON payloads.

### Node.js + Express Backend (`/backend`)
- **API Gateway & Routing**: Exposes unified, versioned REST endpoints (`/api/...`).
- **Security & Authorization**: Enforces CORS, Helmet protection, payload validation with Zod, and JWT token verification.
- **Data Access & Modeling**: Interfaces with Supabase PostgreSQL using Prisma ORM.
- **Service Orchestration**: Mediates communication between client requests and the internal Python AI microservice.

### Python FastAPI AI Service (`/ai-service`)
- **Internal Specialization**: Executes computationally intensive planning logic and prompt pipelines.
- **Model Isolation**: Keeps Python-based machine learning dependencies isolated from the Node.js web server.
- **Future AI Capabilities**: Hosts the Adaptive Re-Planning Engine and Gemini 2.5 Flash agents in Phases 5–7.

### Supabase & PostgreSQL
- **Authentication**: Issues JWTs and manages user identities securely in `auth.users`.
- **Relational Persistence**: Stores structured user profiles, events, budgets, tasks, and vendor contracts.
- **Connection Management**: Supabase connection pooler (pgbouncer) handles concurrent traffic efficiently.

---

## 4. End-to-End Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Event Planner
    participant FE as React Frontend (:3000)
    participant BE as Express Backend (:5000)
    participant DB as Supabase PostgreSQL
    participant AI as Python AI Service (:8000)

    User->>FE: Interacts with Event Planning Dashboard
    FE->>BE: GET /api/health (or future /api/events)
    BE->>DB: Prisma query (e.g. check connection or fetch records)
    DB-->>BE: Query result
    opt When AI Assistance is requested
        BE->>AI: Internal POST /api/v1/adaptive-plan
        AI-->>BE: Optimized planning recommendations
    end
    BE-->>FE: Standardized ApiResponse { success: true, data }
    FE-->>User: Renders real-time UI updates
```
