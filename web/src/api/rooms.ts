import { http } from "@/api/http";
import type {
  ApiResult,
  QueueItem,
  RoomStatePayload,
  RoomSettings,
  Song,
} from "@/types/api";

export async function createRoom(input: {
  name: string;
  displayName: string;
  settings?: Partial<RoomSettings>;
}): Promise<
  ApiResult<{ roomId: string; token: string; state: RoomStatePayload }>
> {
  const res = await http.post<
    ApiResult<{ roomId: string; token: string; state: RoomStatePayload }>
  >("/api/rooms", input);
  return res.data;
}

export async function joinRoom(input: {
  code: string;
  displayName: string;
}): Promise<
  ApiResult<{ roomId: string; token: string; state: RoomStatePayload }>
> {
  const res = await http.post<
    ApiResult<{ roomId: string; token: string; state: RoomStatePayload }>
  >("/api/rooms/join", input);
  return res.data;
}

export async function getRoomState(
  roomId: string,
): Promise<ApiResult<RoomStatePayload>> {
  const res = await http.get<ApiResult<RoomStatePayload>>(
    `/api/rooms/${roomId}/state`,
  );
  return res.data;
}

export async function requestSong(
  roomId: string,
  input: { song: Song },
): Promise<ApiResult<QueueItem>> {
  const res = await http.post<ApiResult<QueueItem>>(
    `/api/rooms/${roomId}/queue`,
    input,
  );
  return res.data;
}

export async function vote(
  roomId: string,
  itemId: string,
  input: { type: "UP" | "DOWN" | "SKIP" },
): Promise<ApiResult<{ itemId: string; voteScore: number }>> {
  const res = await http.post<ApiResult<{ itemId: string; voteScore: number }>>(
    `/api/rooms/${roomId}/queue/${itemId}/votes`,
    input,
  );
  return res.data;
}

export async function adminNext(
  roomId: string,
): Promise<ApiResult<{ nowPlaying?: QueueItem }>> {
  const res = await http.post<ApiResult<{ nowPlaying?: QueueItem }>>(
    `/api/rooms/${roomId}/admin/next`,
  );
  return res.data;
}

export async function adminKick(
  roomId: string,
  userId: string,
): Promise<ApiResult<{ ok: true }>> {
  const res = await http.post<ApiResult<{ ok: true }>>(
    `/api/rooms/${roomId}/admin/kick`,
    { userId },
  );
  return res.data;
}

export async function updateSettings(
  roomId: string,
  input: Partial<RoomSettings>,
): Promise<ApiResult<RoomSettings>> {
  const res = await http.patch<ApiResult<RoomSettings>>(
    `/api/rooms/${roomId}/settings`,
    input,
  );
  return res.data;
}
