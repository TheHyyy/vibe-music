import Meting from "@meting/core";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class MetingQQProvider implements MusicProvider {
  name = "QQ";
  private meting: any;

  constructor() {
    // 初始化 Meting，使用 tencent 平台（QQ 音乐）
    this.meting = new Meting("tencent") as any;
    // 启用格式化输出
    this.meting.format(true);
    
    // 如果配置了 QQ_COOKIE，设置 Cookie
    if (process.env.QQ_COOKIE) {
      try {
        this.meting.cookie(process.env.QQ_COOKIE);
        console.log("[MetingQQ] Cookie set from env");
      } catch (e) {
        console.error("[MetingQQ] Failed to set cookie:", e);
      }
    }
  }

  async search(query: string, page = 1): Promise<Song[]> {
    try {
      const result = await this.meting.search(query, {
        page,
        limit: 20,
      });

      const songs = JSON.parse(result);
      
      if (!Array.isArray(songs)) {
        console.error("[MetingQQ] Invalid search result:", songs);
        return [];
      }

      return songs.map((s: any) => ({
        id: `qq:${s.id}`,
        title: s.name || "Unknown",
        artist: Array.isArray(s.artist) ? s.artist.join(", ") : (s.artist || "Unknown"),
        durationSec: 0, // Meting 不返回时长
        coverUrl: s.pic_id ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.pic_id}.jpg` : "",
        source: "QQ",
      }));
    } catch (e) {
      console.error("[MetingQQ] Search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const realId = id.replace("qq:", "");
      const result = await this.meting.url(realId, 320); // 320kbps
      const urlInfo = JSON.parse(result);
      return urlInfo?.url || null;
    } catch (e) {
      console.error("[MetingQQ] getPlayUrl error:", e);
      throw e;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const realId = id.replace("qq:", "");
      const result = await this.meting.lyric(realId);
      const lyricInfo = JSON.parse(result);
      return lyricInfo?.lyric || null;
    } catch (e) {
      console.error("[MetingQQ] getLyric error:", e);
      return null;
    }
  }
}
