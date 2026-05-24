import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const OUTPUT_FILE = path.join(DATA_DIR, 'lyrics.json');

// Use NeteaseCloudMusicApi for proper auth handling
import netease from 'NeteaseCloudMusicApi';

const { artist_album, album, lyric } = netease;

async function main() {
  console.log('=== Scraping Jay Chou lyrics via NeteaseCloudMusicApi ===\n');

  // 1. Get all albums for Jay Chou (artist ID: 6452)
  console.log('1. Fetching albums...');
  const albumResult = await artist_album({ id: '6452', limit: '200' });
  const albums = albumResult.body.hotAlbums || [];
  console.log(`   Found ${albums.length} albums`);

  // Filter duplicates by name
  const seen = new Set();
  const uniqueAlbums = albums.filter((a) => {
    if (seen.has(a.name)) return false;
    seen.add(a.name);
    return true;
  });
  console.log(`   ${uniqueAlbums.length} unique albums\n`);

  // 2. Get tracks and lyrics
  console.log('2. Fetching tracks and lyrics...');
  const songs = [];

  for (const alb of uniqueAlbums) {
    console.log(`   Album: ${alb.name}`);
    const albumData = await album({ id: alb.id.toString() });
    const tracks = albumData.body.songs || [];

    for (const track of tracks) {
      // Skip duplicate songs
      if (songs.some((s) => s.title === track.name)) continue;

      try {
        const lyricData = await lyric({ id: track.id.toString() });
        const raw = lyricData.body?.lrc?.lyric || '';

        const lines = parseLyric(raw);
        if (lines.length > 0) {
          songs.push({
            title: track.name,
            album: alb.name,
            lines,
            fullText: lines.join('\n'),
          });
        }
      } catch (e) {
        // skip songs without lyrics
      }

      await sleep(100);
    }

    console.log(`     ${tracks.length} tracks, collected ${songs.length} total`);
    await sleep(300);
  }

  // 3. Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(songs, null, 2), 'utf-8');
  console.log(`\n3. Saved ${songs.length} songs to ${OUTPUT_FILE}`);
  console.log(`   Total lines: ${songs.reduce((s, song) => s + song.lines.length, 0)}`);
  console.log('\nDone!');
}

function parseLyric(raw) {
  if (!raw) return [];
  const lines = raw.split('\n');
  const parsed = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})[.\]]\d*\]\s*(.*)/);
    if (match) {
      const text = match[3].trim();
      // Skip instrumental markers, composer info, etc.
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

main().catch(console.error);
