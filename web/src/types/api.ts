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
  settings: RoomSettings;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  coverUrl?: string;
  source: "MOCK" | "NETEASE" | "QQ" | "THIRD_PARTY";
}

export interface QueueItem {
  id: string;
  roomId: string;
  song: Song;
  requestedBy: UserSummary;
  voteScore: number;
  createdAt: string;
}

export interface RoomStatePayload {
  room: Room;
  currentUser: UserSummary;
  members: UserSummary[];
  nowPlaying?: QueueItem;
  queue: QueueItem[];
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  error: { message: string; code?: string };
}

export type ApiResult<T> = ApiOk<T> | ApiErr;
