import type { Song } from "../types.js";

export interface MusicProvider {
  name: string;
  search(query: string, page?: number): Promise<Song[]>;
  getPlayUrl(id: string): Promise<string | null>;
  getLyric(id: string): Promise<string | null>;
}
