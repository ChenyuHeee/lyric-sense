'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchByKeywords } from '@/lib/search';
import { getArtist, getArtistSongs, type Song } from '@/lib/data';
import artists from '@/data/artists.json';
import WordCloud from './WordCloud';
import CoverStrip from './CoverStrip';

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
  const [tagline, setTagline] = useState('');

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
    setTagline('');
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
      // Generate tagline from top 3 results
      if (API_KEY && res.length >= 2) {
        generateTagline(query.trim(), res.slice(0, 3)).then(setTagline).catch(() => {});
      } else {
        setTagline('');
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
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-60px)] max-w-4xl flex-col px-6 pt-6 animate-fade-in">
      {/* Album Cover Strip */}
      <CoverStrip slug={slug} />

      {/* Expandable area: content at top, word cloud fills remaining space */}
      <div className="relative flex flex-1 flex-col">
        {/* Ambient word cloud — fills entire available space */}
        <WordCloud slug={slug} visible={status === 'idle'} />

        {/* Stats + Switch */}
        <div className="relative z-10 mb-3 flex items-center gap-4 text-[13px] text-zinc-600">
          <span>{stats.songs} 首歌 &middot; {stats.albums} 张专辑 &middot; {stats.lines.toLocaleString()} 行歌词</span>
          <span className="text-zinc-700">|</span>
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="appearance-none bg-transparent text-[13px] text-zinc-500 outline-none cursor-pointer hover:text-amber-400 transition-colors"
          >
            {(artists as { slug: string; name: string }[]).map((a) => (
              <option key={a.slug} value={a.slug} className="bg-[#1a1815]">
                切换歌手: {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0d0c0a]/80 backdrop-blur px-5 py-4 shadow-lg transition-all focus-within:border-amber-500/30 focus-within:shadow-[0_0_40px_-10px_rgba(252,187,0,0.1)]">
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
          <div className="relative z-10 stagger">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
                <p className="text-zinc-500">没有找到匹配的歌词，换个描述试试</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <ResultCard key={i} result={r} accentColor={accentColor} />
                  ))}
                </div>
                {tagline && (
                  <div className="mt-6 rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] px-6 py-5 text-center">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/60">
                      为你生成
                    </p>
                    <p className="text-[15px] leading-relaxed italic text-amber-200/80">
                      {tagline}
                    </p>
                  </div>
                )}
                <div className="pb-8" />
              </>
            )}
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/[0.08] border-t-amber-400" />
            <p className="text-sm text-zinc-500">正在理解你的描述，匹配最合适的歌词...</p>
          </div>
        )}

        {/* Idle hint — compact, at bottom of search area */}
        {status === 'idle' && (
          <p className="relative z-10 text-center text-[13px] text-zinc-600">
            试试「暗恋一个人不敢表白」「失去后的痛苦和不舍」...
          </p>
        )}
      </div>
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
            referrerPolicy="no-referrer"
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

async function generateTagline(query: string, topResults: SearchResult[]): Promise<string> {
  const lines = topResults
    .map((r) => r.lines.slice(0, 2).join(' '))
    .join('\n');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是文案高手。根据用户的心情描述和匹配到的歌词，生成一句网感文案（20-40字）。要求：有共鸣感、适合发朋友圈/小红书、自然不做作、融合歌词意境和用户心情。只返回文案本身，不要引号不要解释。`,
        },
        {
          role: 'user',
          content: `用户心情：${query}\n\n匹配歌词：\n${lines}\n\n请生成一句网感文案：`,
        },
      ],
      temperature: 0.9,
      max_tokens: 200,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API error');
  return data.choices?.[0]?.message?.content?.trim() || '';
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
