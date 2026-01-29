import NeteaseCloudMusicApi from "NeteaseCloudMusicApi";
export class NeteaseProvider {
    name = "NETEASE";
    get cookie() {
        const c = process.env.NETEASE_COOKIE || "";
        // 如果看起来像纯 Token (无 key=value 格式)，则自动补全 MUSIC_U
        if (c && !c.includes("=") && c.length > 50) {
            return `MUSIC_U=${c}`;
        }
        return c;
    }
    async search(query, page = 1) {
        try {
            const limit = 10;
            const offset = (page - 1) * limit;
            const res = await NeteaseCloudMusicApi.cloudsearch({
                keywords: query,
                type: 1, // 1: 单曲
                limit,
                offset,
                cookie: this.cookie,
            });
            if (res.status !== 200)
                return [];
            const songs = res.body.result?.songs || [];
            return songs.map((s) => ({
                id: `netease:${s.id}`,
                title: s.name,
                artist: s.ar?.map((a) => a.name).join(", ") || "Unknown",
                durationSec: Math.floor((s.dt || 0) / 1000),
                coverUrl: s.al?.picUrl,
                source: "NETEASE",
            }));
        }
        catch (e) {
            console.error("Netease search error:", e);
            return [];
        }
    }
    async getHotSongs() {
        try {
            // 3778678 is the ID for "Netease Hot Songs"
            const res = await NeteaseCloudMusicApi.playlist_track_all({
                id: "3778678",
                limit: 20,
                offset: Math.floor(Math.random() * 50), // Randomize a bit
                cookie: this.cookie,
            });
            if (res.status !== 200)
                return [];
            const songs = res.body.songs || [];
            return songs.map((s) => ({
                id: `netease:${s.id}`,
                title: s.name,
                artist: s.ar?.map((a) => a.name).join(", ") || "Unknown",
                durationSec: Math.floor((s.dt || 0) / 1000),
                coverUrl: s.al?.picUrl,
                source: "NETEASE",
            }));
        }
        catch (e) {
            console.error("Netease getHotSongs error:", e);
            return [];
        }
    }
    async getPlayUrl(id) {
        try {
            const realId = id.replace("netease:", "");
            const res = await NeteaseCloudMusicApi.song_url_v1({
                id: realId,
                level: "exhigh",
                cookie: this.cookie,
            });
            if (res.status !== 200)
                return null;
            const data = res.body.data?.[0];
            return data?.url || null;
        }
        catch (e) {
            console.error("Netease getPlayUrl error:", e);
            return null;
        }
    }
    async getLyric(id) {
        try {
            const realId = id.replace("netease:", "");
            const res = await NeteaseCloudMusicApi.lyric({
                id: realId,
                cookie: this.cookie,
            });
            if (res.status !== 200)
                return null;
            return res.body.lrc?.lyric || null;
        }
        catch (e) {
            console.error("Netease getLyric error:", e);
            return null;
        }
    }
}
