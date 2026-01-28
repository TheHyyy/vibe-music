import { nanoid } from "nanoid";
export const rooms = new Map();
export const roomIdByCode = new Map();
export function defaultSettings() {
  return {
    allowAnonymous: true,
    allowDuplicateSongs: false,
    maxQueuedPerUser: 10,
    skipVoteThreshold: 2,
  };
}
export function createRoom(input) {
  const roomId = nanoid(12);
  const code = nanoid(6).toUpperCase();
  const room = {
    id: roomId,
    name: input.name,
    code,
    settings: defaultSettings(),
  };
  const host = {
    id: input.host.id,
    displayName: input.host.displayName,
    role: "HOST",
  };
  const rec = {
    room,
    members: new Map([[host.id, host]]),
    queue: [],
    nowPlaying: undefined,
    blacklist: new Set(),
    votes: new Map(),
  };
  rooms.set(roomId, rec);
  roomIdByCode.set(code, roomId);
  return { roomId, host };
}
export function joinRoom(input) {
  const roomId = roomIdByCode.get(input.code);
  if (!roomId) throw new Error("房间不存在");
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  if (rec.blacklist.has(input.user.id)) throw new Error("你已被拉黑");
  const existing = rec.members.get(input.user.id);
  if (existing) return { roomId, member: existing };
  const member = {
    id: input.user.id,
    displayName: input.user.displayName,
    role: "MEMBER",
  };
  rec.members.set(member.id, member);
  return { roomId, member };
}
export function updateSettings(roomId, patch) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  rec.room.settings = { ...rec.room.settings, ...patch };
  return rec.room.settings;
}
export function roomRole(roomId, userId) {
  const rec = rooms.get(roomId);
  if (!rec) return null;
  return rec.members.get(userId)?.role || null;
}
export function addQueueItem(roomId, user, song) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const settings = rec.room.settings;
  if (!settings.allowDuplicateSongs) {
    if (rec.queue.some((it) => it.song.id === song.id))
      throw new Error("队列中已存在该歌曲");
  }
  const queuedByUser = rec.queue.filter(
    (it) => it.requestedBy.id === user.id,
  ).length;
  if (queuedByUser >= settings.maxQueuedPerUser)
    throw new Error("已达到个人点歌上限");
  const item = {
    id: nanoid(12),
    roomId,
    song,
    requestedBy: user,
    voteScore: 0,
    createdAt: new Date().toISOString(),
  };
  // 如果当前没有播放，直接播放这首
  if (!rec.nowPlaying) {
    rec.nowPlaying = item;
  } else {
    rec.queue = sortQueue([...rec.queue, item]);
  }
  return item;
}
export function sortQueue(queue) {
  return [...queue].sort((a, b) => {
    if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
export function applyVote(roomId, userId, itemId, type) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const voteKey = `${roomId}:${itemId}:${userId}`;
  const prev = rec.votes.get(voteKey);
  if (prev === type) return currentVoteScore(rec, itemId);
  rec.votes.set(voteKey, type);
  const score = currentVoteScore(rec, itemId);
  rec.queue = sortQueue(
    rec.queue.map((it) =>
      it.id === itemId ? { ...it, voteScore: score } : it,
    ),
  );
  return score;
}
export function currentVoteScore(rec, itemId) {
  let score = 0;
  for (const [key, v] of rec.votes.entries()) {
    if (!key.includes(`:${itemId}:`)) continue;
    if (v === "UP") score += 1;
    if (v === "DOWN") score -= 1;
    if (v === "SKIP") score += 0;
  }
  return score;
}
export function nextSong(roomId) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const [first, ...rest] = rec.queue;
  rec.nowPlaying = first;
  rec.queue = rest;
  return rec.nowPlaying;
}
export function removeMember(roomId, userId) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  rec.members.delete(userId);
}
export function roomStateForUser(roomId, userId) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const currentUser = rec.members.get(userId);
  if (!currentUser) throw new Error("未加入房间");
  return {
    room: rec.room,
    currentUser,
    members: Array.from(rec.members.values()),
    nowPlaying: rec.nowPlaying,
    queue: rec.queue,
  };
}
