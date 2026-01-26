import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { MockProvider } from "./mock.js";
const providerMode = String(process.env.ECHO_MUSIC_PROVIDER || "").trim().toUpperCase();
const providers = providerMode === "MOCK"
    ? [new MockProvider()]
    : [new NeteaseProvider(), new QQProvider()];
export async function searchMusic(query) {
    const promises = providers.map((p) => p.search(query));
    const results = await Promise.allSettled(promises);
    let allSongs = [];
    results.forEach((r) => {
        if (r.status === "fulfilled") {
            allSongs = [...allSongs, ...r.value];
        }
    });
    return allSongs;
}
export async function getPlayUrl(id) {
    const [source] = id.split(":");
    const provider = providers.find((p) => p.name === source.toUpperCase());
    if (!provider)
        return null;
    return provider.getPlayUrl(id);
}
export async function getLyric(id) {
    const [source] = id.split(":");
    const provider = providers.find((p) => p.name === source.toUpperCase());
    if (!provider)
        return null;
    return provider.getLyric(id);
}
