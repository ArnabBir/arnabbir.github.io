// Repository-local migration/check. Never traverses sibling sources or binaries.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';

const check = process.argv.includes('--check');
const published = process.argv.includes('--dist');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const excluded = new Set(['.git', 'node_modules', 'dist', 'dist-ssr', '.claude']);
const manifests = ['public/library/playbooks/manifest.json', 'public/library/frontend-atlas/manifest.json'];
const snapshots = new Map();
if (!published) for (const path of manifests) snapshots.set(path, JSON.parse(await readFile(path, 'utf8')));
let count = 0;
let occurrences = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!/\.(?:html?|txt|md|js|jsx|mjs|css|json|svg|xml|ya?ml)$/i.test(path)) continue;
    const bytes = await readFile(path);
    const normalized = normalizeBytes(bytes, path);
    if (!bytes.equals(normalized)) {
      count++;
      occurrences += [...bytes.toString().matchAll(new RegExp(String.fromCodePoint(0x2014), 'g'))].length;
      console.log(`${check ? 'NEEDS NORMALIZATION' : 'NORMALIZED'} ${path}`);
      if (!check) await writeFile(path, normalized);
    }
  }
}
await walk(published ? 'dist' : '.');
if (!check && !published) for (const [path, manifest] of snapshots) {
  for (const record of manifest.files) {
    record.sourceSha256 ??= record.sha256;
    record.sourceBytes ??= record.bytes;
    const bytes = await readFile(`public${record.contentPath}`);
    record.sha256 = hash(bytes);
    record.bytes = bytes.length;
  }
  manifest.normalization = NORMALIZATION;
  if (manifest.note) manifest.note = 'HTML uses deterministic editorial punctuation normalization; binary downloads are unchanged. sourceSha256/sourceBytes identify source artifacts; sha256/bytes identify published output.';
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(`${count} files; ${occurrences} literal U+2014 occurrences${published ? ' in build output' : ''}.`);
if (check && count) process.exitCode = 1;
