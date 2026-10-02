import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';
import { resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { playbooks, playbookSource } from '../src/content/playbooks.js';

const source = resolve(process.argv[2] || '../master-playbooks');
const destination = resolve('public/library/playbooks');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = (await readdir(source)).filter(name => name.endsWith('.html'));
const groups = new Map();
for (const file of files) {
  const digest = hash(await readFile(resolve(source, file)));
  groups.set(digest, [...(groups.get(digest) || []), file]);
}
const records = [];
for (const item of playbooks) {
  if (basename(item.sourceFile) !== item.sourceFile) throw new Error('Expected a flat source filename');
  const bytes = await readFile(resolve(source, item.sourceFile));
  const sourceSha256 = hash(bytes);
  const output = normalizeBytes(bytes, item.sourceFile);
  records.push({ id: item.id, sourceFile: item.sourceFile, contentPath: item.contentPath, sourceSha256, sourceBytes: bytes.length, sha256: hash(output), bytes: output.length, aliases: groups.get(sourceSha256).filter(name => name !== item.sourceFile) });
}
if (new Set(records.map(r => r.sha256)).size !== records.length || groups.size !== records.length) {
  throw new Error('Registry must cover every unique source HTML exactly once; review changed/new sources first.');
}
// Refuse to overwrite locally modified imports; a reviewed source update is allowed.
let previous = { files: [] };
try { previous = JSON.parse(await readFile(resolve(destination, 'manifest.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const record of records) {
  try {
    const current = hash(await readFile(resolve(destination, `${record.id}.html`)));
    const old = previous.files.find(file => file.id === record.id);
    if (current !== record.sha256 && current !== old?.sha256) throw new Error(`Local changes: ${record.id}; preserve/review before importing.`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await mkdir(destination, { recursive: true });
for (const record of records) await writeFile(resolve(destination, `${record.id}.html`), normalizeBytes(await readFile(resolve(source, record.sourceFile)), record.sourceFile));
await writeFile(resolve(destination, 'manifest.json'), JSON.stringify({ source: playbookSource, normalization: NORMALIZATION, files: records }, null, 2) + '\n');
console.log(`Imported ${records.length} unique HTML experiences (${files.length - records.length} duplicate aliases), ${records.reduce((n, r) => n + r.bytes, 0)} bytes.`);
