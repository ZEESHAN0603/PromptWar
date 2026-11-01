# EventPilot AI API Reference — Phase 3

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

---

## 3. Budget & Expense Management APIs

All budget endpoints require authentication and verify that the target event belongs to the authenticated user. If inaccessible, HTTP `404 Not Found` is returned.

### 3.1 Create Budget Category
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/budget/categories`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "Catering & Banquet",
  "allocatedAmount": 150000,
  "description": "Buffet dinner and live beverage counters",
  "color": "#10B981"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Budget category created successfully",
  "data": {
    "id": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
    "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "name": "Catering & Banquet",
    "allocatedAmount": 150000,
    "description": "Buffet dinner and live beverage counters",
    "color": "#10B981",
    "createdAt": "2026-10-31T14:00:00.000Z",
    "updatedAt": "2026-10-31T14:00:00.000Z"
  }
}
```
- **Error (409 Conflict)**: Duplicate category name within the same event.

### 3.2 List Budget Categories
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/budget/categories`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget categories retrieved successfully",
  "data": [
    {
      "id": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
      "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
      "name": "Catering & Banquet",
      "allocatedAmount": 150000,
      "description": "Buffet dinner and live beverage counters",
      "color": "#10B981",
      "createdAt": "2026-10-31T14:00:00.000Z",
      "updatedAt": "2026-10-31T14:00:00.000Z"
    }
  ]
}
```

### 3.3 Update Budget Category
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId/budget/categories/:categoryId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "name": "Catering & Premium Bar",
  "allocatedAmount": 180000
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget category updated successfully",
  "data": {
    "id": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
    "name": "Catering & Premium Bar",
    "allocatedAmount": 180000
  }
}
```

### 3.4 Delete Budget Category
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/budget/categories/:categoryId`
- **Auth Required**: Yes
- **Behavior**: Safe deletion. Unassigns associated expenses (`categoryId = null`) rather than cascading delete, protecting expense history.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget category deleted successfully. Associated expenses unassigned.",
  "data": {
    "id": "b3e0258d-74d3-4876-b6d8-9dfc449553b1"
  }
}
```

### 3.5 Create Expense
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/budget/expenses`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "title": "Welcome Beverage Counter Advance",
  "categoryId": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
  "estimatedAmount": 25000,
  "actualAmount": 20000,
  "paymentStatus": "paid",
  "expenseDate": "2026-11-01T10:00:00.000Z",
  "notes": "Paid via UPI receipt #88319"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "id": "8c599184-7512-4217-ba71-61cfef53e20e",
    "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "categoryId": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
    "title": "Welcome Beverage Counter Advance",
    "estimatedAmount": 25000,
    "actualAmount": 20000,
    "paymentStatus": "paid",
    "expenseDate": "2026-11-01T10:00:00.000Z",
    "notes": "Paid via UPI receipt #88319",
    "createdAt": "2026-10-31T14:10:00.000Z",
    "updatedAt": "2026-10-31T14:10:00.000Z"
  }
}
```

### 3.6 List Expenses
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/budget/expenses?categoryId=...&paymentStatus=...`
- **Auth Required**: Yes
- **Query Params**:
  - `categoryId`: Filter by budget category UUID (optional)
  - `paymentStatus`: Filter by `pending`, `partially_paid`, or `paid` (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": [ ... ]
}
```

### 3.7 Update Expense
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId/budget/expenses/:expenseId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "actualAmount": 22000,
  "paymentStatus": "paid"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": { ... }
}
```

