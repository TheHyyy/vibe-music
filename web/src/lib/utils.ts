import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function animalAvatarUrl(seed: string) {
  const animals = [
    "🐱",
    "🐶",
    "🦖",
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

  const palette = [
    "#1e293b",
    "#0f172a",
    "#111827",
    "#0b1220",
    "#1f2937",
    "#0b1020",
    "#111827",
  ];

  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  const emoji = animals[Math.abs(h) % animals.length];
  const bg = palette[Math.abs(h >>> 8) % palette.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="48" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="48" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  </svg>
  `.trim();
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
