I will implement the requested features to improve the music room experience.

### 1. Auto-play Trending Songs (When Queue is Empty)
**Goal**: Prevent playback from stopping when the playlist runs out.
- **Backend (`server/src/music/netease.ts`)**: Add a `getHotSongs()` method that searches for trending music (e.g., query "热歌" with a random offset) to fetch a recommendation.
- **Backend (`server/src/index.ts`)**: Update the next song logic. If the queue is empty when `nextSong` is called:
  1. Fetch a recommendation using `getHotSongs()`.
  2. Add it to the queue.
  3. Proceed to play this new song.

### 2. Search Pagination
**Goal**: Allow users to see more than 10 search results.
- **Backend**:
  - Update `server/src/music/service.ts` and `netease.ts` to accept a `page` or `offset` parameter.
  - Update the `/api/songs/search` endpoint in `server/src/index.ts` to handle the `page` query parameter.
- **Frontend (`web/src/components/room/search/SongSearch.vue`)**:
  - Add a "Load More" button (or "Next Page").
  - Maintain `page` state.
  - Append new results to the existing list.

### 3. Round Album Art
**Goal**: Change the current playing song's cover to a circular design.
- **Frontend (`web/src/components/room/nowPlaying/NowPlaying.vue`)**:
  - Update the CSS for the album art image container.
  - Change `rounded-2xl` to `rounded-full` and ensure `overflow: hidden` is applied for a perfect circle.

### 4. Auto-play Resilience (Room Owner Leaves)
**Goal**: Ensure the next song plays automatically even if the room owner (host) is not present.
- **Backend (`server/src/index.ts`)**:
  - Create a new endpoint `POST /api/rooms/:roomId/ended`.
  - Allow **any** room member to call this endpoint.
  - **Validation**: The server will verify if the current song has actually finished playing (based on start time and duration) to prevent abuse.
  - If valid, it triggers the `nextSong` logic (which includes the auto-play trending song logic from item #1).
- **Frontend (`web/src/components/room/nowPlaying/NowPlaying.vue`)**:
  - Modify the `onEnded` event handler.
  - Instead of checking `canAdmin`, simply call the new `ended` API. This ensures that *any* connected client can trigger the transition to the next song.
