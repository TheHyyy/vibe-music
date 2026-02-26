import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Cache for generated avatar URLs to avoid recomputing
const avatarCache = new Map<string, string>();

const ANIMALS = [
  "🐱",
  "🐶",
  "🦖",
  "👑",
  "🤡",
  "🐰",
  "🐻",
  "🦊",
  "🐼",
  "🐸",
  "🐯",
  "🦁",
  "🐵",
  "🐷",
  "🐨",
  "🦄",
  "🐙",
  "🐲",
];

const PALETTE = [
  "#1e293b",
  "#0f172a",
  "#111827",
  "#0b1220",
  "#1f2937",
  "#0b1020",
  "#111827",
];

/**
 * Generate a deterministic avatar URL based on seed string.
 * Results are cached to avoid recomputing for the same seed.
 */
export function animalAvatarUrl(seed: string): string {
  // Check cache first
  const cached = avatarCache.get(seed);
  if (cached) return cached;

  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const emoji = ANIMALS[Math.abs(h) % ANIMALS.length];
  const bg = PALETTE[Math.abs(h >>> 8) % PALETTE.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="48" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="48" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  </svg>
  `.trim();

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  // Cache the result
  avatarCache.set(seed, url);

  return url;
}
