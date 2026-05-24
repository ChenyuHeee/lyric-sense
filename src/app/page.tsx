'use client';

import { useState, useCallback, useEffect } from 'react';
import { searchByKeywords } from '@/lib/search';
import artists from '@/data/artists.json';
import jayChouLyrics from '@/data/lyrics/jay-chou.json';
import khalilFongLyrics from '@/data/lyrics/khalil-fong.json';
import stefanieSunLyrics from '@/data/lyrics/stefanie-sun.json';
import xueZhiQianLyrics from '@/data/lyrics/xuezhiqian.json';
import jjLinLyrics from '@/data/lyrics/jj-lin.json';
import leehomWangLyrics from '@/data/lyrics/leehom-wang.json';
import gemTangLyrics from '@/data/lyrics/gem-tang.json';
import easonChanLyrics from '@/data/lyrics/eason-chan.json';
import davidTaoLyrics from '@/data/lyrics/david-tao.json';

const LYRICS_MAP: Record<string, Song[]> = {
  'jay-chou': jayChouLyrics as Song[],
  'khalil-fong': khalilFongLyrics as Song[],
  'stefanie-sun': stefanieSunLyrics as Song[],
  'xuezhiqian': xueZhiQianLyrics as Song[],
  'jj-lin': jjLinLyrics as Song[],
  'leehom-wang': leehomWangLyrics as Song[],
  'gem-tang': gemTangLyrics as Song[],
  'eason-chan': easonChanLyrics as Song[],
  'david-tao': davidTaoLyrics as Song[],
};

interface Artist {
  slug: string;
  name: string;
  color: string;
}

interface Song {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
  coverUrl: string | null;
  artist: string;
}