### 3.8 Delete Expense
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/budget/expenses/:expenseId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {
    "id": "8c599184-7512-4217-ba71-61cfef53e20e"
  }
}
```

### 3.9 Get Budget Summary & Alerts
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/budget/summary`
- **Auth Required**: Yes
- **Description**: Returns deterministic calculation of total budget, allocations, estimated vs actual expenses, remaining balance, utilization percentage, category-level variance, and automated over-budget / near-budget warnings.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget summary calculated successfully",
  "data": {
    "totalBudget": 500000,
    "totalAllocated": 180000,
    "totalEstimatedExpenses": 25000,
    "totalActualExpenses": 22000,
    "remainingBudget": 478000,
    "budgetUtilization": 4.4,
    "warning": null,
    "isOverBudget": false,
    "categoryBreakdown": [
      {
        "categoryId": "b3e0258d-74d3-4876-b6d8-9dfc449553b1",
        "categoryName": "Catering & Premium Bar",
        "allocatedAmount": 180000,
        "totalActual": 22000,
        "totalEstimated": 25000,
        "variance": 158000,
        "isOverBudget": false
      }
    ]
  }
}
```

---

## 4. Guest Management APIs

### 4.1 Create Guest
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/guests`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "fullName": "Vikram Mehta",
  "email": "vikram@example.com",
  "phoneNumber": "+91 98765 11111",
  "guestCategory": "VIP",
  "rsvpStatus": "attending",
  "plusOneAllowed": true,
  "plusOneCount": 1,
  "dietaryPreference": "Vegetarian",
  "notes": "Front row seating requested"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Guest created successfully",
  "data": {
    "id": "e21c3247-4952-411a-b611-66795f573ad1",
    "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "fullName": "Vikram Mehta",
    "email": "vikram@example.com",
    "phoneNumber": "+91 98765 11111",
    "guestCategory": "VIP",
    "rsvpStatus": "attending",
    "plusOneAllowed": true,
    "plusOneCount": 1,
    "dietaryPreference": "Vegetarian",
    "notes": "Front row seating requested",
    "createdAt": "2026-10-31T14:30:00.000Z",
    "updatedAt": "2026-10-31T14:30:00.000Z"
  }
}
```

### 4.2 List Guests
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/guests?rsvpStatus=...&guestCategory=...&search=...`
- **Auth Required**: Yes
- **Query Params**:
  - `rsvpStatus`: Filter by `pending`, `invited`, `attending`, `declined`
  - `guestCategory`: Filter by category name
  - `search`: Search by full name, email, or notes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Guests retrieved successfully",
  "data": [ ... ]
}
```

### 4.3 Update Guest
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId/guests/:guestId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "rsvpStatus": "attending",
  "dietaryPreference": "Vegan"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Guest updated successfully",
  "data": { ... }
}
```

### 4.4 Delete Guest
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/guests/:guestId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Guest deleted successfully",
  "data": {
    "id": "e21c3247-4952-411a-b611-66795f573ad1"
  }
}
```

### 4.5 Get Guest Attendance Summary
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/guests/summary/stats`
- **Auth Required**: Yes
- **Description**: Returns headcount aggregation including direct guests and plus-ones across all RSVP statuses.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Guest summary calculated successfully",
  "data": {
    "totalInvited": 50,
    "totalAttending": 35,
    "totalDeclined": 5,
    "totalPending": 10,
    "totalPlusOnes": 12,
    "confirmedHeadcount": 47
  }
}
```

---

## 5. Task Management & Dependencies APIs

### 5.1 Create Task
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/tasks`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "title": "Finalize Catering Menu",
  "description": "Approve tasting items and dessert bar options",
  "dueDate": "2026-11-05T18:00:00.000Z",
  "priority": "high",
  "status": "todo",
  "assignedTo": "Aditi & Chef"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "c138e6df-7935-4ae2-a251-cb3e63db76f9",
    "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "title": "Finalize Catering Menu",
    "priority": "high",
    "status": "todo",
    "dueDate": "2026-11-05T18:00:00.000Z",
    "assignedTo": "Aditi & Chef",
    "createdAt": "2026-10-31T15:00:00.000Z",
    "updatedAt": "2026-10-31T15:00:00.000Z",
    "dependencies": [],
    "dependents": []
  }
}
```

### 5.2 List Tasks
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/tasks?status=...&priority=...&assignedTo=...&sortBy=dueDate&order=asc`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [ ... ]
}
```

### 5.3 Update Task
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId/tasks/:taskId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "status": "completed",
  "overrideIncompletePrerequisites": false
}
```
- **Error (400 Bad Request)**: If task has incomplete prerequisites and `overrideIncompletePrerequisites` is false.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": { ... }
}
```

### 5.4 Delete Task
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/tasks/:taskId`
- **Auth Required**: Yes
- **Behavior**: Cascades removal of task dependency relationships safely without deleting related tasks.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {
    "id": "c138e6df-7935-4ae2-a251-cb3e63db76f9"
  }
}
```

### 5.5 Add Task Dependency
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/tasks/:taskId/dependencies`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "dependsOnTaskId": "a0000000-0000-0000-0000-000000000001"
}
```
- **Cycle Detection**: The backend runs BFS traversal over the dependency graph. If adding this edge forms a direct or transitive cycle, returns HTTP `409 Conflict`.
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Task dependency created successfully",
  "data": {
    "id": "d0000000-0000-0000-0000-000000000001",
    "taskId": "c138e6df-7935-4ae2-a251-cb3e63db76f9",
    "dependsOnTaskId": "a0000000-0000-0000-0000-000000000001"
  }
}
```
- **Error (400 Bad Request)**: Self-dependency or task belonging to different event.
- **Error (409 Conflict)**: Dependency cycle detected.

