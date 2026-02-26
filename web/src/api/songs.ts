import { http } from "@/api/http";
import type { ApiResult, Song } from "@/types/api";

export async function searchSongs(
  q: string,
  page = 1,
  source = "all",
): Promise<ApiResult<Song[]>> {
  const res = await http.get<ApiResult<Song[]>>("/api/songs/search", {
    params: { q, page, source },
  });
  return res.data;
}

export async function getPlayUrl(
  id: string,
): Promise<ApiResult<{ url: string }>> {
  const res = await http.get<ApiResult<{ url: string }>>("/api/songs/url", {
    params: { id },
  });
  return res.data;
}

export async function getLyric(
  id: string,
): Promise<ApiResult<{ lyric: string }>> {
  const res = await http.get<ApiResult<{ lyric: string }>>("/api/songs/lyric", {
    params: { id },
  });
  return res.data;
}

export async function getSystemConfig(): Promise<ApiResult<import("@/types/api").ServerConfig>> {
  const res = await http.get<ApiResult<import("@/types/api").ServerConfig>>("/api/config");
  return res.data;
}
