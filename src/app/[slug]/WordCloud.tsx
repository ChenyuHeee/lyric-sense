'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';
import { extractTopLines, generateWordCloud } from '@/lib/wordcloud';

export default function WordCloud({ slug, visible }: { slug: string; visible: boolean }) {
  const lines = useMemo(() => {
    const songs = getArtistSongs(slug);
    const top = extractTopLines(songs, 40);
    return generateWordCloud(top);
  }, [slug]);

  if (!visible) return null;

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] px-8 py-10">
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
        热门歌词
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        {lines.map((item, i) => (
          <span
            key={i}
            className="inline-block cursor-default select-none leading-relaxed transition-all duration-300 hover:scale-110 hover:text-amber-300"
            style={{
              fontSize: `${item.size}rem`,
              fontWeight: item.weight,
              opacity: item.opacity,
              transform: `rotate(${item.rotate}deg)`,
              color: item.weight > 700 ? '#e8e4df' : item.weight > 500 ? '#b0aca5' : '#6b6560',
            }}
          >
            {item.line}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0d0c0a]/80 to-transparent" />
    </div>
  );
}
