import { readFile, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function validateBuild(directory = 'dist') {
  const root = resolve(directory);
  const manifest = JSON.parse(await readFile(resolve(root, '.vite/manifest.json'), 'utf8'));
  const checked = new Set();
  const check = async (reference, owner = 'index.html') => {
    if (/^(?:data:|https?:|#|\/\/)/.test(reference)) return;
    const path = resolve(root, reference.startsWith('/') ? `.${reference.split(/[?#]/)[0]}` : `${dirname(owner)}/${reference.split(/[?#]/)[0]}`);
    if (relative(root, path).startsWith('..')) throw new Error(`Asset escapes artifact: ${reference}`);
    try { await access(path); } catch { throw new Error(`Missing asset ${reference} referenced by ${owner}`); }
  };
  const entry = Object.values(manifest).find(item => item.isEntry && item.src === 'index.html');
  if (!entry) throw new Error('Missing Vite HTML entry');
  for (const [key, item] of Object.entries(manifest)) {
    for (const dependency of [...(item.imports || []), ...(item.dynamicImports || [])]) {
      if (!manifest[dependency]) throw new Error(`Missing manifest dependency ${dependency} in ${key}`);
    }
    for (const file of [item.file, ...(item.css || []), ...(item.assets || [])]) {
      await check(`/${file}`);
      checked.add(file);
    }
  }
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  if (!html.includes(`/${entry.file}`) || html.includes('/src/main.jsx')) throw new Error('HTML does not match built entry');
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) await check(match[1]);
  for (const file of checked) {
    if (!/\.(?:js|css)$/.test(file)) continue;
    const text = await readFile(resolve(root, file), 'utf8');
    // Covers Vite preload maps as well as emitted static/dynamic chunk imports.
    for (const match of text.matchAll(/["']((?:\.?\.?\/|\/)?assets\/[^"'\s]+|\.\.?\/[^"'\s]+\.(?:js|css))["']/g)) {
      await check(match[1].startsWith('assets/') ? `/${match[1]}` : match[1], file);
    }
    if (file.endsWith('.css')) for (const match of text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/g)) await check(match[1] ?? match[2] ?? match[3], file);
  }
  await check('/404.html');
  await check('/.nojekyll');
  return checked.size;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`PASS: ${await validateBuild(process.argv[2])} emitted assets and their references.`);
}
