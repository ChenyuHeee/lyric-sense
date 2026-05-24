import type { Song } from './data';

interface LineEntry {
  line: string;
  count: number;
  songCount: number; // how many different songs this line appears in
}

export interface WordCloudItem {
  line: string;
  size: number;
  weight: number;
  opacity: number;
  rotate: number;
}

// Heuristic: score a line for "quotability" — the best lyrics are
// complete thoughts, neither too short nor too long, and rich in content.
function lineQuality(line: string): number {
  const len = line.length;
  // Prefer lines between 5 and 14 characters (Chinese)
  if (len < 4 || len > 18) return 0;
  // Sweet spot around 7-12 chars
  const lenScore = len >= 6 && len <= 12 ? 1 : 0.6;
  // Penalize lines starting/ending with common function words
  const weakStart = /^(的|了|在|和|都|就|要|会|能|把|被|让|给|对|从|向|而|却|但|与|或|可|所|以|为|着|过|去|来|到|很|最|更|太|好|才|又|再|还|想|说|看|用|做|走|出|那|这|它|他|她|你|我|们)/.test(line);
  const weakEnd = /(的|了|在|和|都|就|要|会|能|把|被|让|给|对|从|向|而|却|但|与|或|可|所|以|为|着|过|去|来|到|很|最|更|太|好|才|又|再|还|想|说|看|用|做|走)$/.test(line);
  const structureScore = weakStart || weakEnd ? 0.5 : 1;
  return lenScore * structureScore;
}

export function extractTopLines(songs: Song[], topN: number = 50): LineEntry[] {
  const lineMap = new Map<string, { count: number; songs: Set<string> }>();

  for (const song of songs) {
    const seen = new Set<string>();
    for (const line of song.lines) {
      const trimmed = line.trim();
      if (trimmed.length < 4 || trimmed.length > 18) continue;
      if (trimmed.includes('：') || trimmed.includes(':')) continue;
      if (/^(作曲|作词|编曲|制作|演唱|监制|混音|录音|和声|吉他|钢琴)/.test(trimmed)) continue;

      const entry = lineMap.get(trimmed) || { count: 0, songs: new Set() };
      entry.count++;
      entry.songs.add(song.title);
      lineMap.set(trimmed, entry);
    }
  }

  // Score each line: frequency * quality * song diversity bonus
  const scored = [...lineMap.entries()]
    .map(([line, { count, songs }]) => ({
      line,
      count,
      songCount: songs.size,
      score: count * lineQuality(line) * (1 + songs.size * 0.3),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Remove lines that are substrings of higher-scoring lines (keep the longer one)
  const deduped: typeof scored = [];
  for (const item of scored) {
    const isDuplicate = deduped.some(
      (d) => d.line !== item.line && (d.line.includes(item.line) || item.line.includes(d.line))
    );
    if (!isDuplicate) {
      deduped.push(item);
    }
  }

  return deduped.slice(0, topN).map(({ line, count, songCount }) => ({
    line,
    count,
    songCount,
  }));
}

export function generateWordCloud(lines: LineEntry[]): WordCloudItem[] {
  if (lines.length === 0) return [];

  const maxCount = lines[0].count;
  const minCount = lines[lines.length - 1].count;

  return lines.map((w) => {
    const norm = maxCount === minCount ? 0.5 : (w.count - minCount) / (maxCount - minCount);
    return {
      line: w.line,
      size: 0.75 + norm * 1.5,
      weight: 300 + Math.round(norm * 600),
      opacity: 0.4 + norm * 0.6,
      rotate: (Math.random() - 0.5) * 15,
    };
  });
}
