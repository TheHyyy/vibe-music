import axios from "axios";
import crypto from "crypto";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class MiguProvider implements MusicProvider {
  name = "MIGU";

  private getHeaders() {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
      Referer: "https://m.music.migu.cn/",
      By: "792750346062",
    };

    if (process.env.MIGU_COOKIE) {
      headers["Cookie"] = process.env.MIGU_COOKIE;
    }

    return headers;
  }

  async search(query: string, page = 1): Promise<Song[]> {
    try {
      // Use the mobile API which returns better metadata
      const res = await axios.get(
        "https://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do",
        {
          params: {
            text: query,
            pageNo: page,
            pageSize: 10,
            searchSwitch: '{"song":1}',
          },
          headers: this.getHeaders(),
        },
      );

      const list = res.data?.songResultData?.result || [];
      return list.map((s: any) => ({
        id: `migu:${s.copyrightId}`,
        title: s.name,
        artist: s.singers?.map((singer: any) => singer.name).join(", "),
        durationSec: 0,
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

      // Strategy 1: Web Player API (Requires Cookie for VIP songs)
      // This is the most likely to work with a user-provided VIP cookie
      try {
        const webRes = await axios.get(
          "https://music.migu.cn/v3/music/player/audio",
          {
            params: { itemid: copyrightId },
            headers: {
              ...this.getHeaders(),
              Referer: "https://music.migu.cn/v3/music/player/audio",
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        );

        if (
          webRes.data?.returnCode === "000000" &&
          webRes.data?.data?.playUrl
        ) {
          return webRes.data.data.playUrl;
        }
      } catch (e) {
        console.warn("Migu Web API failed, trying fallback...");
      }

      // Strategy 2: Mobile Resource API (Fallback)
      const res = await axios.get(
        "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do",
        {
          params: {
            copyrightId,
            resourceType: 2,
          },
          headers: this.getHeaders(),
        },
      );

      const data = res.data?.resource?.[0];
      if (!data) return null;

      // Check for rate formats (PQ, HQ, SQ, etc.)
      const formats = data.newRateFormats || data.rateFormats || [];
      const targetFormat =
        formats.find((f: any) => f.formatType === "SQ") ||
        formats.find((f: any) => f.formatType === "HQ") ||
        formats.find((f: any) => f.formatType === "PQ") ||
        formats[0];

      if (targetFormat && targetFormat.contentId) {
        try {
          const listenRes = await axios.get(
            "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do",
            {
              params: {
                copyrightId,
                contentId: targetFormat.contentId,
                toneFlag: targetFormat.formatType,
                resourceType: 2,
                channel: "0146951",
                uid: "1234",
              },
              headers: {
                ...this.getHeaders(),
                channel: "0146951",
                uid: "1234",
              },
              maxRedirects: 0,
              validateStatus: (status) => status >= 200 && status < 400,
            },
          );

          if (listenRes.status === 302 || listenRes.status === 301) {
            return listenRes.headers.location;
          }
        } catch (e) {
          console.warn("Migu listenSong.do failed:", e);
        }
      }

      return null;
    } catch (e) {
      console.error("Migu getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    return null;
  }
}
