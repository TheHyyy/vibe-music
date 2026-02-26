import type { Song } from "../types.js";
import type { MusicProvider } from "./types.js";
import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { MusicfreeProvider } from "./musicfree.js";
import { MockProvider } from "./mock.js";

function isEnabledEnvTrue(key: string): boolean {
  const v = process.env[key];
  return v === "true" || v === "1";
}

function buildProviders(): MusicProvider[] {
  const providerMode = (process.env.PROVIDER_MODE || "").toUpperCase();
  
  if (providerMode === "MOCK") return [new MockProvider()];

  // 在这里读取环境变量，而不是在模块顶层
  const enableQQ = isEnabledEnvTrue("ENABLE_QQ_MUSIC");
  const enableKugou = isEnabledEnvTrue("ENABLE_KUGOU_MUSIC");

  console.log("[Music] Building providers, KUGOU:", enableKugou, "QQ:", enableQQ);

  const list: MusicProvider[] = [new NeteaseProvider()];
  if (enableKugou) list.push(new MusicfreeProvider());
  if (enableQQ) list.push(new QQProvider());
  return list;
}

// singleton list of providers
let _providers: MusicProvider[] | null = null;

function providers(): MusicProvider[] {
  if (!_providers) {
    _providers = buildProviders();
  }
  return _providers;
}

export async function searchMusic(query: string): Promise<Song[]> {
  const results: Song[] = [];
  for (const p of providers()) {
    try {
      const songs = await p.search(query);
      results.push(...songs);
    } catch (e) {
      console.error(`[${p.name}] search error:`, e);
    }
  }
  return results;
}

export async function getPlayUrl(id: string): Promise<string | null> {
  const prefix = id.split(":")[0];
  const provider = providers().find((p) => p.name === prefix);
  if (!provider) {
    throw new Error(`Unknown provider: ${prefix}`);
  }
  return provider.getPlayUrl(id);
}

export async function getLyric(id: string): Promise<string | null> {
  const prefix = id.split(":")[0];
  const provider = providers().find((p) => p.name === prefix);
  if (!provider) {
    throw new Error(`Unknown provider: ${prefix}`);
  }
  return provider.getLyric(id);
}

export async function getHotRecommendation(): Promise<Song[]> {
  // 暂时返回空，热门推荐功能待实现
  return [];
}
