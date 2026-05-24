import fs from 'node:fs';
import path from 'node:path';
import netease from 'NeteaseCloudMusicApi';

const { artist_album, album, lyric } = netease;

const DATA_DIR = path.resolve('data');
const ARTISTS_DIR = path.join(DATA_DIR, 'artists');

const ARTIST_ID = process.argv[2];
const ARTIST_SLUG = process.argv[3];
const ARTIST_NAME = process.argv[4];

if (!ARTIST_ID || !ARTIST_SLUG) {
  console.error('Usage: node scrape-artist.mjs <artist_id> <slug> [name]');
  process.exit(1);
}

function parseLyric(raw) {
  if (!raw) return [];
  const lines = raw.split('\n');
  const parsed = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})[.\]]\d*\]\s*(.*)/);
    if (match) {
      const text = match[3].trim();
      if (text && /^[一-鿿]/.test(text) && text.length >= 2) {
        if (!/^(作曲|作词|编曲|制作|演唱|监制|混音|录音|和声|吉他|钢琴|鼓|贝斯|键盘|弦乐|专辑|词|曲|Produced|Music|Lyrics|Arranged)/i.test(text)) {
          parsed.push(text);
        }
      }
    }
  }
  return parsed;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`=== Scraping ${ARTIST_NAME || ARTIST_SLUG} (ID: ${ARTIST_ID}) ===\n`);

  // 1. Get albums
  console.log('1. Fetching albums...');
  const albumResult = await artist_album({ id: ARTIST_ID, limit: '200' });
  const albums = albumResult.body.hotAlbums || [];
  console.log(`   Found ${albums.length} albums`);

  const seen = new Set();
  const uniqueAlbums = albums.filter((a) => {
    if (seen.has(a.name)) return false;
    seen.add(a.name);
    return true;
  });
  console.log(`   ${uniqueAlbums.length} unique albums\n`);

  // 2. Get tracks & lyrics
  console.log('2. Fetching tracks and lyrics...');
  const songs = [];

  for (const alb of uniqueAlbums) {
    console.log(`   Album: ${alb.name}`);
    try {
      const albumData = await album({ id: alb.id.toString() });
      const tracks = albumData.body.songs || [];

      for (const track of tracks) {
        if (songs.some((s) => s.title === track.name)) continue;

        try {
          const lyricData = await lyric({ id: track.id.toString() });
          const raw = lyricData.body?.lrc?.lyric || '';
          const lines = parseLyric(raw);
          if (lines.length > 0) {
            songs.push({
              title: track.name,
              album: alb.name,
              artist: ARTIST_NAME || ARTIST_SLUG,
              lines,
              fullText: lines.join('\n'),
              coverUrl: null,
            });
          }
        } catch (e) {
          // skip
        }
        await sleep(80);
      }

      console.log(`     ${tracks.length} tracks, total ${songs.length}`);
    } catch (e) {
      console.log(`     error: ${e.message}`);
    }
    await sleep(300);
  }

  // 3. Save
  fs.mkdirSync(ARTISTS_DIR, { recursive: true });
  const outFile = path.join(ARTISTS_DIR, `${ARTIST_SLUG}.json`);
  fs.writeFileSync(outFile, JSON.stringify(songs, null, 2), 'utf-8');

  console.log(`\n3. Saved ${songs.length} songs to ${outFile}`);
  console.log(`   Total lines: ${songs.reduce((s, song) => s + song.lines.length, 0)}`);
  console.log('Done!\n');
}

main().catch(console.error);
