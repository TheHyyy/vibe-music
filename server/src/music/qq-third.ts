/**
 * QQ音乐 Provider (第三方API版)
 * 使用公开的第三方API获取歌曲信息和播放链接
 * 支持多个音源，自动切换
 */
import axios from 'axios';
import type { MusicProvider } from './types.js';
import type { Song } from '../types.js';

// 第三方API端点列表（按优先级排序）
const API_ENDPOINTS = [
  {
    name: 'iwxe',
    search: 'https://api.iwxe.cn/api/music/search',
    url: 'https://api.iwxe.cn/api/music/url',
    params: { type: 'tencent' }
  },
  // 可以添加更多API端点
];

export class QQThirdProvider implements MusicProvider {
  name = 'QQ';
  private cookie: string;

  constructor() {
    this.cookie = process.env.QQ_COOKIE || '';
    if (this.cookie) {
      console.log('[QQ-Third] Cookie configured');
    }
  }

  // 搜索歌曲 - 使用QQ官方API
  async search(query: string, page = 1): Promise<Song[]> {
    try {
      // 使用QQ官方搜索API
      const res = await axios.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp', {
        params: {
          format: 'json',
          p: page,
          n: 20,
          w: query,
          aggr: 1,
          lossless: 0,
          cr: 1,
          new_json: 1,
        },
        headers: {
          'Referer': 'https://y.qq.com/portal/search.html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const list = res?.data?.data?.song?.list || [];
      return list.map((s: any) => ({
        id: `qq:${s.mid}`,
        title: s.name,
        artist: s.singer?.map((a: any) => a.name).join(', ') || 'Unknown',
        durationSec: s.interval || 0,
        coverUrl: s.album?.pmid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.album.pmid}.jpg` : '',
        source: 'QQ',
      }));
    } catch (e) {
      console.error('[QQ-Third] Search error:', e);
      return [];
    }
  }

  // 获取播放链接
  async getPlayUrl(id: string): Promise<string | null> {
    const songmid = id.replace('qq:', '');

    // 方法1: 如果有Cookie，使用官方API
    if (this.cookie) {
      try {
        const url = await this.getUrlWithCookie(songmid);
        if (url) return url;
      } catch (e) {
        console.error('[QQ-Third] Cookie method failed:', e);
      }
    }

    // 方法2: 尝试使用第三方API
    for (const endpoint of API_ENDPOINTS) {
      try {
        const res = await axios.get(endpoint.url, {
          params: {
            ...endpoint.params,
            id: songmid,
          },
          timeout: 5000,
        });

        if (res?.data?.url) {
          return res.data.url;
        }
      } catch (e) {
        // 继续尝试下一个API
      }
    }

    // 方法3: 尝试获取免费试听链接
    try {
      const freeUrl = await this.getFreeUrl(songmid);
      if (freeUrl) return freeUrl;
    } catch (e) {
      // 忽略错误
    }

    throw new Error('获取播放链接失败。QQ音乐需要登录或VIP才能播放此歌曲。\n\n解决方案：\n1. 在浏览器中登录 y.qq.com\n2. 按F12打开开发者工具，复制Cookie\n3. 在 .env 文件中设置 QQ_COOKIE=你的Cookie\n4. 重启服务器');
  }

  // 使用Cookie获取播放链接
  private async getUrlWithCookie(songmid: string): Promise<string | null> {
    const guid = Math.floor(Math.random() * 10000000000);

    const res = await axios.get('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      params: {
        '-': 'getplaysongvkey',
        g_tk: 5381,
        loginUin: '0',
        hostUin: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: 0,
        platform: 'yqq.json',
        needNewCode: 0,
        data: JSON.stringify({
          req_0: {
            module: 'vkey.GetVkeyServer',
            method: 'CgiGetVkey',
            param: {
              filename: [`M500${songmid}.mp3`],
              guid: guid.toString(),
              songmid: [songmid],
              songtype: [0],
              uin: '0',
              loginflag: 1,
              platform: '20',
            },
          },
          comm: {
            uin: 0,
            format: 'json',
            ct: 19,
            cv: 0,
          },
        }),
      },
      headers: {
        'Cookie': this.cookie,
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const midurlinfo = res?.data?.req_0?.data?.midurlinfo?.[0];
    const sip = res?.data?.req_0?.data?.sip || [];

    if (midurlinfo?.purl) {
      const domain = sip.find((d: string) => !d.startsWith('http://ws')) || sip[0] || '';
      return `${domain}${midurlinfo.purl}`;
    }

    return null;
  }

  // 获取免费试听链接
  private async getFreeUrl(songmid: string): Promise<string | null> {
    const res = await axios.get('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
      params: {
        songmid,
        format: 'json',
      },
      headers: {
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const songData = res?.data?.data?.[0];
    const url = res?.data?.url?.[songData?.id];

    if (url) {
      return `http://${url}`;
    }

    return null;
  }

  // 获取歌词
  async getLyric(id: string): Promise<string | null> {
    try {
      const songmid = id.replace('qq:', '');
      const res = await axios.get('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg', {
        params: {
          songmid,
          format: 'json',
        },
        headers: {
          'Referer': 'https://y.qq.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': this.cookie,
        },
      });

      let lyric = res?.data?.lyric;
      if (lyric) {
        try {
          lyric = Buffer.from(lyric, 'base64').toString('utf-8');
        } catch {
          // 不是base64，直接返回
        }
      }
      return lyric || null;
    } catch (e) {
      console.error('[QQ-Third] getLyric error:', e);
      return null;
    }
  }
}
