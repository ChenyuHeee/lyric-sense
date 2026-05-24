import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const INPUT = path.join(DATA_DIR, 'lyrics-clean.json');
const OUTPUT = path.join(DATA_DIR, 'lyrics-enriched.json');

// iTunes Search API (free, no auth needed)
const ITUNES_API = 'https://itunes.apple.com/search';

async function fetchCover(artist, album) {
  const term = encodeURIComponent(`${artist} ${album}`);
  const url = `${ITUNES_API}?term=${term}&entity=album&limit=3&country=cn`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.length > 0) {
      // Find best match (album name contains the search term)
      for (const r of data.results) {
        const cover = r.artworkUrl100?.replace('100x100bb', '600x600bb');
        if (cover) return { cover, artistName: r.artistName, collectionName: r.collectionName };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  console.log('=== Enriching lyrics with album covers from iTunes ===\n');

  const songs = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`Loading ${songs.length} songs...`);

  // Get unique albums
  const albumMap = new Map();
  for (const s of songs) {
    const key = s.album;
    if (!albumMap.has(key)) albumMap.set(key, []);
    albumMap.get(key).push(s);
  }

  console.log(`${albumMap.size} unique albums\n`);

  const coverCache = {};
  let found = 0;

  for (const [album, albumSongs] of albumMap) {
    const artist = '周杰伦';
    console.log(`  Searching: ${album}...`);
    const coverData = await fetchCover(artist, album);

    if (coverData) {
      coverCache[album] = coverData.cover;
      found++;
      console.log(`    ✓ ${coverData.collectionName}`);
    } else {
      console.log(`    ✗ not found`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  // Enrich songs with covers
  const enriched = songs.map((s) => ({
    ...s,
    artist: '周杰伦',
    coverUrl: coverCache[s.album] || null,
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`\nDone! Covers found: ${found}/${albumMap.size}`);
  console.log(`Saved to ${OUTPUT}`);
}

main().catch(console.error);
