// Requires Chrome and Playwright; PLAYWRIGHT_MODULE can reuse an existing install.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { preview } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const server = await preview({ preview: { host: '127.0.0.1', port: 4175 } });
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const html = await readFile('dist/index.html', 'utf8');
const entry = html.match(/src="(\/assets\/index-[^"]+\.js)"/)[1];
const entryCode = await readFile(`dist${entry}`, 'utf8');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });

async function scenario(mode) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let documents = 0;
  let chunks = 0;
  if (mode === 'blocked-storage') await context.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('storage denied'); } });
  });
  await page.route('**/library?*', async route => {
    documents++;
    const stale = documents === 1 && mode !== 'unchanged-build';
    await route.fulfill({ contentType: 'text/html', body: stale ? html.replace(entry, '/assets/index-old-session.js') : html });
  });
  await page.route('**/assets/index-old-session.js', route => route.fulfill({ contentType: 'text/javascript', body: entryCode }));
  await page.route('**/assets/LibraryHome-*.js', async route => {
    chunks++;
    if (mode === 'recover' && chunks > 1) return route.continue();
    if (mode === 'offline') await context.setOffline(true);
    await route.abort('failed');
  });
  const address = `${base}/library?topic=java#saved`;
  try {
    await page.goto(address);
    if (mode === 'recover') {
      await page.getByRole('heading', { name: 'An engineering library for curious builders.' }).waitFor();
      assert.equal(documents, 2);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('portfolio:preload-recovery:v1')), 'attempted');
    } else {
      await page.getByRole('heading', { name: 'This page could not be loaded' }).waitFor();
      if (mode === 'permanent-failure') {
        await page.waitForFunction(() => sessionStorage.getItem('portfolio:preload-recovery:v1') === 'attempted');
        await page.waitForTimeout(800);
        assert.equal(documents, 2);
      } else {
        await page.waitForTimeout(800);
        assert.equal(documents, 1);
      }
      const button = page.getByRole('button', { name: 'Reload this page' });
      assert.equal(await button.isDisabled(), mode === 'offline');
      if (mode === 'offline') {
        await context.setOffline(false);
        await page.waitForFunction(() => !document.querySelector('main button').disabled);
        assert.equal(documents, 1);
      }
      // Even another preload error cannot create a reload loop after the one attempt.
      await page.evaluate(() => window.dispatchEvent(new Event('vite:preloadError')));
      await page.waitForTimeout(300);
      if (mode !== 'offline') assert.equal(documents, mode === 'permanent-failure' ? 2 : 1);
    }
    assert.equal(page.url(), address);
    console.log(`PASS browser recovery: ${mode}`);
  } finally { await context.close(); }
}

try {
  for (const mode of ['recover', 'permanent-failure', 'unchanged-build', 'blocked-storage', 'offline']) await scenario(mode);
  for (const script of ['check-playbooks-browser.mjs', 'check-frontend-atlas-browser.mjs']) {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`scripts/${script}`], { stdio: 'inherit', env: { ...process.env, PLAYBOOK_BASE_URL: base } });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script}: exit ${code}`)));
    });
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
