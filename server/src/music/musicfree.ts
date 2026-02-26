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
        console.log("[Musicfree] song not in cache, cannot get play URL");
        return null;
      }
      
      // 优先尝试 MP3 格式（兼容性最好）
      // standard = 128kbps MP3, high = 320kbps MP3, super = FLAC
      const qualities = ['standard', 'high', 'super'];
      
      for (const quality of qualities) {
        try {
          const mediaSource = await musicAPI.getMediaSource(this.platform, songInfo, quality);
          
          if (mediaSource?.url) {
            const url = mediaSource.url;
            const ext = url.split('.').pop()?.toLowerCase();
            
            // 优先返回 MP3 格式（最佳兼容性）
            if (ext === 'mp3') {
              console.log(`[Musicfree] got MP3 URL (${quality})`);
              return url;
            }
            
            // 非 MP3 格式，记录日志
            console.log(`[Musicfree] got ${ext} URL (${quality}), may not work in some browsers`);
          }
        } catch (e: any) {
          console.log(`[Musicfree] quality ${quality} failed:`, e.message);
        }
      }
      
      // 如果所有音质都失败，抛出错误
      throw new Error("酷狗暂无此歌曲资源，请尝试其他平台");
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
