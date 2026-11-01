# EventPilot AI — API Reference (Phase 1)

All endpoints return standardized JSON structures.

### Standard Success Structure
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Standard Error Structure
```json
{
  "success": false,
  "message": "An error occurred",
  "errors": []
}
```

---

## 1. Service Health Check

### `GET /api/health`
Checks whether the Express backend process is active and functioning.

- **Method**: `GET`
- **Path**: `/api/health`
- **Authentication**: None required (Public / Health Probe)
- **Headers**: None
- **Parameters**: None

#### Example Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

#### Example Response (200 OK)
```json
{
  "success": true,
  "message": "EventPilot AI backend is running",
  "data": {
    "status": "healthy",
    "service": "eventpilot-backend",
    "version": "1.0.0"
  }
}
```

#### Status Codes
- `200 OK`: Server is up and accepting requests.

---

## 2. Database Connectivity Check

### `GET /api/health/db`
Actively executes a lightweight test query against the Supabase PostgreSQL database to verify connectivity and measure latency.

- **Method**: `GET`
- **Path**: `/api/health/db`
- **Authentication**: None
- **Headers**: None

#### Example Request
```http
GET /api/health/db HTTP/1.1
Host: localhost:5000
```

#### Example Response — Healthy (200 OK)
```json
{
  "success": true,
  "message": "Database connection is healthy",
  "data": {
    "connected": true,
    "latencyMs": 14
  }
}
```

#### Example Response — Unreachable / Down (503 Service Unavailable)
```json
{
  "success": true,
  "message": "Database connection is unavailable or degraded",
  "data": {
    "connected": false,
    "error": "Connection timeout to PostgreSQL host"
  }
}
```

#### Status Codes
- `200 OK`: Database connected and responding.
- `503 Service Unavailable`: Database is unreachable, credentials invalid, or network down.

---

## 3. Comprehensive System Health

### `GET /api/health/detailed`
Provides combined telemetry including service uptime, version, and database health.

- **Method**: `GET`
- **Path**: `/api/health/detailed`

#### Example Response (200 OK)
```json
{
  "success": true,
  "message": "Backend system status is healthy",
  "data": {
    "status": "healthy",
    "service": "eventpilot-backend",
    "version": "1.0.0",
    "uptimeSeconds": 312,
    "timestamp": "2026-10-31T17:45:00.000Z",
    "database": {
      "connected": true,
      "latencyMs": 11
    }
  }
}
```

---

## 4. Error Handling Reference

### Route Not Found (`404 Not Found`)
```json
{
  "success": false,
  "message": "Route not found: GET /api/nonexistent",
  "errors": []
}
```

### Validation Error (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ]
}
```

---

## 4. Phase 5: Personalized Celebration Ideas Engine

### `POST /api/events/:eventId/ideas/generate`
Generates personalized celebration ideas tailored to the verified event and user preferences using Google Gemini AI, validates output with strict Zod schemas, and persists concepts into Supabase.

- **Method**: `POST`
- **Path**: `/api/events/:eventId/ideas/generate`
- **Authentication**: `Bearer <token>` (Event owner or Admin required)
- **Rate Limit**: 10 requests / minute per user/IP

#### Request Payload
```json
{
  "categories": ["theme", "decoration", "food", "entertainment", "venue", "guest_experience"],
  "preferences": {
    "preferredColors": ["Royal Crimson", "Antique Gold"],
    "atmosphere": "Royal Heritage",
    "venuePreference": "outdoor",
    "style": "Traditional Rajasthani",
    "dietaryPreferences": "Pure Vegetarian options",
    "culturalPreferences": "Marigold & Brass traditional elements",
    "additionalNotes": "Focus on sunset lawn reception"
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Generated 2 personalized celebration ideas.",
  "data": {
    "generationId": "gen_1761980000000_abc123",
    "eventContext": {
      "eventId": "33333333-3333-3333-3333-333333333333",
      "name": "Royal Heritage Wedding",
      "type": "Wedding",
      "budget": 1500000,
      "guestCount": 200,
      "currency": "INR"
    },
    "ideas": [
      {
        "id": "44444444-4444-4444-4444-444444444444",
        "eventId": "33333333-3333-3333-3333-333333333333",
        "title": "Rajputana Royal Grandeur",
        "description": "Intricately carved jharokha backdrops with marigold garlands and royal brass lanterns.",
        "category": "theme",
        "estimatedBudgetRange": "INR 80,000 – 1,20,000",
        "matchReason": "Directly complements your Jaipur heritage celebration and 200 guest count.",
        "alternatives": ["Warm ambient candlelight with terracotta lamps for INR 45,000"],
        "tags": ["Royal Crimson", "Antique Gold", "Emerald Green"],
        "content": {
          "title": "Rajputana Royal Grandeur",
          "colorPalette": ["Royal Crimson", "Antique Gold", "Emerald Green"],
          "estimatedCost": { "min": 80000, "max": 120000, "currency": "INR", "basis": "Estimated decor range" },
          "budgetSuitability": "Fits comfortably within budget",
          "implementationTips": ["Rent vintage brass urlis from local Johari Bazaar vendors"]
        },
        "generationId": "gen_1761980000000_abc123",
        "isSaved": false,
        "createdAt": "2026-11-01T12:00:00.000Z"
      }
    ],
    "totalGenerated": 1
  }
}
```

### `GET /api/events/:eventId/ideas`
Retrieves all generated celebration ideas for the specified event, with optional category filtering.

- **Method**: `GET`
- **Path**: `/api/events/:eventId/ideas`
- **Query Parameters**:
  - `category` (optional): Filter by category (e.g. `theme`, `decoration`, `food`, `saved`, `all`)
  - `generationId` (optional): Filter ideas by generation run

### `GET /api/events/:eventId/ideas/:id`
Retrieves single personalized idea by ID with ownership verification.

### `POST /api/events/:eventId/ideas/:id/save`
Marks an idea as a saved favorite (`isSaved = true`).

### `DELETE /api/events/:eventId/ideas/:id/save`
Removes an idea from saved favorites (`isSaved = false`).

### `DELETE /api/events/:eventId/ideas/:id`
Permanently deletes an idea with event ownership verification.

---

### Internal Server Error (`500 Internal Server Error`)
```json
{
  "success": false,
  "message": "Internal server error",
  "errors": []
}
```
*(Stack traces are omitted in production mode)*

