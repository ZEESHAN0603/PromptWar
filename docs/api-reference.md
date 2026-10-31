# EventPilot AI API Reference — Phase 2

All endpoints return a standardized JSON format:

```json
{
  "success": true,
  "message": "Human readable status message",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "eventName",
      "message": "Event name is required"
    }
  ]
}
```

---

## Authentication Endpoints

All Phase 2 endpoints require a valid Supabase Auth JWT token supplied in the HTTP Authorization header:

`Authorization: Bearer <access_token>`

Unauthenticated, malformed, invalid, or expired tokens receive HTTP `401 Unauthorized`.

---

## 1. User Profile APIs

### 1.1 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/api/users/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Description**: Returns profile for authenticated user. If first access, profile is automatically and idempotently provisioned.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
    "email": "planner@example.com",
    "fullName": "Aditi Deshmukh",
    "avatarUrl": "https://example.com/avatar.jpg",
    "phoneNumber": "+91 98765 43210",
    "createdAt": "2026-10-31T12:00:00.000Z",
    "updatedAt": "2026-10-31T12:00:00.000Z"
  }
}
```

### 1.2 Update User Profile
- **Method**: `PATCH`
- **Endpoint**: `/api/users/me`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "fullName": "Aditi Sharma",
  "avatarUrl": "https://example.com/new-avatar.png",
  "phoneNumber": "+91 98765 00000"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
    "email": "planner@example.com",
    "fullName": "Aditi Sharma",
    "avatarUrl": "https://example.com/new-avatar.png",
    "phoneNumber": "+91 98765 00000",
    "createdAt": "2026-10-31T12:00:00.000Z",
    "updatedAt": "2026-10-31T12:05:00.000Z"
  }
}
```
- **Error (400 Bad Request)**: Unrecognized fields (e.g. attempting to modify `id` or `email`).

### 1.3 Get Current User Events
- **Method**: `GET`
- **Endpoint**: `/api/users/me/events`
- **Auth Required**: Yes
- **Description**: Returns array of all events owned by authenticated user.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "User events retrieved successfully",
  "data": [
    {
      "id": "evt-uuid-1",
      "userId": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
      "eventName": "Royal Palace Wedding",
      "eventType": "Wedding",
      "eventDate": "2026-12-20",
      "location": "Udaipur, Rajasthan",
      "guestCount": 150,
      "budget": 500000,
      "currency": "INR",
      "status": "planning"
    }
  ]
}
```

---

## 2. Event Management CRUD APIs

### 2.1 Create Event
- **Method**: `POST`
- **Endpoint**: `/api/events`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "eventName": "Diwali Festival Gala",
  "eventType": "Festival",
  "eventDate": "2026-11-12",
  "location": "Grand Ballroom, Mumbai",
  "guestCount": 200,
  "budget": 450000,
  "currency": "INR",
  "description": "Annual community festival dinner & cultural showcase",
  "theme": "Festive & Vibrant",
  "status": "planning"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "userId": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
    "eventName": "Diwali Festival Gala",
    "eventType": "Festival",
    "eventDate": "2026-11-12",
    "location": "Grand Ballroom, Mumbai",
    "guestCount": 200,
    "budget": 450000,
    "currency": "INR",
    "description": "Annual community festival dinner & cultural showcase",
    "theme": "Festive & Vibrant",
    "status": "planning",
    "createdAt": "2026-10-31T12:10:00.000Z",
    "updatedAt": "2026-10-31T12:10:00.000Z"
  }
}
```
- **Validation Errors (400 Bad Request)**: Missing required fields or negative budget/guestCount.

### 2.2 List Events
- **Method**: `GET`
- **Endpoint**: `/api/events`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20)
  - `eventType` (string, e.g. "Wedding", "Birthday", "Corporate event")
  - `status` (string, e.g. "planning", "confirmed", "in_progress", "completed", "archived")
  - `sortBy` (enum: `date_asc`, `date_desc`, `created_asc`, `created_desc`, `budget_desc`, `budget_asc`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
        "userId": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
        "eventName": "Diwali Festival Gala",
        "eventType": "Festival",
        "eventDate": "2026-11-12",
        "location": "Grand Ballroom, Mumbai",
        "guestCount": 200,
        "budget": 450000,
        "currency": "INR",
        "status": "planning"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 2.3 Get Event Details
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "id": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "userId": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
    "eventName": "Diwali Festival Gala",
    "eventType": "Festival",
    "eventDate": "2026-11-12",
    "location": "Grand Ballroom, Mumbai",
    "guestCount": 200,
    "budget": 450000,
    "currency": "INR",
    "description": "Annual community festival dinner & cultural showcase",
    "theme": "Festive & Vibrant",
    "status": "planning",
    "createdAt": "2026-10-31T12:10:00.000Z",
    "updatedAt": "2026-10-31T12:10:00.000Z"
  }
}
```
- **Error (404 Not Found)**: Inaccessible (owned by another user) or nonexistent event.

### 2.4 Update Event
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId`
- **Auth Required**: Yes
- **Request Body** (partial fields supported):
```json
{
  "eventName": "Diwali Grand Festival 2026",
  "budget": 500000,
  "guestCount": 250
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "eventName": "Diwali Grand Festival 2026",
    "guestCount": 250,
    "budget": 500000,
    "updatedAt": "2026-10-31T12:20:00.000Z"
  }
}
```
- **Error (404 Not Found)**: If event belongs to another user.
- **Error (400 Bad Request)**: Attempting to modify `userId` or invalid payload format.

### 2.5 Delete Event
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "id": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "deleted": true
  }
}
```
- **Error (404 Not Found)**: Inaccessible or nonexistent event.

