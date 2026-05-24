import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const INPUT = path.join(DATA_DIR, 'lyrics.json');
const OUTPUT = path.join(DATA_DIR, 'lyrics-clean.json');

const songs = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

console.log(`Input: ${songs.length} songs`);

const isLive = (album) =>
  /演唱会|Concert|Live|巡回|The One|Fantasy Show|超时代|魔天伦|地表最强|无与伦比/i.test(album);

const isInstrumental = (title) =>
  /伴奏|演奏|钢琴|纯音乐|音乐盒|Instrumental/i.test(title) || title.endsWith('(伴奏)');

// Score: higher = better version
const albumScore = (album) => {
  if (isLive(album)) return 0;
  if (/Initial|Partners|拍档|范特西PLUS|黄俊郎|即兴曲|Six Degrees|熊猫人|大头贴/i.test(album)) return 1;
  if (/原声|电影|天台/i.test(album)) return 2;
  return 3; // studio or single
};

// Dedup: keep best version
const byTitle = new Map();
for (const s of songs) {
  const existing = byTitle.get(s.title);
  if (!existing) {
    byTitle.set(s.title, s);
  } else if (albumScore(s.album) > albumScore(existing.album)) {
    byTitle.set(s.title, s);
  }
}

// Filter: only remove live and instrumentals
const filtered = [...byTitle.values()].filter((s) => {
  if (isInstrumental(s.title)) return false;
  if (isLive(s.album)) return false;
  return true;
});

filtered.sort((a, b) => a.album.localeCompare(b.album) || a.title.localeCompare(b.title));

fs.writeFileSync(OUTPUT, JSON.stringify(filtered, null, 2), 'utf-8');

const albums = [...new Set(filtered.map((s) => s.album))];
console.log(`\nOutput: ${filtered.length} songs, ${albums.length} albums`);
console.log(`Total lines: ${filtered.reduce((s, song) => s + song.lines.length, 0)}`);
console.log('\nAlbums:');
albums.forEach((a) => {
  const count = filtered.filter((s) => s.album === a).length;
  console.log(`  ${a} (${count} tracks)`);
});
