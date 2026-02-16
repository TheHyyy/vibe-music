# Fix Plan: Queue Item Buttons & UI Confusion

I have identified the issues causing the reported errors and confusion with the Queue List buttons.

## Issues
1.  **"Easy to Error" (First two buttons)**: Caused by `v-memo` in `QueueItem.vue`. This directive prevents the component from updating when the global loading state (`actionLoading`) changes, leading to unresponsive UI or stuck loading spinners.
2.  **"No Reaction" (Last button)**: The "Skip" button in the queue list calls the vote API, but since the song isn't playing, nothing visible happens (it just records a vote). This is confusing for users who expect it to "Skip/Delete" the song.
3.  **"Submitted" Confusion**: The success message is generic and doesn't explain that a vote was cast.

## Implementation Steps

### 1. Frontend: Fix `QueueItem.vue`
*   **Remove `v-memo`**: Ensure the component reacts correctly to loading state changes.
*   **Remove Skip Button**: The "Skip" button in the **waiting list** is misleading (it implies "Next" or "Delete"). I will remove it to avoid confusion. Users should use the "Skip" button in the **Now Playing** area (which I added in the previous step) to vote for skipping the *current* song.
*   **Update UI**:
    *   Keep "Up" and "Down" vote buttons.
    *   Ensure loading states display correctly.

### 2. Verification
*   Verify that clicking Up/Down buttons correctly shows the loading spinner and updates the score.
*   Confirm the confusing "Skip" button is gone from the queue list.

This focuses on polishing the UI to match the backend logic and reducing user confusion. The "ENOENT" error reported likely stems from a separate environment issue (missing build artifacts) or routing mismatch, which should be mitigated by ensuring we use the correct API endpoints and that the UI reflects valid actions.