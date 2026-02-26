import Meting from '@meting/core';
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class KugouProvider implements MusicProvider {
  name = "KUGOU";
  private meting = new Meting('kugou');

  async search(query: string): Promise<Song[]> {
    try {
      const result = await this.meting.search(query, 10);
      const parsed = JSON.parse(result);
      
      if (!parsed?.data?.info) {
        return [];
      }

      return parsed.data.info.map((s: any) => ({
        id: `kugou:${s.hash}`,
        title: s.songname || s.songname_original,
        artist: s.singername || "Unknown",
        durationSec: Math.floor((s.duration || 0) / 1000),
        coverUrl: s.album_img || `http://imge.kugou.com/stdmusic/480/20230920/20230920142503632013.jpg`,
        source: "KUGOU" as const,
      }));
    } catch (e) {
      console.error("Kugou search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const hash = id.replace("kugou:", "");
      // 酷狗音乐播放链接格式
      return `http://trackercdn.kugou.com/i/v2/${hash}.mp3`;
    } catch (e) {
      console.error("Kugou getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const hash = id.replace("kugou:", "");
      const result = await this.meting.lyric(hash);
      const parsed = JSON.parse(result);
      return parsed?.lyric || null;
    } catch (e) {
      console.error("Kugou getLyric error:", e);
      return null;
    }
  }
}
