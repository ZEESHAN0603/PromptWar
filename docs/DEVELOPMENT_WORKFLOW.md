# EventPilot AI — Development Workflow & Guidelines

## 1. Monorepo Organization

The EventPilot AI repository consists of three specialized services:

```
EventPilot-AI/
├── src/                # React 19 Frontend application (Vite + Tailwind v4)
├── backend/            # Node.js + Express + TypeScript Backend
├── ai-service/         # Python 3.11+ FastAPI Microservice
├── docs/               # System architecture and roadmap documentation
└── README.md           # Project onboarding guide
```

---

## 2. Day-to-Day Development Workflow

### Starting Development Servers
In separate terminals:
```bash
# Terminal 1: Frontend (Port 3000)
npm run dev

# Terminal 2: Backend (Port 5000)
cd backend
npm run dev

# Terminal 3: AI Service (Port 8000)
cd ai-service
uvicorn app.main:app --reload --port 8000
```

---

## 3. Database Workflows (Prisma & Supabase)

All database operations interact directly and exclusively with Supabase PostgreSQL:

- **Validating Schema Changes**:
  ```bash
  cd backend
  npm run prisma:validate
  ```
- **Formatting Schema**:
  ```bash
  cd backend
  npm run prisma:format
  ```
- **Generating Prisma Client**:
  ```bash
  cd backend
  npm run prisma:generate
  ```
- **Prisma Migrations**:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
  > [!WARNING]
  > Never run destructive migration flags (`migrate reset` or `--force`) against production or shared database environments.

---

## 4. Code Quality & Pre-Commit Verification

Verify all components before merging or proposing changes:

```bash
# 1. Frontend Typecheck and Build
npm run lint
npm run build

# 2. Backend Typecheck, Lint, and Vitest Tests
cd backend
npm run typecheck
npm run test
npm run build

# 3. Python AI Service Tests
cd ../ai-service
python -m pytest tests/ -v
```
