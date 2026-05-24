import fs from 'node:fs';
import path from 'node:path';
import pkg from 'NeteaseCloudMusicApi';
const { artist_album, album } = pkg;

const DATA_DIR = path.resolve('data');
const ARTISTS_DIR = path.join(DATA_DIR, 'artists');

const ARTIST_SLUG = process.argv[2];
const ARTIST_ID = process.argv[3];

if (!ARTIST_SLUG || !ARTIST_ID) {
  console.error('Usage: node enrich-covers-netease.mjs <slug> <netease_artist_id>');
  process.exit(1);
}

async function main() {
  console.log(`=== Enriching ${ARTIST_SLUG} with NetEase album covers ===\n`);

  const inputFile = path.join(ARTISTS_DIR, `${ARTIST_SLUG}.json`);
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const songs = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log(`Loading ${songs.length} songs...`);

  // Get album list from NetEase
  console.log('Fetching albums from NetEase...');
  const albumResult = await artist_album({ id: ARTIST_ID, limit: '200' });
  const albums = albumResult.body.hotAlbums || [];

  // Build album name -> cover URL map
  const coverMap = {};
  for (const alb of albums) {
    if (alb.picUrl) {
      coverMap[alb.name] = alb.picUrl.replace(/^http:/, 'https:') + '?param=300x300';
    }
  }

  // Also try to get covers from album detail (sometimes has better resolution)
  for (const alb of albums.slice(0, 50)) {
    try {
      const detail = await album({ id: alb.id.toString() });
      const picUrl = detail.body.album?.picUrl || detail.body.album?.blurPicUrl;
      if (picUrl && !coverMap[alb.name]) {
        coverMap[alb.name] = picUrl.replace(/^http:/, 'https:') + '?param=300x300';
      }
    } catch (e) {
      // skip
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Found ${Object.keys(coverMap).length} album covers\n`);

  // Match songs to covers
  let matched = 0;
  const enriched = songs.map((s) => {
    const cover = coverMap[s.album];
    if (cover) matched++;
    return { ...s, coverUrl: cover || s.coverUrl || null };
  });

  const withCover = enriched.filter((s) => s.coverUrl).length;
  console.log(`Songs with covers: ${withCover}/${enriched.length}`);

  fs.writeFileSync(inputFile, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Saved to ${inputFile}`);
}

main().catch(console.error);
