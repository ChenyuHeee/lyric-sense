import artists from '@/data/artists.json';
import jayChou from '@/data/lyrics/jay-chou.json';
import khalilFong from '@/data/lyrics/khalil-fong.json';
import stefanieSun from '@/data/lyrics/stefanie-sun.json';
import xueZhiQian from '@/data/lyrics/xuezhiqian.json';
import jjLin from '@/data/lyrics/jj-lin.json';
import leehomWang from '@/data/lyrics/leehom-wang.json';
import gemTang from '@/data/lyrics/gem-tang.json';
import easonChan from '@/data/lyrics/eason-chan.json';
import davidTao from '@/data/lyrics/david-tao.json';

export interface Song {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
  coverUrl: string | null;
  artist: string;
}

export interface Artist {
  slug: string;
  name: string;
  neteaseId: number;
  color: string;
}

const LYRICS_MAP: Record<string, Song[]> = {
  'jay-chou': jayChou as Song[],
  'khalil-fong': khalilFong as Song[],
  'stefanie-sun': stefanieSun as Song[],
  'xuezhiqian': xueZhiQian as Song[],
  'jj-lin': jjLin as Song[],
  'leehom-wang': leehomWang as Song[],
  'gem-tang': gemTang as Song[],
  'eason-chan': easonChan as Song[],
  'david-tao': davidTao as Song[],
};

export function getArtist(slug: string): Artist | undefined {
  return (artists as Artist[]).find((a) => a.slug === slug);
}

export function getArtistSongs(slug: string): Song[] {
  return LYRICS_MAP[slug] || [];
}

export function getArtists(): Artist[] {
  return artists as Artist[];
}