### 5.6 Remove Task Dependency
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/tasks/:taskId/dependencies/:dependsOnTaskId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task dependency removed successfully",
  "data": {
    "deleted": true
  }
}
```

---

## 6. Event Timeline Management APIs

Timeline items represent day-of run-of-show activities and scheduled milestones, separate from planning preparation tasks.

### 6.1 Create Timeline Item
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/timeline`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "title": "Guest Welcome & Refreshments",
  "description": "Rose water welcome drinks and classical sitar prelude",
  "startTime": "2026-11-12T17:00:00.000Z",
  "endTime": "2026-11-12T18:00:00.000Z",
  "location": "North Courtyard",
  "category": "Ceremony",
  "status": "scheduled"
}
```
- **Chronological Rule**: If provided, `endTime` must be equal to or later than `startTime`.
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Timeline item created successfully",
  "data": {
    "id": "7fa1428a-789a-471a-96e0-d096a58f44d1",
    "eventId": "4b6a9531-ec7b-40fa-80ad-84ee49fb627d",
    "title": "Guest Welcome & Refreshments",
    "startTime": "2026-11-12T17:00:00.000Z",
    "endTime": "2026-11-12T18:00:00.000Z",
    "location": "North Courtyard",
    "category": "Ceremony",
    "status": "scheduled",
    "createdAt": "2026-10-31T15:30:00.000Z",
    "updatedAt": "2026-10-31T15:30:00.000Z"
  }
}
```

### 6.2 List Timeline Items
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/timeline?category=...&status=...`
- **Auth Required**: Yes
- **Response (200 OK)**: Items sorted chronologically by `startTime` ascending.
```json
{
  "success": true,
  "message": "Timeline items retrieved successfully",
  "data": [ ... ]
}
```

### 6.3 Update Timeline Item
- **Method**: `PATCH`
- **Endpoint**: `/api/events/:eventId/timeline/:itemId`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "status": "in_progress",
  "endTime": "2026-11-12T18:15:00.000Z"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Timeline item updated successfully",
  "data": { ... }
}
```

### 6.4 Delete Timeline Item
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/timeline/:itemId`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Timeline item deleted successfully",
  "data": {
    "id": "7fa1428a-789a-471a-96e0-d096a58f44d1"
  }
}
```

---

## 7. Community Vendor Recommendation System APIs (Phase 4)

### 7.1 Public Vendor Discovery
- **Method**: `GET`
- **Endpoint**: `/api/vendors?category=...&city=...&search=...&page=1&limit=20`
- **Auth Required**: No (Public)
- **Response (200 OK)**: Returns paginated list of approved community vendors.

### 7.2 Get Vendor Profile
- **Method**: `GET`
- **Endpoint**: `/api/vendors/:id`
- **Auth Required**: No (Public)
- **Response (200 OK)**: Full vendor profile with service areas, event types, and pricing details.

### 7.3 Real-Time Duplicate Check
- **Method**: `GET`
- **Endpoint**: `/api/vendors/check-duplicates?name=...&city=...&category=...`
- **Auth Required**: No (Public)
- **Response (200 OK)**: Returns `hasPotentialDuplicate`, `highestConfidence`, and `matches`.

### 7.4 Submit Community Vendor Contribution
- **Method**: `POST`
- **Endpoint**: `/api/vendors/contributions`
- **Auth Required**: Yes
- **Request Body**: Vendor details, relationship type, source description, private notes, and `consentConfirmed: true`.

