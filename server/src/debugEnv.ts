export function requireEnv(name: string) {
  const v = (process.env[name] || "").trim();
  return v;
}

export function masked(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 3)}***${value.slice(-4)}`;
}
