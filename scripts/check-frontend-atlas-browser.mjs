import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { frontendAtlas } from '../src/content/frontend-atlas.js';
const { chromium, expect } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const base = process.env.PLAYBOOK_BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const fits = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
try {
  const manifest = JSON.parse(await readFile('public/library/frontend-atlas/manifest.json', 'utf8'));
  for (const file of manifest.files) {
    const response = await page.request.get(`${base}${file.contentPath}`);
    assert.equal(response.status(), 200);
    assert.equal(createHash('sha256').update(await response.body()).digest('hex'), file.sha256);
  }
  await page.goto(`${base}/library`);
  await page.getByLabel('Category', { exact: true }).selectOption('Frontend');
  await page.getByLabel('Topic', { exact: true }).selectOption('React');
  await page.getByLabel('Format', { exact: true }).selectOption('Study course');
  await expect(page.locator('main article')).toHaveCount(1);
  await page.getByRole('link', { name: frontendAtlas.title, exact: true }).last().click();
  await expect(page.getByRole('heading', { name: frontendAtlas.title })).toBeVisible();
  let frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: 'Your frontend journey starts here.' })).toBeVisible();
  await frame.getByRole('link', { name: /Start your journey/ }).click();
  await frame.locator('#complete').click();
  await expect(frame.locator('#complete')).toContainText('Mark as unfinished');
  await page.reload();
  frame = page.frameLocator('iframe');
  await frame.locator('#content').waitFor();
  await page.locator('iframe').evaluate(el => { el.contentWindow.location.hash = 'lesson/web-1'; });
  await expect(frame.locator('#complete')).toContainText('Mark as unfinished');
  await fits();
  // Standalone shares progress and retains every internal chapter, lesson, lab and project route.
  await page.goto(`${base}${frontendAtlas.contentPath}#lesson/web-1`);
  await expect(page.locator('#complete')).toContainText('Mark as unfinished');
  const go = async hash => { await page.evaluate(hash => { location.hash = hash; }, hash); await page.waitForFunction(hash => location.hash === hash && document.querySelector('#content h1'), hash); await page.waitForTimeout(30); };
  await go('#path');
  const modules = await page.locator('.path-card').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  assert.equal(modules.length, 16);
  const lessons = [];
  for (const module of modules) {
    await go(module);
    const links = await page.locator('.lesson-row').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
    assert.equal(links.length, 5);
    lessons.push(...links);
  }
  for (const lesson of lessons) { await go(lesson); await expect(page.locator('#complete')).toBeVisible(); }
  for (const [hash, selector, count] of [['#labs', '.lab-card', 9], ['#projects', '.project-card', 8]]) {
    await go(hash);
    const links = await page.locator(selector).evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
    assert.equal(links.length, count);
    for (const link of links) { await go(link); await expect(page.locator('#content')).not.toContainText('That page isn’t in this playbook.'); }
  }
  await go('#lab/state');
  await page.locator('#state-update').click();
  await expect(page.locator('#state-count')).toHaveText('3');
  await go('#playground');
  await page.getByLabel('Playground mode').selectOption('react');
  await page.getByLabel('Code editor').fill('import React from "react"; import {createRoot} from "react-dom/client"; function App(){const [n,setN]=React.useState<number>(0);return <button onClick={()=>setN(n+1)}>Count {n}</button>} createRoot(document.getElementById("root")!).render(<App/>);');
  await page.getByRole('button', { name: 'Run code' }).click();
  const preview = page.frameLocator('#pg-preview');
  await preview.getByRole('button', { name: 'Count 0' }).click();
  await expect(preview.getByRole('button', { name: 'Count 1' })).toBeVisible();
  await go('#project/taskflow');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download local reference project' }).click();
  assert.equal((await downloadPromise).suggestedFilename(), 'taskflow-reference.zip');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/library/rack/frontend`);
  await expect(page.getByRole('heading', { name: 'Frontend', exact: true })).toBeVisible();
  await fits();
  await page.goto(`${base}/library/frontend-atlas`);
  frame = page.frameLocator('iframe');
  await frame.locator('#menu').waitFor();
  await page.locator('iframe').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await frame.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await frame.locator('[data-nav="labs"]').click();
  await expect(frame.locator('.lab-card')).toHaveCount(9);
  await frame.getByRole('button', { name: 'Switch color theme' }).click();
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
  await frame.getByRole('button', { name: 'Search all lessons' }).click();
  await frame.locator('#global-search').fill('closure');
  await frame.locator('.search-result').first().click();
  await expect(frame.locator('#complete')).toBeVisible();
  await fits();
  assert.ok(await page.locator('iframe').evaluate(el => el.contentDocument.documentElement.scrollWidth <= el.contentWindow.innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log('PASS: Frontend filters/rack/reader; 16 chapters, 80 lessons, 9 labs, 8 projects; progress persistence; React/TSX execution; download; mobile navigation/search/theme/layout; no runtime errors.');
} finally { await browser.close(); }
