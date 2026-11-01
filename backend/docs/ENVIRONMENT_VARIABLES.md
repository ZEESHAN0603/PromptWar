# EventPilot AI — Backend Environment Variables

This document details all environment variables used by the Express TypeScript backend.

| Variable Name | Required? | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `5000` | Port on which the Express HTTP server listens. |
| `NODE_ENV` | Optional | `development` | Runtime mode: `development`, `production`, or `test`. |
| `FRONTEND_URL` | Optional | `http://localhost:3000` | Allowed origin for Cross-Origin Resource Sharing (CORS). |
| `DATABASE_URL` | **Required** | Local placeholder | Supabase PostgreSQL connection URI (pgbouncer pooler on port 6543 recommended). |
| `DIRECT_URL` | Optional | None | Direct Supabase PostgreSQL URI (port 5432) for Prisma CLI migrations. |
| `SUPABASE_URL` | Optional | None | Supabase project URL (`https://[PROJECT_ID].supabase.co`). |
| `SUPABASE_ANON_KEY` | Optional | None | Supabase public/anon API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | None | Supabase administrative service role secret (backend only, never expose). |
| `JWT_SECRET` | **Required** | Safe Dev Secret | Minimum 16-character secret used to verify Supabase JWT tokens. |
| `AI_SERVICE_URL` | Optional | `http://localhost:8000` | Internal URL for the Python FastAPI microservice. |
| `GEMINI_API_KEY` | Optional / Recommended | `""` | Google Gemini API Key (server-side only, never expose to frontend). |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model name for idea synthesis (e.g. `gemini-2.5-flash`). |

---

## Security Practices

1. **Never commit `.env`**: Always ensure `.env` is listed in `.gitignore`. Only commit `.env.example`.
2. **Never expose the Service Role Key**: The Supabase Service Role Key bypasses Row Level Security (RLS). It should only be accessed by trusted backend services, never transmitted to the browser or frontend client.
3. **Log Redaction**: The backend's Pino logger masks headers containing `authorization`, `cookie`, `password`, `token`, and `secret`.

