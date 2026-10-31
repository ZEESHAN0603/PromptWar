# EventPilot AI — Development Setup Guide

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: >= 18.0.0 (v20+ or v22 LTS recommended)
- **npm**: >= 9.0.0
- **Python**: >= 3.11
- **Docker & Docker Compose**: Optional for containerized local workflows

---

## 1. Backend Setup (Node.js + Express + Prisma)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-supabase-jwt-secret-key"
AI_SERVICE_URL="http://localhost:8000"
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

### Step 5: Start the Development Server
```bash
npm run dev
```
The backend will start at `http://localhost:5000`. Test it with:
```bash
curl http://localhost:5000/api/health
```

---

## 2. Python AI Service Setup (FastAPI)

### Step 1: Install Dependencies
```bash
cd ai-service
python -m pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

### Step 3: Run AI Service Tests
```bash
pytest tests/
```

### Step 4: Start AI Microservice
```bash
uvicorn app.main:app --reload --port 8000
```
Check health at:
```bash
curl http://localhost:8000/health
```

---

## 3. Running with Docker Compose

To start both the Node.js backend and the Python AI service simultaneously:
```bash
docker compose up --build
```
- Node.js Backend: `http://localhost:5000`
- Python AI Service: `http://localhost:8000`

---

## 4. Frontend Integration Preparation

The existing React frontend runs on port `3000`:
```bash
npm run dev
```
CORS on the backend is configured to accept requests from `http://localhost:3000`. In Phase 2, frontend API calls will route to `http://localhost:5000/api`.

---

## Troubleshooting

- **Prisma Error P1012**: Missing environment variables. Ensure `DATABASE_URL` and `DIRECT_URL` are defined in `backend/.env`.
- **Database 503 on `/api/health/db`**: Verify your database credentials in `.env` and verify your IP is allowed in Supabase Network Restrictions.
- **Port Conflicts**: Change `PORT` in `backend/.env` or `ai-service/.env`.
