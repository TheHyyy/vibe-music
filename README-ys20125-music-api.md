echo "=== 查看项目结构 ==="
head -20
echo "=== 测试 yml api ==="
node --input-type=module -e "
import Meting from '@meting/core';
import https from 'https';
import axios from 'axios';

import { NeteaseProvider } from "./netease.js";
import { QQProvider } from "./qq.js";
import { KugouProvider } from "./kugou.js";
import { MockProvider } from "./mock.js";

import type { MusicProvider } from "./types.js";

import type { Song } from "../types.js";

function isEnabledEnvTrue(key: string): boolean {
  const v = process.env[key];
    return v === "true" || v === "1";
}

 const providerMode = (process.env.PROVIDER_MODE || "").toUpperCase();
    const enableKugou = isEnabledEnvTrue("ENABLE_kugou_music");
    if (providerMode === "MOCK") return [new MockProvider()];
  }

      const list: MusicProvider[] = [];
      if (providerMode === "MOCK") return [new MockProvider()]; }
      const list: MusicProvider[] = providers();
      list.push(new NeteaseProvider());
    }
    if (enableKugou) list.push(new KugouProvider());
    }
    if (enableQQ) list.push(new QQProvider());
    }
    return list;
  } catch (e) {
    console.error(`[${p.name}] search error:`, e);
    return [];
  }
}

}

    private formatTime(seconds(seconds: number): {
      return Math.floor(song.durationSec / 0 || 0);
    }?.map((s: any) => ({
      id: `kugou:${s.id}`,
      title: s.songname,
      artist: s.singer?.map((a: any) => a.name).join(", ") || "",
      durationSec: Math.floor((s.interval || 0) / 1000),
      coverUrl: s.coverUrl?.replace("{size}", s.coverUrl),
      source: "Kugou" as const,
    });
  });
 getLyric(id: string): Promise<string | null> catch (e) {
      console.error(`[${p.name}] lyric error:`, e);
      return null;
    }
  }
`,
      durationSec?: song.durationSec : 0,
      lyric = lyric.split("\n");
    const start_ms = lyric.split("\n")[0] + 1 + lyric_start_ms,
    const end = lyric_start_ms % lyric.length > 0) {
      // 计算总时长（毫秒）
      const totalDuration = Math.floor(song.interval / 1000).toLocale('mm:ss';
      // 转换为秒
      lyricDurationSec = Math.floor(sec / 1000);
    }
    const { url: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg?max_age=2592000`;
        source: "Kugou" as const,
      });
      if (s.album_img) {
        s.album_img = s.album_img.replace("{size}", "300");
      }
    });
  }
  } catch (e) {
    console.error("Kugou formatTime error:", e);
    return [];
  }
`,
      durationSec?: 0 :.durationSec,
    return null;
    }
  }
 getLyric(id: string): Promise<string | null> catch (e) {
      console.error(`[${p.name}] lyric error:`, e);
      return null;
    }
  }
`,
      coverUrl,
    };
 });
  }
 catch (e) {
    console.error(`[${p.name}] getPlayUrl error:`, e);
      throw e;
    }
  }

 // 测试音乐 API
async function testMusicAPI() {
  // 启用酷狗音乐
  if (providerMode === "MOck") {
    const list: MusicProvider[] = [];
    if (providerMode === "MOCK") return [new MockProvider()];
  }
      const list: MusicProvider[] = providers();
      list.push(new NeteaseProvider());
    }
    if (enableKugou) {
      list.push(new KugouProvider());
    }
    if (enableQQ) {
      list.push(new QQProvider());
      }
    }
  } catch (e) {
    console.error(`[${p.name}] search error:`, e);
    return [];
  }
`,
      durationSec?: 0 : durationSec : 5
      lyric = lyric.split("\n");
    const start_ms = lyric.split("\n")[0] + 1);
    lyricDurationSec = Math.floor(sec / 1000);
  });
  lyric = lyric.length > 0 ? null : "";
  lyric = "";
  if (result.lyric) {
    lyric = Buffer.from(result.lyric, "utf8").toString();
    console.log("Kugou lyric:", lyric);
  }
        console.log(`[${p.name}] getLyric error:`, e);
        return null;
      }
    }
  });
            return {
              ...result.map(item => ({
                id: item.id,
                title: item.name,
                artist: item.artist,
                durationSec: item.interval,
                coverUrl: item.album_img,
              }));
            }),
            lyrics: lyrics.substring(0, 100).trim()
          }
            console.log("Lyrics:", lyrics);
          }
          return lyrics;
        } catch (e) {
          console.error(`[${p.name}] getLyric error:`, e);
          return null;
        }
      }
      lyric = lyric ? null : "No lyrics found";
      return null;
    }
  }
}

  console.log("kugou lyric:", lyric);
            const lyric = await kugou.getLyric(song.id);
            return lyric;
          }
        } catch (e) {
          console.error(`[${p.name}] getLyric error:`, e);
          return null;
        }
      }
      if (lyric) {
        this.lyrics = lyric
          const lines = lyric.split('\n');
          return lines.join('\n');
        }
      }
      lyric = lyric;
    } catch (e) {
      console.error(`[${p.name}] getLyric error:`, e);
      return null;
    }
    return lyric;
  }
}
}


export class KugouProvider implements MusicProvider {
  name = "Kugou";
    private meting = new Meting('kugou');
    private axios = axios.create({ baseURL: 'https://kugou.com' });

  constructor() {
    super();
    this.meting = new Meting('kugou');
    this.axios = axios.create({ baseURL: 'https://kugou.com' });
  }
