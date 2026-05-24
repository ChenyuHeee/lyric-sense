import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const ARTISTS_DIR = path.join(DATA_DIR, 'artists');

const ITUNES_API = 'https://itunes.apple.com/search';

const ARTIST_SLUG = process.argv[2];
const ARTIST_NAME = process.argv[3];

if (!ARTIST_SLUG || !ARTIST_NAME) {
  console.error('Usage: node enrich-covers.mjs <slug> <artist_name>');
  process.exit(1);
}

async function fetchCover(artist, album) {
  const term = encodeURIComponent(`${artist} ${album}`);
  const url = `${ITUNES_API}?term=${term}&entity=album&limit=5&country=us`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.length > 0) {
      for (const r of data.results) {
        const cover = r.artworkUrl100?.replace('100x100bb', '600x600bb');
        if (cover) return cover;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  console.log(`=== Enriching ${ARTIST_NAME} with album covers ===\n`);

  const inputFile = path.join(ARTISTS_DIR, `${ARTIST_SLUG}.json`);

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const songs = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log(`Loading ${songs.length} songs...`);

  const albumMap = new Map();
  for (const s of songs) {
    if (!albumMap.has(s.album)) albumMap.set(s.album, []);
    albumMap.get(s.album).push(s);
  }
  console.log(`${albumMap.size} unique albums\n`);

  const coverCache = {};
  let found = 0;

  for (const [album] of albumMap) {
    console.log(`  Searching: ${album}...`);
    const cover = await fetchCover(ARTIST_NAME, album);
    if (cover) {
      coverCache[album] = cover;
      found++;
      console.log(`    ✓ found`);
    } else {
      console.log(`    ✗ not found`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const enriched = songs.map((s) => ({
    ...s,
    coverUrl: coverCache[s.album] || null,
  }));

  fs.writeFileSync(inputFile, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`\nCovers: ${found}/${albumMap.size}`);
  console.log(`Saved to ${inputFile}`);
}

main().catch(console.error);
