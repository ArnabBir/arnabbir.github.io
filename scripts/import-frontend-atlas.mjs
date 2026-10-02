// Explicit allowlist: normalize HTML punctuation and preserve the binary download.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const source = resolve(process.argv[2] || '../frontend-atlas');
const destination = 'public/library/frontend-atlas';
const names = ['index.html', 'taskflow-reference.zip'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = await Promise.all(names.map(async name => {
  const bytes = await readFile(resolve(source, 'dist', name));
  const output = normalizeBytes(bytes, name);
  return { sourceFile: `dist/${name}`, contentPath: `/library/frontend-atlas/${name}`, sourceBytes: bytes.length, sourceSha256: hash(bytes), bytes: output.length, sha256: hash(output) };
}));
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
const manifest = {
  id: 'frontend-atlas', sourceRepository: git('remote', 'get-url', 'origin'),
  sourceCommit: git('rev-parse', 'HEAD'), sourceDirty: Boolean(git('status', '--porcelain')),
  normalization: NORMALIZATION,
  note: 'HTML uses deterministic editorial punctuation normalization; binary downloads are unchanged. sourceSha256/sourceBytes identify source artifacts; sha256/bytes identify published output.',
  files,
};
await mkdir(destination, { recursive: true });
for (const name of names) await writeFile(`${destination}/${name}`, normalizeBytes(await readFile(resolve(source, 'dist', name)), name));
await writeFile(`${destination}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported ${files.length} Frontend Atlas artifacts (${files.reduce((sum, file) => sum + file.bytes, 0)} bytes).`);
