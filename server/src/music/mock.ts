import type { MusicProvider } from "./types.js";
import type { Song } from "../types.js";

function buildSilentWavDataUrl(durationMs: number) {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = numSamples * channels * bytesPerSample;

  const buf = Buffer.alloc(44 + dataSize);
  let o = 0;
  buf.write("RIFF", o);
  o += 4;
  buf.writeUInt32LE(36 + dataSize, o);
  o += 4;
  buf.write("WAVE", o);
  o += 4;
  buf.write("fmt ", o);
  o += 4;
  buf.writeUInt32LE(16, o);
  o += 4;
  buf.writeUInt16LE(1, o);
  o += 2;
  buf.writeUInt16LE(channels, o);
  o += 2;
  buf.writeUInt32LE(sampleRate, o);
  o += 4;
  buf.writeUInt32LE(sampleRate * channels * bytesPerSample, o);
  o += 4;
  buf.writeUInt16LE(channels * bytesPerSample, o);
  o += 2;
  buf.writeUInt16LE(bitsPerSample, o);
  o += 2;
  buf.write("data", o);
  o += 4;
  buf.writeUInt32LE(dataSize, o);
  o += 4;

  return `data:audio/wav;base64,${buf.toString("base64")}`;
}

const mockSongs: Song[] = [
  {
    id: "MOCK:1",
    title: "Mock Song A",
    artist: "Echo",
    durationSec: 5,
    coverUrl: "",
    source: "MOCK",
  },
  {
    id: "MOCK:2",
    title: "Mock Song B",
    artist: "Echo",
    durationSec: 5,
    coverUrl: "",
    source: "MOCK",
  },
  {
    id: "MOCK:3",
    title: "Mock Song C",
    artist: "Echo",
    durationSec: 5,
    coverUrl: "",
    source: "MOCK",
  },
];

const mockAudioUrl = buildSilentWavDataUrl(1200);
const mockLyric = `[00:00.00]Mock lyric\n[00:01.00]Echo Music\n`;

export class MockProvider implements MusicProvider {
  name = "MOCK";

  async search(query: string): Promise<Song[]> {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return mockSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || (s.artist || "").toLowerCase().includes(q),
    );
  }

  async getPlayUrl(id: string): Promise<string | null> {
    if (!id.startsWith("MOCK:")) return null;
    return mockAudioUrl;
  }

  async getLyric(id: string): Promise<string | null> {
    if (!id.startsWith("MOCK:")) return null;
    return mockLyric;
  }
}

