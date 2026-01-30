import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { signToken, verifyToken } from "./auth.js";
import {
  addQueueItem,
  applyVote,
  cancelLeave,
  createRoom,
  joinRoom,
  nextSong,
  removeMember,
  roomRole,
  roomStateForUser,
  rooms,
  scheduleLeave,
  updatePlayback,
  updateSettings,
} from "./store.js";
import {
  searchMusic,
  getPlayUrl,
  getLyric,
  getHotRecommendation,
} from "./music/service.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
// 托管前端静态资源
const clientDist = path.resolve(__dirname, "../../client_dist");
app.use(express.static(clientDist));
function ok(data) {
  return { ok: true, data };
}
function err(message, code) {
  return { ok: false, error: { message, code } };
}
function parseBearer(auth) {
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}
function authRoom(req) {
  const token = parseBearer(req.headers.authorization);
  console.log("[Auth] Header:", req.headers.authorization);
  if (!token) {
    console.error("[Auth] No token found");
    throw new Error("未登录");
  }
  try {
    const payload = verifyToken(token);
    console.log("[Auth] Verified payload:", payload);
    return payload;
  } catch (e) {
    console.error("[Auth] Verify failed:", e);
    throw e;
  }
}
function buildState(roomId, userId) {
  return roomStateForUser(roomId, userId);
}
const createRoomSchema = z.object({
  name: z.string().min(1).max(120),
  displayName: z.string().min(1).max(80),
  settings: z
    .object({
      allowAnonymous: z.boolean().optional(),
      allowDuplicateSongs: z.boolean().optional(),
      maxQueuedPerUser: z.number().int().min(1).max(50).optional(),
      skipVoteThreshold: z.number().int().min(1).max(100).optional(),
    })
    .optional(),
});
app.post("/api/rooms", (req, res) => {
  try {
    const input = createRoomSchema.parse(req.body);
    const userId = nanoid(12);
    const { roomId, host } = createRoom({
      name: input.name,
      host: { id: userId, displayName: input.displayName },
    });
    if (input.settings) updateSettings(roomId, input.settings);
    const token = signToken({ userId, roomId });
    const state = buildState(roomId, userId);
    res.json(ok({ roomId, token, state }));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.post("/api/rooms/join", (req, res) => {
  try {
    const input = z
      .object({
        code: z.string().min(1).max(20),
        displayName: z.string().min(1).max(80),
      })
      .parse(req.body);
    const userId = nanoid(12);
    const code = input.code.trim().toUpperCase();
    const { roomId } = joinRoom({
      code,
      user: { id: userId, displayName: input.displayName },
    });
    const token = signToken({ userId, roomId });
    const state = buildState(roomId, userId);
    res.json(ok({ roomId, token, state }));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.get("/api/rooms/:roomId/public", (req, res) => {
  try {
    const rec = rooms.get(req.params.roomId);
    if (!rec) throw new Error("房间不存在");
    const host = Array.from(rec.members.values()).find(
      (m) => m.role === "HOST",
    );
    res.json(
      ok({
        name: rec.room.name,
        code: rec.room.code,
        hostName: host?.displayName,
      }),
    );
  } catch (e) {
    res.status(404).json(err(e.message));
  }
});
app.get("/api/rooms/:roomId/state", (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    res.json(ok(buildState(roomId, userId)));
  } catch (e) {
    const msg = e.message;
    if (msg === "未登录") res.status(401).json(err(msg));
    else if (msg === "无权访问") res.status(403).json(err(msg));
    else if (msg === "房间不存在") res.status(404).json(err(msg));
    else res.status(400).json(err(msg));
  }
});
app.post("/api/rooms/:roomId/queue", (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const input = z.object({ song: z.any() }).parse(req.body);
    const rec = rooms.get(roomId);
    if (!rec) throw new Error("房间不存在");
    const user = rec.members.get(userId);
    if (!user) throw new Error("未加入房间");
    const song = input.song;
    // 记录旧的 nowPlaying ID，用于判断是否需要全量广播
    const oldNowPlayingId = rec.nowPlaying?.id;
    const item = addQueueItem(roomId, user, song);
    // 如果 nowPlaying 变了（例如之前为空），则全量广播以更新播放状态
    if (rec.nowPlaying?.id !== oldNowPlayingId) {
      broadcastRoomState(roomId);
    } else {
      // 否则只广播队列更新，减少开销
      io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
    }
    res.json(ok(item));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.post("/api/rooms/:roomId/queue/:itemId/votes", (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const input = z
      .object({ type: z.enum(["UP", "DOWN", "SKIP"]) })
      .parse(req.body);
    const { score, skipCount } = applyVote(
      roomId,
      userId,
      req.params.itemId,
      input.type,
    );
    // Broadcast updates
    const rec = rooms.get(roomId);
    if (rec) {
      io.to(roomId).emit("vote:update", {
        itemId: req.params.itemId,
        voteScore: score,
      });
      io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
      // Check for automatic skip
      if (
        input.type === "SKIP" &&
        rec.nowPlaying?.id === req.params.itemId &&
        skipCount >= rec.room.settings.skipVoteThreshold
      ) {
        console.log(`[Vote] Skip threshold reached for room ${roomId}`);
        const nowPlaying = nextSong(roomId);
        io.to(roomId).emit("queue:update", {
          mode: "replace",
          queue: rec.queue,
        });
        broadcastRoomState(roomId);
      } else if (rec.nowPlaying?.id === req.params.itemId) {
        // If it was a vote on nowPlaying but didn't skip, we still need to sync nowPlaying state (skip votes)
        // Since "room:state" is heavy, maybe we just rely on the next periodic sync or optimistically update?
        // Actually, broadcastRoomState is fine or we can emit a smaller event.
        // For now, let's just broadcast to be safe and consistent.
        broadcastRoomState(roomId);
      }
    }
    res.json(ok({ itemId: req.params.itemId, voteScore: score }));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.patch("/api/rooms/:roomId/settings", (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const role = roomRole(roomId, userId);
    if (role !== "HOST") throw new Error("仅房主可修改设置");
    const input = z
      .object({
        allowAnonymous: z.boolean().optional(),
        allowDuplicateSongs: z.boolean().optional(),
        maxQueuedPerUser: z.number().int().min(1).max(50).optional(),
        skipVoteThreshold: z.number().int().min(1).max(100).optional(),
      })
      .parse(req.body);
    const settings = updateSettings(roomId, input);
    broadcastRoomState(roomId);
    res.json(ok(settings));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
const AUTOPLAY_USER = {
  id: "autoplay-bot",
  displayName: "自动点歌",
  role: "MEMBER",
};
app.post("/api/rooms/:roomId/admin/next", async (req, res) => {
  console.log("[API] Next song request for room:", req.params.roomId);
  try {
    gc;
    const { userId, roomId } = authRoom(req);
    console.log("[API] Next song auth passed for user:", userId);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const role = roomRole(roomId, userId);
    console.log("[API] User role:", role);
    if (role !== "HOST" && role !== "MODERATOR") throw new Error("无权限");
    let nowPlaying = nextSong(roomId);
    const rec = rooms.get(roomId);
    // Auto-play hot song if queue is empty
    if (!nowPlaying && rec) {
      console.log("[AdminNext] Queue empty, fetching hot song...");
      const hotSong = await getHotRecommendation();
      if (hotSong) {
        console.log("[AdminNext] Found hot song:", hotSong.title);
        // Use the virtual user for attribution
        const item = addQueueItem(roomId, AUTOPLAY_USER, hotSong);
        // addQueueItem sets nowPlaying if it was empty, so we don't need to call nextSong again
        nowPlaying = item;
      } else {
        console.warn("[AdminNext] Failed to find hot song");
      }
    }
    if (rec)
      io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
    broadcastRoomState(roomId);
    res.json(ok({ nowPlaying }));
  } catch (e) {
    console.error("[API] Next song failed:", e);
    const msg = e.message;
    if (msg === "未登录") res.status(401).json(err(msg));
    else if (msg === "无权访问" || msg === "无权限")
      res.status(403).json(err(msg));
    else if (msg === "房间不存在") res.status(404).json(err(msg));
    else res.status(400).json(err(msg));
  }
});
app.post("/api/rooms/:roomId/ended", async (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const rec = rooms.get(roomId);
    if (!rec) throw new Error("房间不存在");
    const input = z.object({ songId: z.string() }).parse(req.body);
    // Verify if the song requesting to end is actually the one playing
    if (!rec.nowPlaying || rec.nowPlaying.id !== input.songId) {
      // It might have been skipped already
      res.json(ok({ skipped: false, reason: "Already skipped" }));
      return;
    }
    // Perform next song logic (with auto-play fallback)
    let nowPlaying = nextSong(roomId);
    if (!nowPlaying) {
      console.log("[Ended] Queue empty, fetching hot song...");
      const hotSong = await getHotRecommendation();
      if (hotSong) {
        console.log("[Ended] Found hot song:", hotSong.title);
        // Use the virtual user for attribution
        const item = addQueueItem(roomId, AUTOPLAY_USER, hotSong);
        nowPlaying = item;
      } else {
        console.warn("[Ended] Failed to find hot song");
      }
    }
    io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
    broadcastRoomState(roomId);
    res.json(ok({ nowPlaying }));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.post("/api/rooms/:roomId/admin/kick", async (req, res) => {
  try {
    const { userId, roomId } = authRoom(req);
    if (roomId !== req.params.roomId) throw new Error("无权访问");
    const role = roomRole(roomId, userId);
    if (role !== "HOST") throw new Error("仅房主可踢人");
    const input = z.object({ userId: z.string().min(1) }).parse(req.body);
    removeMember(roomId, input.userId);
    const sockets = await io.in(roomId).fetchSockets();
    for (const s of sockets) {
      if (s.data.userId === input.userId) {
        s.emit("user:kicked", { reason: "你已被房主移出" });
        s.disconnect(true);
      }
    }
    broadcastRoomState(roomId);
    res.json(ok({ ok: true }));
  } catch (e) {
    res.status(400).json(err(e.message));
  }
});
app.get("/api/songs/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const page = Number(req.query.page) || 1;
  if (!q) {
    res.json(ok([]));
    return;
  }
  try {
    const items = await searchMusic(q, page);
    res.json(ok(items));
  } catch (e) {
    res.status(500).json(err(e.message));
  }
});
app.get("/api/songs/url", async (req, res) => {
  const id = String(req.query.id || "").trim();
  if (!id) {
    res.status(400).json(err("Missing id"));
    return;
  }
  try {
    const url = await getPlayUrl(id);
    if (!url) {
      res.status(404).json(err("Not found or playable"));
      return;
    }
    res.json(ok({ url }));
  } catch (e) {
    res.status(500).json(err(e.message));
  }
});
app.get("/api/songs/lyric", async (req, res) => {
  const id = String(req.query.id || "").trim();
  if (!id) {
    res.status(400).json(err("Missing id"));
    return;
  }
  try {
    const lyric = await getLyric(id);
    res.json(ok({ lyric: lyric || "" }));
  } catch (e) {
    res.status(500).json(err(e.message));
  }
});
app.get("/api/config", (req, res) => {
  res.json(
    ok({
      enableQQ: process.env.ENABLE_QQ_MUSIC === "true",
    }),
  );
});
// SPA Fallback: 所有未匹配 API 的 GET 请求返回 index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("未登录");
    const payload = verifyToken(token);
    socket.data.userId = payload.userId;
    socket.data.roomId = payload.roomId;
    next();
  } catch (e) {
    next(new Error(e.message));
  }
});
io.on("connection", (socket) => {
  socket.on("room:join", (body, ack) => {
    try {
      const userId = socket.data.userId;
      const tokenRoomId = socket.data.roomId;
      if (tokenRoomId !== body.roomId) throw new Error("无权加入");
      // Cancel any pending leave timer for this user
      const wasScheduled = cancelLeave(body.roomId, userId);
      if (wasScheduled) {
        console.log(
          `[Join] Canceled pending leave for user ${userId} in room ${body.roomId}`,
        );
      }
      socket.join(body.roomId);
      ack?.(ok(buildState(body.roomId, userId)));
      broadcastRoomState(body.roomId);
      // Check if room is empty and auto-play
      const rec = rooms.get(body.roomId);
      if (rec && !rec.nowPlaying && rec.queue.length === 0) {
        console.log(
          `[Join] Room ${body.roomId} is empty, triggering auto-play...`,
        );
        getHotRecommendation()
          .then((hotSong) => {
            // Re-check state inside async callback
            const currentRec = rooms.get(body.roomId);
            if (
              hotSong &&
              currentRec &&
              !currentRec.nowPlaying &&
              currentRec.queue.length === 0
            ) {
              addQueueItem(body.roomId, AUTOPLAY_USER, hotSong);
              broadcastRoomState(body.roomId);
            }
          })
          .catch((e) => console.error("[Join] Auto-play failed:", e));
      }
    } catch (e) {
      ack?.(err(e.message));
    }
  });
  socket.on("disconnect", () => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      if (userId && roomId) {
        console.log(
          `[Disconnect] User ${userId} disconnected from room ${roomId}, scheduling removal...`,
        );
        scheduleLeave(roomId, userId, () => {
          console.log(
            `[Disconnect] Removing user ${userId} from room ${roomId} after timeout`,
          );
          try {
            removeMember(roomId, userId);
            broadcastRoomState(roomId);
          } catch (e) {
            console.error(`[Disconnect] Failed to remove member: ${e}`);
          }
        });
      }
    } catch (e) {
      console.error("disconnect error", e);
    }
  });
  socket.on("player:update", (body) => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      if (roomId !== body.roomId) return;
      const role = roomRole(roomId, userId);
      if (role !== "HOST" && role !== "MODERATOR") return;
      const state = updatePlayback(roomId, {
        isPaused: body.isPaused,
        startTime: Date.now() - body.currentTime * 1000,
        pausedAt: body.isPaused ? Date.now() : undefined,
      });
      io.to(roomId).emit("player:sync", state);
    } catch (e) {
      console.error("player:update error", e);
    }
  });
});
async function broadcastRoomState(roomId) {
  const sockets = await io.in(roomId).fetchSockets();
  console.log(`[Broadcast] Room ${roomId} has ${sockets.length} sockets`);
  for (const s of sockets) {
    const userId = s.data.userId;
    try {
      console.log(`[Broadcast] Sending state to user ${userId}`);
      s.emit("room:state", buildState(roomId, userId));
    } catch (e) {
      console.error(`[Broadcast] Failed to send state to user ${userId}:`, e);
      void 0;
    }
  }
}
const port = Number(process.env.PORT || 3001);
httpServer.listen(port, () => {
  process.stdout.write(`server listening on http://localhost:${port}\n`);
});
