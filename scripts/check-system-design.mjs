import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { systemDesign, systemDesignPath } from '../src/content/system-design.js';
import { LibraryItemSchema } from '../src/content/schema.js';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const forbidden = /(?:^|\/)(?:\.[^/]+|node_modules|__pycache__|cache|secrets?)(?:\/|$)|\.(?:pem|key|map|gz)$/i;
assert.deepEqual(systemDesignPath.ids, systemDesign.map(item => item.id));
for (const [index, item] of systemDesign.entries()) {
  LibraryItemSchema.parse(item);
  const root = `public/library/${item.id}`;
  const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
  assert.equal(manifest.id, item.id);
  assert.equal(manifest.normalization, NORMALIZATION);
  assert.equal(manifest.sourceRepository.replace(/\.git$/, '').toLowerCase(), item.sourceUrl.toLowerCase());
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  const paths = manifest.files.map(file => file.contentPath);
  const published = new Set(paths);
  assert.equal(paths.length, index === 0 ? 389 : 8);
  assert.equal(paths.filter(path => path.endsWith('.html')).length, index === 0 ? 326 : 1);
  if (index === 0) assert.equal(paths.filter(path => path.includes('/case-studies/') && path.endsWith('/index.html')).length, 65);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.includes(item.contentPath));
  const disk = (await readdir(root, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => resolve(entry.parentPath, entry.name));
  assert.deepEqual(disk.sort(), [...paths.map(path => resolve(`public${path}`)), resolve(root, 'manifest.json')].sort());
  for (const file of manifest.files) {
    assert.ok(file.contentPath.startsWith(`/library/${item.id}/`));
    assert.ok(!file.sourceFile.split('/').includes('..'));
    assert.doesNotMatch(file.sourceFile, forbidden);
    const bytes = await readFile(`public${file.contentPath}`);
    assert.equal(bytes.length, file.bytes, file.contentPath);
    assert.equal(hash(bytes), file.sha256, file.contentPath);
    assert.match(file.sourceSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(normalizeBytes(bytes, file.sourceFile), bytes);
    if (file.contentPath.endsWith('.html')) {
      for (const match of bytes.toString().matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
        const target = new URL(match[1].replaceAll('&amp;', '&'), `https://portfolio.invalid${file.contentPath}`);
        if (target.origin !== 'https://portfolio.invalid' || !target.pathname.startsWith(`/library/${item.id}/`)) continue;
        const path = decodeURIComponent(target.pathname);
        assert.ok(published.has(path) || published.has(`${path}${path.endsWith('/') ? '' : '/'}index.html`), `Missing local link in ${file.contentPath}: ${match[1]}`);
      }
    }
    if (/\.(html|js|mjs|json|txt|py|java|xml|css)$/.test(file.sourceFile)) {
      assert.doesNotMatch(bytes.toString(), /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}/, file.sourceFile);
    }
    if (process.argv[index + 2]) {
      const source = await readFile(resolve(process.argv[index + 2], file.sourceFile));
      assert.equal(hash(source), file.sourceSha256, file.sourceFile);
      assert.equal(source.length, file.sourceBytes);
      let expected = normalizeBytes(source, file.sourceFile);
      if (index === 0 && /\.(html|xml|json|js)$/.test(file.sourceFile)) {
        expected = Buffer.from(expected.toString().replaceAll('https://arnabbir.github.io/system-design-masterclass/', 'https://arnabbir.github.io/library/system-design-masterclass/'));
      }
      assert.deepEqual(bytes, expected, file.sourceFile);
    }
  }
  console.log(`PASS ${item.id}: ${manifest.files.length} artifacts; ${paths.filter(path => path.endsWith('.html')).length} HTML pages; provenance, hashes, normalization and exclusions.`);
}
const bank = JSON.parse(await readFile('public/library/system-design-practice-lab/data/bank.json', 'utf8'));
assert.deepEqual(bank.inventory, { total: 2336, authored: 896, cases: 152, numeric: 480, calculationFamilies: 24, traces: 960, traceFamilies: 12, tracks: 26 });
assert.equal(bank.questions.length, bank.inventory.total);
assert.equal(new Set(bank.questions.map(question => question.id)).size, bank.inventory.total);
console.log('Practice inventory:', JSON.stringify(bank.inventory));
