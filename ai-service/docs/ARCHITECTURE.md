# EventPilot AI — Python AI Microservice Architecture

## Overview

The `ai-service` is an asynchronous Python microservice built using **FastAPI 0.115+** and **Pydantic v2**. In Phase 1, it provides the service scaffolding, strict configuration validation, health-check monitoring, and testing harness. In future phases (Phases 5–7), it will host specialized LLM reasoning pipelines, Gemini API interactions, adaptive budget re-allocation models, and conversational co-pilot agents.

---

## Architectural Principles

1. **Decoupled Architecture**: The AI service operates strictly as an internal microservice. It is not directly accessible from the frontend client. All requests are brokered and authenticated via the Node.js Express backend.
2. **Type Safety & Schema Validation**: Pydantic v2 models enforce strict request and response schemas, ensuring deterministic data contracts.
3. **Stateless Execution**: The AI service does not directly query PostgreSQL or manage persistent user state; it receives structured event context from the backend and returns generative recommendations, diffs, and analysis.
4. **Resilience & Graceful Degradation**: If the AI service is unreachable or rate-limited, the Express backend continues to serve core event planning functions.

---

## Service Structure

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── config.py           # Pydantic Settings & environment validation
│   ├── main.py             # FastAPI application factory & middlewares
│   └── routes/
│       ├── __init__.py
│       └── health.py       # GET /health service check
├── tests/
│   ├── __init__.py
│   └── test_health.py      # Pytest test suite with TestClient
├── docs/
│   └── ARCHITECTURE.md     # Architecture documentation
├── requirements.txt        # Pinned dependencies
├── .env.example            # Environment template
└── Dockerfile              # Multi-stage production container
```

---

## Endpoints (Phase 1)

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/` | Service root & metadata | Public / Internal |
| `GET` | `/health` | Health check probe | Internal |
| `GET` | `/docs` | OpenAPI / Swagger interactive docs | Development only |

---

## Future AI Integration Roadmap (Phases 5–7)

- **Phase 5 (Personalized Ideas AI)**: Structured prompt generation for theme, decor, food, and entertainment recommendations based on culture, guest breakdown, and budget constraints.
- **Phase 6 (Adaptive Re-Planning Engine)**: Multi-constraint rebalancing algorithm to adjust budget allocations, guest counts, and task priorities upon event date or scale changes.
- **Phase 7 (AI Co-Pilot)**: Real-time interactive assistance, streaming chat responses, and contextual event modifications.

