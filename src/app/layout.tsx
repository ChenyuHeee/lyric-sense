import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import artists from '@/data/artists.json';

export const metadata: Metadata = {
  title: 'LyricSense — 歌词语义搜索',
  description: '用一句话描述你的心情，找到最契合的歌词',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full font-sans text-[#e8e4df] antialiased" style={{ background: '#0d0c0a' }}>
        {/* Grain texture */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMjU2IDI1NicgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC45JyBudW1PY3RhdmVzPSc0JyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI24pJy8+PC9zdmc+')]"></div>
        </div>

        {/* Top Nav */}
        <header className="relative z-40 border-b border-white/[0.06]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#e8e4df] transition-colors group-hover:text-amber-400">
                LyricSense
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {artists.map((a) => (
                <Link
                  key={a.slug}
                  href={`/${a.slug}`}
                  className="rounded-full px-3 py-1.5 text-[13px] text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-zinc-300"
                >
                  {a.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center">
          <p className="text-xs text-zinc-600">
            Lyrics from NetEase Cloud Music &middot; Covers from NetEase
          </p>
        </footer>
      </body>
    </html>
  );
}
