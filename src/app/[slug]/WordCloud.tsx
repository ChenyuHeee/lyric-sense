'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';
import { extractTopLines, generateWordCloud } from '@/lib/wordcloud';

export default function WordCloud({ slug, visible }: { slug: string; visible: boolean }) {
  const lines = useMemo(() => {
    const songs = getArtistSongs(slug);
    const top = extractTopLines(songs, 36);
    return generateWordCloud(top);
  }, [slug]);

  if (!visible) return null;
  if (lines.length === 0) return null;

  // Color tiers — warm spectrum from bright gold to muted amber
  const tierColors = [
    ['#f5d78c', '#e8c56d', '#d4a853'], // tier 0: bright gold
    ['#c9a86b', '#b8965c', '#a6844d'], // tier 1: warm amber
    ['#8a7050', '#7a6344', '#6b5638'], // tier 2: muted bronze
  ];

  const getColor = (tier: number) => {
    const palette = tierColors[tier] || tierColors[2];
    return palette[Math.floor(Math.random() * palette.length)];
  };

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent">
      {/* Subtle radial glow in center */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[80%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212,168,83,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Label */}
      <p className="relative z-10 px-6 pt-8 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
        经典歌词
      </p>

      {/* Cloud container */}
      <div
        className="relative w-full"
        style={{ paddingBottom: '85%' }}
      >
        {lines.map((item, i) => {
          const color = getColor(item.tier);
          return (
            <span
              key={i}
              className="absolute cursor-default select-none whitespace-nowrap transition-all duration-500 ease-out"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: `${item.size}rem`,
                fontWeight: item.weight,
                opacity: item.opacity * 0.85,
                transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                color,
                textShadow: item.tier === 0
                  ? '0 0 20px rgba(212,168,83,0.3), 0 0 40px rgba(212,168,83,0.1)'
                  : item.tier === 1
                    ? '0 0 12px rgba(180,140,80,0.2)'
                    : 'none',
                animation: `floatCloud ${item.duration}s ease-in-out infinite`,
                animationDelay: `${item.delay}s`,
                transition: 'opacity 0.5s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), color 0.4s ease, text-shadow 0.4s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.opacity = '1';
                el.style.transform = `translate(-50%, -50%) rotate(${item.rotate}deg) scale(1.15)`;
                el.style.color = '#f5d78c';
                el.style.textShadow = '0 0 30px rgba(245,215,140,0.6), 0 0 60px rgba(212,168,83,0.3), 0 0 100px rgba(212,168,83,0.15)';
                el.style.zIndex = '20';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.opacity = `${item.opacity * 0.85}`;
                el.style.transform = `translate(-50%, -50%) rotate(${item.rotate}deg) scale(1)`;
                el.style.color = color;
                el.style.textShadow = item.tier === 0
                  ? '0 0 20px rgba(212,168,83,0.3), 0 0 40px rgba(212,168,83,0.1)'
                  : item.tier === 1
                    ? '0 0 12px rgba(180,140,80,0.2)'
                    : 'none';
                el.style.zIndex = '1';
              }}
            >
              {item.line}
            </span>
          );
        })}
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0c0a]/90 to-transparent" />

      <style jsx>{`
        @keyframes floatCloud {
          0%, 100% {
            margin-top: 0;
          }
          25% {
            margin-top: -6px;
          }
          75% {
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
