import {
  calcDailyRoomStats,
  renderDailyText,
  type DailyRoomStats,
} from "./daily.js";

type SongRequestedEvent = {
  ts: number;
  type: "song.requested";
  roomId: string;
  user: { ip: string; ipHash: string; userId?: string; username?: string };
  song: { title: string; artist: string };
};

type UserKey = string; // ipHash

export type DailyAllRoomsStats = {
  date: string;
  totalRooms: number;
  totalRequests: number;
  uniqueUsersByIpHash: number;
  rooms: DailyRoomStats[];
  perUser: Array<{
    ipHash: string;
    displayName: string;
    requests: number;
    favoriteArtist?: string;
    favoriteSong?: string;
  }>;
  topSongs: Array<{ title: string; artist: string; count: number }>;
  topArtists: Array<{ artist: string; count: number }>;
};

function normalizeIp(ip: string) {
  return ip.startsWith("::ffff:") ? ip.slice("::ffff:".length) : ip;
}

function maskIp(ip: string) {
  const norm = normalizeIp(ip);
  if (norm.includes(":")) {
    // IPv6: keep short suffix
    const parts = norm.split(":").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return `*:*:*:${last.slice(-4)}`;
  }
  const parts = norm.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return norm;
}

function pickDisplayName(e: SongRequestedEvent) {
  const name = String(e.user?.username || "").trim();
  if (name) return name;
  const ipMasked = maskIp(String(e.user?.ip || ""));
  return `匿名（${ipMasked}）`;
}

function stableSongKey(song: { title: string; artist: string }) {
  return `${song.title} - ${song.artist}`.trim();
}

export function calcDailyAllRoomsStats(input: {
  date: string;
  events: SongRequestedEvent[];
  topN?: number;
}): DailyAllRoomsStats {
  const topN = input.topN ?? 5;

  const roomIds = [...new Set(input.events.map((e) => e.roomId))].filter(
    Boolean,
  );
  const rooms = roomIds
    .map((roomId) =>
      calcDailyRoomStats({
        roomId,
        date: input.date,
        events: input.events,
        topN,
      }),
    )
    .sort((a, b) => b.totalRequests - a.totalRequests);

  const userAgg = new Map<
    UserKey,
    {
      ipHash: string;
      displayName: string;
      requests: number;
      artistCount: Map<string, number>;
      songCount: Map<string, number>;
    }
  >();

  const songCount = new Map<
    string,
    { title: string; artist: string; count: number }
  >();
  const artistCount = new Map<string, { artist: string; count: number }>();

  // Track unique users with better granularity (Name + IP)
  const uniqueUserKeys = new Set<string>();

  for (const e of input.events) {
    if (e.type !== "song.requested") continue;

    const ipHash = String(e.user?.ipHash || "");
    const username = String(e.user?.username || "").trim();

    // Merge by username if available (User request: "名字相同的就合并")
    let userKey = username;

    if (!userKey) {
      // If no username, fallback to userId or ipHash to distinguish anonymous users
      userKey = e.user?.userId || ipHash;
    }

    if (userKey) uniqueUserKeys.add(userKey);

    const title = String(e.song?.title || "").trim();
    const artist = String(e.song?.artist || "").trim();
    if (!title) continue;

    // global top
    const sk = stableSongKey({ title, artist });
    const prevS = songCount.get(sk);
    songCount.set(sk, { title, artist, count: (prevS?.count || 0) + 1 });

    if (artist) {
      const prevA = artistCount.get(artist);
      artistCount.set(artist, { artist, count: (prevA?.count || 0) + 1 });
    }

    // per user
    if (userKey) {
      const prev = userAgg.get(userKey);
      const displayName = prev?.displayName || pickDisplayName(e);
      const agg = prev || {
        ipHash,
        displayName,
        requests: 0,
        artistCount: new Map<string, number>(),
        songCount: new Map<string, number>(),
      };

      agg.requests += 1;
      if (artist)
        agg.artistCount.set(artist, (agg.artistCount.get(artist) || 0) + 1);
      agg.songCount.set(sk, (agg.songCount.get(sk) || 0) + 1);

      userAgg.set(userKey, agg);
    }
  }

  const perUser = [...userAgg.values()]
    .map((u) => {
      const favoriteArtist = [...u.artistCount.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];
      const favoriteSongKey = [...u.songCount.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];
      return {
        ipHash: u.ipHash,
        displayName: u.displayName,
        requests: u.requests,
        favoriteArtist,
        favoriteSong: favoriteSongKey,
      };
    })
    .sort((a, b) => b.requests - a.requests);

  const topSongs = [...songCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
  const topArtists = [...artistCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return {
    date: input.date,
    totalRooms: roomIds.length,
    totalRequests: input.events.length,
    uniqueUsersByIpHash: uniqueUserKeys.size, // Use the new count
    rooms,
    perUser,
    topSongs,
    topArtists,
  };
}

export function renderDailyAllText(stats: DailyAllRoomsStats) {
  const lines: string[] = [];
  lines.push(`六人组 Music 日报汇总（${stats.date}）`);
  lines.push("");
  lines.push(
    `当日点歌：${stats.totalRequests} 首｜参与：${stats.uniqueUsersByIpHash} 人`,
    // `房间数：${stats.totalRooms}｜今日点歌：${stats.totalRequests} 首｜参与：${stats.uniqueUsersByIpHash} 人`,
  );

  // 不要房间预览
  // if (stats.rooms.length) {
  //   lines.push("");
  //   lines.push("房间概览：");
  //   stats.rooms.forEach((r, idx) => {
  //     lines.push(
  //       `${idx + 1}. ${r.roomId}：${r.totalRequests} 首（${r.uniqueUsersByIpHash} 人）`,
  //     );
  //   });
  // }

  if (stats.perUser.length) {
    lines.push("");
    lines.push("最活跃点歌榜：");
    stats.perUser.slice(0, 10).forEach((u, idx) => {
      const fav = u.favoriteArtist ? `｜最爱：${u.favoriteArtist}` : "";
      lines.push(`${idx + 1}. ${u.displayName}：${u.requests} 首${fav}`);
    });
  }

  if (stats.topSongs.length) {
    lines.push("");
    lines.push("全局 Top 歌曲：");
    stats.topSongs.forEach((s, idx) => {
      lines.push(
        `${idx + 1}. ${s.title}${s.artist ? ` - ${s.artist}` : ""}（${s.count}）`,
      );
    });
  }

  // if (stats.topArtists.length) {
  //   lines.push("");
  //   lines.push("全局 Top 歌手：");
  //   stats.topArtists.forEach((a, idx) => {
  //     lines.push(`${idx + 1}. ${a.artist}（${a.count}）`);
  //   });
  // }

  // Keep room-level raw report at bottom for traceability (shortened)
  // 注释掉简报部分
  // if (stats.rooms.length) {
  //   lines.push("\n——\n");
  //   lines.push("附：各房间简报（可追溯）");
  //   stats.rooms.forEach((r) => {
  //     lines.push("");
  //     lines.push(renderDailyText(r));
  //   });
  // }

  return lines.join("\n");
}
