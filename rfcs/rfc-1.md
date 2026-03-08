# RFC-1: API & WebSocket Contract

**Author:** Chris  
**Must be approved by:** Joanna, Ade, Eshan

---

## Overview

This RFC defines the complete API and WebSocket contract for the bill splitting app. All teammates must LGTM this before opening any feature branches that depend on the API.

The system uses:
- **GraphQL** for all queries and mutations
- **WebSockets** for real-time events

---

## 1. Auth

Users are identified with an anonymous token + display name. No login or email required.

**Flow:**
1. User enters a display name (e.g. "Chris")
2. Server generates a random UUID token and returns it
3. Token is stored in the browser (`localStorage`)
4. Every GraphQL request sends the token in the header: `Authorization: Bearer <token>`
5. Every WebSocket connection sends the token as a query param: `ws://<host>/ws?token=<token>&session_id=<session_id>`

**Reconnection behavior:**
- If a user disconnects, the token stays in the browser
- On reconnect, the browser sends the same token
- The server recognizes the user and restores their session
- If reconnection happens within 2 minutes, the lite agent is cancelled

---

## 2. GraphQL Schema

### 2.1 Types

```graphql
type Session {
  id: ID!
  status: SessionStatus!
  members: [Member!]!
  items: [Item!]!
  tax: Float
  tip: Float
  joinUrl: String!
  qrCodeUrl: String!
}

enum SessionStatus {
  WAITING
  ACTIVE
  CLOSED
}

type Member {
  id: ID!
  displayName: String!
  connected: Boolean!
  token: String
}

type Item {
  id: ID!
  name: String!
  price: Float!
  category: String
  claimedBy: Member
  locked: Boolean!
}

type ClaimResult {
  success: Boolean!
  item: Item!
  errorCode: String
  message: String
}

type ReceiptUploadResult {
  success: Boolean!
  jobId: ID!
  message: String!
}

type JoinSessionResult {
  success: Boolean!
  token: String!
  member: Member!
  session: Session!
}

type CreateSessionResult {
  success: Boolean!
  token: String!
  member: Member!
  session: Session!
}
```

---

### 2.2 Queries

```graphql
type Query {
  # Fetch the full session with all nested data, including members, items, claims
  session(id: ID!): Session!
}
```

---

### 2.3 Mutations

```graphql
type Mutation {
  # Create a new bill session
  createSession(displayName: String!): CreateSessionResult!

  # Join an existing session via link or QR code
  joinSession(sessionId: ID!, displayName: String!): JoinSessionResult!

  # Attempt to claim an item, goes through locking logic
  claimItem(itemId: ID!, userId: ID!): ClaimResult!

  # Release a previously claimed item
  releaseItem(itemId: ID!, userId: ID!): ClaimResult!

  # Upload a receipt image, enqueues OCR job and returns immediately
  uploadReceipt(sessionId: ID!, file: Upload!): ReceiptUploadResult!
}
```

---

## 3. WebSocket Events

All WebSocket messages are JSON with a top level `event` field.

### Events broadcast by server to all clients

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
Sent once per item as the OCR worker parses the receipt, enabling live streaming of items appearing one by one.
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
  "action": "ACCEPTED or REJECTED",
  "on_behalf_of": "user-uuid",
  "display_name": "Chris"
}
```

---

## 4. Error Handling

GraphQL errors follow the standard GraphQL error format:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Human readable message",
      "extensions": {
        "code": "ERROR_CODE_HERE"
      }
    }
  ]
}
```

For mutation results like `claimItem` where partial success is meaningful, errors are returned in the result type itself rather than the GraphQL errors array:

```json
{
  "data": {
    "claimItem": {
      "success": false,
      "errorCode": "ITEM_ALREADY_CLAIMED",
      "message": "This item was just claimed by someone else.",
      "item": {
        "id": "item-uuid",
        "claimedBy": {
          "id": "other-user-uuid",
          "displayName": "Joanna"
        }
      }
    }
  }
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
| `DISPLAY_NAME_TAKEN` | Display name already in use within this session |