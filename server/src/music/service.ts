import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { MockProvider } from "./mock.js";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

const providerMode = String(process.env.ECHO_MUSIC_PROVIDER || "").trim().toUpperCase();
const providers: MusicProvider[] =
  providerMode === "MOCK"
    ? [new MockProvider()]
    : [new NeteaseProvider(), new QQProvider()];

export async function searchMusic(query: string): Promise<Song[]> {
  const promises = providers.map((p) => p.search(query));
  const results = await Promise.allSettled(promises);
  
  let allSongs: Song[] = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") {
      allSongs = [...allSongs, ...r.value];
    }
  });

  return allSongs;
}

export async function getPlayUrl(id: string): Promise<string | null> {
  const [source] = id.split(":");
  const provider = providers.find((p) => p.name === source.toUpperCase());
  if (!provider) return null;
  return provider.getPlayUrl(id);
}

export async function getLyric(id: string): Promise<string | null> {
  const [source] = id.split(":");
  const provider = providers.find((p) => p.name === source.toUpperCase());
  if (!provider) return null;
  return provider.getLyric(id);
}
