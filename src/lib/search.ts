interface Song {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
}

export interface SearchResult {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
  mode: 'semantic' | 'keyword';
  score: number;
}

// Tokenize Chinese text for keyword matching
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const segments = text.split(/[,，、。！？\s.!?\n]+/).filter(Boolean);

  for (const seg of segments) {
    if (seg.length <= 2) {
      tokens.push(seg);
    } else {
      tokens.push(seg);
      for (let i = 0; i < seg.length - 1; i++) {
        const bigram = seg.slice(i, i + 2);
        if (/^[一-鿿]{2}$/.test(bigram)) {
          tokens.push(bigram);
        }
      }
      for (const char of seg) {
        if (/[一-鿿]/.test(char)) {
          tokens.push(char);
        }
      }
    }
  }

  return [...new Set(tokens)];
}

function keywordScore(query: string, song: Song): { score: number; matchedLines: string[] } {
  const keywords = tokenize(query);
  if (keywords.length === 0) return { score: 0, matchedLines: [] };

  const matchedLines: { line: string; score: number }[] = [];

  for (const line of song.lines) {
    let score = 0;
    let matches = 0;
    for (const kw of keywords) {
      if (line.includes(kw)) {
        score += kw.length;
        matches++;
      }
    }
    if (matches > 0) {
      const ratio = matches / keywords.length;
      matchedLines.push({ line, score: score * ratio });
    }
  }

  matchedLines.sort((a, b) => b.score - a.score);

  const totalScore = matchedLines.reduce((s, m) => s + m.score, 0);
  const topLines = matchedLines.slice(0, 5).map((m) => m.line);

  return { score: totalScore, matchedLines: topLines };
}

export function searchByKeywords(query: string, songs: Song[], topK: number = 5): SearchResult[] {
  const results = songs.map((song) => {
    const { score, matchedLines } = keywordScore(query, song);
    return {
      title: song.title,
      album: song.album,
      lines: matchedLines,
      fullText: song.fullText,
      mode: 'keyword' as const,
      score,
    };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
