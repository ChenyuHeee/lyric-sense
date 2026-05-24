import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from '@xenova/transformers';

const DATA_DIR = path.resolve('data');
const INPUT = path.join(DATA_DIR, 'lyrics-clean.json');
const OUTPUT = path.join(DATA_DIR, 'embeddings.json');
const SRC_OUTPUT = path.resolve('src/data/embeddings.json');

const MODEL = 'Xenova/all-MiniLM-L6-v2';

async function main() {
  console.log('=== Generating embeddings with Transformers.js ===\n');
  console.log(`Model: ${MODEL}\n`);

  const songs = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`Loading ${songs.length} songs...`);

  // Load feature extraction pipeline
  console.log('Loading model (first time downloads ~80MB)...');
  const extractor = await pipeline('feature-extraction', MODEL);
  console.log('Model loaded.\n');

  const texts = songs.map((s) => {
    const sample = s.lines.slice(0, 30).join('\n');
    return `${s.title}\n${sample}`;
  });

  const BATCH_SIZE = 32;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchSongs = songs.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, texts.length)})`);

    if (i === 0) {
      // First batch: run sequentially to warm up
      for (let j = 0; j < batch.length; j++) {
        const result = await extractor(batch[j], { pooling: 'mean', normalize: true });
        allEmbeddings.push({
          title: batchSongs[j].title,
          album: batchSongs[j].album,
          lines: batchSongs[j].lines,
          fullText: batchSongs[j].fullText,
          embedding: Array.from(result.data),
        });
      }
    } else {
      // Subsequent batches: run in parallel
      const results = await Promise.all(
        batch.map((t) => extractor(t, { pooling: 'mean', normalize: true }))
      );
      for (let j = 0; j < batch.length; j++) {
        allEmbeddings.push({
          title: batchSongs[j].title,
          album: batchSongs[j].album,
          lines: batchSongs[j].lines,
          fullText: batchSongs[j].fullText,
          embedding: Array.from(results[j].data),
        });
      }
    }
  }

  // Save to both locations
  const json = JSON.stringify(allEmbeddings);
  fs.writeFileSync(OUTPUT, json, 'utf-8');
  fs.writeFileSync(SRC_OUTPUT, json, 'utf-8');

  console.log(`\nDone! Saved ${allEmbeddings.length} embeddings`);
  const sizeMb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
  console.log(`File size: ${sizeMb} MB`);
  console.log(`Embedding dims: ${allEmbeddings[0]?.embedding.length || 'N/A'}`);
}

main().catch(console.error);
