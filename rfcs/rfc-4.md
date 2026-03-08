# RFC-4: Item Locking & Race Condition Strategy

**Author:** Ade
**Must be approved by:** Chris, Eshan

---

## Overview

This RFC defines how items are locked and unlocked to prevent race conditions when multiple users attempt to claim the same item simultaneously.

---

## 1. Problem Statement

When two users tap "Claim" on the same item at nearly the same time, both requests arrive at the server within milliseconds of each other. Network latency and thread scheduling mean the database can receive both writes before either completes resulting in an item claimed by two people.

---

## 2. Locking Strategy

We use an **atomic conditional SQL update** as the source of truth, combined with WebSocket broadcasts to keep all clients in sync.

`locked` and `claimed` are not the same thing. An item is **locked** while a claim is being processed. It is **claimed** only once the DB write is confirmed. Clients must treat these as distinct states.

---

## 3. Claim Flow

**Happy path:**
1. Chris taps "Claim Burger"
2. Server broadcasts `ITEM_LOCKED` to all clients immediately
3. Server runs atomic SQL: `UPDATE items SET claimed_by = :userId WHERE id = :itemId AND claimed_by IS NULL`
4. SQL returns 1 row affected → server broadcasts `ITEM_CLAIMED`

**Race condition (Alex loses):**
1. Alex's request arrives after Chris's write completes
2. SQL returns 0 rows affected → server broadcasts `ITEM_UNLOCKED`
3. Server returns `ITEM_ALREADY_CLAIMED` error to Alex

**Failure path:**
1. `ITEM_LOCKED` already broadcast
2. Unexpected exception occurs before or during DB write
3. Server broadcasts `ITEM_UNLOCKED` from catch block
4. Server returns `SERVER_ERROR` to client

Every code path must resolve to either `ITEM_CLAIMED` or `ITEM_UNLOCKED`. An item must never remain locked without a resolution.

---

## 4. Why Atomic SQL

We considered pessimistic locking (block one thread until the other finishes) and optimistic locking (let both try, reject the loser). Pessimistic locking requires explicit cleanup and breaks on server crash. Optimistic locking does wasted work.

The atomic conditional update does the READ and WRITE in a single SQL statement. The database guarantees only one writer can succeed. No separate lock to manage, no cleanup needed.

---

## 5. WebSocket Events

**ITEM_LOCKED** — broadcast immediately when a claim attempt begins.
```json
{ "event": "ITEM_LOCKED", "item_id": "item-uuid" }
```

**ITEM_CLAIMED** — broadcast after DB write succeeds.
```json
{ "event": "ITEM_CLAIMED", "item_id": "item-uuid", "claimed_by": "user-uuid", "display_name": "Chris" }
```

**ITEM_UNLOCKED** — broadcast when a claim attempt fails for any reason. Clients revert item to available.
```json
{ "event": "ITEM_UNLOCKED", "item_id": "item-uuid" }
```

**ITEM_RELEASED** — broadcast when a user voluntarily releases their claim.
```json
{ "event": "ITEM_RELEASED", "item_id": "item-uuid" }
```

---

## 6. Error Codes Added

`ITEM_ALREADY_CLAIMED` — race condition loser, item was claimed by someone else.
`ITEM_LOCKED` — item is currently being processed.

---

## Out of Scope

- Split claiming between multiple members — future RFC
- Claim timeout / auto-release — future RFC
- Lite Agent claim behaviour — RFC-5