// @ts-ignore
import qq from "qq-music-api";
// 如果配置了 QQ_COOKIE，则设置全局 Cookie
if (process.env.QQ_COOKIE) {
    try {
        qq.setCookie(process.env.QQ_COOKIE);
        console.log("[QQ] Cookie set from env");
    }
    catch (e) {
        console.error("[QQ] Failed to set cookie:", e);
    }
}
export class QQProvider {
    name = "QQ";
    async search(query) {
        try {
            // 使用 qq-music-api 的搜索接口
            const res = await qq.api("search", { key: query, pageSize: 10 });
            // qq-music-api 返回结构调整：部分版本直接返回 list，部分返回 data.list
            // @ts-ignore
            const list = res?.list || res?.data?.list || [];
            return list.map((s) => ({
                id: `qq:${s.songmid}`,
                title: s.songname,
                artist: s.singer?.map((a) => a.name).join(", ") || "Unknown",
                durationSec: s.interval || 0,
                coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`,
                source: "QQ",
            }));
        }
        catch (e) {
            console.error("QQ search error:", e);
            return [];
        }
    }
    async getPlayUrl(id) {
        try {
            const realId = id.replace("qq:", "");
            const res = await qq.api("song/urls", { id: realId });
            // qq-music-api 返回结构可能较复杂，通常是一个对象 map
            return res?.[realId] || null;
        }
        catch (e) {
            console.error("QQ getPlayUrl error:", e);
            throw e; // Rethrow to let the caller handle it (and send to client)
        }
    }
    async getLyric(id) {
        try {
            const realId = id.replace("qq:", "");
            const res = await qq.api("lyric", { songmid: realId });
            return res?.lyric || null;
        }
        catch (e) {
            console.error("QQ getLyric error:", e);
            return null;
        }
    }
}
