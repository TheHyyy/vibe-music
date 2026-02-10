import fs from "fs/promises";
import path from "path";

type SongRequestedEvent = {
  ts: number;
  type: "song.requested";
  roomId: string;
  user: { ip: string; ipHash: string; userId?: string; username?: string };
  song: { title: string; artist: string };
};

export type DailyRoomStats = {
  roomId: string;
  date: string;
  totalRequests: number;
  uniqueUsersByIpHash: number;
  topSongs: Array<{ title: string; artist: string; count: number }>;
  topArtists: Array<{ artist: string; count: number }>;
};

function stableSongKey(song: { title: string; artist: string }) {
  return `${song.title} - ${song.artist}`.trim();
}

export async function readRoomEventsJsonl(date: string): Promise<SongRequestedEvent[]> {
  const filePath = path.resolve(process.cwd(), "data", "room-events", `${date}.jsonl`);
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const events: SongRequestedEvent[] = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj && obj.type === "song.requested") events.push(obj);
      } catch {
        // ignore broken line
      }
    }
    return events;
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return [];
    }
    throw e;
  }
}

export function calcDailyRoomStats(input: {
  roomId: string;
  date: string;
  events: SongRequestedEvent[];
  topN?: number;
}): DailyRoomStats {
  const topN = input.topN ?? 5;
  const events = input.events.filter((e) => e.roomId === input.roomId);

  const uniqueIpHash = new Set<string>();
  const songCount = new Map<string, { title: string; artist: string; count: number }>();
  const artistCount = new Map<string, { artist: string; count: number }>();

  for (const e of events) {
    if (e.user?.ipHash) uniqueIpHash.add(e.user.ipHash);

    const title = String(e.song?.title || "").trim();
    const artist = String(e.song?.artist || "").trim();
    if (!title) continue;

    const key = stableSongKey({ title, artist });
    const prev = songCount.get(key);
    songCount.set(key, {
      title,
      artist,
      count: (prev?.count || 0) + 1,
    });

    if (artist) {
      const pa = artistCount.get(artist);
      artistCount.set(artist, { artist, count: (pa?.count || 0) + 1 });
    }
  }

  const topSongs = [...songCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  const topArtists = [...artistCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return {
    roomId: input.roomId,
    date: input.date,
    totalRequests: events.length,
    uniqueUsersByIpHash: uniqueIpHash.size,
    topSongs,
    topArtists,
  };
}

export function renderDailyText(stats: DailyRoomStats) {
  const lines: string[] = [];
  lines.push(`Echo Music 房间日报（${stats.date}）`);
  lines.push(`房间：${stats.roomId}`);
  lines.push("");
  lines.push(`今日点歌：${stats.totalRequests} 首`);
  lines.push(`参与用户（按 IPHash 去重）：${stats.uniqueUsersByIpHash} 人`);

  if (stats.topSongs.length) {
    lines.push("");
    lines.push("Top 歌曲：");
    stats.topSongs.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.title}${s.artist ? ` - ${s.artist}` : ""}（${s.count}）`);
    });
  }

  if (stats.topArtists.length) {
    lines.push("");
    lines.push("Top 歌手：");
    stats.topArtists.forEach((a, idx) => {
      lines.push(`${idx + 1}. ${a.artist}（${a.count}）`);
    });
  }

  return lines.join("\n");
}
