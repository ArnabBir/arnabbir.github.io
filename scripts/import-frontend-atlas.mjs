// Explicit allowlist: preserve the offline build and its only companion asset byte-for-byte.
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const source = resolve(process.argv[2] || '../frontend-atlas');
const destination = 'public/library/frontend-atlas';
const names = ['index.html', 'taskflow-reference.zip'];
const files = await Promise.all(names.map(async name => {
  const bytes = await readFile(resolve(source, 'dist', name));
  return { sourceFile: `dist/${name}`, contentPath: `/library/frontend-atlas/${name}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}));
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
const manifest = {
  id: 'frontend-atlas', sourceRepository: git('remote', 'get-url', 'origin'),
  sourceCommit: git('rev-parse', 'HEAD'), sourceDirty: Boolean(git('status', '--porcelain')),
  note: 'Existing offline build, copied without modification. Hashes identify the exact artifacts independently of the source commit.',
  files,
};
await mkdir(destination, { recursive: true });
for (const name of names) await copyFile(resolve(source, 'dist', name), `${destination}/${name}`);
await writeFile(`${destination}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported ${files.length} Frontend Atlas artifacts (${files.reduce((sum, file) => sum + file.bytes, 0)} bytes).`);
