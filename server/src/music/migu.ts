import axios from "axios";
import crypto from "crypto";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class MiguProvider implements MusicProvider {
  name = "MIGU";

  async search(query: string, page = 1): Promise<Song[]> {
    console.log(`[Migu] Searching for: ${query}, page: ${page}`);
    try {
      // Migu Search API v3 - Alternative endpoint
      // Sometimes the tag search is blocked or requires specific headers
      // Let's try the suggestion API or the main search API if available

      // Attempt 1: Main Search API (often requires more headers)
      // https://m.music.migu.cn/migu/remoting/scr_search_tag

      // Attempt 2: New Migu Music API (from app reverse engineering)
      // https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do
      const deviceId = crypto.randomUUID();
      const res = await axios.get(
        "https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do",
        {
          params: {
            text: query,
            pageNo: page,
            pageSize: 10,
            searchSwitch: '{"song":1}', // Only search songs
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
            By: "792750346062",
            Referer: "https://m.music.migu.cn/",
          },
        },
      );

      const list = res.data?.songResultData?.result || [];
      return list.map((s: any) => ({
        id: `migu:${s.copyrightId}`,
        title: s.name,
        artist: s.singers?.map((singer: any) => singer.name).join(", "),
        durationSec: 0, // Duration might be in other fields or not available here
        coverUrl: s.imgItems?.[0]?.img || "",
        source: "MIGU",
      }));
    } catch (e) {
      console.error("Migu search error:", e);
      return [];
    }
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const copyrightId = id.replace("migu:", "");
      // Migu Play URL API
      // We can try getting it from the new API
      const res = await axios.get(
        "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do",
        {
          params: {
            copyrightId,
            resourceType: 2,
          },
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
          },
        },
      );

      const data = res.data?.resource?.[0];
      if (!data) return null;

      // Prioritize high quality
      const format =
        data.newRateFormats?.find((f: any) => f.formatType === "SQ") ||
        data.newRateFormats?.find((f: any) => f.formatType === "HQ") ||
        data.newRateFormats?.[0];

      let url = format?.url || data.rateFormats?.[0]?.url;

      if (url) {
        // URLs usually start with ftp://, need to convert to http/https if possible
        // or they are just regular http
        if (url.startsWith("ftp://")) {
          // Sometimes Migu returns ftp links, which browsers don't support well for audio
          // But often they have http alternatives or we can replace protocol?
          // Actually Migu's ftp links are often accessible via http
          url = url.replace("ftp://", "http://");
        }
        // Remove newlines if any
        return url.replace(/\s/g, "");
      }

      return null;
    } catch (e) {
      console.error("Migu getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const copyrightId = id.replace("migu:", "");
      const res = await axios.get(
        "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do",
        {
          params: {
            copyrightId,
            resourceType: 2,
          },
        },
      );

      const lrcUrl = res.data?.resource?.[0]?.lrcUrl;
      if (lrcUrl) {
        const lrcRes = await axios.get(lrcUrl);
        return lrcRes.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
