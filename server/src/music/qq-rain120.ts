import axios from 'axios';
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

// Rain120 QQ 音乐 API
// GitHub: https://github.com/Rain120/qq-music-api
// 需要部署 Rain120 的服务，或使用公共实例

const QQ_API_BASE = process.env.QQ_MUSIC_API_BASE || 'http://localhost:3200';

export class QQRain120Provider implements MusicProvider {
  name = "qq";

  async search(query: string): Promise<Song[]> {
    try {
      const res = await axios.get(`${QQ_API_BASE}/search`, {
        params: {
          key: query,
          page: 1,
          limit: 10,
        }
      });

      const data = res.data?.data;
      if (!data?.song?.list) {
        return [];
      }

      return data.song.list.map((s: any) => ({
        id: `qq:${s.songmid}`,
        title: s.songname,
        artist: s.singer?.map((a: any) => a.name).join(", ") || "Unknown",
        durationSec: s.interval || 0,
        coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`,
        source: "QQ" as const,
      }));
    } catch (e) {
      console.error("[QQ-Rain120] search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const songmid = id.replace("qq:", "");

      // 方法1: 获取 VKey（推荐）
      const vkeyRes = await axios.get(`${QQ_API_BASE}/song/url`, {
        params: {
          id: songmid,
        }
      });

      if (vkeyRes.data?.url) {
        return vkeyRes.data.url;
      }

      // 方法2: 直接获取歌曲信息
      const songRes = await axios.get(`${QQ_API_BASE}/song`, {
        params: {
          mid: songmid,
        }
      });

      if (songRes.data?.url) {
        return songRes.data.url;
      }

      throw new Error("无法获取播放链接");
    } catch (e) {
      console.error("[QQ-Rain120] getPlayUrl error:", e);
      throw e;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const songmid = id.replace("qq:", "");

      const res = await axios.get(`${QQ_API_BASE}/lyric`, {
        params: {
          songmid: songmid,
        }
      });

      return res.data?.lyric || null;
    } catch (e) {
      console.error("[QQ-Rain120] getLyric error:", e);
      return null;
    }
  }
}
