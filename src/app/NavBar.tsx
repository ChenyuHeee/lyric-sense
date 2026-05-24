'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getArtist } from '@/lib/data';

export default function NavBar() {
  const pathname = usePathname();
  const slug = pathname.split('/')[1]; // /jay-chou -> jay-chou
  const artist = slug ? getArtist(slug) : null;

  return (
    <header className="relative z-40 border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-serif text-lg font-bold tracking-tight">
            <span className="text-amber-400 transition-colors">Lyric</span>
            <span className="text-[#c9b88c] transition-colors">Sense</span>
          </span>
          {artist && (
            <>
              <span className="text-zinc-700">/</span>
              <span className="font-serif text-lg font-bold text-amber-400">
                {artist.name}
              </span>
            </>
          )}
        </Link>
        {!artist && (
          <span className="text-[13px] text-zinc-500">华语歌词语义搜索</span>
        )}
      </div>
    </header>
  );
}