### 7.5 Event Vendor Recommendations
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/vendor-recommendations?category=...`
- **Auth Required**: Yes
- **Response (200 OK)**: Deterministic 0-100 scored recommendations with transparent factor breakdown.

### 7.6 Event Vendor Team Management
- **Method**: `GET`, `POST`, `PATCH`, `DELETE`
- **Endpoint**: `/api/events/:eventId/vendors`
- **Auth Required**: Yes

---

## 8. Personalized Celebration Ideas Engine APIs (Phase 5)

### 8.1 Generate Personalized Ideas
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/ideas/generate`
- **Auth Required**: Yes (Event owner or Admin)
- **Rate Limit**: 10 requests / minute
- **Request Body**:
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
- **Response (200 OK)**:
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

### 8.2 List Event Ideas
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/ideas?category=...&generationId=...`
- **Auth Required**: Yes
- **Query Parameters**:
  - `category` (optional): `theme`, `decoration`, `food`, `entertainment`, `venue`, `guest_experience`, `saved`, `all`
  - `generationId` (optional): Filter ideas by generation batch
- **Response (200 OK)**: Array of persisted celebration ideas.

### 8.3 Get Single Idea
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/ideas/:id`
- **Auth Required**: Yes

### 8.4 Save Idea to Favorites
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/ideas/:id/save`
- **Auth Required**: Yes

### 8.5 Remove Idea from Favorites
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/ideas/:id/save`
- **Auth Required**: Yes

### 8.6 Delete Idea
- **Method**: `DELETE`
- **Endpoint**: `/api/events/:eventId/ideas/:id`
- **Auth Required**: Yes

---

## 9. Phase 6: Adaptive Event Re-Planning Engine & Version History

### 9.1 Generate Re-Planning Proposal
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/replan`
- **Auth Required**: Yes (`Bearer <token>`)
- **Description**: Evaluates impact of changes across budget, guest count, and event date deterministically and generates Gemini AI strategic alternatives without altering existing records.
- **Request Body**:
```json
{
  "changes": {
    "budget": { "proposed": 700000 },
    "guestCount": { "proposed": 250 },
    "eventDate": { "proposed": "2026-12-08T18:00:00Z" }
  },
  "reason": "Budget optimization and expanded guest headcount"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Re-planning proposal generated successfully",
  "data": {
    "proposalId": "f9018420-1b2c-4f81-8d2a-20fa92bce811",
    "eventId": "a9018420-1b2c-4f81-8d2a-20fa92bce811",
    "status": "READY_FOR_REVIEW",
    "proposedChanges": { ... },
    "impactReport": { ... },
    "aiRecommendations": { ... },
    "baseEventUpdatedAt": "2026-11-01T14:00:00.000Z",
    "reason": "Budget optimization and expanded guest headcount",
    "createdAt": "2026-11-01T14:30:00.000Z"
  }
}
```

### 9.2 Retrieve Re-Planning Proposal
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/replan/:proposalId`
- **Auth Required**: Yes
- **Description**: Retrieves proposal and provides `isStale: true` protection if event was modified after proposal creation.

### 9.3 Selectively Apply Approved Proposal
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/replan/:proposalId/apply`
- **Auth Required**: Yes
- **Description**: Applies only explicitly approved changes in an atomic Prisma transaction, records pre-change snapshot in `event_plan_versions`, preserves recorded actual expenses, and marks proposal as `APPLIED`.
- **Request Body**:
```json
{
  "approvedChanges": {
    "budget": true,
    "guestCount": true,
    "eventDate": false
  },
  "approvedTaskChanges": [
    { "taskId": "b9018420-...", "proposedDueDate": "2026-12-01T00:00:00Z" }
  ],
  "approvedTimelineChanges": []
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Approved re-planning changes applied successfully",
  "data": {
    "event": { ... },
    "versionNumber": 2,
    "versionId": "c9018420-...",
    "appliedChanges": { ... }
  }
}
```

### 9.4 Reject Proposal
- **Method**: `POST`
- **Endpoint**: `/api/events/:eventId/replan/:proposalId/reject`
- **Auth Required**: Yes
- **Description**: Marks proposal status as `REJECTED`.

### 9.5 Retrieve Event Plan Version History
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/versions`
- **Auth Required**: Yes
- **Description**: Lists historical plan versions (`v1.0`, `v2.0`...) in descending chronological order.

