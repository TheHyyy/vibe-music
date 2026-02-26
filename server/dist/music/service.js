import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { QQRain120Provider } from "./qq-rain120.js";
import { MockProvider } from "./mock.js";
function isEnabledEnvTrue(key) {
    const v = process.env[key];
    return v === "true" || v === "1";
}
function buildProviders() {
    const providerMode = (process.env.PROVIDER_MODE || "").toUpperCase();
    if (providerMode === "MOCK")
        return [new MockProvider()];
    // 在这里读取环境变量，而不是在模块顶层
    const enableQQ = isEnabledEnvTrue("ENABLE_QQ_MUSIC");
    console.log("[Music] Building providers, QQ:", enableQQ);
    const list = [new NeteaseProvider()];
    if (enableQQ) {
        // 优先使用 Rain120 的 API（不需要登录）
        const qqApiBase = process.env.QQ_MUSIC_API_BASE;
        if (qqApiBase) {
            list.push(new QQRain120Provider());
        }
        else {
            // 降级到原来的 QQProvider（需要 Cookie）
            list.push(new QQProvider());
        }
    }
    return list;
}
// singleton list of providers
let _providers = null;
function providers() {
    if (!_providers) {
        _providers = buildProviders();
    }
    return _providers;
}
export async function searchMusic(query, page = 1, source = "all") {
    const results = [];
    const allProviders = providers();
    // 过滤要使用的 provider
    const targetProviders = source === "all"
        ? allProviders
        : allProviders.filter(p => p.name.toLowerCase() === source.toLowerCase());
    for (const p of targetProviders) {
        try {
            const songs = await p.search(query, page);
            results.push(...songs);
        }
        catch (e) {
            console.error(`[${p.name}] search error:`, e);
        }
    }
    // 如果是全部平台，交替排列结果
    if (source === "all" && targetProviders.length > 1) {
        return interleaveResults(results, targetProviders);
    }
    return results;
}
// 交替排列不同平台的结果
function interleaveResults(songs, providers) {
    const result = [];
    const byProvider = new Map();
    // 按平台分组
    for (const song of songs) {
        const key = song.source.toLowerCase();
        if (!byProvider.has(key))
            byProvider.set(key, []);
        byProvider.get(key).push(song);
    }
    // 交替取出
    const providerOrder = providers.map(p => p.name.toLowerCase());
    let hasMore = true;
    while (hasMore) {
        hasMore = false;
        for (const providerName of providerOrder) {
            const list = byProvider.get(providerName);
            if (list && list.length > 0) {
                result.push(list.shift());
                hasMore = true;
            }
        }
    }
    return result;
}
export async function getPlayUrl(id) {
    const prefix = id.split(":")[0]?.toUpperCase();
    const provider = providers().find((p) => p.name.toUpperCase() === prefix);
    if (!provider) {
        throw new Error(`Unknown provider: ${prefix}`);
    }
    return provider.getPlayUrl(id);
}
export async function getLyric(id) {
    const prefix = id.split(":")[0]?.toUpperCase();
    const provider = providers().find((p) => p.name.toUpperCase() === prefix);
    if (!provider) {
        throw new Error(`Unknown provider: ${prefix}`);
    }
    return provider.getLyric(id);
}
export async function getHotRecommendation() {
    try {
        // 使用网易云的热歌榜
        const provider = new NeteaseProvider();
        const songs = await provider.getHotSongs();
        if (songs.length > 0) {
            // 随机选一首
            return songs[Math.floor(Math.random() * songs.length)];
        }
        return null;
    }
    catch (e) {
        console.error("[Music] getHotRecommendation error:", e);
        return null;
    }
}
