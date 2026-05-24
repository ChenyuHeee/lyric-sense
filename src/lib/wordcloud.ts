import type { Song } from './data';

// Common Chinese stop words
const STOP_WORDS = new Set([
  '我们', '他们', '她们', '自己', '什么', '怎么', '怎么样', '为什么',
  '一个', '没有', '不是', '可以', '不会', '不能', '不要', '不会',
  '只是', '还是', '就是', '已经', '因为', '所以', '但是', '然后',
  '这个', '那个', '这些', '那些', '这里', '那里', '这样', '那样',
  '真的', '知道', '看到', '觉得', '应该', '可能', '也许', '一直',
  '一定', '一切', '一起', '一样', '不过', '而且', '如果', '虽然',
  '但是', '可是', '所以', '因为', '或者', '还是', '只是', '就是',
  '了', '的', '是', '在', '我', '你', '他', '她', '它', '们',
  '着', '过', '去', '来', '到', '和', '与', '也', '都', '就',
  '要', '会', '能', '把', '被', '让', '给', '对', '从', '向',
  '那', '这', '很', '最', '更', '太', '好', '才', '又', '再',
  '还', '想', '说', '看', '让', '用', '做', '走', '出', '有',
  '上', '下', '里', '外', '中', '大', '小', '多', '少', '不',
  '人', '天', '地', '心', '爱', '一', '只', '个', '些', '种',
  '让', '让', '为', '以', '可', '所', '而', '却', '并', '或',
  '及', '但', '吗', '吧', '呢', '啊', '嘛', '哦', '嗯', '呀',
  '啦', '哎', '哈', '呵', '嗨', '喂', '哟', '噢', '喔',
]);

// Chinese punctuation and common single chars
const SINGLE_SKIP = new Set([
  '一', '二', '三', '是', '的', '了', '在', '和', '也', '都',
  '就', '要', '会', '能', '不', '有', '人', '我', '你', '他',
  '她', '它', '们', '这', '那', '很', '最', '更', '太', '好',
  '才', '又', '再', '还', '想', '说', '看', '用', '做', '走',
  '出', '上', '下', '里', '外', '中', '大', '小', '多', '少',
  '把', '被', '让', '给', '对', '从', '向', '而', '却', '但',
  '与', '或', '可', '所', '以', '为', '着', '过', '去', '来',
]);

interface WordEntry {
  word: string;
  count: number;
}

export function extractTopWords(songs: Song[], topN: number = 60): WordEntry[] {
  const freq = new Map<string, number>();

  for (const song of songs) {
    for (const line of song.lines) {
      // Extract bigrams (2-char words) from Chinese text
      for (let i = 0; i < line.length - 1; i++) {
        const bigram = line.slice(i, i + 2);
        // Keep only Chinese characters
        if (/^[一-鿿]{2}$/.test(bigram) && !STOP_WORDS.has(bigram)) {
          freq.set(bigram, (freq.get(bigram) || 0) + 1);
        }
      }

      // Also extract 3-char and 4-char words from the text
      for (let i = 0; i < line.length - 2; i++) {
        const trigram = line.slice(i, i + 3);
        if (/^[一-鿿]{3}$/.test(trigram) && !STOP_WORDS.has(trigram)) {
          freq.set(trigram, (freq.get(trigram) || 0) + 1);
        }
      }
    }
  }

  // Sort by frequency, take top N
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export interface WordCloudItem extends WordEntry {
  size: number;   // font size in rem
  weight: number; // font weight (300-900)
  opacity: number; // 0.3-1.0
  rotate: number; // rotation in degrees
  x: number;      // random horizontal offset percent
  y: number;      // random vertical offset percent
}

export function generateWordCloud(words: WordEntry[]): WordCloudItem[] {
  if (words.length === 0) return [];

  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;

  return words.map((w) => {
    // Normalize: 0 to 1
    const norm = maxCount === minCount ? 0.5 : (w.count - minCount) / (maxCount - minCount);

    return {
      ...w,
      size: 0.7 + norm * 2.0,        // 0.7rem to 2.7rem
      weight: 300 + Math.round(norm * 600), // 300 to 900
      opacity: 0.35 + norm * 0.65,   // 0.35 to 1.0
      rotate: (Math.random() - 0.5) * 20, // -10 to +10 degrees
      x: Math.random() * 100,
      y: Math.random() * 100,
    };
  });
}
