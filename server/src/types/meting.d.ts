declare module "@meting/core" {
  export interface SearchOptions {
    page?: number;
    limit?: number;
    type?: number;
  }

  export interface MetingInterface {
    VERSION: string;
    raw: string | null;
    info: any;
    error: string | null;
    status: string | null;
    temp: any;
    server: string | null;
    provider: any;
    isFormat: boolean;
    header: any;

    site(server: string): MetingInterface;
    cookie(cookie: string): MetingInterface;
    format(enable: boolean): MetingInterface;
    
    search(keyword: string, options?: SearchOptions): Promise<string>;
    song(id: string): Promise<string>;
    album(id: string): Promise<string>;
    artist(id: string, limit?: number): Promise<string>;
    playlist(id: string): Promise<string>;
    url(id: string, bitrate?: number): Promise<string>;
    lyric(id: string): Promise<string>;
    pic(id: string, size?: number): Promise<string>;
    
    _exec(request: any): Promise<string>;
    _curl(url: string, body?: any, isPost?: boolean): Promise<any>;
  }

  export default MetingInterface;
}
