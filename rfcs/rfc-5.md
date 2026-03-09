# RFC-5: Lite Agent Logic

**Author:** Eshan
**Must be approved by:** Ade, Joanna

---

## Overview
This RFC defines the behavior of the Lite Agent, a heuristic-based system that automatically accepts or rejects unresolved bill items on behalf of a disconnected member. The agent activates after a member has been disconnected for 2 minutes and cancels immediately if the member reconnects.

## 1. Trigger Conditions
The agent activates when:
A member has been disconnected for 2 minutes (Redis TTL fires, defined in RFC-6)
There are unresolved items remaining in the session
The session is in ACTIVE state
The agent does not activate if:
The session is in WAITING or CLOSED state
All items are already resolved

## 2. Heuristic Rules
The agent acts only on behalf of the disconnected member and applies the following rules to decide which unclaimed items to claim for them:
| Rule | Behavior |
|------|----------|
| Dietary preference | If `item.category == "meat"` and the disconnected member’s stored `dietary_preference` is `VEGETARIAN` or `VEGAN`, reject |
| Locked items | Skip items that are currently locked by another user |
| Already resolved | Skip items that are already accepted/rejected by someone else |
| Fair-share cap | Agent stops after reaching `floor(unresolved items / number of members)` accepted items |

If no items match the rules, the agent does nothing and the group proceeds without those items being claimed.

## 3. Agent Behavior
- Agent reads all unresolved items for the session
- Agent applies heuristic rules to select actions
- Agent writes claims through Ade's locking logic (RFC-4)
- Agent emits `AGENT_ACTION` WebSocket event per claim
- Agent marks itself as done when no unclaimed items remain
- Agent stops when it has evaluated all of the eligible items or the member reconnects

## 4. Cancellation
If the disconnected member reconnects before the agent finishes:
- Agent stops immediately
- Any actions/claims already made by the agent remain
- Member resumes control of unclaimed items
- Server broadcasts `USER_RECONNECTED` event

## 5. WebSocket Event
Agent uses the `AGENT_ACTION` WebSocket event defined in RFC-1:

```json
{
  "event": "AGENT_ACTION",
  "item_id": "item-uuid",
  "action": "ACCEPTED or REJECTED",
  "on_behalf_of": "user-uuid",
  "display_name": "Eshan"
}
```

## 6. Database Amendment

The Lite Agent dietary rules store a dietary preference for each member. Thus, the database will be amended by adding a `dietary_preference` column to the `members` table.

Supported values for now:
- `NONE`
- `VEGETARIAN`
- `VEGAN`

This value is collected when a member joins a session and it is used by the Lite Agent when evaluating any food-category items.

## Out of Scope
Machine learning based claiming
Agent negotiation between multiple disconnected members
Undoing agent claims