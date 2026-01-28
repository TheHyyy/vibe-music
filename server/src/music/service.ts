import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { MiguProvider } from "./migu.js";
import { MockProvider } from "./mock.js";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

const providerMode = String(process.env.ECHO_MUSIC_PROVIDER || "")
  .trim()
  .toUpperCase();

// 控制是否启用 QQ 音乐（可通过环境变量配置）
const enableQQ = process.env.ENABLE_QQ_MUSIC === "true";

const providers: MusicProvider[] =
  providerMode === "MOCK"
    ? [new MockProvider()]
    : [
        new NeteaseProvider(),
        new MiguProvider(),
        ...(enableQQ ? [new QQProvider()] : []),
      ];

export async function searchMusic(query: string, page = 1): Promise<Song[]> {
  // Wrap each provider search with a timeout
  const promises = providers.map((p) => {
    return Promise.race([
      p.search(query, page),
      new Promise<Song[]>((_, reject) =>
        setTimeout(
          () => reject(new Error(`[${p.name}] Search timeout`)),
          10000,
        ),
      ),
    ]);
  });

  const results = await Promise.allSettled(promises);

  // 收集所有成功的数组
  const songsLists: Song[][] = [];
  results.forEach((r, index) => {
    if (r.status === "fulfilled") {
      songsLists.push(r.value);
    } else {
      console.warn(
        `[Search] Provider ${providers[index].name} failed:`,
        r.reason,
      );
    }
  });

  // 交叉合并 (Interleaving)
  // 避免某个平台的结果独占头部
  const interleaved: Song[] = [];
  const maxLength = Math.max(...songsLists.map((list) => list.length));

  for (let i = 0; i < maxLength; i++) {
    for (const list of songsLists) {
      if (i < list.length) {
        interleaved.push(list[i]);
      }
    }
  }

  return interleaved;
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

export async function getHotRecommendation(): Promise<Song | null> {
  const provider = providers.find((p) => p.name === "NETEASE");
  if (!provider) return null;

  // Cast to any to access getHotSongs since it's not in the generic interface
  // In a stricter typed env, we should update the interface or use type guards
  if ("getHotSongs" in provider) {
    const songs = await (provider as any).getHotSongs();
    if (songs.length > 0) {
      // Pick a random one from the batch
      const randomIdx = Math.floor(Math.random() * songs.length);
      return songs[randomIdx];
    }
  }
  return null;
}
