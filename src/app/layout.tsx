import type { Metadata } from 'next';
import './globals.css';
import NavBar from './NavBar';

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
        <NavBar />

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
