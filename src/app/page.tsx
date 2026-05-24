'use client';

import { useState, useCallback } from 'react';
import { searchByKeywords } from '@/lib/search';
import lyrics from '@/data/lyrics.json';

interface SearchResult {
  title: string;
  album: string;
  lines: string[];
  fullText: string;
  mode: 'semantic' | 'keyword';
  reason?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const songs = lyrics as { title: string; album: string; lines: string[]; fullText: string }[];

const API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || 'deepseek-v4-pro';

async function semanticSearch(query: string): Promise<SearchResult[]> {
  // Stage 1: keyword pre-filter to 20 candidates
  const candidates = searchByKeywords(query, songs, 20);
  const pool = candidates.length > 0 ? candidates : songs.slice(0, 20);

  // Stage 2: DeepSeek ranks by 意境
  const catalog = pool
    .map((s, i) => `[${i}]《${s.title}》(${s.album})\n${s.lines.slice(0, 15).join('\n')}`)
    .join('\n\n');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是周杰伦歌词意境匹配助手。用户描述一种心情或场景，你从候选歌词中选出意境最契合的5首。
规则：
1. 深入理解情感内核，在意境层面匹配
2. 选出5首最契合的，不合适就少选
3. 返回JSON: [{"index": 序号, "reason": "一句话解释意境为何契合"}]
只返回JSON数组。`,
        },
        {
          role: 'user',
          content: `用户描述：${query}\n\n候选歌词：\n${catalog}`,
        },
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

  return matches.map((m: any) => ({
    title: pool[m.index]?.title || '未知',
    album: pool[m.index]?.album || '',
    lines: pool[m.index]?.lines || [],
    fullText: pool[m.index]?.fullText || '',
    mode: 'semantic' as const,
    reason: m.reason || '',
  }));
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setStatus('loading');
    setError('');
    try {
      let res: SearchResult[];
      if (API_KEY) {
        res = await semanticSearch(query.trim());
      } else {
        res = searchByKeywords(query.trim(), songs) as SearchResult[];
      }
      setResults(res);
      setStatus('done');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-amber-400">
          LyricSense
        </h1>
        <p className="mt-3 text-zinc-400">
          用一句话描述你的心情，找到最契合的周杰伦歌词
        </p>
      </header>

      <div className="mb-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：失去一个人后的痛苦和不舍..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors"
            autoFocus
          />
          <button
            onClick={search}
            disabled={status === 'loading' || !query.trim()}
            className="rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-all"
          >
            {status === 'loading' ? '搜索中...' : '搜索'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {status === 'done' && (
        <div className="flex-1">
          {results.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
              <p className="text-zinc-400">没有找到匹配的歌词，试试换个描述方式</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-amber-700/50 transition-colors"
                >
                  <div className="mb-3 flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold text-amber-300">{r.title}</h2>
                    <span className="text-sm text-zinc-500">{r.album}</span>
                    {r.mode === 'semantic' && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400">
                        意境匹配
                      </span>
                    )}
                  </div>
                  {r.reason && (
                    <p className="mb-3 text-sm text-amber-400/70 italic">{r.reason}</p>
                  )}
                  <div className="space-y-1.5">
                    {r.lines.slice(0, 5).map((line, j) => (
                      <p key={j} className="text-zinc-300 leading-relaxed">{line}</p>
                    ))}
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400">
                      查看完整歌词
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-zinc-400 leading-relaxed">
                      {r.fullText}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status === 'idle' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-zinc-600">
            <p className="text-lg">输入你的心情，找到周杰伦的歌词共鸣</p>
            <p className="mt-2 text-sm">
              试试「暗恋一个人不敢表白」「对未来充满迷茫」...
            </p>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
            <p className="text-sm text-zinc-500">正在理解你的描述，匹配最合适的歌词...</p>
          </div>
        </div>
      )}
    </div>
  );
}
