# RFC-6: Session & Lobby Management

**Author:** Ade
**Must be approved by:** Joanna, Chris, Eshan  

---

## Overview

This RFC defines how sessions are created, joined, and 
managed throughout their lifecycle. It covers anonymous 
token authentication, session state transitions, member 
presence tracking, and reconnection behavior.

**RFC-1 Amendments:** 
- Adds `DISPLAY_NAME_TAKEN` to the global error code registry defined in RFC-1 §4
- Removes `quantity` field from the `Item` type in RFC-1 §2.1

---

## 1. Auth

Users are identified with an anonymous token + display 
name. No login or email required.

**Flow:**
1. User enters a display name (e.g. "Chris")
2. Server generates a UUID token and returns it once
3. Token is stored in the browser (`localStorage`)
4. Every GraphQL request sends the token in the header:
   `Authorization: Bearer <token>`
5. Every WebSocket connection sends the token as a 
   query param: 
   `ws://<host>/ws?token=<token>&session_id=<session_id>`

**Token is never re-issued.** If a user clears 
localStorage they lose their session identity.

The member who calls `createSession` is assigned the 
`LEADER` role. Only the `LEADER` may call `uploadReceipt`.

---

## 2. Session State Machine

Sessions move through three states:

  WAITING → ACTIVE → CLOSED

| State   | Meaning                                          |
|---------|--------------------------------------------------|
| WAITING | Session created, members joining, no receipt yet |
| ACTIVE  | Receipt uploaded and fully processed by OCR      |
| CLOSED  | Bill finalized, no further claims accepted       |

**WAITING → ACTIVE:** Triggered when the OCR job 
completes successfully and all items are persisted. 
The session only advances once, on confirmed success. 
If OCR fails the session stays in WAITING and the 
leader can retry the upload.

There is no FAILED state.

---

## 3. Join via Link & QR Code

**Join URL:**

  https://yourapp.com/join/{sessionId}

Where `{sessionId}` is the session's UUID returned from
`createSession`. The frontend uses this ID to establish
the WebSocket connection and fetch initial session state.

**QR Code URL** is constructed server-side and returned 
as `qrCodeUrl` in the Session type. No QR infrastructure 
is needed — the server constructs the string using a 
free encoding service:

  https://api.qrserver.com/v1/create-qr-code/?data={joinUrl}

Both fields are returned from `createSession` and 
available via the `session` query.
---

## 4. Display Name Uniqueness

Display names must be unique within a session. Two 
members named "Chris" in the same bill creates 
ambiguity on the client when displaying claims.

**DB constraint:** `UNIQUE(session_id, display_name)`

**On violation:** return `DISPLAY_NAME_TAKEN` (see §7)

**Migration required:**

  ALTER TABLE members 
  ADD CONSTRAINT unique_display_name_per_session 
  UNIQUE (session_id, display_name);

---

## 5. Presence & Reconnection

**On WebSocket disconnect:**
1. Member marked `connected = false` in DB
2. Server broadcasts `USER_DISCONNECTED` to session
3. A delayed Redis job is enqueued with a 120s TTL

**On reconnect within 2 minutes:**
1. Redis job is cancelled
2. Member marked `connected = true`
3. Server broadcasts `USER_RECONNECTED`

**On Redis job firing (2 min elapsed):**
1. Lite Agent takes over the member's session
2. See RFC-5 for agent behavior

Redis is used over in-memory timers so that the 
countdown survives a server crash or restart.

---

## 6. Schema Changes

**Member table:**

| Column    | Type                 | Constraints              |
|-----------|----------------------|--------------------------|
| token     | VARCHAR              | UNIQUE, NOT NULL         |
| connected | BOOLEAN              | DEFAULT true             |
| role      | ENUM(LEADER, MEMBER) | NOT NULL, DEFAULT MEMBER |

**Session table:**

| Column | Type                          | Constraints               |
|--------|-------------------------------|---------------------------|
| status | ENUM(WAITING, ACTIVE, CLOSED) | NOT NULL, DEFAULT WAITING |

**Items table:**

| Change   | Column   | Reason                                         |
|----------|----------|------------------------------------------------|
| DROPPED  | quantity | Multiple quantities are represented as separate|
|          |          | rows, each with a unique ID, so they can be    |
|          |          | claimed independently by different members     |

**Full migration:**

  CREATE TYPE member_role AS ENUM ('LEADER', 'MEMBER');
  CREATE TYPE session_status AS ENUM ('WAITING', 'ACTIVE', 'CLOSED');

  ALTER TABLE members
  ADD COLUMN role member_role NOT NULL DEFAULT 'MEMBER';

  ALTER TABLE members
  ADD COLUMN token VARCHAR UNIQUE NOT NULL;

  ALTER TABLE members
  ADD COLUMN connected BOOLEAN NOT NULL DEFAULT true;

  ALTER TABLE members
  ADD CONSTRAINT unique_display_name_per_session
  UNIQUE (session_id, display_name);

  ALTER TABLE sessions
  ADD COLUMN status session_status NOT NULL DEFAULT 'WAITING';

  ALTER TABLE items
  DROP COLUMN quantity;

---

## 7. Error Codes Added

| Code                 | Meaning                                    |
|----------------------|--------------------------------------------|
| `DISPLAY_NAME_TAKEN` | displayName already exists in this session |

---

## Out of Scope

- Password protection for sessions
- Session expiry / cleanup (future RFC)
- Lite Agent logic (RFC-5)