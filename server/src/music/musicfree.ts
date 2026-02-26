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
      let songInfo = songCache.get(realId);
      
      // 如果缓存没有，尝试通过 ID 重新获取（服务器重启后缓存丢失）
      if (!songInfo) {
        console.log(`[Musicfree] song ${realId} not in cache, attempting to refetch...`);
        
        // 尝试直接用 ID 获取播放链接
        // musicfree-api 支持直接用歌曲 ID 获取
        try {
          const directMedia = await musicAPI.getMediaSource(this.platform, { id: realId }, 'standard');
          if (directMedia?.url) {
            console.log(`[Musicfree] got URL directly by ID`);
            return directMedia.url;
          }
        } catch (e) {
          console.log(`[Musicfree] direct fetch failed:`, e);
        }
        
        throw new Error("歌曲信息已过期，请重新搜索");
      }
      
      // 优先尝试 MP3 格式（兼容性最好）
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
            
            // 非 MP3 格式，也返回（可能兼容性差）
            console.log(`[Musicfree] got ${ext} URL (${quality}), may not work in some browsers`);
            return url;
          }
        } catch (e: any) {
          console.log(`[Musicfree] quality ${quality} failed:`, e.message);
        }
      }
      
      throw new Error("酷狗暂无此歌曲资源，请尝试其他平台");
    } catch (e) {
      console.error("[Musicfree] getPlayUrl error:", e);
      throw e;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const realId = id.replace("kugou:", "");
      
      const songInfo = songCache.get(realId);
      if (!songInfo) {
        return null;
      }
      
      const lyric = await musicAPI.getLyric(this.platform, songInfo);
      return lyric?.rawLrc || null;
    } catch (e) {
      console.error("[Musicfree] getLyric error:", e);
      return null;
    }
  }
}
