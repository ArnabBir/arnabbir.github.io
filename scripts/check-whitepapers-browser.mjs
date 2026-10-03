// Run against npm run preview. An existing Playwright installation can be supplied.
import assert from 'node:assert/strict';
import { learningPaths } from '../src/content/paperResearch.js';
import { whitepaperCatalog } from '../src/content/whitepapers.js';
import { allResearchGuides, guideById, guidePath, guideLabel } from '../src/content/paperGuides.js';
import { legacyPublicCopies, sourceAccessNotes } from '../src/content/legacyPaperSources.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAPER_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow: ${page.url()}`);
const rack = () => page.goto(`${base}/library/rack/whitepapers`);
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await rack();
    await page.getByRole('status').filter({ hasText: 'Showing 76 of 76 entries' }).waitFor();
    assert.equal(await page.locator('main article').count(), whitepaperCatalog.length);
    assert.equal(await page.getByText('Citation details', { exact: true }).count(), whitepaperCatalog.length);
    assert.equal(await page.getByRole('link', { name: /^Open research workspace\s*:/ }).count(), 52);
    await noOverflow();
    await page.getByRole('textbox', { name: 'Search papers', exact: true }).fill('Ongaro 2014');
    await page.getByRole('status').filter({ hasText: 'Showing 1 of 76 entries' }).waitFor();
    await page.reload();
    assert.equal(await page.getByRole('textbox', { name: 'Search papers', exact: true }).inputValue(), 'Ongaro 2014');
    await page.getByLabel('Topic', { exact: true }).selectOption('Storage');
    await page.getByRole('heading', { name: 'No matching papers' }).waitFor();
    await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
    await page.getByLabel('Format', { exact: true }).selectOption('Reading guide');
    await page.getByRole('status').filter({ hasText: 'Showing 24 of 76 entries' }).waitFor();
    await page.getByLabel('Sort', { exact: true }).selectOption('newest');
    assert.match(await page.locator('main article').first().innerText(), /PagedAttention/);
    await page.getByLabel('Source type').selectOption('Technical report');
    await page.getByRole('status').filter({ hasText: 'Showing 1 of 76 entries' }).waitFor();
    assert.match(await page.locator('main article').innerText(), /Dapper/);
    for (const path of learningPaths) {
      await page.getByRole('button', { name: new RegExp(path.title) }).click();
      await page.getByRole('status').filter({ hasText: `Showing ${path.ids.length} of 76 entries` }).waitFor();
      assert.equal(await page.locator('main article').count(), path.ids.length);
    }
    await page.getByRole('link', { name: 'Explore the model labs' }).click();
    await page.getByRole('status').filter({ hasText: 'Showing 14 of 76 entries' }).waitFor();
    for (const paper of allResearchGuides) {
      await page.goto(`${base}${guidePath(paper)}`);
      await page.getByRole('heading', { name: paper.shortTitle, exact: true, level: 1 }).waitFor();
      assert.equal(await page.getByRole('link', { name: 'Read original source', exact: false }).getAttribute('href'), paper.source);
      assert.equal(await page.locator('.research-figure li').count(), paper.diagram.length);
      assert.equal(await page.locator('main h1').count(), 1);
      await page.getByRole('figure', { name: /Conceptual sequence drawn for this guide/ }).waitFor();
      assert.ok((await page.locator('.research-eyebrow').first().textContent()).includes(guideLabel(paper)));
      assert.equal(await page.getByLabel('Compare research guides').locator('option').count(), 76);
      if (paper.demoPath) assert.equal(await page.getByRole('link', { name: 'Open original interactive experience' }).getAttribute('href'), paper.demoPath);
      if (legacyPublicCopies[paper.id]) assert.equal(await page.getByRole('link', { name: 'Read verified public copy' }).getAttribute('href'), legacyPublicCopies[paper.id].url);
      if (sourceAccessNotes[paper.source]) await page.locator('.research-access-note').waitFor();
      for (const artifact of paper.artifacts) assert.ok(await page.locator(`#artifacts a[href="${artifact.url}"]`).count());
      for (const related of paper.related) assert.ok(await page.locator(`.research-related a[href="${guidePath(guideById[related.id])}"]`).count());
      const index = whitepaperCatalog.findIndex(p => p.id === paper.id);
      const adjacent = [whitepaperCatalog[index - 1], whitepaperCatalog[index + 1]].filter(Boolean);
      const pagination = page.getByRole('navigation', { name: 'Adjacent reading workspaces' });
      assert.equal(await pagination.getByRole('link').count(), adjacent.length);
      for (const entry of adjacent) assert.ok(await pagination.locator(`a[href="${guidePath(guideById[entry.id])}"]`).count());
      assert.deepEqual(await page.locator('main').evaluate(main => [...main.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => !document.getElementById(id))), []);
      await page.getByText('Reveal reasoning guidance', { exact: true }).click();
      await page.getByText(paper.exercise.guidance, { exact: true }).waitFor();
      if (paper.id !== 'druid') assert.equal(await page.locator('option[value="druid"]').innerText(), 'Druid architecture (Undated)');
      await noOverflow();
    }
    for (const id of ['bloom-paradox', 'gorilla']) {
      await page.goto(`${base}/library/whitepapers/${id}`);
      const experiment = page.getByRole('region', { name: 'Deterministic experiment' });
      await experiment.waitFor();
      const before = await experiment.getByRole('status').innerText();
      if (id === 'bloom-paradox') {
        await page.getByLabel('True-hit queries').selectOption('100');
        await experiment.getByText('Filter costs more.', { exact: false }).waitFor();
        await page.getByLabel('Filter bits').selectOption('32');
        await page.getByLabel('Hash functions').selectOption('8');
      } else await page.getByLabel('Sampling pattern').selectOption('gap');
      assert.notEqual(await experiment.getByRole('status').innerText(), before);
      await page.getByRole('button', { name: 'Reset experiment' }).click();
      assert.equal(await experiment.getByRole('status').innerText(), before);
      await noOverflow();
    }
    await page.goto(`${base}/library/whitepapers/pregel`);
    await page.getByRole('button', { name: 'Next superstep' }).waitFor();
    const before = await page.locator('.lab-vertices').innerText();
    await page.getByRole('button', { name: 'Next superstep' }).click();
    assert.notEqual(await page.locator('.lab-vertices').innerText(), before);
    await page.getByRole('button', { name: 'Reset lab' }).click();
    assert.equal(await page.locator('.lab-vertices').innerText(), before);
    await noOverflow();
    await page.goto(`${base}/library/whitepapers/spanner`);
    await page.getByRole('heading', { name: 'Spanner Simulation', exact: true }).waitFor();
    await noOverflow();
    for (const id of ['bitcoin', 'myrocks']) {
      const paper = whitepaperCatalog.find(p => p.id === id);
      await page.goto(`${base}${paper.contentPath}`);
      const nav = page.getByRole('navigation', { name: 'Paper navigation', exact: true });
      await nav.getByText(`Citation: ${paper.year ?? 'Undated'} · ${paper.sourceType}`, { exact: true }).click();
      await nav.getByText(paper.authors.join(', '), { exact: true }).waitFor();
      assert.ok(!(await nav.innerText()).includes('and collaborators'));
      if (paper.citationNote) await nav.getByText(paper.citationNote, { exact: true }).waitFor();
      await noOverflow();
    }
    await page.goto(`${base}/library/whitepapers?chapter=2`);
    await page.waitForURL('**/library/google_file_system.html');
    assert.ok((await page.locator('body').innerText()).includes('Google File System'));
    for (const entry of whitepaperCatalog.filter(p => p.kind === 'Legacy interactive')) {
      await page.goto(`${base}${entry.contentPath}`);
      assert.equal(await page.getByRole('link', { name: 'Reading workspace', exact: true }).getAttribute('href'), entry.researchPath);
      await noOverflow();
    }
  }
  await page.goto(`${base}/library/whitepapers/monarch/research`);
  await page.locator('#paper-notes').fill('Weight error ratios by request count.');
  await page.getByLabel('Compare research guides').selectOption('myrocks');
  await page.locator('.research-comparison').getByRole('link', { name: 'MyRocks foundations', exact: true }).click();
  await page.getByRole('heading', { name: 'MyRocks foundations', level: 1 }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), '');
  await page.getByRole('navigation', { name: 'Adjacent reading workspaces' }).getByRole('link', { name: /Previous in collection/ }).click();
  await page.getByRole('heading', { name: 'Monarch', level: 1 }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), 'Weight error ratios by request count.');
  await page.getByRole('link', { name: 'Try the reading exercise' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/research#practice');
  await page.getByText('Reveal reasoning guidance', { exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#practice details').getAttribute('open'), '');
  await page.goto(`${base}/library/whitepapers/raft`);
  await page.getByLabel('Compare research guides').selectOption('foundationdb');
  assert.equal(await page.locator('.research-comparison article').count(), 2);
  await noOverflow();
  await page.locator('#paper-notes').fill('A majority preserves the committed prefix.');
  await page.reload();
  assert.equal(await page.locator('#paper-notes').inputValue(), 'A majority preserves the committed prefix.');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export worksheet' }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'raft-reading-notes.md');
  const stream = await download.createReadStream();
  let exported = ''; for await (const chunk of stream) exported += chunk.toString();
  assert.ok(exported.includes('A majority preserves the committed prefix.'));
  assert.ok(exported.includes('Diego Ongaro'));
  await page.getByLabel('Compare research guides').selectOption('foundationdb');
  await page.locator('.research-comparison').getByRole('link', { name: 'FoundationDB', exact: true }).click();
  await page.getByRole('heading', { name: 'FoundationDB', exact: true, level: 1 }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), '');
  assert.equal(await page.getByLabel('Compare research guides').inputValue(), '');
  await page.goBack();
  await page.getByRole('heading', { name: 'Raft', exact: true, level: 1 }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), 'A majority preserves the committed prefix.');
  await page.locator('.research-related a').filter({ hasText: 'ZooKeeper' }).click();
  await page.getByRole('heading', { name: 'ZooKeeper', exact: true, level: 1 }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), '');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  assert.ok(await page.locator('html').evaluate(el => el.classList.contains('dark')));
  await noOverflow();
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key.startsWith('paper-notebook:')) throw new Error('Storage blocked'); return original.call(this, key, value); };
  });
  await page.reload();
  await page.locator('#paper-notes').fill('Keep these notes even without storage.');
  await page.getByRole('status').filter({ hasText: 'Could not save locally' }).waitFor();
  assert.equal(await page.locator('#paper-notes').inputValue(), 'Keep these notes even without storage.');
  assert.deepEqual(errors, []);
  console.log(`PASS: ${allResearchGuides.length} guides at 1440px and 390px; preserved original demo links; Bloom and Gorilla computed controls/reset; 76-card rack and citation details; filters; six paths; verified public-copy/source/artifact hrefs; labeled figures and guide types; exercises; 76-option grouped comparison; local notes, export and storage failure; legacy comparison and adjacent navigation; keyboard exercise access; light/dark; legacy Pregel controls, Spanner and GFS routing; Bitcoin and MyRocks attribution; no page errors or checked-page overflow.`);
} finally { await browser.close(); }
