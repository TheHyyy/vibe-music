import musicAPI from 'musicfree-api';
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

// 缓存歌曲信息，用于获取播放链接
const songCache = new Map<string, any>();

export class MusicfreeProvider implements MusicProvider {
  name = "kugou";  // 必须和 ID 前缀匹配
  private platform = 'kg'; // 使用酷狗音乐

  async search(query: string): Promise<Song[]> {
    try {
      const result = await musicAPI.search(this.platform, query, 1, 'music');
      
      if (!result?.data) {
        return [];
      }

      return result.data.map((s: any) => {
        // 缓存完整的歌曲信息
        songCache.set(s.id, s);
        
        return {
          id: `kugou:${s.id}`,
          title: s.title,
          artist: s.artist || "Unknown",
          durationSec: Math.floor((s.duration || 0) / 1000),
          coverUrl: s.artwork,
          source: "KUGOU" as const,
        };
      });
    } catch (e) {
      console.error("[Musicfree] search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const realId = id.replace("kugou:", "");
      
      // 从缓存中获取歌曲信息
      const songInfo = songCache.get(realId);
      
      if (!songInfo) {
        console.error("[Musicfree] song not found in cache:", realId);
        return null;
      }
      
      // 获取播放链接（使用最高音质）
      const mediaSource = await musicAPI.getMediaSource(this.platform, songInfo, 'super');
      
      return mediaSource?.url || null;
    } catch (e) {
      console.error("[Musicfree] getPlayUrl error:", e);
      throw e;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const realId = id.replace("kugou:", "");
      
      // 从缓存中获取歌曲信息
      const songInfo = songCache.get(realId);
      
      if (!songInfo) {
        return null;
      }
      
      // 获取歌词
      const lyric = await musicAPI.getLyric(this.platform, songInfo);
      
      return lyric?.rawLrc || null;
    } catch (e) {
      console.error("[Musicfree] getLyric error:", e);
      return null;
    }
  }
}
