declare module '@meting/core' {
  export default class Meting {
    constructor(server: string);
    search(keyword: string, limit: number): Promise<string>;
    url(id: string, quality?: string): Promise<string>;
    lyric(id: string): Promise<string>;
    pic(id: string): Promise<string>;
    album(id: string): Promise<string>;
    artist(id: string): Promise<string>;
    playlist(id: string): Promise<string>;
  }
}
