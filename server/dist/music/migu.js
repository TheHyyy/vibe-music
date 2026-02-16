import axios from "axios";
// @ts-ignore
import CryptoJS from "crypto-js";
// @ts-ignore
import JSEncrypt from "node-jsencrypt";
export class MiguProvider {
    name = "MIGU";
    getHeaders() {
        const headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
            Referer: "http://m.music.migu.cn/v3",
        };
        if (process.env.MIGU_COOKIE) {
            headers["Cookie"] = process.env.MIGU_COOKIE;
        }
        if (process.env.MIGU_HEADER) {
            try {
                const custom = JSON.parse(process.env.MIGU_HEADER);
                Object.assign(headers, custom);
            }
            catch (e) {
                console.error("Parse MIGU_HEADER failed", e);
            }
        }
        return headers;
    }
    async search(query, page = 1) {
        try {
            // Use the mobile API which returns better metadata
            const res = await axios.get("https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do", {
                params: {
                    text: query,
                    pageNo: page,
                    pageSize: 10,
                    searchSwitch: '{"song":1}',
                },
                headers: this.getHeaders(),
            });
            const list = res.data?.songResultData?.result || [];
            return list.map((s) => ({
                id: `migu:${s.copyrightId}`,
                title: s.name,
                artist: s.singers?.map((singer) => singer.name).join(", "),
                durationSec: 0,
                coverUrl: s.imgItems?.[0]?.img || "",
                source: "MIGU",
            }));
        }
        catch (e) {
            console.error("Migu search error:", e);
            return [];
        }
    }
    async getContentId(copyrightId, headers) {
        try {
            // Try to get contentId from audioPlayer/songs API
            const res = await axios.get("https://music.migu.cn/v3/api/music/audioPlayer/songs", {
                params: {
                    type: 1,
                    copyrightId: copyrightId,
                },
                headers: {
                    ...headers,
                    Referer: "https://music.migu.cn/v3/music/player/audio",
                },
            });
            if (res.data?.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                console.log(`[MIGU] Found contentId via audioPlayer/songs: ${item.contentId}`);
                return item.contentId;
            }
        }
        catch (e) {
            console.warn("Migu getContentId failed:", e);
        }
        return null;
    }
    async getPlayUrl(id) {
        try {
            const copyrightId = id.replace("migu:", "");
            const headers = this.getHeaders();
            console.log(`[MIGU] Getting play url for ${copyrightId}`);
            console.log(`[MIGU] Headers:`, JSON.stringify(headers, null, 2));
            // Pre-fetch contentId which is required for some strategies
            // Try resourceinfo.do first as it often contains contentId in rateFormats
            let contentId = await this.getContentId(copyrightId, headers);
            if (!contentId) {
                try {
                    console.log(`[MIGU] Trying to get contentId via resourceinfo.do...`);
                    const resInfo = await axios.get("https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do", {
                        params: {
                            copyrightId,
                            resourceType: 2,
                        },
                        headers: headers,
                    });
                    const data = resInfo.data?.resource?.[0];
                    if (data) {
                        // Log minimal data to avoid spam but enough to debug
                        console.log(`[MIGU] resourceinfo.do data keys:`, Object.keys(data));
                        if (data.contentId) {
                            contentId = data.contentId;
                            console.log(`[MIGU] Found contentId in top-level resource data: ${contentId}`);
                        }
                        else if (data.songId) {
                            // Sometimes songId might be useful, but PC strategy usually needs the long contentId
                            // Check rateFormats
                            const formats = data.newRateFormats || data.rateFormats || [];
                            const targetFormat = formats.find((f) => f.contentId);
                            if (targetFormat) {
                                contentId = targetFormat.contentId;
                                console.log(`[MIGU] Found contentId via resourceinfo.do formats: ${contentId}`);
                            }
                            else {
                                console.log(`[MIGU] No contentId found in resourceinfo.do formats. Formats available: ${formats.length}`);
                                if (formats.length > 0) {
                                    console.log(`[MIGU] First format keys:`, Object.keys(formats[0]));
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    console.warn("Migu resourceinfo.do contentId fetch failed:", e);
                }
            }
            // Strategy 1: Encrypted Web API (getPlayInfo)
            // Referenced from: https://github.com/jsososo/MiguMusicApi/blob/master/util/SongSaver.js
            try {
                console.log(`[MIGU] Trying Encrypted Web API (Strategy 1)...`);
                const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW
VJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin
2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe
ZosTByYp4Xwpb1+WAQIDAQAB
-----END PUBLIC KEY-----`;
                const o = `{"copyrightId":"${copyrightId}","auditionsFlag":0,"type":3}`;
                const s = new JSEncrypt();
                s.setPublicKey(publicKey);
                const a = 1e3 * Math.random();
                const u = CryptoJS.SHA256(String(a)).toString();
                const c = CryptoJS.AES.encrypt(o, u).toString();
                const f = s.encrypt(u);
                const webRes = await axios.get("https://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo", {
                    params: {
                        dataType: 2,
                        data: c,
                        secKey: f,
                    },
                    headers: {
                        ...headers,
                        Referer: "http://music.migu.cn/v3/music/player/audio",
                        channel: "0146951",
                        uid: "1234",
                    },
                });
                console.log(`[MIGU] Web API Status: ${webRes.status}`);
                if (webRes.status === 200 && !webRes.data?.data?.playUrl) {
                    console.log(`[MIGU] Web API Response Data (Debug):`, JSON.stringify(webRes.data, null, 2));
                }
                // console.log(`[MIGU] Web API Data:`, JSON.stringify(webRes.data, null, 2));
                if (webRes.data?.data?.playUrl) {
                    console.log(`[MIGU] Found play URL via Encrypted Web API`);
                    let url = webRes.data.data.playUrl;
                    if (url.startsWith("//")) {
                        url = "https:" + url;
                    }
                    return url.replace(/\?.+$/, ""); // Remove query params as per SongSaver.js
                }
            }
            catch (e) {
                console.warn("Migu Encrypted Web API failed:", e.message);
            }
            // Strategy 4: PC Strategy API (Requires contentId)
            // Source: User suggestion & Official PC Client behavior
            if (contentId) {
                console.log(`[MIGU] Trying PC Strategy API (Strategy 4)...`);
                try {
                    const pcRes = await axios.get("https://app.c.nf.migu.cn/MIGUM3.0/strategy/pc/listen/v1.0", {
                        params: {
                            copyrightId,
                            contentId,
                            resourceType: "2",
                            netType: "01",
                            toneFlag: "SQ", // Try SQ first
                            scene: "",
                        },
                        headers: {
                            ...headers,
                            Referer: "http://music.migu.cn/v3/music/player/audio",
                            channel: "0146951",
                            uid: "1234",
                        },
                    });
                    console.log(`[MIGU] PC Strategy API Status: ${pcRes.status}`);
                    if (pcRes.data?.data?.url) {
                        console.log(`[MIGU] Found play URL via PC Strategy API`);
                        return pcRes.data.data.url;
                    }
                    else {
                        console.log(`[MIGU] PC Strategy API Response (Debug):`, JSON.stringify(pcRes.data, null, 2));
                    }
                    // Try HQ if SQ fails
                    if (!pcRes.data?.data?.url) {
                        const pcResHQ = await axios.get("https://app.c.nf.migu.cn/MIGUM3.0/strategy/pc/listen/v1.0", {
                            params: {
                                copyrightId,
                                contentId,
                                resourceType: "2",
                                netType: "01",
                                toneFlag: "HQ",
                                scene: "",
                            },
                            headers: {
                                ...headers,
                                Referer: "http://music.migu.cn/v3/music/player/audio",
                                channel: "0146951",
                                uid: "1234",
                            },
                        });
                        if (pcResHQ.data?.data?.url) {
                            console.log(`[MIGU] Found play URL via PC Strategy API (HQ)`);
                            return pcResHQ.data.data.url;
                        }
                    }
                }
                catch (e) {
                    console.warn("Migu PC Strategy API failed:", e.message);
                }
            }
            // Strategy 2: Mobile Resource API (Fallback)
            console.log(`[MIGU] Trying Mobile Resource API (Fallback)...`);
            const res = await axios.get("https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do", {
                params: {
                    copyrightId,
                    resourceType: 2,
                },
                headers: headers,
            });
            console.log(`[MIGU] Resource Info Status: ${res.status}`);
            const data = res.data?.resource?.[0];
            if (!data) {
                console.log(`[MIGU] No resource data found`);
                return null;
            }
            // Check for rate formats (PQ, HQ, SQ, etc.)
            const formats = data.newRateFormats || data.rateFormats || [];
            const typeMap = {
                SQ: "flac",
                HQ: "320",
                PQ: "128",
            };
            let foundUrl = null;
            // Try to find a URL directly first in resource info
            for (const formatType of ["SQ", "HQ", "PQ"]) {
                const format = formats.find((f) => f.formatType === formatType);
                if (format) {
                    const url = format.url || format.androidUrl;
                    if (url) {
                        foundUrl = url.replace(/ftp:\/\/[^/]+/, "https://freetyst.nf.migu.cn");
                        console.log(`[MIGU] Found URL in resource info for ${formatType}: ${foundUrl}`);
                        break;
                    }
                }
            }
            if (foundUrl) {
                return foundUrl;
            }
            const targetFormat = formats.find((f) => f.formatType === "SQ") ||
                formats.find((f) => f.formatType === "HQ") ||
                formats.find((f) => f.formatType === "PQ") ||
                formats[0];
            console.log(`[MIGU] Selected format:`, targetFormat);
            // Use targetFormat.contentId OR the pre-fetched contentId
            const targetContentId = targetFormat?.contentId || contentId;
            if (targetFormat && targetContentId) {
                try {
                    console.log(`[MIGU] Calling listenSong.do with contentId: ${targetContentId}...`);
                    const listenRes = await axios.get("https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do", {
                        params: {
                            copyrightId,
                            contentId: targetContentId,
                            toneFlag: targetFormat.formatType,
                            resourceType: 2,
                            channel: "0146951",
                            uid: "1234",
                        },
                        headers: {
                            ...headers,
                            channel: "0146951",
                            uid: "1234",
                        },
                        maxRedirects: 0,
                        validateStatus: (status) => status >= 200 && status < 400,
                    });
                    console.log(`[MIGU] listenSong.do Status: ${listenRes.status}`);
                    if (listenRes.status === 302 || listenRes.status === 301) {
                        console.log(`[MIGU] Found play URL via listenSong.do (Redirect)`);
                        return listenRes.headers.location;
                    }
                }
                catch (e) {
                    console.warn("Migu listenSong.do failed:", e.message);
                    if (e.response) {
                        console.warn("Migu listenSong.do Error Data:", e.response.data);
                    }
                }
            }
            // Strategy 3: Listen URL API (Direct copyrightId)
            // Source: https://github.com/vhikd/mxget/blob/master/pkg/provider/migu/migu.go
            console.log(`[MIGU] Trying Listen URL API (Strategy 3)...`);
            try {
                const listenUrlRes = await axios.get("https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/listen-url", {
                    params: {
                        copyrightId,
                        netType: "01",
                        toneFlag: "SQ", // Try SQ first
                        resourceType: "2",
                    },
                    headers: {
                        ...headers,
                        channel: "0146951",
                        uid: "1234",
                    },
                });
                console.log(`[MIGU] Listen URL API Status: ${listenUrlRes.status}`);
                console.log(`[MIGU] Listen URL API Data:`, JSON.stringify(listenUrlRes.data, null, 2));
                if (listenUrlRes.data?.code === "000000" &&
                    listenUrlRes.data?.data?.url) {
                    console.log(`[MIGU] Found play URL via Listen URL API`);
                    return listenUrlRes.data.data.url;
                }
                // Try HQ if SQ fails
                if (listenUrlRes.data?.code !== "000000") {
                    console.log(`[MIGU] Trying HQ...`);
                    const listenUrlResHQ = await axios.get("https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/listen-url", {
                        params: {
                            copyrightId,
                            netType: "01",
                            toneFlag: "HQ",
                            resourceType: "2",
                        },
                        headers: {
                            ...headers,
                            channel: "0146951",
                            uid: "1234",
                        },
                    });
                    if (listenUrlResHQ.data?.code === "000000" &&
                        listenUrlResHQ.data?.data?.url) {
                        console.log(`[MIGU] Found play URL via Listen URL API (HQ)`);
                        return listenUrlResHQ.data.data.url;
                    }
                }
            }
            catch (e) {
                console.warn("Migu Listen URL API failed:", e.message);
            }
            return null;
        }
        catch (e) {
            console.error("Migu getPlayUrl error:", e);
            return null;
        }
    }
    async getLyric(id) {
        try {
            const copyrightId = id.replace("migu:", "");
            const headers = this.getHeaders();
            console.log(`[MIGU] Getting lyric for ${copyrightId}`);
            const resInfo = await axios.get("https://c.musicapp.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do", {
                params: {
                    copyrightId,
                    resourceType: 2,
                },
                headers: headers,
            });
            const data = resInfo.data?.resource?.[0];
            if (data?.lrcUrl) {
                let lrcUrl = data.lrcUrl;
                if (lrcUrl.startsWith("ftp://")) {
                    lrcUrl = lrcUrl.replace(/ftp:\/\/[^/]+/, "https://freetyst.nf.migu.cn");
                }
                console.log(`[MIGU] Found lyric URL: ${lrcUrl}`);
                const lrcRes = await axios.get(lrcUrl, { headers });
                return typeof lrcRes.data === "string"
                    ? lrcRes.data
                    : JSON.stringify(lrcRes.data);
            }
            console.warn(`[MIGU] No lyric URL found for ${copyrightId}`);
            return null;
        }
        catch (e) {
            console.error("Migu getLyric error:", e);
            return null;
        }
    }
}
