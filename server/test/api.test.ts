import assert from "assert";
import { test } from "node:test";

const API_BASE = "http://localhost:3001/api";

async function post(path: string, body: any, token?: string) {
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path: string, token?: string) {
  const headers: any = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  return { status: res.status, data: await res.json() };
}

test("Echo Music API Flow", async (t) => {
  let roomId = "";
  let hostToken = "";
  let songId = "";

  await t.test("1. Create Room", async () => {
    const res = await post("/rooms", { name: "Test Room", displayName: "Tester" });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.ok);
    roomId = res.data.data.roomId;
    hostToken = res.data.data.token;
    console.log("Room created:", roomId);
  });

  await t.test("2. Search Song", async () => {
    // Mock search if needed, but we can try real
    const res = await get("/songs/search?q=周杰伦");
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.ok);
    const songs = res.data.data;
    assert.ok(songs.length > 0);
    songId = songs[0].id;
    console.log("Song found:", songs[0].title, songId);
  });

  await t.test("3. Add Song to Queue (Auto Play)", async () => {
    const res = await post(
      `/rooms/${roomId}/queue`,
      {
        song: {
          id: songId,
          title: "Test Song",
          source: "NETEASE",
          durationSec: 180,
        },
      },
      hostToken
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.ok);
    console.log("Song added");
  });

  await t.test("4. Check Room State (Now Playing)", async () => {
    const res = await get(`/rooms/${roomId}/state`, hostToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.ok);
    const state = res.data.data;
    // Should be playing immediately because queue was empty
    assert.ok(state.nowPlaying, "Should have nowPlaying");
    assert.strictEqual(state.nowPlaying.song.id, songId);
    console.log("Now playing:", state.nowPlaying.song.title);
  });

  await t.test("5. Get Play URL", async () => {
    const res = await get(`/songs/url?id=${songId}`);
    // Might fail if song is VIP, but should return 200 or 404 handled gracefully
    if (res.status === 200) {
      assert.ok(res.data.ok);
      console.log("Play URL:", res.data.data.url);
    } else {
      console.log("Get URL failed (expected for VIP sometimes):", res.status, res.data);
    }
  });
});
