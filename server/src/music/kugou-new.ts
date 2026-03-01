/**
 * 酷狗音乐 Provider
 * 使用酷狗音乐API获取歌曲信息和播放链接
 */
import axios from 'axios';
import type { MusicProvider } from './types.js';
import type { Song } from '../types.js';

export class KugouProvider implements MusicProvider {
  name = 'KUGOU';

  // 搜索歌曲
  async search(query: string, page = 1): Promise<Song[]> {
    try {
      const res = await axios.get('https://songsearch.kugou.com/song_search_v2', {
        params: {
          keyword: query,
          page,
          pagesize: 20,
          platform: 'WebFilter',
        },
        timeout: 10000,
      });

      const list = res?.data?.data?.lists || [];
      return list.map((s: any) => ({
        id: `kugou:${s.FileHash}`,
        title: s.SongName,
        artist: s.SingerName,
        durationSec: s.Duration || 0,
        coverUrl: s.Image?.replace('{size}', '300x300') || '',
        source: 'KUGOU',
      }));
    } catch (e) {
      console.error('[Kugou] Search error:', e);
      return [];
    }
  }

  // 获取歌词
  async getLyric(id: string): Promise<string | null> {
    try {
      const hash = id.replace('kugou:', '');

      const res = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
        params: {
          r: 'play/getdata',
          hash,
          album_id: 0,
          mid: Date.now().toString(),
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kugou.com/',
        },
        timeout: 10000,
      });

      return res?.data?.data?.lyrics || null;
    } catch (e) {
      console.error('[Kugou] getLyric error:', e);
      return null;
    }
  }

  // 获取播放链接
  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const hash = id.replace('kugou:', '');

      // 使用酷狗API获取播放链接
      const res = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
        params: {
          r: 'play/getdata',
          hash,
          mid: Date.now().toString(),
          type: 'audio',
          platid: 4,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kugou.com/',
        },
        timeout: 10000,
      });

      const url = res?.data?.data?.play_url || res?.data?.data?.url;
      if (url) {
        return url;
      }

      // 如果获取失败，尝试备用API
      const backupRes = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
        params: {
          r: 'play/getdata',
          hash,
          album_id: 0,
          mid: Date.now().toString(),
          platid: 4,
          _: Date.now(),
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kugou.com/',
        },
        timeout: 10000,
      });

      const backupUrl = backupRes?.data?.data?.play_url || backupRes?.data?.data?.url;
      if (backupUrl) {
        return backupUrl;
      }

      throw new Error('获取播放链接失败，该歌曲可能需要VIP权限');
    } catch (e: any) {
      console.error('[Kugou] getPlayUrl error:', e);
      throw new Error('酷狗音乐暂时无法获取此歌曲的播放链接，请稍后重试或尝试其他音源');
    }
  }

  // 获取歌词
  async getLyric(id: string): Promise<string | null> {
    try {
      const hash = id.replace('kugou:', '');

      const res = await axios.get('https://wwwapi.kugou.com/yy/index.php', {
        params: {
          r: 'play/getdata',
          hash,
          album_id: 0,
          mid: Date.now().toString(),
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kugou.com/',
        },
        timeout: 10000,
      });

      return res?.data?.data?.lyrics || null;
    } catch (e) {
      console.error('[Kugou] getLyric error:', e);
      return null;
    }
  }
}
