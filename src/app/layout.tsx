import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LyricSense - 周杰伦歌词语义搜索',
  description: '用一句话描述你的心情，找到最契合的周杰伦歌词',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full bg-zinc-950">
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased" style={{ background: '#09090b', color: '#f4f4f5' }}>{children}</body>
    </html>
  );
}
