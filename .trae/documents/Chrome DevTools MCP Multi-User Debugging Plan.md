I will execute the Chrome DevTools MCP debugging plan as follows:

### Phase 1: Environment Setup & Session Initialization
1.  **Launch Pages**: Open 3 separate pages pointing to `http://localhost:5173` to represent **Host**, **GuestA**, and **GuestB**.
2.  **Session Isolation**: Clear `localStorage` and `sessionStorage` on GuestA and GuestB to ensure clean sessions.

### Phase 2: Host Smoke Test
1.  **Create Room**: On Host page, create a room named "Debug Room".
2.  **Get Room Link**: Capture the generated Room URL (containing the Room ID).
3.  **Basic Playback**:
    *   Search for "许嵩".
    *   Add a song (e.g., "如果当时").
    *   Verify the song appears in the queue and starts playing.

### Phase 3: Multi-User Connection
1.  **Guests Join**: Navigate GuestA and GuestB to the captured Room URL.
2.  **Sync Verification**: Confirm that both Guests immediately show the correct **Current Song** and **Queue**.

### Phase 4: Interaction & Consistency Verification
1.  **Host -> Guest Sync**: Host adds another song ("温泉"). Verify it appears on Guests' queues.
2.  **Guest -> Host Sync**: GuestA adds a song ("雅俗共赏"). Verify it appears on Host and GuestB.
3.  **Playback Control**: Host skips the current song. Verify all clients switch to the next song synchronously.
4.  **Permissions**: GuestA attempts to skip a song. Record the outcome (allowed or denied).

### Phase 5: Concurrency & Resilience
1.  **Concurrent Actions**: Trigger song additions from Host and GuestA in rapid succession to test queue consistency.
2.  **Recovery**: Reload GuestA's page and verify it reconnects and restores the correct room state automatically.

### Phase 6: Reporting
*   I will log the results of each step, including successful syncs and any anomalies found.