### 9.6 Retrieve Single Version Snapshot
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/versions/:versionId`
- **Auth Required**: Yes

### 9.7 Compare Two Plan Versions
- **Method**: `GET`
- **Endpoint**: `/api/events/:eventId/versions/compare?from=:fromId&to=:toId`
- **Auth Required**: Yes
- **Description**: Deterministically compares snapshots between two historical versions or between historical version and current plan.

---

## 10. Context-Aware AI Co-Pilot APIs (Phase 7)

### 10.1 Co-Pilot Chat Interaction
- **Method**: `POST`
- **Endpoint**: `/api/copilot/chat`
- **Auth Required**: Yes (`Bearer <token>`)
- **Rate Limit**: 25 requests/min per user
- **Description**: Sends a natural-language question or instruction to the context-aware planning assistant. Automatically establishes event context when `eventId` is provided. If an action is requested, generates a structured `actionPreview` requiring explicit user confirmation.
- **Request Body**:
```json
{
  "message": "What is my remaining budget and how much have I spent so far?",
  "eventId": "c3f10111-ee15-4606-bf32-bf43ce77e8da",
  "conversationId": "optional-uuid"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "reply": "### Budget Overview\n• **Total Planned Budget**: ₹3,50,000\n• **Recorded Actual Expenses**: ₹0\n• **Remaining Budget**: ₹3,50,000\n• **Budget Utilization**: 0%",
    "conversationId": "55555555-5555-5555-5555-555555555555",
    "messageId": "msg-uuid",
    "actionPreview": null,
    "recommendations": [
      "Allocate budget across categories",
      "Check vendor recommendations"
    ],
    "eventContextSummary": {
      "eventId": "c3f10111-ee15-4606-bf32-bf43ce77e8da",
      "eventName": "Aarav & Meera Sangeet & Reception",
      "eventType": "Wedding",
      "budgetUtilization": 0,
      "tasksTotal": 0,
      "tasksCompleted": 0,
      "confirmedGuests": 0
    }
  }
}
```

### 10.2 List Planning Conversations
- **Method**: `GET`
- **Endpoint**: `/api/copilot/conversations?eventId=:optionalEventId`
- **Auth Required**: Yes
- **Description**: Retrieves persistent conversation threads owned by the authenticated user, optionally filtered by celebration workspace.

### 10.3 Create Planning Conversation
- **Method**: `POST`
- **Endpoint**: `/api/copilot/conversations`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "eventId": "c3f10111-ee15-4606-bf32-bf43ce77e8da",
  "title": "Vendor & Catering Strategy"
}
```
- **Response (201 Created)**: Returns created conversation thread.

### 10.4 Get Conversation Messages
- **Method**: `GET`
- **Endpoint**: `/api/copilot/conversations/:id`
- **Auth Required**: Yes
- **Description**: Retrieves full chronological message history for an owned conversation.

### 10.5 Delete Conversation
- **Method**: `DELETE`
- **Endpoint**: `/api/copilot/conversations/:id`
- **Auth Required**: Yes
- **Description**: Safely deletes an owned conversation and its linked messages.

### 10.6 Prepare Action Preview
- **Method**: `POST`
- **Endpoint**: `/api/copilot/actions/preview`
- **Auth Required**: Yes
- **Description**: Validates operation parameters and generates an explicit action preview without modifying database records.
- **Request Body**:
```json
{
  "eventId": "c3f10111-ee15-4606-bf32-bf43ce77e8da",
  "actionType": "create_task",
  "parameters": {
    "title": "Review Catering Tasting Menu",
    "priority": "high",
    "dueDate": "2026-11-20"
  }
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Action preview prepared successfully",
  "data": {
    "actionPreview": {
      "actionType": "create_task",
      "title": "Create Task: \"Review Catering Tasting Menu\"",
      "summary": "Will create a new high priority task due on 11/20/2026.",
      "targetEntity": "tasks",
      "proposedData": {
        "title": "Review Catering Tasting Menu",
        "description": null,
        "dueDate": "2026-11-20",
        "priority": "high",
        "status": "todo"
      },
      "requiresConfirmation": true
    }
  }
}
```

### 10.7 Confirm and Execute Action
- **Method**: `POST`
- **Endpoint**: `/api/copilot/actions/confirm`
- **Auth Required**: Yes
- **Description**: Explicitly commits a validated action to the event workspace using existing verified domain services.
- **Request Body**: Same parameters as preview.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task \"Review Catering Tasting Menu\" successfully created in event workspace.",
  "data": {
    "id": "new-task-uuid",
    "title": "Review Catering Tasting Menu",
    "priority": "high",
    "status": "todo",
    "dueDate": "2026-11-20T00:00:00.000Z"
  }
}
```





