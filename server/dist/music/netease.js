import NeteaseCloudMusicApi from "NeteaseCloudMusicApi";
export class NeteaseProvider {
    name = "NETEASE";
    get cookie() {
        return process.env.NETEASE_COOKIE || "";
    }
    async search(query) {
        try {
            const res = await NeteaseCloudMusicApi.cloudsearch({
                keywords: query,
                type: 1, // 1: 单曲
                limit: 10,
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
