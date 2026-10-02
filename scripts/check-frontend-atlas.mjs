import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { frontendAtlas, frontendPath } from '../src/content/frontend-atlas.js';
import { LibraryItemSchema } from '../src/content/schema.js';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';

const manifest = JSON.parse(await readFile('public/library/frontend-atlas/manifest.json', 'utf8'));
assert.equal(manifest.normalization, NORMALIZATION);
LibraryItemSchema.parse(frontendAtlas);
assert.deepEqual(frontendPath.ids, [frontendAtlas.id]);
assert.equal(manifest.id, frontendAtlas.id);
assert.equal(manifest.sourceRepository.replace(/\.git$/, ''), frontendAtlas.sourceUrl);
assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
assert.equal(manifest.files.length, 2);
assert.deepEqual((await readdir('public/library/frontend-atlas')).sort(), ['index.html', 'manifest.json', 'taskflow-reference.zip']);
for (const file of manifest.files) {
  const bytes = await readFile(`public${file.contentPath}`);
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  assert.match(file.sourceSha256, /^[a-f0-9]{64}$/);
  assert.ok(file.sourceBytes > 0);
  assert.deepEqual(normalizeBytes(bytes, file.sourceFile), bytes);
  if (process.argv[2]) {
    const source = await readFile(resolve(process.argv[2], file.sourceFile));
    assert.equal(createHash('sha256').update(source).digest('hex'), file.sourceSha256);
    assert.equal(source.length, file.sourceBytes);
    assert.deepEqual(bytes, normalizeBytes(source, file.sourceFile));
  }
}
const html = await readFile(`public${frontendAtlas.contentPath}`, 'utf8');
assert.match(html, /Frontend Atlas/);
assert.match(html, /taskflow-reference\.zip/);
assert.doesNotMatch(html, /<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i);
const archive = execFileSync('unzip', ['-Z1', 'public/library/frontend-atlas/taskflow-reference.zip'], { encoding: 'utf8' });
assert.doesNotMatch(archive, /node_modules|\/target\/|\.env(?:\n|\.)|\.git\/|(?:^|\/)\.\.(?:\/|$)/m);
assert.match(archive, /taskflow\/README.md/);
assert.match(archive, /TaskController.java/);
console.log('PASS: Frontend Atlas schema, path, provenance, exact artifact hashes, offline dependencies, and clean reference archive.');
