import assert from 'node:assert/strict';
import { preview } from 'vite';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const server = await preview({ preview:{ host:'127.0.0.1', port:4178, strictPort:true } });
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
let browser;
try {
  browser = await chromium.launch({ headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/library/index.html`);
  await page.getByText('70 matching units', { exact:true }).waitFor();
  assert.equal(await page.locator('.catalog li').count(), 70);
  await page.keyboard.press('/'); assert.equal(await page.locator('#search').evaluate(e => e === document.activeElement), true);
  await page.locator('#search').fill('CLOEXEC');
  assert.ok(await page.locator('#search-results li').count() > 0);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#search').inputValue(), '');
  await page.locator('#search').fill('thistermhasnoresults'); await page.getByText('0 matching units', { exact:true }).waitFor();
  await page.goto(`${base}/library/chapters/ch05.html`);
  await page.getByRole('button', { name:'Mark lesson complete', exact:true }).click();
  await page.locator('#notes').fill('Shared offset; descriptor-local CLOEXEC.');
  await page.locator('input[value="false"]').check(); await page.getByRole('button', { name:'Check answer', exact:true }).click();
  await page.getByText(/^Try again\./).waitFor();
  await page.locator('input[value="true"]').check(); await page.getByRole('button', { name:'Check answer', exact:true }).click();
  await page.getByText(/^Correct\./).waitFor();
  await page.reload(); await page.getByRole('button', { name:'Completed: mark incomplete', exact:true }).waitFor();
  assert.equal(await page.locator('#notes').inputValue(), 'Shared offset; descriptor-local CLOEXEC.');
  await page.getByText('Saved attempt: correct. You can answer again.', { exact:true }).waitFor();
  await page.goto(`${base}/library/models.html`);
  await page.getByRole('button', { name:'dup fd 3', exact:true }).click();
  await page.getByRole('button', { name:'Write AB via fd 3', exact:true }).click();
  await page.getByRole('button', { name:'Write CD via fd 4', exact:true }).click();
  assert.match(await page.locator('#model-output').innerText(), /ABCD/);
  await page.getByRole('button', { name:'Successful exec', exact:true }).click();
  assert.equal(JSON.parse(await page.locator('#model-output').innerText()).fds[3], undefined);
  await page.locator('#model-kind').selectOption('signals');
  for (let i=0;i<3;i++) await page.getByRole('button', { name:'Generate SIGUSR1', exact:true }).click();
  assert.equal(JSON.parse(await page.locator('#model-output').innerText()).pending, 1);
  await page.getByRole('button', { name:'Unblock', exact:true }).click();
  assert.equal(JSON.parse(await page.locator('#model-output').innerText()).terminated, true);
  await page.locator('#model-kind').selectOption('tcp');
  await page.getByRole('button', { name:'Swap active closer', exact:true }).click();
  for (let i=0;i<5;i++) await page.getByRole('button', { name:'Next transition', exact:true }).click();
  assert.equal(JSON.parse(await page.locator('#model-output').innerText()).server, 'TIME-WAIT');
  await page.locator('#model-kind').selectOption('pty');
  await page.getByRole('button', { name:'Type a at master', exact:true }).click();
  assert.equal(JSON.parse(await page.locator('#model-output').innerText()).pending, 'a');
  await page.getByRole('button', { name:'Type Ctrl-C at master', exact:true }).click();
  assert.match(JSON.parse(await page.locator('#model-output').innerText()).signal, /SIGINT/);
  const { units } = JSON.parse(await readFile(new URL('../public/library/coverage.json', import.meta.url), 'utf8'));
  for (const u of units) {
    const response = await page.request.get(`${base}/library/${u.href}`); assert.equal(response.status(),200);
    const escaped = u.title.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    assert.ok((await response.text()).includes(escaped), u.href);
  }
  for (const [position, href] of [[1,'chapters/ch01.html'],[64,'chapters/ch64.html'],[65,'appendices/a.html'],[70,'appendices/f.html']]) {
    await page.goto(`${base}/library/tlpi?chapter=${position}`);
    const frame = page.locator('iframe'); await frame.waitFor();
    assert.ok((await frame.getAttribute('src')).endsWith(href), `legacy query ${position}`);
    await page.frameLocator('iframe').locator('h1').waitFor();
  }
  await page.goto(`${base}/library/index.html?chapter=70`); await page.waitForURL('**/appendices/f.html');
  await page.goto(`${base}/`);
  const shelfLinks = page.locator('#library .grid > a');
  assert.ok(await shelfLinks.count() >= 4);
  for (const [index, slug] of ['system-design','whitepapers','search-and-ai-systems','systems-programming'].entries()) assert.equal(await shelfLinks.nth(index).getAttribute('href'), `/library/rack/${slug}`);
  await shelfLinks.nth(3).click(); await page.getByRole('heading', { name:'Systems Programming', exact:true }).waitFor();
  await page.goto(`${base}/library/tlpi?chapter=4`);
  await page.frameLocator('iframe').locator('h1').waitFor();
  await page.locator('iframe').evaluate(frame => frame.contentWindow.postMessage({ type:'THEME_CHANGE', theme:'dark' }, location.origin));
  await page.frameLocator('iframe').locator('html[data-theme="dark"]').waitFor();
  await page.setViewportSize({ width:390, height:844 });
  for (const route of ['/library/index.html','/library/chapters/ch05.html','/library/models.html','/library/labs/index.html']) {
    await page.goto(base+route);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `mobile overflow ${route}`);
  }
  assert.deepEqual(errors, []);
  await context.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('denied'); } }));
  const b = await blocked.newPage(); await b.goto(`${base}/library/chapters/ch01.html`);
  await b.getByRole('button', { name:'Mark lesson complete', exact:true }).click();
  await b.getByText('Storage unavailable or full. Changes last only for this page session.', { exact:true }).waitFor();
  await blocked.close();
  const corrupt = await browser.newContext(); await corrupt.addInitScript(() => localStorage.setItem('linux-companion:v1','{bad'));
  const c = await corrupt.newPage(); await c.goto(`${base}/library/chapters/ch01.html`);
  await c.getByText('70 matching units', { exact:true }).waitFor(); await corrupt.close();
  const noJS = await browser.newContext({ javaScriptEnabled:false }); const n = await noJS.newPage();
  await n.goto(`${base}/library/chapters/ch64.html`); assert.equal(await n.locator('h1').innerText(), 'A PTY includes a terminal line discipline');
  assert.equal(await n.locator('#sources a').count() >= 5, true); await noJS.close();
  console.log('PASS Linux browser: catalog, API search, keyboard, assessment, persistent notes/completion, four models, all 70 routes, legacy iframe positions, theme messaging, category navigation, mobile overflow, denied/corrupt storage, no-JS reading.');
} finally {
  await browser?.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
