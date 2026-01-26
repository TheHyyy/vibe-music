export interface LrcLine {
  time: number;
  text: string;
}

export function parseLrc(lrc: string): LrcLine[] {
  if (!lrc) return [];
  
  const lines = lrc.split("\n");
  const result: LrcLine[] = [];
  
  // Regex to match [mm:ss.xx]
  const timeExp = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/;
  
  for (const line of lines) {
    const match = timeExp.exec(line);
    if (!match) continue;
    
    // Parse time
    const min = parseInt(match[1]);
    const sec = parseInt(match[2]);
    const msStr = match[3] ? match[3].substring(1) : "0";
    const ms = parseInt(msStr.padEnd(3, "0").substring(0, 3)); // Normalize to ms
    
    const time = min * 60 + sec + ms / 1000;
    const text = line.replace(timeExp, "").trim();
    
    if (text) {
      result.push({ time, text });
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}

// Find current active line index
export function findCurrentLineIndex(lines: LrcLine[], currentTime: number): number {
  if (lines.length === 0) return -1;
  // Find the last line that starts before current time
  // Using binary search or simple loop. Simple loop is fine for < 100 lines.
  let index = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}
