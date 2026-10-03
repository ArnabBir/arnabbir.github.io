import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { normalizeBytes, NORMALIZATION } from './text-normalization.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const master = resolve(process.argv[2] || `${homedir()}/system-design-masterclass`);
const gym = resolve(process.argv[3] || '../system-design-practice-lab');
const allowed = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.txt', '.xml', '.zip', '.py', '.java', '.pdf']);
async function walk(root, prefix = '') {
  const files = [];
  for (const entry of await readdir(resolve(root, prefix), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', '__pycache__', 'cache', 'caches'].includes(entry.name)) continue;
    const name = `${prefix}${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${name}`);
    if (entry.isDirectory()) files.push(...await walk(root, `${name}/`));
    else if (allowed.has(extname(name)) || /(?:LICENSE|COPYING)(?:\.|$)/.test(entry.name)) files.push(name);
    else if (!name.endsWith('.map') && !name.endsWith('.gz')) throw new Error(`Review unexpected artifact: ${name}`);
  }
  return files.sort();
}
// Refuse a stale MkDocs snapshot rather than silently publish old chapters.
const buildInputs = JSON.parse(await readFile(resolve(master, 'site/build-manifest.json')));
for (const [name, expected] of Object.entries(buildInputs)) {
  if (hash(await readFile(resolve(master, name))) !== expected) throw new Error(`Stale masterclass build: ${name}. Rebuild in an isolated copy; see docs/system-design-import.md.`);
}
const specs = [
  { id: 'system-design-masterclass', root: master, prefix: 'site/', names: await walk(resolve(master, 'site')) },
  { id: 'system-design-practice-lab', root: gym, prefix: '', names: ['index.html', 'app.mjs', 'engine.mjs', 'styles.css', 'data/bank.json', 'data/curriculum.mjs', ...await walk(resolve(gym, 'assets')).then(names => names.map(n => `assets/${n}`))] },
];
// Read and validate both sources before replacing any owned output.
for (const spec of specs) {
  spec.outputs = await Promise.all(spec.names.map(async name => {
    const bytes = await readFile(resolve(spec.root, spec.prefix, name));
    if (/(?:^|\/)(?:secrets?|credentials)(?:[./]|$)|\.(?:pem|key)$/i.test(name)) throw new Error(`Refusing sensitive artifact: ${name}`);
    if (/\.(html|js|mjs|json|txt|py|java|xml|css)$/.test(name) && /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}/.test(bytes.toString())) throw new Error(`Review possible credential in ${name}`);
    let output = normalizeBytes(bytes, name);
    if (spec.id === 'system-design-masterclass' && /\.(html|xml|json|js)$/.test(name)) {
      output = Buffer.from(output.toString().replaceAll('https://arnabbir.github.io/system-design-masterclass/', 'https://arnabbir.github.io/library/system-design-masterclass/'));
    }
    return { name, output, record: { sourceFile: `${spec.prefix}${name}`, contentPath: `/library/${spec.id}/${name}`, sourceBytes: bytes.length, sourceSha256: hash(bytes), bytes: output.length, sha256: hash(output) } };
  }));
  const git = (...args) => execFileSync('git', ['-C', spec.root, ...args], { encoding: 'utf8' }).trim();
  spec.manifest = { id: spec.id, sourceRepository: git('remote', 'get-url', 'origin'), sourceCommit: git('rev-parse', 'HEAD'), sourceDirty: Boolean(git('status', '--porcelain')), normalization: NORMALIZATION, relocation: spec.id === 'system-design-masterclass' ? 'Canonical and sitemap base relocated to /library/system-design-masterclass/; relative runtime paths preserved.' : null, files: spec.outputs.map(o => o.record) };
}
for (const spec of specs) {
  const destination = resolve('public/library', spec.id);
  await rm(destination, { recursive: true, force: true });
  for (const { name, output } of spec.outputs) {
    const target = resolve(destination, name);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, output);
  }
  await writeFile(resolve(destination, 'manifest.json'), `${JSON.stringify(spec.manifest, null, 2)}\n`);
  console.log(`${spec.id}: ${spec.outputs.length} runtime artifacts, ${spec.names.filter(n => n.endsWith('.html')).length} HTML pages`);
}
