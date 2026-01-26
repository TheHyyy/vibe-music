import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
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
    : [new NeteaseProvider(), ...(enableQQ ? [new QQProvider()] : [])];

export async function searchMusic(query: string): Promise<Song[]> {
  const promises = providers.map((p) => p.search(query));
  const results = await Promise.allSettled(promises);

  // 收集所有成功的数组
  const songsLists: Song[][] = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") {
      songsLists.push(r.value);
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
