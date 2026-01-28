export type RoomRole = "HOST" | "MODERATOR" | "MEMBER";

export interface UserSummary {
  id: string;
  displayName: string;
  role: RoomRole;
}

export interface RoomSettings {
  allowAnonymous: boolean;
  allowDuplicateSongs: boolean;
  maxQueuedPerUser: number;
  skipVoteThreshold: number;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  hostId: string;
  settings: RoomSettings;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  coverUrl?: string;
  source: "MOCK" | "NETEASE" | "QQ" | "KUWO" | "MIGU" | "THIRD_PARTY";
}

export interface QueueItem {
  id: string;
  roomId: string;
  song: Song;
  requestedBy: UserSummary;
  voteScore: number;
  skipVotes: number;
  createdAt: string;
}

export interface PlaybackState {
  isPaused: boolean;
  startTime: number;
  pausedAt?: number;
}

export interface RoomStatePayload {
  room: Room;
  currentUser: UserSummary;
  members: UserSummary[];
  nowPlaying?: QueueItem;
  queue: QueueItem[];
  playback: PlaybackState;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };
