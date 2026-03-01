/**
 * QQ音乐 Provider (免费版)
 * 使用公开API获取歌曲信息和播放链接
 * 注意：部分歌曲可能需要VIP才能播放
 */
import axios from 'axios';
import type { MusicProvider } from './types.js';
import type { Song } from '../types.js';

export class QQFreeProvider implements MusicProvider {
  name = 'QQ';

  // 搜索歌曲
  async search(query: string, page = 1): Promise<Song[]> {
    try {
      const res = await axios.get('https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg', {
        params: {
          key: query,
          format: 'json',
        },
        headers: {
          'Referer': 'https://y.qq.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const list = res?.data?.data?.song?.itemlist || [];
      return list.map((s: any) => ({
        id: `qq:${s.mid}`,
        title: s.name,
        artist: s.singer,
        durationSec: 0,
        coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`,
        source: 'QQ',
      }));
    } catch (e) {
      console.error('[QQ-Free] Search error:', e);
      return [];
    }
  }

  // 获取播放链接
  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const songmid = id.replace('qq:', '');

      // 方法1: 尝试获取歌曲详情（包含免费试听链接）
      const detailRes = await axios.get('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
        params: {
          songmid,
          format: 'json',
        },
        headers: {
          'Referer': 'https://y.qq.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const songData = detailRes?.data?.data?.[0];

      // 检查是否有免费URL
      if (detailRes?.data?.url?.[songData?.id]) {
        const url = detailRes.data.url[songData.id];
        return `http://${url}`;
      }

      // 方法2: 尝试使用vkey获取
      const guid = Math.floor(Math.random() * 10000000000);
      const vkeyRes = await axios.get('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        params: {
          '-': 'getplaysongvkey',
          g_tk: 5381,
          loginUin: 0,
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
                filename: [`C400${songmid}.m4a`],
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
          'Referer': 'https://y.qq.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const midurlinfo = vkeyRes?.data?.req_0?.data?.midurlinfo?.[0];
      const sip = vkeyRes?.data?.req_0?.data?.sip || [];

      if (midurlinfo?.purl) {
        const domain = sip.find((d: string) => !d.startsWith('http://ws')) || sip[0] || '';
        return `${domain}${midurlinfo.purl}`;
      }

      // 如果都失败，抛出错误提示用户
      throw new Error('QQ音乐需要登录或VIP才能播放此歌曲。请在 .env 中配置有效的 QQ_COOKIE（登录QQ音乐后获取）');
    } catch (e: any) {
      console.error('[QQ-Free] getPlayUrl error:', e);
      throw e;
    }
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
        },
      });

      // 歌词可能是base64编码
      let lyric = res?.data?.lyric;
      if (lyric) {
        // 解码base64
        try {
          lyric = Buffer.from(lyric, 'base64').toString('utf-8');
        } catch {
          // 如果不是base64，直接返回
        }
      }
      return lyric || null;
    } catch (e) {
      console.error('[QQ-Free] getLyric error:', e);
      return null;
    }
  }
}
