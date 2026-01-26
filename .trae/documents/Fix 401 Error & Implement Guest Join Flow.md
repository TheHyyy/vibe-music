I will fix the 401 error and improve the guest joining experience by implementing a "Join Room" flow directly on the room page.

### Phase 1: Backend - Public Room Info Endpoint
1.  **Add Endpoint**: Create `GET /api/rooms/:roomId/public` in `server/src/index.ts`.
2.  **Logic**: Look up the room by ID. If found, return basic info `{ name, code, hostName }`. If not, return 404.
3.  **Auth**: This endpoint will be **public** (no token required) so guests can see what room they are joining.

### Phase 2: Frontend - Join Room Dialog
1.  **Create Component**: `web/src/components/room/JoinRoomDialog.vue`.
    *   **UI**: A modal showing "Join [Room Name]".
    *   **Input**: "Nickname" field, pre-filled from `localStorage` or generated default (e.g., "Guest 8848").
    *   **Action**: "Join" button that calls `joinRoom` API.
2.  **API Update**: Add `getPublicRoomInfo` to `web/src/api/rooms.ts`.

### Phase 3: Frontend - Integration in RoomPage
1.  **Handle 401**: Modify `RoomPage.vue` to intercept 401 errors.
    *   Instead of redirecting to Home, trigger the "Join Room" flow.
    *   Fetch public room info using the `roomId` from the URL.
2.  **Show Dialog**: Display `JoinRoomDialog` when public info is loaded.
3.  **On Join Success**:
    *   Store the new token.
    *   Hydrate room state.
    *   Close dialog and let the user interact with the room.

### Phase 4: Verification
1.  **Scenario**: Open a room URL in a new Incognito window (simulating a guest).
2.  **Expectation**:
    *   No 401 error console spam (or handled gracefully).
    *   See "Join Room" dialog with a default nickname.
    *   Click "Join" -> Successfully enter the room and sync state.
