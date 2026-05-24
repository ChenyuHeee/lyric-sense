'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';
import { extractTopLines, generateWordCloud } from '@/lib/wordcloud';

export default function WordCloud({ slug, visible }: { slug: string; visible: boolean }) {
  const lines = useMemo(() => {
    const songs = getArtistSongs(slug);
    const top = extractTopLines(songs, 28);
    return generateWordCloud(top);
  }, [slug]);

  if (!visible) return null;
  if (lines.length === 0) return null;

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes floatCloud {
          0%, 100% { margin-top: 0; }
          30% { margin-top: -4px; }
          70% { margin-top: 3px; }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
        style={{ minHeight: '500px' }}
      >
        {lines.map((item, i) => {
          const alpha = (item.opacity * 0.22).toFixed(2);
          const weight = item.tier === 0 ? 500 : item.tier === 1 ? 400 : 300;
          const baseColor = item.tier === 0 ? '212,168,83' : item.tier === 1 ? '180,160,130' : '130,120,105';
          return (
            <span
              key={i}
              className="absolute left-0 top-0 whitespace-nowrap leading-relaxed transition-all duration-1000"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${item.size}rem`,
                fontWeight: weight,
                color: `rgba(${baseColor},${alpha})`,
                transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                animation: `floatCloud ${item.duration}s ease-in-out infinite`,
                animationDelay: `${item.delay}s`,
              }}
            >
              {item.line}
            </span>
          );
        })}
      </div>
    </>
  );
}
