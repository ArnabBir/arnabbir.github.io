import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { playbooks, playbookPaths } from '../src/content/playbooks.js';
import { LibraryItemSchema } from '../src/content/schema.js';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile('public/library/playbooks/manifest.json', 'utf8'));
assert.equal(manifest.normalization, NORMALIZATION);
assert.equal(playbooks.length, 24);
assert.equal(manifest.files.length, 24);
assert.equal(new Set(playbooks.map(item => item.id)).size, 24);
assert.equal(new Set(manifest.files.map(item => item.sha256)).size, 24);
assert.equal(manifest.files.flatMap(item => item.aliases).length, 4);
assert.equal((await readdir('public/library/playbooks')).filter(name => name.endsWith('.html')).length, 24);
const expectedCounts = {
  'Payments & Financial Infrastructure': 5, 'Search & AI Systems': 4,
  'Geospatial & Marketplace Systems': 3, 'Media & Communication': 4,
  'Data Platforms & Resilience': 3, 'Programming Languages': 2,
  'Algorithms & Data Structures': 1, 'Identity & API Platforms': 2,
};
const actualCounts = {};
for (const item of playbooks) {
  LibraryItemSchema.parse(item);
  assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(item.contentPath, `/library/playbooks/${item.id}.html`);
  actualCounts[item.category] = (actualCounts[item.category] || 0) + 1;
  const record = manifest.files.find(record => record.id === item.id);
  assert.equal(record.sourceFile, item.sourceFile);
  assert.equal(record.contentPath, item.contentPath);
  const bytes = await readFile(`public${item.contentPath}`);
  assert.equal(bytes.length, record.bytes);
  assert.equal(hash(bytes), record.sha256);
  assert.match(record.sourceSha256, /^[a-f0-9]{64}$/);
  assert.ok(record.sourceBytes > 0);
  assert.deepEqual(normalizeBytes(bytes, item.sourceFile), bytes);
  assert.match(bytes.toString(), /<title[\s>]/i);
  if (process.argv[2]) {
    for (const name of [item.sourceFile, ...record.aliases]) {
      const source = await readFile(resolve(process.argv[2], name));
      assert.equal(hash(source), record.sourceSha256, name);
      assert.equal(source.length, record.sourceBytes);
      assert.deepEqual(normalizeBytes(source, name), bytes);
    }
  }
}
assert.deepEqual(actualCounts, expectedCounts);
for (const path of playbookPaths) for (const id of path.ids) assert.ok(playbooks.some(item => item.id === id));
// This checker only loads SSR modules; do not start a browser dependency scan.
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { default: library } = await server.ssrLoadModule('/src/content/library.js');
  assert.equal(new Set(library.map(item => item.id)).size, library.length);
  for (const item of library) LibraryItemSchema.parse(item);
  const papers = library.find(item => item.id === 'whitepapers');
  const { whitepaperCatalog } = await server.ssrLoadModule('/src/content/whitepapers.js');
  assert.deepEqual(papers.chapters, whitepaperCatalog);
  const { resolvePaperChapter } = await server.ssrLoadModule('/src/content/whitepapers.js');
  for (let chapter = 1; chapter <= 52; chapter++) assert.ok(resolvePaperChapter(String(chapter)), `legacy paper ${chapter}`);
  console.log(`PASS: ${library.length} catalog entries; 24 unique imports; 8 category counts; provenance, schema, paths; 52 legacy paper chapter resolutions.`);
} finally { await server.close(); }
