# EventPilot AI — Production Deployment Readiness Guide
**Infrastructure Architecture, Environment Configuration & Operational Runbook**

- **Date**: November 1, 2026
- **Auditor**: DevOps & Deployment Specialist
- **Architecture**: React 19 Frontend + Express/TypeScript Backend + Supabase PostgreSQL + Google Gemini AI

---

## 1. Production Architecture Overview

The recommended and verified production deployment architecture for EventPilot AI leverages decoupled, cloud-native services:

```mermaid
flowchart TD
    subgraph ClientLayer["Edge & Client Tier"]
        Users["Web & Mobile Browsers"] -->|HTTPS / WSS| Vercel["Vercel / Netlify\nReact 19 Frontend CDN"]
    end

    subgraph ServiceLayer["Application Tier"]
        Vercel -->|REST API (HTTPS Bearer)| Render["Railway / Render / AWS ECS\nNode.js Express Backend\nDocker-free Native Process"]
    end

    subgraph DataLayer["Managed Data Tier"]
        Render -->|Prisma Pooler Port 6543| SupabaseDB[("Supabase PostgreSQL\nManaged DB with pgbouncer")]
        Render -->|Direct Port 5432| SupabaseDirect[("Supabase Direct\nMigrations Only")]
        Vercel -->|Auth Sessions| SupabaseAuth["Supabase Authentication\nManaged Auth Engine"]
        Render -->|Verify Tokens| SupabaseAuth
    end

    subgraph AILayer["AI Intelligence Tier"]
        Render -->|Official GenAI SDK| Gemini["Google Gemini API\ngemini-2.5-flash / gemini-3.5-flash"]
    end
```

### Hosting Strategy Recommendations
1. **Frontend**: **Vercel** or **Netlify**
   - Ideal for static single-page applications built with Vite.
   - Built-in global edge CDN, automatic HTTPS, and pull request preview deployments.
2. **Backend**: **Railway** or **Render**
   - Native Node.js 18+ runtime support without requiring Docker containers.
   - Automated health checks, zero-downtime rolling deploys, and environment secret injection.
3. **Database & Auth**: **Supabase** (Managed Cloud)
   - Supabase PostgreSQL with built-in PgBouncer transaction pooling.
   - Supabase Authentication engine managing secure user identities and JWT issuance.
4. **AI Microservice**: **Optional Secondary**
   - The Python FastAPI service can be deployed to Railway/Render if dedicated Python NLP features are enabled. Core Gemini features run directly on the Node backend.

---

## 2. Environment Variables Configuration

### 2.1 Backend Environment (`backend/.env` or Platform Secret Manager)
| Variable | Required | Production Value / Pattern | Description |
|---|---|---|---|
| `PORT` | Yes | `5000` or assigned by platform | HTTP listening port |
| `NODE_ENV` | Yes | `production` | Enables production error redaction |
| `FRONTEND_URL` | Yes | `https://eventpilot.yourdomain.com` | Allowed CORS origin |
| `DATABASE_URL` | Yes | `postgresql://postgres:[PW]@db.[REF].supabase.co:6543/postgres?pgbouncer=true` | Supabase PgBouncer pooler URL |
| `DIRECT_URL` | Yes | `postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres` | Supabase direct connection for migrations |
| `SUPABASE_URL` | Yes | `https://[REF].supabase.co` | Supabase project API gateway |
| `SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase client anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` | Supabase backend admin key (SECRET) |
| `JWT_SECRET` | Yes | High-entropy string (min 32 chars) | Matches Supabase Auth JWT Secret |
| `GEMINI_API_KEY` | Yes | AI Studio API Key | Google Gemini AI authentication key |
| `GEMINI_MODEL` | Yes | `gemini-2.5-flash` | Production AI model name |

### 2.2 Frontend Environment (`.env.production` or Platform Secret Manager)
| Variable | Required | Production Value / Pattern | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `https://api.eventpilot.yourdomain.com/api` | Backend API root URL |
| `VITE_SUPABASE_URL` | Yes | `https://[REF].supabase.co` | Supabase project API gateway |
| `VITE_SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase public client anon key |
| `VITE_ENABLE_DEMO_FALLBACK` | No | `false` | Disables demo login fallback in production |

---

## 3. Build & Runtime Commands

### Backend
- **Install Dependencies**: `npm ci`
- **Generate Prisma Client**: `npm run prisma:generate`
- **Validate Schema**: `npm run prisma:validate`
- **Build TypeScript**: `npm run build` (outputs to `dist/`)
- **Production Start**: `node dist/server.js`

### Frontend
- **Install Dependencies**: `npm ci`
- **Typecheck**: `npm run lint`
- **Build Bundle**: `npm run build` (outputs to `dist/`)
- **Serve Production**: Standard static file serving (Vercel/Netlify/Nginx)

---

## 4. Health Checks & Monitoring

### 4.1 Automated Platform Probes
- **Liveness Probe**: `GET /api/health` — Checks if Express process is active.
- **Readiness Probe**: `GET /api/health/db` — Executes lightweight query against Supabase PostgreSQL and verifies connection latency.
- **System Telemetry**: `GET /api/health/detailed` — Returns uptime, service version, and database status.

### 4.2 Logging & Alerting
- Structured JSON logging provided by **Pino**.
- High-risk strings (passwords, tokens, service keys) automatically redacted.
- Error alerts should be configured on HTTP status 500 rate exceeding 1% over 5-minute windows.

---

## 5. Database Migration & Deployment Runbook

### 5.1 Pre-Deployment Migration Validation
Never apply raw DDL directly to production without testing against a staging branch.

### 5.2 Safe Migration Procedure
1. Verify Supabase connection string using `DIRECT_URL` (port 5432).
2. Check schema drift:
   ```bash
   npx prisma migrate status
   ```
3. Apply pending migrations safely using Prisma migrate deploy:
   ```bash
   npx prisma migrate deploy
   ```
4. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

### 5.3 Rollback Strategy
- All migrations in EventPilot AI are strictly **additive** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- If an application deploy fails, revert the application container or commit to the previous version. The database schema remains backwards-compatible.

---

## 6. Pre-Launch Verification Checklist

- [x] All 168 backend integration tests passing (including re-planning concurrency & auth security suites).
- [x] All 4 Python AI service tests passing.
- [x] Frontend builds with 0 TypeScript errors (`vite build` production clean).
- [x] Backend builds with 0 TypeScript errors (`tsc` dist clean).
- [x] Adaptive re-planning concurrency strategy verified with atomic transactions and revision bumping.
- [x] Phase 5 migration checksum preserved; additive migration script prepared for fresh instances.
- [x] Production authentication fallback strictly gated; demo credentials stripped from client source.
- [x] Health check endpoints verified.
- [x] Sensitive fields redacted from logging output.
- [x] Cross-tenant data isolation verified with 404 responses.
- [x] Production environment documentation complete (`docs/production-blocker-resolution.md`).


