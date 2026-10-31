# EventPilot AI — Development Workflow & Guidelines

## 1. Monorepo Organization

The EventPilot AI repository consists of three distinct service layers:

```
EventPilot-AI/
├── src/                # React 19 Frontend application
├── backend/            # Node.js + Express + TypeScript Backend
├── ai-service/         # Python 3.11+ FastAPI Microservice
├── docs/               # System architecture and roadmap documentation
├── docker-compose.yml  # Local multi-container orchestration
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

### Alternatively, using Docker Compose:
```bash
docker compose up
```

---

## 3. Database Workflows (Prisma & Supabase)

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
- **Applying Migrations in Development**:
  ```bash
  # Ensure DIRECT_URL is configured in backend/.env before creating migrations
  npx prisma migrate dev --name <migration_name>
  ```
  > [!WARNING]
  > Never use destructive migration flags (`migrate reset` or `--force`) in shared staging or production environments.

---

## 4. Code Quality & Pre-Commit Verification

Before submitting pull requests or pushing commits, run all verification steps:

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

---

## 5. Git Commit Conventions

Follow the Conventional Commits specification:
- `feat(backend): add health telemetry endpoint`
- `fix(ai-service): resolve pydantic settings validation`
- `docs: update system architecture diagrams`
- `test(backend): add database degradation mock tests`
