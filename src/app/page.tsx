import Link from 'next/link';
import { getArtists, getArtistSongs, type Artist, type Song } from '@/lib/data';

export default function Home() {
  const artists = getArtists();

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-6 py-16">
      {/* Hero */}
      <div className="mb-20 text-center animate-fade-in">
        <h1 className="mb-4 font-serif text-[clamp(3rem,6vw,5rem)] font-black leading-none tracking-tight text-[#e8e4df]">
          LyricSense
        </h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-zinc-500">
          用一句话描述你的心情，<br className="hidden sm:block" />
          从华语乐坛最经典的歌词中，找到属于你的那一句
        </p>
      </div>

      {/* Artist Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {artists.map((artist) => (
          <ArtistCard key={artist.slug} artist={artist} />
        ))}
      </div>
    </main>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const songs = getArtistSongs(artist.slug);
  const stats = {
    songs: songs.length,
    lines: songs.reduce((s, song) => s + song.lines.length, 0),
    albums: new Set(songs.map((s) => s.album)).size,
  };

  // Pick 4 random covers for the collage
  const covers = songs
    .filter((s) => s.coverUrl)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((s) => s.coverUrl!);

  return (
    <Link
      href={`/${artist.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover-lift"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${artist.color}08, transparent 40%)`,
        }}
      />

      {/* Cover collage */}
      <div className="mb-5 grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
        {covers.length >= 4 ? (
          covers.map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-white/[0.03]">
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover album-cover"
                loading="lazy"
              />
            </div>
          ))
        ) : (
          <div className="col-span-2 flex aspect-[2/1] items-center justify-center rounded-xl bg-white/[0.03]">
            <span className="font-serif text-3xl font-bold text-white/[0.06]">
              {artist.name.slice(0, 1)}
            </span>
          </div>
        )}
      </div>

      {/* Artist info */}
      <div className="relative">
        <h2 className="mb-1 font-serif text-xl font-bold text-[#e8e4df] transition-colors group-hover:text-[var(--hover-color)]"
          style={{ '--hover-color': artist.color } as React.CSSProperties}>
          {artist.name}
        </h2>
        <p className="text-[13px] text-zinc-600">
          {stats.songs} 首歌 &middot; {stats.albums} 张专辑 &middot; {stats.lines.toLocaleString()} 行歌词
        </p>
      </div>
    </Link>
  );
}
