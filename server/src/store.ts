import { nanoid } from "nanoid";
import type {
  PlaybackState,
  QueueItem,
  Room,
  RoomRole,
  RoomSettings,
  Song,
  UserSummary,
} from "./types.js";

export interface RoomRecord {
  room: Room;
  members: Map<string, UserSummary>;
  queue: QueueItem[];
  nowPlaying?: QueueItem;
  playback: PlaybackState;
  blacklist: Set<string>;
  votes: Map<string, "UP" | "DOWN" | "SKIP">;
}

export const rooms = new Map<string, RoomRecord>();
export const roomIdByCode = new Map<string, string>();

// Store pending leave timers: `${roomId}:${userId}` -> NodeJS.Timeout
const pendingLeaves = new Map<string, NodeJS.Timeout>();

export function scheduleLeave(
  roomId: string,
  userId: string,
  callback: () => void,
) {
  const key = `${roomId}:${userId}`;
  if (pendingLeaves.has(key)) {
    clearTimeout(pendingLeaves.get(key));
  }

  // Wait 5 seconds before actually removing
  const timer = setTimeout(() => {
    pendingLeaves.delete(key);
    callback();
  }, 5000);

  pendingLeaves.set(key, timer);
}

export function cancelLeave(roomId: string, userId: string) {
  const key = `${roomId}:${userId}`;
  if (pendingLeaves.has(key)) {
    clearTimeout(pendingLeaves.get(key));
    pendingLeaves.delete(key);
    return true; // Successfully canceled
  }
  return false;
}

export function defaultSettings(): RoomSettings {
  return {
    allowAnonymous: true,
    allowDuplicateSongs: false,
    maxQueuedPerUser: 10,
    skipVoteThreshold: 2,
  };
}

export function createRoom(input: {
  name: string;
  host: { id: string; displayName: string };
}): {
  roomId: string;
  host: UserSummary;
} {
  const roomId = nanoid(12);
  const code = nanoid(6).toUpperCase();
  const room: Room = {
    id: roomId,
    name: input.name,
    code,
    hostId: input.host.id,
    settings: defaultSettings(),
  };
  const host: UserSummary = {
    id: input.host.id,
    displayName: input.host.displayName,
    role: "HOST",
  };
  const rec: RoomRecord = {
    room,
    members: new Map([[host.id, host]]),
    queue: [],
    nowPlaying: undefined,
    playback: { isPaused: false, startTime: 0 },
    blacklist: new Set(),
    votes: new Map(),
  };
  rooms.set(roomId, rec);
  roomIdByCode.set(code, roomId);
  return { roomId, host };
}

export function joinRoom(input: {
  code: string;
  user: { id: string; displayName: string };
}): {
  roomId: string;
  member: UserSummary;
} {
  const roomId = roomIdByCode.get(input.code);
  if (!roomId) throw new Error("房间不存在");
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  if (rec.blacklist.has(input.user.id)) throw new Error("你已被拉黑");
  const existing = rec.members.get(input.user.id);
  if (existing) return { roomId, member: existing };
  const member: UserSummary = {
    id: input.user.id,
    displayName: input.user.displayName,
    role: rec.room.hostId === input.user.id ? "HOST" : "MEMBER",
  };
  rec.members.set(member.id, member);
  return { roomId, member };
}

export function updateSettings(roomId: string, patch: Partial<RoomSettings>) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  rec.room.settings = { ...rec.room.settings, ...patch };
  return rec.room.settings;
}

export function roomRole(roomId: string, userId: string): RoomRole | null {
  const rec = rooms.get(roomId);
  if (!rec) return null;
  return rec.members.get(userId)?.role || null;
}

export function addQueueItem(
  roomId: string,
  user: UserSummary,
  song: Song,
): QueueItem {
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
  const item: QueueItem = {
    id: nanoid(12),
    roomId,
    song,
    requestedBy: user,
    voteScore: 0,
    skipVotes: 0,
    createdAt: new Date().toISOString(),
  };

  // 如果当前没有播放，直接播放这首
  if (!rec.nowPlaying) {
    rec.nowPlaying = item;
    rec.playback = { isPaused: false, startTime: Date.now() };
  } else {
    rec.queue = sortQueue([...rec.queue, item]);
  }

  return item;
}

export function sortQueue(queue: QueueItem[]) {
  return [...queue].sort((a, b) => {
    if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function applyVote(
  roomId: string,
  userId: string,
  itemId: string,
  type: "UP" | "DOWN" | "SKIP",
) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const voteKey = `${roomId}:${itemId}:${userId}`;
  const prev = rec.votes.get(voteKey);
  if (prev === type)
    return {
      score: currentVoteScore(rec, itemId),
      skipCount: currentSkipCount(rec, itemId),
    };
  rec.votes.set(voteKey, type);

  const score = currentVoteScore(rec, itemId);
  const skipCount = currentSkipCount(rec, itemId);

  // Update queue
  rec.queue = sortQueue(
    rec.queue.map((it) =>
      it.id === itemId ? { ...it, voteScore: score, skipVotes: skipCount } : it,
    ),
  );

  // Update nowPlaying if matches
  if (rec.nowPlaying?.id === itemId) {
    rec.nowPlaying = {
      ...rec.nowPlaying,
      voteScore: score,
      skipVotes: skipCount,
    };
  }

  return { score, skipCount };
}

export function currentVoteScore(rec: RoomRecord, itemId: string) {
  let score = 0;
  for (const [key, v] of rec.votes.entries()) {
    if (!key.includes(`:${itemId}:`)) continue;
    if (v === "UP") score += 1;
    if (v === "DOWN") score -= 1;
  }
  return score;
}

export function currentSkipCount(rec: RoomRecord, itemId: string) {
  let count = 0;
  for (const [key, v] of rec.votes.entries()) {
    if (!key.includes(`:${itemId}:`)) continue;
    if (v === "SKIP") count += 1;
  }
  return count;
}

export function nextSong(roomId: string) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  const [first, ...rest] = rec.queue;
  rec.nowPlaying = first;
  rec.queue = rest;
  if (first) {
    rec.playback = { isPaused: false, startTime: Date.now() };
  } else {
    rec.playback = { isPaused: false, startTime: 0 };
  }
  return rec.nowPlaying;
}

export function updatePlayback(roomId: string, state: Partial<PlaybackState>) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  rec.playback = { ...rec.playback, ...state };
  return rec.playback;
}

export function removeMember(roomId: string, userId: string) {
  const rec = rooms.get(roomId);
  if (!rec) throw new Error("房间不存在");
  rec.members.delete(userId);
}

export function roomStateForUser(roomId: string, userId: string) {
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
    playback: rec.playback,
  };
}
