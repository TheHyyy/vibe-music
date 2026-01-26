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
import { addQueueItem, applyVote, createRoom, joinRoom, nextSong, removeMember, roomRole, roomStateForUser, rooms, updateSettings, } from "./store.js";
import { searchMusic, getPlayUrl, getLyric } from "./music/service.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({
    origin: true,
    credentials: true,
}));
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
    if (!auth)
        return null;
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m?.[1] || null;
}
function authRoom(req) {
    const token = parseBearer(req.headers.authorization);
    if (!token)
        throw new Error("未登录");
    const payload = verifyToken(token);
    return payload;
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
        if (input.settings)
            updateSettings(roomId, input.settings);
        const token = signToken({ userId, roomId });
        const state = buildState(roomId, userId);
        res.json(ok({ roomId, token, state }));
    }
    catch (e) {
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
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.get("/api/rooms/:roomId/state", (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        res.json(ok(buildState(roomId, userId)));
    }
    catch (e) {
        res.status(401).json(err(e.message));
    }
});
app.post("/api/rooms/:roomId/queue", (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        const input = z.object({ song: z.any() }).parse(req.body);
        const rec = rooms.get(roomId);
        if (!rec)
            throw new Error("房间不存在");
        const user = rec.members.get(userId);
        if (!user)
            throw new Error("未加入房间");
        const song = input.song;
        const item = addQueueItem(roomId, user, song);
        io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
        broadcastRoomState(roomId);
        res.json(ok(item));
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.post("/api/rooms/:roomId/queue/:itemId/votes", (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        const input = z
            .object({ type: z.enum(["UP", "DOWN", "SKIP"]) })
            .parse(req.body);
        const score = applyVote(roomId, userId, req.params.itemId, input.type);
        io.to(roomId).emit("vote:update", {
            itemId: req.params.itemId,
            voteScore: score,
        });
        const rec = rooms.get(roomId);
        if (rec)
            io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
        res.json(ok({ itemId: req.params.itemId, voteScore: score }));
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.patch("/api/rooms/:roomId/settings", (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        const role = roomRole(roomId, userId);
        if (role !== "HOST")
            throw new Error("仅房主可修改设置");
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
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.post("/api/rooms/:roomId/admin/next", (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        const role = roomRole(roomId, userId);
        if (role !== "HOST" && role !== "MODERATOR")
            throw new Error("无权限");
        const nowPlaying = nextSong(roomId);
        const rec = rooms.get(roomId);
        if (rec)
            io.to(roomId).emit("queue:update", { mode: "replace", queue: rec.queue });
        broadcastRoomState(roomId);
        res.json(ok({ nowPlaying }));
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.post("/api/rooms/:roomId/admin/kick", async (req, res) => {
    try {
        const { userId, roomId } = authRoom(req);
        if (roomId !== req.params.roomId)
            throw new Error("无权访问");
        const role = roomRole(roomId, userId);
        if (role !== "HOST")
            throw new Error("仅房主可踢人");
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
    }
    catch (e) {
        res.status(400).json(err(e.message));
    }
});
app.get("/api/songs/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) {
        res.json(ok([]));
        return;
    }
    try {
        const items = await searchMusic(q);
        res.json(ok(items));
    }
    catch (e) {
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
    }
    catch (e) {
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
    }
    catch (e) {
        res.status(500).json(err(e.message));
    }
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
        if (!token)
            throw new Error("未登录");
        const payload = verifyToken(token);
        socket.data.userId = payload.userId;
        socket.data.roomId = payload.roomId;
        next();
    }
    catch (e) {
        next(new Error(e.message));
    }
});
io.on("connection", (socket) => {
    socket.on("room:join", (body, ack) => {
        try {
            const userId = socket.data.userId;
            const tokenRoomId = socket.data.roomId;
            if (tokenRoomId !== body.roomId)
                throw new Error("无权加入");
            socket.join(body.roomId);
            ack?.(ok(buildState(body.roomId, userId)));
            broadcastRoomState(body.roomId);
        }
        catch (e) {
            ack?.(err(e.message));
        }
    });
});
async function broadcastRoomState(roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    for (const s of sockets) {
        const userId = s.data.userId;
        try {
            s.emit("room:state", buildState(roomId, userId));
        }
        catch {
            void 0;
        }
    }
}
const port = Number(process.env.PORT || 3001);
httpServer.listen(port, () => {
    process.stdout.write(`server listening on http://localhost:${port}\n`);
});
