// Builds dist/: copies site/ and writes the encrypted links.json.
//
// Table source, first match wins:
//   1. VIDEOS_JSON env var (GitHub Actions secret, keeps links out of the repo)
//   2. data/videos.json (gitignored, for local use)
//   3. data/videos.example.json (placeholders)
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { encryptRow, indexKey, videoIdFromPath } from '../site/lib.js';

const root = new URL('..', import.meta.url);
const dist = new URL('dist/', root);

async function loadSource() {
  if (process.env.VIDEOS_JSON?.trim()) return { name: 'VIDEOS_JSON secret', text: process.env.VIDEOS_JSON };
  for (const f of ['data/videos.json', 'data/videos.example.json']) {
    const u = new URL(f, root);
    if (existsSync(u)) return { name: f, text: await readFile(u, 'utf8') };
  }
  throw new Error('No table source found');
}

function toVideoId(video) {
  const s = String(video).trim();
  if (/^\d{8,25}$/.test(s)) return s;
  const id = videoIdFromPath(s);
  if (!id) throw new Error(`Cannot read a video ID from "${s}". Use the full www.tiktok.com/@user/video/<ID> URL or the ID.`);
  return id;
}

async function main() {
  const src = await loadSource();
  const list = JSON.parse(src.text);
  if (!Array.isArray(list)) throw new Error('Table must be a JSON array');

  const rows = {};
  for (const item of list) {
    if (item.active === false) continue;
    if (!/^https?:\/\//.test(item.reveal_url || '')) throw new Error(`Bad reveal_url for ${item.video}`);
    const id = toVideoId(item.video ?? item.video_id);
    rows[await indexKey(id)] = await encryptRow(id, {
      reveal_url: item.reveal_url,
      premium_code: item.premium_code || '',
    });
  }

  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(new URL('site/', root), dist, { recursive: true });
  await writeFile(new URL('links.json', dist), JSON.stringify({ v: 1, rows }));
  console.log(`Built dist/ from ${src.name}: ${Object.keys(rows).length} active video(s).`);
}

main().catch((e) => {
  console.error('Build failed:', e.message);
  process.exit(1);
});
