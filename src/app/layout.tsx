import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LyricSense - 歌词语义搜索',
  description: '用一句话描述你的心情，找到最契合的歌词',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#edeeef] text-zinc-800 antialiased">{children}</body>
    </html>
  );
}
