# RFC-1: API & WebSocket Contract

**Author:** Chris  
**Branch:** `feature/rfc-1`  
**Must be approved by:** Joanna, Ade, Eshan  

---

## Overview

This RFC defines the complete API and WebSocket contract for the bill splitting app. All teammates must LGTM this before opening any feature branches that depend on the API.

---

## 1. Auth

Users are identified with an anonymous token + display name. No login or email required.

**Flow:**
1. User enters a display name (e.g. "Chris")
2. Server generates a random UUID token and returns it
3. Token is stored in the browser (`localStorage`)
4. Every subsequent HTTP request sends the token in the header: `Authorization: Bearer <token>`
5. Every WebSocket connection sends the token as a query param: `ws://server/ws?token=<token>`

**Reconnection behavior:**
- If a user disconnects, the token stays in the browser
- On reconnect, the browser sends the same token
- The server recognizes the user and restores their session
- If reconnection happens within 2 minutes, the lite agent is cancelled

---

## 2. REST Endpoints

All endpoints are prefixed with `/api`.  
All request and response bodies are JSON.  
All responses include a top level `success: boolean` field.

---

### 2.1 Session

#### `POST /api/session`
Create a new bill session. Called by the group leader.

**Request body:**
```json
{
  "display_name": "Chris"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "abc123",
  "token": "uuid-token",
  "user_id": "user-uuid",
  "qr_code_url": "https://..."
}
```

---

#### `GET /api/session/:session_id`
Fetch the full session including all members and items.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "abc123",
    "status": "active",
    "members": [
      { "user_id": "uuid", "display_name": "Chris", "connected": true }
    ],
    "items": [
      {
        "id": "item-uuid",
        "name": "Burger",
        "price": 15.00,
        "category": "meat",
        "claimed_by": null,
        "locked": false
      }
    ],
    "tax": 0.10,
    "tip": 0.18
  }
}
```

---

#### `POST /api/session/:session_id/join`
Join an existing session via QR code or link.

**Request body:**
```json
{
  "display_name": "Joanna"
}
```

**Response:**
```json
{
  "success": true,
  "token": "uuid-token",
  "user_id": "user-uuid",
  "session": { ... }
}
```

---

### 2.2 Items

#### `POST /api/item/:item_id/claim`
Attempt to claim an item. Goes through locking logic.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "user_id": "user-uuid"
}
```

**Success response:**
```json
{
  "success": true,
  "item": {
    "id": "item-uuid",
    "claimed_by": "user-uuid"
  }
}
```

**Failure response (race condition loser):**
```json
{
  "success": false,
  "error_code": "ITEM_ALREADY_CLAIMED",
  "message": "This item was just claimed by someone else.",
  "item": {
    "id": "item-uuid",
    "claimed_by": "other-user-uuid"
  }
}
```

---

#### `POST /api/item/:item_id/release`
Release a previously claimed item.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "user_id": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "item-uuid",
    "claimed_by": null
  }
}
```

---

### 2.3 Receipt

#### `POST /api/receipt/upload`
Upload a receipt image. Server immediately enqueues an OCR job in Redis and returns. It does not wait for processing.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Request body:**
```
session_id: "abc123"
image: <file>
```

**Response (immediate, before OCR starts):**
```json
{
  "success": true,
  "job_id": "job-uuid",
  "message": "Receipt upload received. Processing in background."
}
```

---

## 3. WebSocket

All WebSocket messages are JSON with a top level `event` field.

---

### 3.1 Events broadcast by server to all clients

#### `ITEM_CLAIMED`
Sent when a user successfully claims an item.
```json
{
  "event": "ITEM_CLAIMED",
  "item_id": "item-uuid",
  "claimed_by": "user-uuid",
  "display_name": "Chris"
}
```

#### `ITEM_RELEASED`
Sent when a user releases an item.
```json
{
  "event": "ITEM_RELEASED",
  "item_id": "item-uuid"
}
```

#### `ITEM_LOCKED`
Sent when an item is being processed during a claim attempt (race condition buffer).
```json
{
  "event": "ITEM_LOCKED",
  "item_id": "item-uuid"
}
```

#### `OCR_ITEM_PARSED`
Sent once per item as the OCR worker parses the receipt, enabling live streaming of items.
```json
{
  "event": "OCR_ITEM_PARSED",
  "item": {
    "id": "item-uuid",
    "name": "Burger",
    "price": 15.00,
    "category": "meat",
    "quantity": 1
  }
}
```

#### `USER_DISCONNECTED`
Sent when a member loses connection.
```json
{
  "event": "USER_DISCONNECTED",
  "user_id": "user-uuid",
  "display_name": "Chris",
  "agent_takeover_in_seconds": 120
}
```

#### `USER_RECONNECTED`
Sent when a disconnected member rejoins.
```json
{
  "event": "USER_RECONNECTED",
  "user_id": "user-uuid",
  "display_name": "Chris"
}
```

#### `AGENT_ACTION`
Sent when the lite agent accepts or rejects an item on behalf of a disconnected user.
```json
{
  "event": "AGENT_ACTION",
  "item_id": "item-uuid",
  "action": "ACCEPTED" | "REJECTED",
  "on_behalf_of": "user-uuid",
  "display_name": "Chris"
}
```

---

## 4. Error Response Shape

All errors follow this shape:
```json
{
  "success": false,
  "error_code": "ERROR_CODE_HERE",
  "message": "Human readable message"
}
```

**Error codes:**
| Code | Meaning |
|------|---------|
| `ITEM_ALREADY_CLAIMED` | Race condition loser - item was claimed by someone else |
| `ITEM_LOCKED` | Item is currently being processed |
| `SESSION_NOT_FOUND` | Session ID does not exist |
| `UNAUTHORIZED` | Missing or invalid token |
| `INVALID_REQUEST` | Malformed request body |
