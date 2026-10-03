import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { systemDesign } from '../src/content/system-design.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PLAYBOOK_BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const bank = JSON.parse(await readFile('public/library/system-design-practice-lab/data/bank.json', 'utf8'));
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const overflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow: ${page.url()}`);
    await page.goto(`${base}/`);
    for (const item of systemDesign) assert.ok(await page.locator(`a[href="/library/${item.id}"]`).count(), 'Homepage path');
    await page.goto(`${base}/library`);
    await page.getByLabel('Category', { exact: true }).selectOption('System Design');
    await page.getByLabel('Format', { exact: true }).selectOption('Practice studio');
    await page.getByLabel('Search library', { exact: true }).fill('Design Gym');
    await page.locator('a[href="/library/system-design-practice-lab"]').first().waitFor();
    await overflow();
    await page.goto(`${base}/library/rack/system-design`);
    for (const item of systemDesign) {
      assert.ok(await page.locator(`a[href="/library/${item.id}"]`).count());
      if (viewport.width === 1440) {
        const manifest = JSON.parse(await readFile(`public/library/${item.id}/manifest.json`, 'utf8'));
        for (const file of manifest.files) {
          const response = await page.request.get(`${base}${file.contentPath}`);
          assert.equal(response.status(), 200, file.contentPath);
          assert.equal(createHash('sha256').update(await response.body()).digest('hex'), file.sha256, file.contentPath);
        }
      }
    }
    await overflow();
    for (const item of systemDesign) {
      await page.goto(`${base}/library/${item.id}`);
      await page.locator('iframe').waitFor();
      assert.equal(await page.locator('iframe').getAttribute('src'), item.contentPath);
      await page.frameLocator('iframe').locator('h1').first().waitFor();
      assert.ok(await page.locator(`a[href="${item.contentPath}"]`).count(), 'Full-page link');
      await overflow();
    }
    const master = `${base}/library/system-design-masterclass`;
    await page.goto(`${master}/tools/capacity-lab/index.html`);
    const card = page.locator('.sdm-calculator-card').first();
    await card.waitFor();
    const before = await card.innerText();
    await card.locator('input').first().fill('123456');
    assert.notEqual(await card.innerText(), before, 'Calculator updates');
    await overflow();
    await page.goto(`${master}/tools/practice-console/index.html`);
    await page.getByLabel('Practice prompt', { exact: true }).fill('Design a durable notification queue');
    await page.getByRole('button', { name: 'Save attempt', exact: true }).click();
    await page.reload();
    await page.getByText('Design a durable notification queue', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sdm-practice-attempts-v1')).length), 1);
    await overflow();
    const gym = `${base}/library/system-design-practice-lab/index.html`;
    for (const kind of ['single', 'multi', 'order', 'match', 'numeric']) {
      const q = bank.questions.find(question => question.kind === kind);
      await page.goto(`${gym}#/question/${q.id}`);
      await page.locator('#answer-form').waitFor();
      if (kind === 'single' || kind === 'multi') {
        for (const answer of q.answer) await page.locator(`[name="answer"][value="${answer}"]`).check();
      } else if (kind === 'numeric') await page.locator('#numeric-response').fill(String(q.numeric.value));
      else if (kind === 'match') {
        for (const [id, answer] of Object.entries(q.answer)) await page.locator(`[data-match="${id}"]`).selectOption(answer);
      } else {
        // Exercise real move controls until the expected order is reached.
        for (let target = 0; target < q.answer.length; target++) {
          const id = q.answer[target];
          while ((await page.locator('.step [data-action="move-up"]').evaluateAll(nodes => nodes.map(node => node.dataset.id))).indexOf(id) > target) {
            await page.locator(`[data-action="move-up"][data-id="${id}"]`).click();
          }
        }
      }
      await page.getByRole('button', { name: 'Check answer', exact: true }).click();
      await page.getByText('Correct under the stated assumptions.', { exact: true }).waitFor();
      await page.locator('[data-action="bookmark"]').click();
      await page.reload();
      await page.locator('[data-action="bookmark"][aria-pressed="true"]').waitFor();
      await page.getByText('Correct under the stated assumptions.', { exact: true }).waitFor();
      await overflow();
      await page.getByRole('button', { name: 'Finish session', exact: true }).click();
      await page.locator('dialog[open]').getByRole('button', { name: 'Finish session', exact: true }).click();
      await page.locator('.result-score').waitFor();
    }
    await page.goto(`${base}/library/system-design-practice-lab`);
    await page.frameLocator('iframe').locator('h1').waitFor();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('design-gym.progress.v1')));
    assert.equal(saved.saved.length, 5);
    assert.equal(Object.keys(saved.answers).length, 5);
    assert.equal(saved.sessions.length, 5);
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}px: rack, both readers, full-page links, calculator, saved practice, five graded formats, bookmarks and reload/shared-origin persistence.`);
    await context.close();
  }
} finally {
  await browser.close();
}
