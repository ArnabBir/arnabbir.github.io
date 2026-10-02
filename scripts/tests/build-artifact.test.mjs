import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateBuild } from '../check-build.mjs';

test('validates lazy graph and rejects missing chunks and stale root HTML', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pages-artifact-'));
  try {
    await mkdir(join(root, '.vite'));
    await mkdir(join(root, 'assets'));
    const manifest = { 'index.html': { isEntry: true, src: 'index.html', file: 'assets/index-test.js', dynamicImports: ['lazy.jsx'] }, 'lazy.jsx': { file: 'assets/lazy-test.js' } };
    await writeFile(join(root, '.vite/manifest.json'), JSON.stringify(manifest));
    await writeFile(join(root, 'index.html'), '<script src="/assets/index-test.js"></script>');
    await writeFile(join(root, 'assets/index-test.js'), 'import("./lazy-test.js")');
    await writeFile(join(root, 'assets/lazy-test.js'), 'export default 1');
    await writeFile(join(root, '404.html'), 'fallback');
    await writeFile(join(root, '.nojekyll'), '');
    assert.equal(await validateBuild(root), 2);
    await rm(join(root, 'assets/lazy-test.js'));
    await assert.rejects(validateBuild(root), /Missing asset/);
    await writeFile(join(root, 'assets/lazy-test.js'), 'export default 1');
    await writeFile(join(root, 'index.html'), '<script src="/assets/index-stale.js"></script>');
    await assert.rejects(validateBuild(root), /HTML does not match/);
    await writeFile(join(root, 'index.html'), '<script src="/assets/index-test.js"></script>');
    await writeFile(join(root, 'assets/index-test.js'), 'const preload=["assets/missing.css"]');
    await assert.rejects(validateBuild(root), /Missing asset/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
