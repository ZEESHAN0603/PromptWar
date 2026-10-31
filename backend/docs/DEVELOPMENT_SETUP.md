# EventPilot AI — Development Setup Guide

## Prerequisites

Ensure you have the following installed locally:
- **Node.js**: `>= 18.0.0` (`v20+` or `v22 LTS` recommended)
- **npm**: `>= 9.0.0`
- **Python**: `>= 3.11`
- **Supabase Project**: A valid Supabase cloud account and project

> [!IMPORTANT]
> EventPilot AI exclusively uses the PostgreSQL database provided by your Supabase project.
> Do NOT install, configure, or run a local PostgreSQL server or container.

---

## 1. Node.js + Express Backend Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase connection strings from Project Settings -> Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase API keys
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT secret from Project Settings -> API
JWT_SECRET=your-supabase-jwt-secret

AI_SERVICE_URL=http://localhost:8000
```

### Step 3: Validate and Generate Prisma Client
```bash
npm run prisma:validate
npm run prisma:generate
```

### Step 4: Run Tests
```bash
npm run test
```

### Step 5: Start Backend Development Server
```bash
npm run dev
```
Backend will start on `http://localhost:5000`. Test the health check:
```bash
curl http://localhost:5000/api/health
```

---

## 2. Python AI Microservice Setup

### Step 1: Install Dependencies
```bash
cd ai-service
python -m pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
```

### Step 3: Run Tests
```bash
python -m pytest tests/ -v
```

### Step 4: Start AI Microservice
```bash
uvicorn app.main:app --reload --port 8000
```
Test health check at:
```bash
curl http://localhost:8000/health
```

---

## 3. Frontend Application

From the root directory:
```bash
npm run dev
```
The React frontend starts at `http://localhost:3000`.

---

## Troubleshooting

- **Prisma Error P1012**: Missing environment variables. Ensure `DATABASE_URL` and `DIRECT_URL` are defined in `backend/.env`.
- **Database 503 on `/api/health/db`**: Check your Supabase database password, connection strings, and network restrictions in the Supabase Dashboard.
- **Port Conflict**: Change `PORT` in `backend/.env` or `ai-service/.env`.
