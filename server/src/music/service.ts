import type { Song } from "../types.js";
import type { MusicProvider } from "./types.js";
import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { QQRain120Provider } from "./qq-rain120.js";
import { MetingQQProvider } from "./meting-qq.js";
import { QQFreeProvider } from "./qq-free.js";
import { QQThirdProvider } from "./qq-third.js";
import { MockProvider } from "./mock.js";

function isEnabledEnvTrue(key: string): boolean {
  const v = process.env[key];
  return v === "true" || v === "1";
}

function buildProviders(): MusicProvider[] {
  const providerMode = (process.env.PROVIDER_MODE || "").toUpperCase();

  if (providerMode === "MOCK") return [new MockProvider()];

  // 在这里读取环境变量，而不是在模块顶层
  // ENABLE_QQ_MUSIC 默认为 true（除非明确设置为 false）
  const enableQQ = process.env.ENABLE_QQ_MUSIC !== "false";
  const qqProvider = (process.env.QQ_MUSIC_PROVIDER || "qq-music-api").toLowerCase();

  console.log("[Music] Building providers, QQ:", enableQQ, "Provider:", qqProvider);

  const list: MusicProvider[] = [new NeteaseProvider()];
  if (enableQQ) {
    // 根据 QQ_MUSIC_PROVIDER 环境变量选择 QQ 音乐实现
    switch (qqProvider) {
      case "meting":
        // 使用 Meting（推荐，支持多种功能）
        list.push(new MetingQQProvider());
        break;
      case "rain120":
        // 使用 Rain120 API（不需要登录）
        list.push(new QQRain120Provider());
        break;
      case "free":
        // 使用免费API（不需要登录，但部分歌曲无法播放）
        list.push(new QQFreeProvider());
        break;
      case "third":
        // 使用第三方API（推荐，支持多种音源）
        list.push(new QQThirdProvider());
        break;
      case "qq-music-api":
      default:
        // 使用 qq-music-api（需要 Cookie）
        list.push(new QQProvider());
        break;
    }
  }
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

export async function searchMusic(query: string, page = 1, source = "all"): Promise<Song[]> {
  const results: Song[] = [];
  const allProviders = providers();
  
  // 过滤要使用的 provider
  const targetProviders = source === "all" 
    ? allProviders 
    : allProviders.filter(p => p.name.toLowerCase() === source.toLowerCase());

  for (const p of targetProviders) {
    try {
      const songs = await p.search(query, page);
      results.push(...songs);
    } catch (e) {
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
function interleaveResults(songs: Song[], providers: MusicProvider[]): Song[] {
  const result: Song[] = [];
  const byProvider = new Map<string, Song[]>();
  
  // 按平台分组
  for (const song of songs) {
    const key = song.source.toLowerCase();
    if (!byProvider.has(key)) byProvider.set(key, []);
    byProvider.get(key)!.push(song);
  }
  
  // 交替取出
  const providerOrder = providers.map(p => p.name.toLowerCase());
  let hasMore = true;
  
  while (hasMore) {
    hasMore = false;
    for (const providerName of providerOrder) {
      const list = byProvider.get(providerName);
      if (list && list.length > 0) {
        result.push(list.shift()!);
        hasMore = true;
      }
    }
  }
  
  return result;
}

export async function getPlayUrl(id: string): Promise<string | null> {
  const prefix = id.split(":")[0]?.toUpperCase();
  const provider = providers().find((p) => p.name.toUpperCase() === prefix);
  if (!provider) {
    throw new Error(`Unknown provider: ${prefix}`);
  }
  return provider.getPlayUrl(id);
}

export async function getLyric(id: string): Promise<string | null> {
  const prefix = id.split(":")[0]?.toUpperCase();
  const provider = providers().find((p) => p.name.toUpperCase() === prefix);
  if (!provider) {
    throw new Error(`Unknown provider: ${prefix}`);
  }
  return provider.getLyric(id);
}

export async function getHotRecommendation(): Promise<Song | null> {
  try {
    // 使用网易云的热歌榜
    const provider = new NeteaseProvider();
    const songs = await provider.getHotSongs();
    if (songs.length > 0) {
      // 随机选一首
      return songs[Math.floor(Math.random() * songs.length)];
    }
    return null;
  } catch (e) {
    console.error("[Music] getHotRecommendation error:", e);
    return null;
  }
}
