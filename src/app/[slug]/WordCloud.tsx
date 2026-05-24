'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';
import { extractTopWords, generateWordCloud } from '@/lib/wordcloud';

export default function WordCloud({ slug, visible }: { slug: string; visible: boolean }) {
  const words = useMemo(() => {
    const songs = getArtistSongs(slug);
    const top = extractTopWords(songs, 50);
    return generateWordCloud(top);
  }, [slug]);

  if (!visible) return null;

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-10">
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
        热门歌词词云
      </p>
      <div
        className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        style={{ minHeight: words.length > 0 ? 'auto' : '120px' }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            className="inline-block cursor-default select-none transition-all duration-500 hover:scale-110 hover:text-amber-400"
            style={{
              fontSize: `${w.size}rem`,
              fontWeight: w.weight,
              opacity: w.opacity,
              transform: `rotate(${w.rotate}deg)`,
              color: w.weight > 700 ? '#e8e4df' : w.weight > 500 ? '#b0aca5' : '#6b6560',
              lineHeight: 1.3,
              transition: 'transform 0.2s ease, color 0.2s ease',
            }}
          >
            {w.word}
          </span>
        ))}
      </div>
      {/* Subtle gradient fade at edges */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0d0c0a]/80 to-transparent" />
    </div>
  );
}
