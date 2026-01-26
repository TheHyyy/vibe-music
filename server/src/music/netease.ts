import NeteaseCloudMusicApi from "NeteaseCloudMusicApi";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class NeteaseProvider implements MusicProvider {
  name = "NETEASE";

  private get cookie() {
    return process.env.NETEASE_COOKIE || "";
  }

  async search(query: string): Promise<Song[]> {
    try {
      const res = await NeteaseCloudMusicApi.cloudsearch({
        keywords: query,
        type: 1, // 1: 单曲
        limit: 10,
        cookie: this.cookie,
      });

      if (res.status !== 200) return [];
      const songs = (res.body.result as any)?.songs || [];

      return songs.map((s: any) => ({
        id: `netease:${s.id}`,
        title: s.name,
        artist: s.ar?.map((a: any) => a.name).join(", ") || "Unknown",
        durationSec: Math.floor((s.dt || 0) / 1000),
        coverUrl: s.al?.picUrl,
        source: "NETEASE",
      }));
    } catch (e) {
      console.error("Netease search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const realId = id.replace("netease:", "");
      const res = await NeteaseCloudMusicApi.song_url_v1({
        id: realId,
        level: "exhigh" as any,
        cookie: this.cookie,
      });

      if (res.status !== 200) return null;
      const data = (res.body.data as any)?.[0];
      return data?.url || null;
    } catch (e) {
      console.error("Netease getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const realId = id.replace("netease:", "");
      const res = await NeteaseCloudMusicApi.lyric({
        id: realId,
        cookie: this.cookie,
      });

      if (res.status !== 200) return null;
      return (res.body.lrc as any)?.lyric || null;
    } catch (e) {
      console.error("Netease getLyric error:", e);
      return null;
    }
  }
}
