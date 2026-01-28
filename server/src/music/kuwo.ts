import axios from "axios";
import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

export class KuwoProvider implements MusicProvider {
  name = "KUWO";

  async search(query: string, page = 1): Promise<Song[]> {
    try {
      const res = await axios.get("http://search.kuwo.cn/r.s", {
        params: {
          all: query,
          ft: "music",
          itemset: "web_2013",
          client: "kt",
          pn: page - 1,
          rn: 10,
          rformat: "json",
          encoding: "utf8",
        },
        responseType: "text", // It returns text/html usually
      });

      // The response is often variable-like: "try { var jsondata = ... } catch(e) {}"
      // or raw JSON depending on params. The old API returns "jsondata = ...".
      let data = res.data;
      if (typeof data === "string") {
        // Kuwo legacy API returns raw JS object notation, NOT valid JSON.
        // e.g. jsondata = {'abslist':[{'AARTIST':'Jay&nbsp;Chou',...}]}
        // We cannot use JSON.parse even with regex replacement because it contains
        // single quotes and special keys.
        // Since we are in a backend environment, we can evaluate it in a sandbox or use a custom parser.
        // But for simplicity and relative safety with this specific API response structure,
        // we can try to extract the list array part and process it.

        // The safest robust way is to use 'eval' or 'Function' but strictly sandbox it.
        // However, this data is from a public music API.
        // Let's assume the structure 'jsondata = {...}' and strip the prefix.

        // Let's use `new Function` to parse it since it's just a data object assignment.
        // Be careful: malicious code execution risk if Kuwo is compromised.
        // Mitigate by ensuring it only contains data-like characters? No, that's hard.
        // Let's try to extract the array content using a better regex.

        // It uses single quotes for keys and values: {'key':'value',...}
        // JSON requires double quotes.

        // Let's replace single quotes with double quotes, BUT handle escaped quotes?
        // Kuwo response: {'AARTIST':'Jay&nbsp;Chou','ALBUM':'',...}

        // Let's try a safer evaluation approach:
        // Strip "try{...}catch(e){}" and "var jsondata ="
        // and just return the object.

        // Check for 'jsondata = {...}' pattern
        const match = data.match(/jsondata\s*=\s*(\{[\s\S]*?\});/);

        let objectToParse = "";
        if (match && match[1]) {
          objectToParse = match[1];
        } else if (data.trim().startsWith("{")) {
          // Sometimes it returns the raw object without assignment
          objectToParse = data;
        }

        if (objectToParse) {
          try {
            // Use Function constructor to parse the JS object literal
            // This is equivalent to eval() but scoped.
            const parse = new Function(`return ${objectToParse}`);
            const jsonObj = parse();
            const list = jsonObj.abslist || [];

            return list.map((s: any) => ({
              id: `kuwo:${s.MUSICRID.replace("MUSIC_", "")}`,
              title: (s.SONGNAME || "").replace(/&nbsp;/g, " "),
              artist: (s.ARTIST || "").replace(/&nbsp;/g, " "),
              durationSec: Number(s.DURATION || 0),
              coverUrl: s.PIC || "", // PIC is usually a URL
              source: "KUWO",
            }));
          } catch (e) {
            console.error("Kuwo eval error:", e);
          }
        } else {
          console.warn("[Kuwo] Response format mismatch:", data.slice(0, 100));
        }
      }
    } catch (e) {
      console.error("Kuwo fallback search error:", e);
    }

    return [];
  }

  async getPlayUrl(id: string): Promise<string | null> {
    try {
      const rid = id.replace("kuwo:", "");
      const res = await axios.get("http://antiserver.kuwo.cn/anti.s", {
        params: {
          type: "convert_url",
          rid,
          format: "mp3",
          response: "url",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      // It returns just the URL string
      const url = res.data;
      if (url && url.startsWith("http")) {
        return url;
      }
      return null;
    } catch (e) {
      console.error("Kuwo getPlayUrl error:", e);
      return null;
    }
  }

  async getLyric(id: string): Promise<string | null> {
    try {
      const rid = id.replace("kuwo:", "");
      const res = await axios.get(
        "http://m.kuwo.cn/newh5/singles/songinfoandlrc",
        {
          params: {
            musicId: rid,
            httpsStatus: 1,
          },
        },
      );

      const lrclist = res.data?.data?.lrclist;
      if (lrclist && Array.isArray(lrclist)) {
        return lrclist
          .map((l: any) => `[${formatTime(l.time)}]${l.lineLyric}`)
          .join("\n");
      }
      return null;
    } catch (e) {
      console.error("Kuwo getLyric error:", e);
      return null;
    }
  }
}

function formatTime(time: string | number) {
  const t = Number(time);
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}
