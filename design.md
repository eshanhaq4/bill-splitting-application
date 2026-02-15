# Bill Split App - Design Document

**Team Members:** Christopher Ridad, Eshan Haq, Adedamola Adejumobi, Joanna Echeverri Porras

---

## 1. Architecture Overview

### Components:
- **Client**: Next.js web application
- **Django Server**: REST API + WebSocket server
- **Background Worker**: Python RQ worker for OCR processing
- **PostgreSQL**: Database (via Supabase)
- **Redis**: Event Queue (job queue) + Topic Queue (pub/sub)
- **Lite Agent**: Auto-approve/reject service

### System Diagram

![System Architecture](./diagrams/system-diagram.png)

### Sequence Diagrams

![Import Receipt](./diagrams/upload-receipt.png)

![Claim Items](./diagrams/user-claim.png)

![Lite Agent](./diagrams/lite-agent.png)

---

## 2. State Model

---

## 3. Data Model (Schema)


---

## 4. API Design

### Simple actions such as uploading a receipt

#### API Format: GraphQL Mutation

- When someone uploads a receipt, it should be a write operation, and it needs to be non-blocking.
- The uploadReceipt GraphQL mutation takes in the file, pushes an OCR job onto the Redis event queue, and immediately returns a job ID.
- It also updates the bill’s status to PROCESSING and sends back a confirmation right away, without waiting for the OCR to finish.
- This is asynchronous, so the server responds instantly, and the actual OCR processing happens later in a background worker.

### Fetch group, bill, user, and other nested data

#### API Format: GraphQL Query

- We need to fetch the full bill efficiently, so we shouldn’t use a REST API.
- With a GraphQL query, you can grab the whole bill, plus everything nested under it, like items, users, and claims, in a single request.
- The client can ask for only the fields it actually wants, so we’re not stuck with over-fetching or under-fetching.
- With GraphQL, resolvers can fetch related data more intelligently via joins/batching, so we can get everything efficiently from the database.

### Realtime updates

#### API Format: WebSocket

- WebSockets create a bidirectional, persistent connection, so the server can push updates to all connected clients instantly
- If User A claims an item, Users B, C, and D see that change immediately because the server broadcasts it to everyone through the WebSocket.
- While the background worker is processing a receipt, partial OCR results are published to Redis. The server listens for those updates and - streams them to clients via WebSocket, so items show up progressively without a page refresh.
- If the Lite Agent auto-rejects items for someone who’s offline, the rest of the group is notified right away through WebSocket events.
- The server can push events like item_claimed, ocr_progress, agent_action, or user_joined/left without the client having to ask for them.

---

## 5. Failure Scenarios


...