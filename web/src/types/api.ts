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
  password?: string;
  inviteToken?: string;
}

export interface RoomListItem {
  id: string;
  name: string;
  hostName: string;
  memberCount: number;
  hasPassword: boolean;
  nowPlaying?: Song;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  coverUrl?: string;
  source: "MOCK" | "NETEASE" | "QQ" | "MIGU" | "THIRD_PARTY";
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
  history: QueueItem[];
  playback: PlaybackState;
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

export interface ServerConfig {
  enableQQ: boolean;
  enableMigu: boolean;
}
