'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { getArtistSongs } from '@/lib/data';

export default function CoverStrip({ slug }: { slug: string }) {
  const covers = useMemo(() => {
    const songs = getArtistSongs(slug);
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', updateScroll, { passive: true });
    return () => { if (el) el.removeEventListener('scroll', updateScroll); };
  }, []);

  if (covers.length === 0) return null;

  const tilt = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return (hash % 10) - 5;
  };

  const COVER_SIZE = 110;

  return (
    <div className="relative mb-12">
      {/* Left fade */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16 bg-gradient-to-r from-[#0d0c0a] to-transparent" />
      )}

      {/* Right fade */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 bg-gradient-to-l from-[#0d0c0a] to-transparent" />
      )}

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="flex items-end gap-0 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {covers.map((cover, i) => (
          <div
            key={cover.album}
            className="group relative flex-shrink-0 cursor-pointer transition-all duration-500 ease-out"
            style={{
              width: `${COVER_SIZE}px`,
              height: `${COVER_SIZE}px`,
              transform: `rotate(${tilt(cover.album)}deg)`,
              zIndex: 1,
              marginLeft: i > 0 ? '-14px' : '0',
              filter: 'brightness(0.85) saturate(0.9)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'rotate(0deg) scale(1.15)';
              el.style.filter = 'brightness(1.1) saturate(1.1)';
              el.style.zIndex = '50';
              el.style.marginLeft = i > 0 ? '-4px' : '0';
              el.style.marginRight = '14px';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = `rotate(${tilt(cover.album)}deg)`;
              el.style.filter = 'brightness(0.85) saturate(0.9)';
              el.style.zIndex = '1';
              el.style.marginLeft = i > 0 ? '-14px' : '0';
              el.style.marginRight = '0';
            }}
          >
            <img
              src={cover.url}
              alt={cover.album}
              className="h-full w-full rounded-lg object-cover shadow-2xl transition-shadow duration-500 group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom gradient fade to page bg */}
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-20"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, #0d0c0a 65%)' }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -inset-x-10 -top-6 -bottom-6 opacity-25"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 45%, rgba(212,168,83,0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
