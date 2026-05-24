'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchByKeywords } from '@/lib/search';
import { getArtist, getArtistSongs, type Song } from '@/lib/data';
import artists from '@/data/artists.json';
import WordCloud from './WordCloud';

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

export default function ArtistSearch({ slug }: { slug: string }) {
  const artist = getArtist(slug);
  const songs = getArtistSongs(slug);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [accentColor, setAccentColor] = useState(artist?.color || '#d4a853');
  const [selectedArtist, setSelectedArtist] = useState(slug);

  useEffect(() => {
    if (!artist) router.push('/');
  }, [artist, router]);

  useEffect(() => {
    if (selectedArtist !== slug) {
      router.push(`/${selectedArtist}`);
    }
  }, [selectedArtist, slug, router]);

  const search = useCallback(async () => {
    if (!query.trim() || songs.length === 0) return;
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
  }, [query, songs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  if (!artist) return null;

  const stats = {
    songs: songs.length,
    albums: new Set(songs.map((s) => s.album)).size,
    lines: songs.reduce((a, s) => a + s.lines.length, 0),
  };

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-zinc-600 transition-colors hover:text-zinc-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        全部歌手
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-3">
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="appearance-none bg-transparent font-serif text-3xl font-black text-[#e8e4df] outline-none cursor-pointer hover:text-amber-400 transition-colors"
            >
              {(artists as { slug: string; name: string }[]).map((a) => (
                <option key={a.slug} value={a.slug} className="bg-[#1a1815] text-base">
                  {a.name}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-[13px] text-zinc-600">
            {stats.songs} 首歌 &middot; {stats.albums} 张专辑 &middot; {stats.lines.toLocaleString()} 行歌词
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-500">
          用一句话描述你的心情，从 {artist.name} 的歌词中找到意境最契合的那一句
        </p>
      </div>

      {/* Search */}
      <div className="mb-10">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 shadow-lg transition-all focus-within:border-amber-500/30 focus-within:shadow-[0_0_40px_-10px_rgba(252,187,0,0.1)]">
          <svg className="h-5 w-5 flex-shrink-0 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的心情、场景或感受..."
            className="flex-1 bg-transparent text-[15px] text-[#e8e4df] placeholder:text-zinc-600 focus:outline-none"
            autoFocus
          />
          <button
            onClick={search}
            disabled={status === 'loading' || !query.trim()}
            className="rounded-xl px-5 py-2 text-[13px] font-semibold transition-all disabled:opacity-30"
            style={{
              background: status === 'loading' ? 'transparent' : accentColor,
              color: status === 'loading' ? accentColor : '#0d0c0a',
              border: status === 'loading' ? `1px solid ${accentColor}30` : '1px solid transparent',
            }}
          >
            {status === 'loading' ? '匹配中...' : '搜索'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400/80">{error}</p>}
      </div>

      {/* Results */}
      {status === 'done' && (
        <div className="stagger">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
              <p className="text-zinc-500">没有找到匹配的歌词，换个描述试试</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <ResultCard key={i} result={r} accentColor={accentColor} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/[0.08] border-t-amber-400" />
          <p className="text-sm text-zinc-500">正在理解你的描述，匹配最合适的歌词...</p>
        </div>
      )}

      {/* Word Cloud */}
      <WordCloud slug={slug} visible={status === 'idle'} />

      {/* Empty */}
      {status === 'idle' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
          <p className="text-sm text-zinc-600">
            试试「暗恋一个人不敢表白」「失去后的痛苦和不舍」...
          </p>
        </div>
      )}
    </main>
  );
}

function ResultCard({ result, accentColor }: { result: SearchResult; accentColor: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]">
      <div className="h-[80px] w-[80px] flex-shrink-0 overflow-hidden rounded-lg">
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
            className="flex h-full w-full items-center justify-center text-[11px] font-semibold"
            style={{ background: accentColor, color: '#0d0c0a' }}
          >
            {result.album.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-serif text-[15px] font-bold text-[#e8e4df]">{result.title}</h3>
          <span className="text-[12px] text-zinc-500">{result.album}</span>
          {result.mode === 'semantic' && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              意境匹配
            </span>
          )}
        </div>
        {result.reason && (
          <p className="mb-2 text-[13px] italic leading-relaxed text-zinc-500">{result.reason}</p>
        )}
        <div className="space-y-1">
          {result.lines.slice(0, 3).map((line, j) => (
            <p key={j} className="text-[14px] leading-relaxed text-zinc-400">{line}</p>
          ))}
        </div>
        {result.lines.length > 3 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[12px] text-zinc-600 transition-colors hover:text-zinc-400">
              展开全部歌词
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-500">
              {result.fullText}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

async function semanticSearch(query: string, songs: Song[]): Promise<SearchResult[]> {
  const candidates = searchByKeywords(query, songs, 20);
  const pool = candidates.length > 0 ? candidates : songs.slice(0, 20);

  const catalog = pool
    .map(
      (s: any, i: number) =>
        `[${i}]《${s.title}》(${s.album})\n${s.lines.slice(0, 15).join('\n')}`
    )
    .join('\n\n');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
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