interface SearchResult {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
  coverUrl: string | null;
  mode: 'semantic' | 'keyword';
  reason?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || 'deepseek-v4-pro';

export default function Home() {
  const [artist, setArtist] = useState<Artist>(artists[0]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [accentColor, setAccentColor] = useState(artists[0].color);

  const songs = LYRICS_MAP[artist.slug] || [];
  const hasData = songs.length > 0;

  const search = useCallback(async () => {
    if (!query.trim() || !hasData) return;
    setStatus('loading');
    setError('');
    try {
      let res: SearchResult[];
      if (API_KEY) {
        res = await semanticSearch(query.trim(), songs);
      } else {
        res = searchByKeywords(query.trim(), songs).map((r) => ({
          ...r,
          coverUrl: songs.find((s) => s.title === r.title)?.coverUrl || null,
        }));
      }
      setResults(res);
      setStatus('done');
      if (res.length > 0 && res[0].coverUrl) {
        extractColor(res[0].coverUrl).then(setAccentColor);
      }
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [query, songs, hasData]);

  // Reset results when switching artists
  useEffect(() => {
    setResults([]);
    setStatus('idle');
    setAccentColor(artist.color);
  }, [artist]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  const availableArtists = artists.filter((a) => LYRICS_MAP[a.slug]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed Nav */}
      <header className="fixed top-0 z-50 w-full bg-black">
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-0">
          <span className="text-lg font-bold tracking-tight text-white">LyricSense</span>
          <div className="flex items-center">
            {artists.map((a) => {
              const available = !!LYRICS_MAP[a.slug];
              return (
                <button
                  key={a.slug}
                  onClick={() => setArtist(a)}
                  disabled={!available}
                  className={`px-3 py-3.5 text-[13px] transition-colors ${
                    artist.slug === a.slug
                      ? 'text-white'
                      : available
                        ? 'text-zinc-500 hover:text-white'
                        : 'text-zinc-700 cursor-not-allowed'
                  }`}
                >
                  {a.name}
                  {!available && (
                    <span className="ml-0.5 text-[10px] text-zinc-600">即将</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-12">
        <div className="w-full max-w-[640px] text-center">
          {status === 'idle' && (
            <div className="mb-10">
              <h1 className="text-[42px] font-bold tracking-tight text-black">
                {artist.name}
              </h1>
              <p className="mt-2 text-[15px] text-zinc-400">
                {hasData
                  ? '用一句话描述你的心情，找到最契合的歌词'
                  : `${artist.name}的歌词正在收录中，敬请期待`}
              </p>
            </div>
          )}

          {hasData && (
            <div className={status !== 'idle' ? 'mb-8' : ''}>
              <div className="flex items-center rounded-full border border-zinc-300 bg-white px-5 py-3 shadow-sm transition-shadow focus-within:border-zinc-400 focus-within:shadow-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的心情、场景或感受..."
                  className="flex-1 bg-transparent text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={search}
                  disabled={status === 'loading' || !query.trim()}
                  className="ml-3 rounded-full bg-black px-5 py-1.5 text-[13px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 transition-all"
                >
                  {status === 'loading' ? '搜索中...' : '搜索'}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div className="w-full">
              <h2 className="mb-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {results.length > 0
                  ? `${artist.name} · ${results.length} 个匹配`
                  : '没有找到匹配'}
              </h2>
              {results.length === 0 ? (
                <p className="py-10 text-center text-zinc-400">换个描述试试</p>
              ) : (
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <ResultCard key={i} result={r} accentColor={accentColor} />
                  ))}
                </div>
              )}
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
              <p className="text-sm text-zinc-400">正在理解你的描述，匹配最合适的歌词...</p>
            </div>
          )}

          {status === 'idle' && hasData && (
            <p className="mt-6 text-[13px] text-zinc-400">
              试试「暗恋一个人不敢表白」「失去后的痛苦和不舍」...
            </p>
          )}
        </div>
      </div>

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400">
          Lyrics from NetEase · Covers from Apple Music
        </p>
      </footer>
    </div>
  );
}

function ResultCard({ result, accentColor }: { result: SearchResult; accentColor: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md text-left">
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200">
        {result.coverUrl && !imgError ? (
          <img
            src={result.coverUrl}
            alt={result.album}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white"
            style={{ background: accentColor }}
          >
            {result.album.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex items-baseline gap-2">
          <h3 className="text-[15px] font-semibold text-zinc-900">{result.title}</h3>
          <span className="text-[12px] text-zinc-400">{result.album}</span>
          {result.mode === 'semantic' && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ background: accentColor }}
            >
              意境
            </span>
          )}
        </div>
        {result.reason && (
          <p className="mb-1.5 text-[13px] italic text-zinc-400">{result.reason}</p>
        )}
        <div className="space-y-0.5">
          {result.lines.slice(0, 3).map((line, j) => (
            <p key={j} className="text-[14px] leading-relaxed text-zinc-700">
              {line}
            </p>
          ))}
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-[12px] text-zinc-400 hover:text-zinc-600">
            展开全部歌词
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-500">
            {result.fullText}
          </pre>
        </details>
      </div>
    </div>
  );
}

async function semanticSearch(query: string, songs: Song[]): Promise<SearchResult[]> {
  const candidates = searchByKeywords(query, songs, 20);
  const pool = candidates.length > 0 ? candidates : songs.slice(0, 20);

  const catalog = pool
    .map(
      (s, i) =>
        `[${i}]《${s.title}》(${s.album})\n${s.lines.slice(0, 15).join('\n')}`
    )
    .join('\n\n');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是歌词意境匹配助手。从候选歌词中选出意境最契合的5首。深入理解情感内核，在意境层面匹配。返回JSON: [{"index":序号,"reason":"一句话解释"}]，只返回JSON数组。`,
        },
        { role: 'user', content: `描述：${query}\n\n候选歌词：\n${catalog}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `API error: ${res.status}`);

  const content = data.choices?.[0]?.message?.content || '';
  const jsonStr = content.replace(/```json\s*|```\s*/g, '').trim();
  const matches = JSON.parse(jsonStr);

  return matches.map((m: any) => {
    const song = pool[m.index] as Song | undefined;
    return {
      title: song?.title || '未知',
      album: song?.album || '',
      lines: song?.lines || [],
      fullText: song?.fullText || '',
      coverUrl: song?.coverUrl || null,
      mode: 'semantic' as const,
      reason: m.reason || '',
    };
  });
}

function extractColor(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        resolve(`rgb(${Math.floor(r * 0.7)},${Math.floor(g * 0.7)},${Math.floor(b * 0.7)})`);
      }
    };
    img.onerror = () => resolve('#d4a853');
    img.src = url;
  });
}
