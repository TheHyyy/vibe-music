# Fix Plan: Host Permission Loss & Member Sync Issues

I have analyzed the server-side room management and confirmed the root causes for the reported failures.

## Root Cause Analysis
1.  **Host Permission Loss**: The server does not persist the "Host" identity in the room metadata. When a Host disconnects (e.g., refresh), they are removed from the member list. Upon reconnecting, the `joinRoom` function treats them as a new user and defaults their role to `MEMBER`.
2.  **Member Sync & 400 Errors**: Socket disconnection triggers immediate removal of the member. Subsequent HTTP requests (like `/state`) fail with 400/403 because the user is no longer in the room. The frontend fix (showing Join Dialog) is correct, but the server must ensure that re-joining restores the correct role.

## Implementation Steps

### 1. Server-Side: Persist Host Identity
I will modify the server to store the `hostId` permanently in the room object, ensuring that the original creator always regains `HOST` privileges upon re-joining.

*   **Modify `server/src/types.ts`**:
    *   Update `Room` interface to include `hostId: string`.
*   **Modify `server/src/store.ts`**:
    *   Update `createRoom`: Store the `hostId` in the created room object.
    *   Update `joinRoom`: Add logic to check if the joining user's ID matches `room.hostId`. If yes, force assign `role: "HOST"`.

### 2. Verification
*   **Host Restore**: Create a room, refresh the page, re-join, and verify the role is `HOST`.
*   **Member Sync**: Verify online counts are accurate after refresh.

This plan directly addresses the Critical and Blocker issues by ensuring robust role management and allowing the existing frontend reconnection logic to work correctly.