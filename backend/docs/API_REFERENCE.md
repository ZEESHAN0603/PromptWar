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

### Internal Server Error (`500 Internal Server Error`)
```json
{
  "success": false,
  "message": "Internal server error",
  "errors": []
}
```
*(Stack traces are omitted in production mode)*

