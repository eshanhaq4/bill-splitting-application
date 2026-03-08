# RFC-3: Frontend State & UI Streaming

**Author:** Joanna
**Must be approved by:** Chris

---

## Overview

This RFC defines the frontend architecture for the bill splitting application. It specifies how major UI components are organized, the structure of the client state, how real-time updates are handled through the WebSocket, and how OCR items stream into the UI. 

The frontend is implemented using Next.js and communicates with the backend using:
- GraphQL for queries and mutations
- WebSockets for real-time session updates

---

## 1. Page and Component Structure

One component is shared between all pages:

**Header**
- Header bar at the top with website name.
- When inside a session, it also displays session members and their connection state (connected / disconnected).

The frontend contains four pages:

#### HomePage

The default page with our home screen. Also where a session can be started by the leader of the group.

Components:
- **OpeningDescription:** Holds the introductory information to our app to let users know what they are getting into it.
- **CreateContainer:** Will display name input, receipt upload, create session button

Behavior:
- Calls *createSession*
- Stores returned token in *localStorage*
- Navigates to *ReceiptPage*

#### JoinPage

Used by additional members joining via shared link or QR code.

Components:
- **JoinContainer:** Will display name input and the join button

Behavior:
- SessionId obtained from URL
- Calls *joinSession*
- Stores returned token in *localStorage*
- Navigates to *ReceiptPage*

#### ReceiptPage

Primary collaborative page where users interact with the bill.

Components:
- **ReceiptContainer:** The main section that will hold all of the receipt information.
- **ItemsContainer:** The container held within the ReceiptContainer, holds a scrollable list of all ItemCards, displays streamed OCR items
- **ItemCard:** Card showcasing all of the item's details such as name, price, and its claim status.
- **ClaimButton:** Button held within the ItemCard, triggers claim or release mutation, manages temporary pending state, and updates claim state in real time including claimant identity.
- **ItemSummaryContainer:** The other main section to the right of the ReceiptContainer, will hold the number of items claimed, subtotal, tax, and total for the current user. Will also hold the ready button.

Behavior:
- Display receipt items
- Stream OCR parsed items
- Handle item claiming
- Display member presence
- Show current user item summary
- Send "ready" signal
- Listen for real-time session updates through the WebSocket

#### SummaryPage

Displayed after the session is finalized.

Components:
- **EndingDescription:** This holds the goodbye text to thank a user for using our service.
- **FinalSummaryTable:** Will display a summary of all of the users item state, this includes the users names, the number of items claimed, and the final total for each.

The page is read-only and does not allow further interaction.

---

## 2. Frontend State Model

The frontend maintains a centralized session state owned by *ReceiptPage*. This state represents the current collaborative session and is updated through GraphQL responses and WebSocket events.

#### Server-derived state

```typescript
session: {
    id: string
    status: "WAITING" | "ACTIVE" | "CLOSED"
}

currentUser: {
    id: string
    displayName: string
}

members: Member[]

type Member = {
    id: string
    displayName: string
    connected: boolean
}

items: Item[]

type Item = {
    id: string
    name: string
    price: number
    category?: string
    claimedBy?: Member | null
    locked: boolean
}
```

#### Client/UI-derived state
 
```typescript
receiptUpload: {
    status: "idle" | "uploading" | "processing" | "streaming" | "complete" | "error"
    jobId?: string
}

websocket: {
    connected: boolean
    reconnecting: boolean
}

claimInteractionState: {
    pendingItemIds: string[]
}

sessionCompletionState: {
    readySubmitted: boolean
}
```

---

## 3. WebSocket Client

The frontend opens a WebSocket connection when the *ReceiptPage* loads.

Connection URL: ws://<host>/ws?token=<token>&session_id=<session_id>

**On Connection**
1) WebSocket connection established
2) Frontend marks *websocket.connected = true*
3) Session events begin streaming
4) WebSocket events are merged into the local session state owned by ReceiptPage, which then triggers React re-renders for child components.

**Reconnection Strategy**
If the WebSocket connection drops:
1) Frontend marks *websocket.connected = false*
2) Client attempts automatic reconnection for a total of 3 times
3) On successful reconnect, the client refetches the full session state using the session GraphQL query
4) Any actions done by the agent if it did take over momentarily will be visible to the client
5) On failed reconnect, the client will simply be redirected to the home page

This ensures that any missed events are reconciled.

---

## 4. UI Streaming

Behavior:
- After *uploadReceipt* mutation is called, UI enters processing
- Receipt page automatically shows up with static state showing that items are being loaded in currently
- Items appear progressively as *OCR_ITEM_PARSED* events arrive
- Appends the item to the *items* array and renders it immediately inside *ItemsContainer* without refreshing the page
- Creates a live streaming experience where items appear progressively while OCR processing is running

The *ItemsContainer* component owns the live streaming list of parsed items.

---

## 5. UI Updates

The frontend will not use optimistic UI updates. Instead it uses a pending confirmation approach:
1) User clicks Claim
2) item id added to claimInteractionState.pendingItemIds and the claim icon enters a loading state
3) Mutation claimItem sent to server
4) Server processes lock/claim logic
5) WebSocket event updates item ownership
6) If the claim fails due to a race condition, the UI removes the loading state and displays the updated owner.
7) If claim succeeds, UI will display the current user as the owner

This approach avoids temporary incorrect UI states during concurrent claims.
