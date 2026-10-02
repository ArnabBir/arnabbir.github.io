// Run against a built preview server. PLAYWRIGHT_MODULE may point to an existing installation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { playbooks } from '../src/content/playbooks.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PLAYBOOK_BASE_URL || 'http://127.0.0.1:8080';
const manifest = JSON.parse(await readFile('public/library/playbooks/manifest.json', 'utf8'));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Outer page overflow: ${page.url()}`);
const openFirstLesson = async root => {
  const details = root.locator('details').filter({ has: root.locator('a[data-card="lesson-001"]') });
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  await root.locator('a[data-card="lesson-001"]').click();
};
try {
  await page.goto(`${base}/library`);
  await page.getByRole('heading', { name: 'An engineering library for curious builders.' }).waitFor();
  await page.getByLabel('Format', { exact: true }).selectOption('Architecture study');
  assert.equal(await page.locator('main article').count(), playbooks.filter(item => item.format === 'Architecture study').length);
  await page.getByLabel('Topic', { exact: true }).selectOption('Ledgers');
  assert.equal(await page.locator('main article').count(), 3);
  await page.getByLabel('Search library').fill('no-such-experience-xyz');
  await page.getByText('No books match your search.').waitFor();
  await page.getByRole('button', { name: 'Reset filters' }).first().click();
  const categories = new Set(playbooks.map(item => item.category));
  for (const category of categories) {
    const slug = category.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await page.goto(`${base}/library/rack/${slug}`);
    await page.getByRole('heading', { name: category, exact: true }).waitFor();
    assert.equal(await page.locator('main article').count(), playbooks.filter(item => item.category === category).length);
  }
  for (const item of playbooks) {
    const response = await page.request.get(`${base}${item.contentPath}`);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-type'], /text\/html/);
    assert.equal(createHash('sha256').update(await response.body()).digest('hex'), manifest.files.find(record => record.id === item.id).sha256);
    await page.goto(`${base}/library/${item.id}`);
    await page.getByRole('heading', { name: item.title, exact: true }).waitFor();
    const iframe = page.locator('iframe');
    await iframe.waitFor();
    await page.waitForFunction(() => {
      const iframe = document.querySelector('iframe');
      return iframe?.contentDocument?.readyState === 'complete' && iframe.contentDocument.body.innerText.length > 100;
    });
    assert.equal(await iframe.getAttribute('title'), item.title);
    assert.equal(await page.getByRole('link', { name: /Open full page/ }).getAttribute('href'), item.contentPath);
    const bounds = await iframe.boundingBox();
    assert.ok(bounds.height <= 1000 && bounds.height >= 360);
    await noOverflow();
  }
  // Real course completion must survive reload and switching to the standalone view.
  await page.goto(`${base}/library/java-to-go`);
  let frame = page.frameLocator('iframe');
  await openFirstLesson(frame);
  await frame.locator('[data-complete="lesson-001"]').click();
  assert.equal(await frame.locator('[data-complete="lesson-001"]').getAttribute('aria-pressed'), 'true');
  await page.reload();
  frame = page.frameLocator('iframe');
  await openFirstLesson(frame);
  assert.equal(await frame.locator('[data-complete="lesson-001"]').getAttribute('aria-pressed'), 'true');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /Open full page/ }).click();
  const standalone = await popupPromise;
  await standalone.waitForLoadState();
  await openFirstLesson(standalone);
  assert.equal(await standalone.locator('[data-complete="lesson-001"]').getAttribute('aria-pressed'), 'true');
  await standalone.close();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/library', '/library/rack/payments-and-financial-infrastructure', '/library/stripe-payment-infrastructure', '/library/java-to-go', '/library/airflow-study-course']) {
    await page.goto(`${base}${path}`);
    await page.locator('main').waitFor();
    await page.waitForTimeout(400);
    await noOverflow();
    if (await page.locator('iframe').count()) {
      await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.readyState === 'complete');
      const bounds = await page.locator('iframe').boundingBox();
      assert.ok(bounds.width <= 390 && bounds.height <= 844);
      assert.ok(await page.locator('iframe').evaluate(iframe => iframe.contentDocument.documentElement.scrollWidth <= iframe.contentWindow.innerWidth + 1), `Inner mobile overflow: ${path}`);
    }
  }
  await page.goto(`${base}/library/java-to-go`);
  frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Open course contents', exact: true }).click();
  await frame.locator('a[data-card="welcome"]').waitFor({ state: 'visible' });
  await frame.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
  assert.ok(await frame.locator('body').evaluate(body => body.classList.contains('dark')));
  await page.goto(`${base}/library/stripe-payment-infrastructure`);
  await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.body?.innerText.includes('Stripe'));
  const scrolled = await page.locator('iframe').evaluate(iframe => {
    iframe.contentWindow.scrollTo(0, 1200);
    return iframe.contentDocument.scrollingElement.scrollHeight > iframe.clientHeight;
  });
  assert.ok(scrolled, 'Architecture reader has an independent scroll area');
  await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.scrollY > 0);
  await page.goto(`${base}/library/rack/whitepapers`);
  await page.locator('main').waitFor();
  await page.goto(`${base}/library/whitepapers?chapter=2`);
  await page.waitForURL('**/library/google_file_system.html');
  console.log('PASS: all 24 readers and HTML routes; 8 racks; filter intersections/reset; desktop/mobile outer layouts; bounded iframe; Go completion reload/standalone persistence; legacy GFS redirect.');
  console.log(`Runtime page errors: ${JSON.stringify(errors)}`);
  assert.equal(errors.length, 0);
} finally { await browser.close(); }
