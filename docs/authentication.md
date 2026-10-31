# EventPilot AI Authentication — Phase 2

## 1. Authentication Architecture

EventPilot AI delegates user identity and credential management strictly to **Supabase Auth**. Express.js never stores user passwords or generates proprietary password hashes.

```
+----------------+          +-------------------+          +-------------------+
|  React Client  |          |   Supabase Auth   |          |  Express Backend  |
+----------------+          +-------------------+          +-------------------+
        |                             |                              |
        | 1. signInWithPassword()     |                              |
        |---------------------------->|                              |
        |                             |                              |
        | 2. Returns Session + JWT    |                              |
        |<----------------------------|                              |
        |                             |                              |
        | 3. GET /api/events (Authorization: Bearer <token>)         |
        |----------------------------------------------------------->|
        |                             |                              |
        |                             | 4. auth.getUser(token)       |
        |                             |<-----------------------------|
        |                             |                              |
        |                             | 5. Returns Verified User     |
        |                             |----------------------------->|
        |                             |                              |
        |                             | 6. Executes query with userId|
        | 7. Returns 200 JSON         |                              |
        |<-----------------------------------------------------------|
```

---

## 2. Frontend Authentication Handling

- **Supabase Client (`src/services/supabase.ts`)**:
  Initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Session Persistence**:
  `persistSession: true` preserves access tokens across browser refreshes via localStorage.
- **API Client (`src/services/apiClient.ts`)**:
  Retrieves the active Supabase session token dynamically and injects it into the HTTP header:
  `Authorization: Bearer <access_token>`
- **Protected Routes**:
  `ProtectedRoute` component in `src/App.tsx` guards application views, redirecting unauthenticated visitors to `/login`.

---

## 3. Backend Verification Middleware (`backend/src/middleware/auth.middleware.ts`)

The `requireAuth` middleware executes prior to any protected Express route handler:

1. **Header Inspection**:
   Validates presence of `req.headers.authorization`. If missing, immediately returns `401 Unauthorized`.
2. **Format Validation**:
   Enforces `Bearer <token>` format. Rejects malformed headers with `401 Unauthorized`.
3. **Cryptographic / Auth Service Verification**:
   Calls `verifySupabaseToken(token)` via server-side Supabase client (`auth.getUser(token)`).
4. **Context Injection**:
   Extracts `id`, `email`, `fullName`, and `avatarUrl` and attaches them to `req.user`.
5. **No Password Or Secret Storage**:
   The backend never handles plaintext passwords or stores authentication secrets.

---

## 4. Security Considerations

- **Service-Role Key Protection**:
  The `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to backend environment files (`backend/.env`). It is **never** bundled or exposed to frontend code.
- **Non-Enumerable Error Responses**:
  Inaccessible resources owned by other users return `404 Not Found` rather than `403 Forbidden`, preventing attackers from determining whether an event ID exists.
- **Redacted Token Logging**:
  Access tokens and authorization headers are explicitly excluded from Pino HTTP logs.
- **Fail-Fast Validation**:
  Zod input parsing strictly strips and ignores any `userId` or ownership parameters submitted by the client. Ownership is set solely from `req.user.id`.

