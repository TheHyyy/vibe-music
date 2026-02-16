import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export type SongRequestedEvent = {
  ts: number;
  type: "song.requested";
  roomId: string;
  user: {
    ip: string;
    ipHash: string;
    userId?: string;
    username?: string;
  };
  song: {
    title: string;
    artist: string;
  };
};

function resolveIpFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  connection?: { remoteAddress?: string | null };
}): string {
  // If behind a trusted reverse proxy, x-forwarded-for may contain the real client IP.
  // Here we still prefer socket address unless x-forwarded-for is present.
  const xff = req.headers["x-forwarded-for"];
  const xffStr = Array.isArray(xff) ? xff[0] : xff;
  const firstXff = xffStr?.split(",")[0]?.trim();

  const raw =
    firstXff ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";

  // Normalize IPv6 mapped IPv4: ::ffff:192.168.0.2
  return raw.startsWith("::ffff:") ? raw.slice("::ffff:".length) : raw;
}

function resolveIpFromSocket(socket: {
  handshake: { headers: Record<string, string | string[] | undefined> };
  conn?: { remoteAddress?: string | null };
  request?: { socket?: { remoteAddress?: string | null } };
}): string {
  const xff = socket.handshake.headers["x-forwarded-for"];
  const xffStr = Array.isArray(xff) ? xff[0] : xff;
  const firstXff = xffStr?.split(",")[0]?.trim();

  const raw =
    firstXff ||
    socket.request?.socket?.remoteAddress ||
    socket.conn?.remoteAddress ||
    "";

  return raw.startsWith("::ffff:") ? raw.slice("::ffff:".length) : raw;
}

function getIpHashSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error("Missing env: IP_HASH_SALT");
  }
  return salt;
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function formatDateKey(ts: number): string {
  const d = new Date(ts);
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function appendJsonl(filePath: string, obj: unknown) {
  const line = `${JSON.stringify(obj)}\n`;
  await fs.appendFile(filePath, line, { encoding: "utf8" });
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function logSongRequestedFromHttp(input: {
  req: {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string | null };
    connection?: { remoteAddress?: string | null };
  };
  roomId: string;
  userId?: string;
  username?: string;
  song: { title?: string; artist?: string };
}) {
  const ts = Date.now();
  const ip = resolveIpFromRequest(input.req);
  const ipHash = sha256Hex(`${ip}:${getIpHashSalt()}`);

  const event: SongRequestedEvent = {
    ts,
    type: "song.requested",
    roomId: input.roomId,
    user: {
      ip,
      ipHash,
      userId: input.userId,
      username: input.username,
    },
    song: {
      title: String(input.song.title || "").trim(),
      artist: String(input.song.artist || "").trim(),
    },
  };

  // Minimal validation: skip if missing title (avoid polluting logs)
  if (!event.song.title) return;

  const dateKey = formatDateKey(ts);
  const dir = path.resolve(process.cwd(), "data", "room-events");
  await ensureDir(dir);
  const filePath = path.join(dir, `${dateKey}.jsonl`);
  await appendJsonl(filePath, event);
}

export async function logSongRequestedFromSocket(input: {
  socket: {
    handshake: { headers: Record<string, string | string[] | undefined> };
    conn?: { remoteAddress?: string | null };
    request?: { socket?: { remoteAddress?: string | null } };
    data?: any;
  };
  roomId: string;
  userId?: string;
  username?: string;
  song: { title?: string; artist?: string };
}) {
  const ts = Date.now();
  const ip = resolveIpFromSocket(input.socket);
  const ipHash = sha256Hex(`${ip}:${getIpHashSalt()}`);

  const event: SongRequestedEvent = {
    ts,
    type: "song.requested",
    roomId: input.roomId,
    user: {
      ip,
      ipHash,
      userId: input.userId,
      username: input.username,
    },
    song: {
      title: String(input.song.title || "").trim(),
      artist: String(input.song.artist || "").trim(),
    },
  };

  if (!event.song.title) return;

  const dateKey = formatDateKey(ts);
  const dir = path.resolve(process.cwd(), "data", "room-events");
  await ensureDir(dir);
  const filePath = path.join(dir, `${dateKey}.jsonl`);
  await appendJsonl(filePath, event);
}
