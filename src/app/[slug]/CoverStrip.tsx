'use client';

import { useMemo } from 'react';
import { getArtistSongs } from '@/lib/data';

export default function CoverStrip({ slug }: { slug: string }) {
  const covers = useMemo(() => {
    const songs = getArtistSongs(slug);
    // Pick unique album covers, prefer those that actually have URL
    const seen = new Set<string>();
    const unique: { url: string; album: string }[] = [];
    for (const s of songs) {
      if (!s.coverUrl || seen.has(s.album)) continue;
      seen.add(s.album);
      unique.push({ url: s.coverUrl, album: s.album });
      if (unique.length >= 12) break;
    }
    return unique;
  }, [slug]);

  if (covers.length === 0) return null;

  // Random slight tilts for organic feel — stable per cover (derived from string)
  const tilt = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return (hash % 10) - 5; // -5 to +5 degrees
  };

  return (
    <div className="relative mb-12 overflow-hidden">
      {/* Cover strip */}
      <div className="flex items-end justify-center gap-1">
        {covers.map((cover, i) => (
          <div
            key={cover.album}
            className="group relative flex-shrink-0 cursor-pointer transition-all duration-500 ease-out"
            style={{
              width: i === 0 ? '140px' : i === 1 ? '120px' : '100px',
              height: i === 0 ? '140px' : i === 1 ? '120px' : '100px',
              transform: `rotate(${tilt(cover.album)}deg)`,
              zIndex: covers.length - i,
              marginLeft: i > 0 ? '-18px' : '0',
              filter: i < 3
                ? 'brightness(1) saturate(1)'
                : i < 6
                  ? 'brightness(0.7) saturate(0.8)'
                  : 'brightness(0.5) saturate(0.6)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = `rotate(0deg) scale(1.1)`;
              el.style.filter = 'brightness(1.1) saturate(1.1)';
              el.style.zIndex = '50';
              el.style.marginLeft = i > 0 ? '-10px' : '0';
              el.style.marginRight = '12px';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = `rotate(${tilt(cover.album)}deg)`;
              el.style.filter = i < 3
                ? 'brightness(1) saturate(1)'
                : i < 6
                  ? 'brightness(0.7) saturate(0.8)'
                  : 'brightness(0.5) saturate(0.6)';
              el.style.zIndex = `${covers.length - i}`;
              el.style.marginLeft = i > 0 ? '-18px' : '0';
              el.style.marginRight = '0';
            }}
          >
            <img
              src={cover.url}
              alt={cover.album}
              className="h-full w-full rounded-lg object-cover shadow-2xl transition-shadow duration-500 group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
              loading="lazy"
            />
            {/* Subtle shine on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom fade — blends covers into the dark page background */}
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-32"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #0d0c0a 70%)',
        }}
      />

      {/* Subtle ambient glow behind the covers */}
      <div
        className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-10 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,168,83,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
