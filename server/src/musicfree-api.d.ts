declare module 'musicfree-api' {
  export interface SearchResult {
    data: Array<{
      id: string;
      title: string;
      artist: string;
      album: string;
      duration: number;
      artwork?: string;
    }>;
  }

  export interface MediaSource {
    url: string;
    quality?: string;
    size?: number;
  }

  export interface LyricResult {
    rawLrc?: string;
  }

  export function search(platform: string, keyword: string, page?: number, type?: string): Promise<SearchResult>;
  export function getMediaSource(platform: string, song: any, quality?: string): Promise<MediaSource>;
  export function getLyric(platform: string, song: any): Promise<LyricResult>;
  export function getAvailablePlatforms(): Record<string, string>;
}
