# EventPilot AI Architecture — Phase 2

## 1. System Overview

EventPilot AI employs a decoupled three-tier architecture connecting a React 19 frontend client to an Express.js TypeScript backend and a Supabase-hosted PostgreSQL database.

```mermaid
flowchart TD
    subgraph Frontend["React 19 Client (:3000)"]
        UI["UI Pages & Components\n(Dashboard, Wizard, Overview, Settings)"]
        Store["Zustand Global Store\n(useAppStore)"]
        SupaClient["Supabase Auth Client\n(@supabase/supabase-js)"]
        APIClient["API Client\n(apiClient.ts with Bearer Token)"]
    end

    subgraph SupabaseAuth["Supabase Authentication"]
        AuthService["Supabase Auth Service\n(auth.users)"]
    end

    subgraph Backend["Express Backend (:5000)"]
        AuthMW["requireAuth Middleware\n(Token Verification)"]
        UserRouter["/api/users Router\n(Profile Management)"]
        EventRouter["/api/events Router\n(Event CRUD & Isolation)"]
        HealthRouter["/api/health Router\n(Telemetry)"]
        PrismaORM["Prisma Client ORM\n(Singleton)"]
    end

    subgraph Database["Supabase PostgreSQL"]
        ProfilesTable[("profiles Table\n(id = auth.users.id)")]
        EventsTable[("events Table\n(userId -> profiles.id)")]
    end

    UI --> Store
    Store --> SupaClient
    Store --> APIClient
    SupaClient <-->|"Sign In / Sign Up / Session"| AuthService
    APIClient -->|"HTTP + Bearer JWT"| AuthMW
    AuthMW <-->|"Verify JWT via getUser()"| AuthService
    AuthMW --> UserRouter
    AuthMW --> EventRouter
    UserRouter --> PrismaORM
    EventRouter --> PrismaORM
    HealthRouter --> PrismaORM
    PrismaORM <--> ProfilesTable
    PrismaORM <--> EventsTable
```

---

## 2. Communication & Authentication Flow

1. **User Authentication**:
   - The user provides credentials on the frontend Login/Signup form.
   - The frontend `@supabase/supabase-js` client submits credentials to Supabase Auth.
   - Supabase authenticates the user and issues a signed JWT access token.
   - The frontend stores the session securely and tracks the current authenticated state.

2. **API Request Dispatch**:
   - When communicating with the Express backend, `apiClient` attaches the JWT in the `Authorization` header:
     `Authorization: Bearer <access_token>`

3. **Backend Middleware Verification**:
   - `requireAuth` middleware intercepts the request.
   - Checks presence and Bearer format of the header (rejects with 401 if missing/malformed).
   - Validates the token against Supabase Auth (`supabase.auth.getUser(token)`).
   - If invalid or expired, returns HTTP 401 Unauthorized.
   - If valid, extracts the verified user ID and metadata (`id`, `email`, `fullName`, `avatarUrl`) and attaches it to `req.user`.

4. **Resource Ownership & Data Isolation**:
   - Domain controllers (`UserController`, `EventController`) extract `req.user.id`.
   - Never trust user IDs provided in the request body or query parameters.
   - Queries to `events` table strictly constrain `where: { userId: req.user.id }`.
   - If a user attempts to access, update, or delete another user's event, the server returns HTTP 404 Not Found to prevent leaking the existence of unauthorized resources.

---

## 3. Database Layer & Prisma ORM

- **Single Database Authority**: Hosted Supabase PostgreSQL exclusively.
- **Connection Strategy**:
  - Connection pooling (Port 6543) with PgBouncer for API runtime queries.
  - Direct connection (Port 5432) for Prisma CLI schema migrations.
- **Foreign Key Relationships**:
  - `Profile` primary key `id` corresponds directly to `auth.users.id` (UUID).
  - `Event` belongs to one `Profile` via `userId` foreign key.
  - Deleting an event never affects shared community vendor records or other users' data.

