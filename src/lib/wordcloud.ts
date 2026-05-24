import type { Song } from './data';

interface LineEntry {
  line: string;
  count: number;
  songCount: number;
}

export interface WordCloudItem {
  line: string;
  size: number;
  weight: number;
  opacity: number;
  rotate: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  tier: number; // 0=top (brightest), 1=mid, 2=low (dimmest)
}

function isFillerLine(line: string): boolean {
  const chars = [...line];
  const unique = new Set(chars);
  if (unique.size === 1) return true;
  if (unique.size / chars.length < 0.3) return true;
  const fillerChars = new Set('啦哦啊呀哈嘿嗯喔哟哎噜嘟哒吧嘛滴');
  const fillerCount = chars.filter((c) => fillerChars.has(c)).length;
  if (fillerCount / chars.length > 0.3) return true;
  if (/^[啦哦啊呀哈嘿嗯喔哟哎噜嘟哒吧嘛]{2,}$/.test(line)) return true;
  if (line.length >= 4 && /^(.{1,2})\1{1,}$/.test(line)) return true;
  return false;
}

function lineQuality(line: string): number {
  const len = line.length;
  if (len < 5 || len > 18) return 0;
  if (isFillerLine(line)) return 0;
  const uniqueRatio = new Set([...line]).size / len;
  const lenScore = len >= 6 && len <= 12 ? 1.0 : len <= 5 ? 0.4 : 0.7;
  const weakStart = /^(的|了|在|和|都|就|要|会|能|把|被|让|给|对|从|向|而|却|但|与|或|可|所|以|为|着|过|去|来|到|很|最|更|太|好|才|又|再|还|想|说|看|用|做|走|出|那|这|它|他|她|你|我|们)/.test(line);
  const weakEnd = /(的|了|在|和|都|就|要|会|能|把|被|让|给|对|从|向|而|却|但|与|或|可|所|以|为|着|过|去|来|到|很|最|更|太|好|才|又|再|还|想|说|看|用|做|走)$/.test(line);
  const structureBonus = !weakStart && !weakEnd ? 1.3 : weakStart && weakEnd ? 0.3 : 0.7;
  const richnessScore = 0.5 + uniqueRatio * 0.5;
  return lenScore * structureBonus * richnessScore;
}

export function extractTopLines(songs: Song[], topN: number = 36): LineEntry[] {
  const lineMap = new Map<string, { count: number; songs: Set<string> }>();

  for (const song of songs) {
    for (const line of song.lines) {
      const trimmed = line.trim();
      if (trimmed.length < 5 || trimmed.length > 18) continue;
      if (trimmed.includes('：') || trimmed.includes(':')) continue;
      if (/^(作曲|作词|编曲|制作|演唱|监制|混音|录音|和声|吉他|钢琴|词|曲)/.test(trimmed)) continue;
      if (/纯音乐|请欣赏|音乐赏析|音乐推荐|原声带|伴奏|演奏|纯乐器|背景音乐|音效/.test(trimmed)) continue;
      if (/版权所有|翻版必究|工作室|广播电视台|文化传媒|新华社|主题歌音乐|工作团队|制作人|出品|发行|唱片|录音棚|录音室|混音师|编曲人|词曲|OP|SP|音乐集团|音乐产业|博物院|实验室|杜比|有限公司|组委会|主办|承办|协办|赞助|品牌|宣传|推广/.test(trimmed)) continue;
      if (/^[\d\s\-/.]+$/.test(trimmed)) continue;
      if (isFillerLine(trimmed)) continue;

      const entry = lineMap.get(trimmed) || { count: 0, songs: new Set() };
      entry.count++;
      entry.songs.add(song.title);
      lineMap.set(trimmed, entry);
    }
  }

  const scored = [...lineMap.entries()]
    .map(([line, { count, songs }]) => ({
      line,
      count,
      songCount: songs.size,
      score: count * lineQuality(line) * (1 + songs.size * 0.4),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const deduped: typeof scored = [];
  for (const item of scored) {
    const isSubsumed = deduped.some(
      (d) =>
        d.line !== item.line &&
        d.line.includes(item.line) &&
        d.line.length > item.line.length + 1
    );
    if (!isSubsumed) deduped.push(item);
  }

  return deduped.slice(0, topN).map(({ line, count, songCount }) => ({
    line,
    count,
    songCount,
  }));
}

// Generate positions using a spiral layout — brighter lines cluster near center,
// dimmer lines spiral outward. Creates an organic galaxy/constellation feel.
export function generateWordCloud(lines: LineEntry[]): WordCloudItem[] {
  if (lines.length === 0) return [];

  const maxCount = lines[0].count;
  const minCount = lines[lines.length - 1].count;

  // Sort by count descending — brightest first, placed near center
  const sorted = [...lines].sort((a, b) => b.count - a.count);

  // Golden angle spiral placement
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const centerX = 50;
  const centerY = 50;

  return sorted.map((w, i) => {
    const norm = maxCount === minCount ? 0.5 : (w.count - minCount) / (maxCount - minCount);
    const tier = norm > 0.6 ? 0 : norm > 0.25 ? 1 : 2;

    // Spiral: radius increases with index, higher-weight items cluster nearer center
    const radiusBase = (i / sorted.length) * 38 + (1 - norm) * 12;
    const angle = i * goldenAngle;
    // Add jitter for organic feel
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterY = (Math.random() - 0.5) * 8;

    const x = centerX + Math.cos(angle) * radiusBase + jitterX;
    const y = centerY + Math.sin(angle) * radiusBase + jitterY;

    // Clamp to container bounds (5-95%)
    const clampedX = Math.max(3, Math.min(92, x));
    const clampedY = Math.max(5, Math.min(92, y));

    return {
      line: w.line,
      size: 0.7 + norm * 1.4,
      weight: 300 + Math.round(norm * 600),
      opacity: 0.35 + norm * 0.65,
      rotate: (Math.random() - 0.5) * 18,
      x: Math.round(clampedX * 10) / 10,
      y: Math.round(clampedY * 10) / 10,
      delay: Math.random() * 0.5,
      duration: 3 + Math.random() * 4,
      tier,
    };
  });
}
