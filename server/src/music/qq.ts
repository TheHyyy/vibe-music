// @ts-ignore
import qq from "qq-music-api";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

// 如果配置了 QQ_COOKIE，则设置全局 Cookie
if (process.env.QQ_COOKIE) {
  try {
    qq.setCookie(process.env.QQ_COOKIE);
    console.log("[QQ] Cookie set from env");
  } catch (e) {
    console.error("[QQ] Failed to set cookie:", e);
  }
}

export class QQProvider implements MusicProvider {
  name = "QQ";

  async search(query: string): Promise<Song[]> {
    try {
      // 使用 qq-music-api 的搜索接口
      const res = await qq.api("search", { key: query, pageSize: 10 });
      
      const list = res?.data?.list || [];
      return list.map((s: any) => ({
        id: `qq:${s.songmid}`,
        title: s.songname,
        artist: s.singer?.map((a: any) => a.name).join(", ") || "Unknown",
        durationSec: s.interval || 0,
        coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`,
        source: "QQ",
      }));
    } catch (e) {
      console.error("QQ search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const realId = id.replace("qq:", "");
      const res = await qq.api("song/urls", { id: realId });
      // qq-music-api 返回结构可能较复杂，通常是一个对象 map
      return res?.[realId] || null;
    } catch (e) {
      console.error("QQ getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const realId = id.replace("qq:", "");
      const res = await qq.api("lyric", { songmid: realId });
      return res?.lyric || null;
    } catch (e) {
      console.error("QQ getLyric error:", e);
      return null;
    }
  }
}
