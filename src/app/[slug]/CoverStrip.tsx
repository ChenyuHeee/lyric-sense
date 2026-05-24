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
      if (unique.length >= 14) break;
    }
    return unique;
  }, [slug]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScroll, { passive: true });
      // Initial check: if content doesn't overflow, no fade needed
      setAtEnd(el.scrollWidth <= el.clientWidth);
    }
    return () => { if (el) el.removeEventListener('scroll', updateScroll); };
  }, []);

  if (covers.length === 0) return null;

  const tilt = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return (hash % 8) - 4;
  };

  const SIZE = 100;

  return (
    <div className="relative mb-12 -mx-6">
      {/* Scrollable strip — generous vertical padding for rotated covers */}
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto overflow-y-visible scrollbar-none px-6 py-6"
        style={{ scrollBehavior: 'smooth', scrollSnapType: 'x proximity' }}
      >
        {/* Leading spacer for visual breathing room */}
        <div className="flex-shrink-0" style={{ width: '4px' }} />

        {covers.map((cover, i) => (
          <div
            key={cover.album}
            className="group relative flex-shrink-0 cursor-pointer transition-all duration-500 ease-out"
            style={{
              width: `${SIZE}px`,
              height: `${SIZE}px`,
              transform: `rotate(${tilt(cover.album)}deg)`,
              zIndex: 1,
              marginLeft: i > 0 ? '-12px' : '0',
              filter: 'brightness(0.88) saturate(0.92)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'rotate(0deg) scale(1.18)';
              el.style.filter = 'brightness(1.08) saturate(1.08)';
              el.style.zIndex = '50';
              el.style.marginLeft = i > 0 ? '-2px' : '0';
              el.style.marginRight = '12px';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = `rotate(${tilt(cover.album)}deg)`;
              el.style.filter = 'brightness(0.88) saturate(0.92)';
              el.style.zIndex = '1';
              el.style.marginLeft = i > 0 ? '-12px' : '0';
              el.style.marginRight = '0';
            }}
          >
            <img
              src={cover.url}
              alt={cover.album}
              className="h-full w-full rounded-lg object-cover shadow-xl transition-shadow duration-500 group-hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)]"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
              }}
            />
          </div>
        ))}

        {/* Trailing spacer */}
        <div className="flex-shrink-0" style={{ width: '4px' }} />
      </div>

      {/* Subtle edge fades — only when scrolled away from that edge */}
      {!atStart && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-20"
          style={{ width: '40px', background: 'linear-gradient(to right, #0d0c0a 0%, #0d0c0a 20%, transparent 100%)' }}
        />
      )}
      {!atEnd && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-20"
          style={{ width: '40px', background: 'linear-gradient(to left, #0d0c0a 0%, #0d0c0a 20%, transparent 100%)' }}
        />
      )}

      {/* Ambient warmth behind covers */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(212,168,83,0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
