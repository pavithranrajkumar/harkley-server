# 🎯 Action Items API - Clean CRUD

Simple and clean action items API with just 4 essential endpoints.

## 📋 API Endpoints

### 1. Get Action Items

**GET** `/api/action-items`

**Query Parameters:**

- `meetingId` (optional): Filter by meeting ID
- `status` (optional): Filter by status (pending, in_progress, completed, cancelled)
- `priority` (optional): Filter by priority (high, medium, low)
- `speaker` (optional): Filter by speaker
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Sample Request:**

```bash
GET /api/action-items?meetingId=123&status=pending&priority=high
```

**Sample Response:**

```json
{
  "success": true,
  "data": {
    "actionItems": [
      {
        "id": "action-1",
        "meetingId": "123",
        "description": "Follow up with client",
        "priority": "high",
        "status": "pending",
        "speaker": "john@example.com",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "createdBy": "user-123",
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-10T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "message": "Action items retrieved successfully"
}
```

### 2. Create Action Item

**POST** `/api/action-items`

**Request Body:**

```json
{
  "meetingId": "123",
  "description": "Schedule follow-up meeting",
  "priority": "medium",
  "speaker": "jane@example.com",
  "dueDate": "2024-01-20T00:00:00.000Z"
}
```

**Sample Response:**

```json
{
  "success": true,
  "data": {
    "id": "action-2",
    "meetingId": "123",
    "description": "Schedule follow-up meeting",
    "priority": "medium",
    "status": "pending",
    "speaker": "jane@example.com",
    "dueDate": "2024-01-20T00:00:00.000Z",
    "createdBy": "user-123",
    "createdAt": "2024-01-10T11:00:00.000Z",
    "updatedAt": "2024-01-10T11:00:00.000Z"
  },
  "message": "Action item created successfully"
}
```

### 3. Update Action Item

**PUT** `/api/action-items/:id`

**Request Body:**

```json
{
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "speaker": "new@example.com",
  "dueDate": "2024-01-25T00:00:00.000Z"
}
```

**Sample Response:**

```json
{
  "success": true,
  "data": {
    "id": "action-1",
    "meetingId": "123",
    "description": "Updated description",
    "priority": "high",
    "status": "in_progress",
    "speaker": "new@example.com",
    "dueDate": "2024-01-25T00:00:00.000Z",
    "createdBy": "user-123",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T12:00:00.000Z"
  },
  "message": "Action item updated successfully"
}
```

### 4. Delete Action Item

**DELETE** `/api/action-items/:id`

**Sample Response:**

```json
{
  "success": true,
  "data": null,
  "message": "Action item deleted successfully"
}
```

## 🔧 Usage Examples

### Get all action items for a meeting

```javascript
const response = await fetch('/api/action-items?meetingId=123');
const data = await response.json();
console.log(data.data.actionItems);
```

### Create a new action item

```javascript
const response = await fetch('/api/action-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    meetingId: '123',
    description: 'Review project proposal',
    priority: 'high',
    speaker: 'manager@company.com',
  }),
});
```

### Update action item status

```javascript
const response = await fetch('/api/action-items/action-1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: 'completed',
  }),
});
```

### Delete an action item

```javascript
const response = await fetch('/api/action-items/action-1', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## ✅ That's it!

Clean, simple, and focused. No unnecessary complexity - just the 4 essential CRUD operations you need! 🎯
