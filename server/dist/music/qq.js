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
            // 尝试获取播放链接
            const res = await qq.api("song/urls", { id: realId });
            // qq-music-api 返回结构可能较复杂，通常是一个对象 map
            const url = res?.[realId];
            if (!url) {
                // 如果没有获取到 URL，可能需要登录或 VIP
                console.error(`[QQ] No URL for ${realId}, may require login or VIP`);
                throw new Error("QQ音乐需要登录或VIP才能播放此歌曲。\n\n" +
                    "请按以下步骤获取Cookie：\n" +
                    "1. 在浏览器中打开 https://y.qq.com 并登录\n" +
                    "2. 按F12打开开发者工具 -> Network标签页\n" +
                    "3. 刷新页面，点击任意请求\n" +
                    "4. 复制Request Headers中的cookie值\n" +
                    "5. 在server/.env中设置 QQ_COOKIE=你的cookie\n" +
                    "6. 重启服务器");
            }
            return url;
        }
        catch (e) {
            console.error("[QQ] getPlayUrl error:", e);
            // 如果是 qq-music-api 的错误，提供更友好的提示
            if (e?.message?.includes('登录')) {
                throw new Error("QQ音乐需要登录，请在 .env 中配置有效的 QQ_COOKIE");
            }
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
