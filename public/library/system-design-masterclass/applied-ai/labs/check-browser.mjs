// Uses an existing Playwright installation; output stays in the supplied artifact directory.
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const site = path.resolve(process.env.REVIEW_SITE);
const output = path.resolve(process.env.REVIEW_OUTPUT);
await stat(site);
await stat(output);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const record = JSON.parse(await readFile(path.join(root, 'review-applied-ai.json'), 'utf8'));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = path.resolve(site, '.' + pathname);
    if (!target.startsWith(site + path.sep)) throw new Error('Outside site');
    res.setHeader('Content-Type', mime[path.extname(target)] ?? 'application/octet-stream');
    res.end(await readFile(target));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
let next = 0;
try {
  await Promise.all(Array.from({ length: 3 }, async () => {
    const page = await browser.newPage();
    while (next < record.pages.length) {
      const entry = record.pages[next++];
      const text = await readFile(path.join(root, entry.path), 'utf8');
      const expected = [...text.matchAll(/^```mermaid$/gm)].length;
      const authoredSummaries = [...text.matchAll(/<summary>(.*?)<\/summary>/g)].map(match => match[1].trim());
      const result = { path: entry.path, sha256: createHash('sha256').update(text).digest('hex'), expected_diagrams: expected, views: [] };
      for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
        const errors = [];
        const onError = error => errors.push(error.message.split('\n')[0]);
        page.on('pageerror', onError);
        const view = { name, width, errors, screenshots: [] };
        try {
          await page.setViewportSize({ width, height });
          const route = entry.path.replace(/^docs\//, '').replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '/');
          const response = await page.goto(origin + '/' + route, { waitUntil: 'networkidle', timeout: 30000 });
          if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
          const authored = await page.locator('article details').evaluateAll((details, summaries) => details
            .filter(el => summaries.includes(el.querySelector(':scope > summary')?.textContent.trim()))
            .map(el => ({ open: el.open, summary: el.querySelector(':scope > summary').textContent.trim() })), authoredSummaries);
          if (authored.length !== authoredSummaries.length) throw new Error('Authored answer disclosure missing');
          view.initial_open_answers = authored.filter(el => el.open).length;
          if (view.initial_open_answers) throw new Error('Answer open on initial load');
          await page.evaluate(() => document.querySelectorAll('article details').forEach(el => { el.open = true; }));
          if (expected) {
            await page.waitForFunction(n => document.querySelectorAll('article .mermaid svg').length === n, expected, { timeout: 30000 });
            await page.waitForFunction(n => document.querySelectorAll('article .sdm-diagram-shell').length === n, expected);
          }
          view.diagram_geometry = await page.locator('article .mermaid svg').evaluateAll(svgs => svgs.map(svg => {
            const box = svg.getBoundingClientRect();
            return { width: box.width, height: box.height, viewBox: svg.getAttribute('viewBox'), labels: svg.querySelectorAll('text,foreignObject').length };
          }));
          if (view.diagram_geometry.some(x => x.width <= 0 || x.height <= 0 || !x.labels)) throw new Error('Empty diagram geometry');
          view.page_overflow_px = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (view.page_overflow_px > 2) throw new Error(`Page overflow ${view.page_overflow_px}px`);
          const shells = page.locator('article .sdm-diagram-shell');
          for (let i = 0; i < expected; i++) {
            const shell = shells.nth(i);
            await shell.locator('[data-action="reset"]').click();
            const pan = await shell.locator('.sdm-diagram-viewport').evaluate(el => {
              el.scrollLeft = el.scrollWidth;
              el.scrollTop = el.scrollHeight;
              const value = { client: el.clientWidth, scroll: el.scrollWidth, reached: el.scrollLeft,
                clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, reachedTop: el.scrollTop };
              el.scrollLeft = 0;
              el.scrollTop = 0;
              return value;
            });
            if (pan.scroll > pan.client + 2 && pan.reached <= 0) throw new Error('Wide diagram is not pannable');
            if (pan.scrollHeight > pan.clientHeight + 2 && pan.reachedTop <= 0) throw new Error('Tall diagram is not pannable');
            await shell.locator('[data-action="fit"]').click();
            const filename = entry.path.replace(/^docs\/applied-ai\//, '').replace(/\.md$/, '').replaceAll('/', '-') + `-${i + 1}-${name}.png`;
            // After testing the real scroll container, expand its height only for the review artifact.
            const viewport = shell.locator('.sdm-diagram-viewport');
            const originalStyle = await viewport.getAttribute('style');
            await viewport.evaluate(el => { el.style.maxHeight = 'none'; });
            await shell.screenshot({ path: path.join(output, filename) });
            await viewport.evaluate((el, style) => {
              if (style === null) el.removeAttribute('style'); else el.setAttribute('style', style);
            }, originalStyle);
            view.screenshots.push(filename);
          }
          view.pass = errors.length === 0;
        } catch (error) {
          errors.push(error.message.split('\n')[0]);
          view.pass = false;
        } finally {
          page.off('pageerror', onError);
        }
        result.views.push(view);
      }
      results.push(result);
    }
    await page.close();
  }));
  const shots = results.sort((a, b) => a.path.localeCompare(b.path))
    .flatMap(row => row.views.filter(view => view.name === 'desktop').flatMap(view => view.screenshots));
  const gallery = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  for (let start = 0; start < shots.length; start += 6) {
    const cards = [];
    for (const filename of shots.slice(start, start + 6)) {
      const image = (await readFile(path.join(output, filename))).toString('base64');
      cards.push(`<section><p>${filename}</p><img src="data:image/png;base64,${image}"></section>`);
    }
    await gallery.setContent(`<style>body{margin:12px;background:#eee;font:16px sans-serif}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}section{background:white;padding:8px}img{width:100%;height:340px;object-fit:contain}p{overflow-wrap:anywhere}</style><main class="grid">${cards.join('')}</main>`);
    await gallery.screenshot({ path: path.join(output, `contact-${start / 6 + 1}.png`), fullPage: true });
  }
  await gallery.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
results.sort((a, b) => a.path.localeCompare(b.path));
const failures = results.flatMap(row => row.views.filter(view => !view.pass).map(view => ({ path: row.path, view: view.name, errors: view.errors })));
const report = { pages: results.length, views: results.length * 2, diagrams: results.reduce((n, x) => n + x.expected_diagrams, 0), failures, results };
await writeFile(path.join(output, 'applied-ai-browser.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pages: report.pages, views: report.views, diagrams: report.diagrams, failures, report: path.join(output, 'applied-ai-browser.json') }, null, 2));
if (failures.length) process.exitCode = 1;
