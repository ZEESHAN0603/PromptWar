# EventPilot AI — Testing Guide

## Overview

Testing is an essential quality gate in EventPilot AI. Both the Node.js backend and Python AI service have automated test suites testing application lifecycle, request contracts, security constraints, environment parsing, and database isolation.

---

## 1. Backend Testing (Vitest & Supertest)

### Frameworks
- **Vitest**: High-performance ESM test runner.
- **Supertest**: High-level HTTP assertion library for testing Express routing without occupying live network ports.

### Test Directory Layout
```
backend/tests/
├── auth.test.ts            # Supabase JWT token parsing & Bearer auth guards
├── budget.test.ts          # Budget categories, expense allocations & variance
├── database.test.ts        # Prisma client lifecycle & error handling
├── env.test.ts             # Zod schema validation & secret masking
├── error-handler.test.ts   # Centralized error response formats & 404
├── events.test.ts          # Event CRUD, tenant isolation & pagination
├── guest.test.ts           # Guest management, RSVP tracking & headcount
├── health.test.ts          # /api/health, /api/health/db, /api/health/detailed
├── idea.test.ts            # Phase 5 Gemini generation, persistence & favorites (15 tests)
├── profile.test.ts         # User profile lookup & update
├── task.test.ts            # Tasks, priorities & BFS cycle-detected dependencies
├── timeline.test.ts        # Run-of-show milestones & chronological ordering
└── vendor.test.ts          # Community vendor discovery, recommendations & admin moderation
```

**Total Backend Test Coverage**: 13 test files, **112/112 passing tests** (100% pass rate).

### Running Tests
```bash
cd backend

# Run all unit and integration tests once
npm run test

# Run tests in interactive watch mode
npm run test:watch

# Generate code coverage report
npm run test:coverage
```

### Key Assertions Tested
- **Health Probes**: `GET /api/health` asserts status code `200` and verifies payload matching `{ success: true, message: "...", data: { status: "healthy", service: "eventpilot-backend", version: "1.0.0" } }`.
- **Database Degradation**: Mocks Prisma `$queryRaw` failure to verify that `/api/health/db` returns HTTP `503` with `{ connected: false, error: "..." }` and does not crash the server.
- **Credential Protection**: Validates that passwords and secrets are redacted from output objects.
- **Zod Schema Parsing**: Asserts that invalid ports, bad emails, or missing variables throw descriptive configuration errors.
- **Error Middleware**: Checks that operational `ApiError` instances produce standard `{ success: false, message, errors }` shapes with correct HTTP status codes (`400`, `401`, `403`, `404`, `500`).

---

## 2. Python AI Service Testing (Pytest)

### Frameworks
- **pytest**: Test execution framework.
- **fastapi.testclient.TestClient**: Simulates ASGI requests without network bindings.

### Running Pytest
```bash
cd ai-service
python -m pytest tests/ -v
```

### Key Assertions Tested
- **App Initializer**: Asserts root metadata response.
- **Health Contract**: Confirms `GET /health` returns `{ status: "healthy", service: "eventpilot-ai-service", version: "1.0.0" }`.
- **Configuration Constraints**: Asserts port out-of-range (> 65535) is rejected by Pydantic validation.
- **404 Routing**: Verifies undefined routes are caught gracefully.

