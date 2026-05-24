'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';
import { extractTopLines, generateWordCloud } from '@/lib/wordcloud';

export default function WordCloud({ slug, visible }: { slug: string; visible: boolean }) {
  const lines = useMemo(() => {
    const songs = getArtistSongs(slug);
    const top = extractTopLines(songs, 30);
    return generateWordCloud(top);
  }, [slug]);

  if (!visible) return null;
  if (lines.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes floatCloud {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
          80% { transform: translateY(2px); }
        }
        @keyframes floatCloudSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <div
        className="pointer-events-auto absolute inset-0 z-0 flex select-none flex-wrap items-center justify-center content-center gap-x-5 gap-y-3 overflow-hidden px-4"
      >
        {lines.map((item, i) => {
          const alpha = (item.opacity * 0.18).toFixed(2);
          const baseColor = item.tier === 0 ? '212,168,83' : item.tier === 1 ? '185,160,130' : '140,125,105';
          return (
            <span
              key={i}
              className="inline-block cursor-default whitespace-nowrap leading-relaxed transition-all duration-500 ease-out"
              style={{
                fontSize: `${item.size}rem`,
                fontWeight: item.weight,
                color: `rgba(${baseColor},${alpha})`,
                transform: `rotate(${item.rotate}deg)`,
                animation: `${i % 2 === 0 ? 'floatCloud' : 'floatCloudSlow'} ${item.duration}s ease-in-out infinite`,
                animationDelay: `${item.delay}s`,
                filter: 'blur(0px)',
                transitionProperty: 'color, transform, filter, text-shadow, opacity',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.color = 'rgba(245,215,140,0.95)';
                el.style.transform = `rotate(0deg) scale(1.18)`;
                el.style.textShadow = '0 0 24px rgba(245,215,140,0.5), 0 0 48px rgba(212,168,83,0.25)';
                el.style.filter = 'blur(0px)';
                el.style.zIndex = '50';
                el.style.position = 'relative';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.color = `rgba(${baseColor},${alpha})`;
                el.style.transform = `rotate(${item.rotate}deg)`;
                el.style.textShadow = 'none';
                el.style.filter = 'blur(0px)';
                el.style.zIndex = '';
                el.style.position = '';
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
