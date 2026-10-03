// Read-only validation confined to the two reviewed documentation trees.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { JSDOM } from 'jsdom';
const { window } = new JSDOM('');
globalThis.window = window; globalThis.document = window.document;
const { default: mermaid } = await import('mermaid');
const root = process.cwd();
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}
const files = ['docs/practice', 'docs/lld'].flatMap(walk).sort();
let diagrams = 0, java = 0, links = 0;
const errors = [];
const renderCases = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const blocks = [...text.matchAll(/^[ \t]*```([^\n]*)\n([\s\S]*?)^[ \t]*```\s*$/gm)];
  const ds = blocks.filter(b => b[1].trim() === 'mermaid');
  const js = blocks.filter(b => b[1].trim() === 'java');
  for (const d of ds) {
    if (!await mermaid.parse(d[2], { suppressErrors: true })) errors.push(`${file}: Mermaid rejected`);
    renderCases.push({ file, code: d[2] });
  }
  diagrams += ds.length; java += js.length;
  if ((text.match(/<details\b[^>]*>/g) ?? []).length !== (text.match(/<\/details>/g) ?? []).length) errors.push(`${file}: disclosure imbalance`);
  const before = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  for (const heading of before.match(/^#{1,6} .+$/gm) ?? []) {
    if (!text.split('\n').includes(heading)) errors.push(`${file}: removed heading ${heading}`);
  }
  for (const m of text.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const url = m[1]; if (/^(?:https?:|mailto:|#)/.test(url)) continue;
    const target = decodeURIComponent(url.split('#')[0]);
    if (!target) continue;
    links++;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) errors.push(`${file}: missing ${target}`);
  }
  if (process.argv.includes('--inventory')) console.log(`${file}: ${ds.length} diagrams, ${js.length} Java fences`);
}
const diff = execFileSync('git', ['diff', '--unified=0', '--', 'docs/practice', 'docs/lld'], { encoding: 'utf8' });
for (const line of diff.split('\n')) {
  if (line.startsWith('+') && !line.startsWith('+++') && /[^\x00-\x7f]/.test(line)) errors.push('Non-ASCII added: ' + line.slice(0, 120));
}
if (files.length !== 52) errors.push(`Expected 52 pages, found ${files.length}`);
const weights = [2, 2, 2, 3, 2, 3, 3, 2, 2, 1];
const scores = [3, 2, 2, 3, 2, 2, 2, 1, 3, 2];
if (weights.reduce((a,b)=>a+b,0) !== 22 || scores.reduce((sum,s,i)=>sum+s*weights[i],0) !== 49) errors.push('Diagnostic arithmetic');
if (10000000 * 1500 * 90 * 3 * 1.3 !== 5265000000000) errors.push('C5 decimal storage arithmetic');
if (18400 / 200 !== 92 || 50000 * 5 !== 250000 || 1000000 * 1.5 !== 1500000) errors.push('Scenario arithmetic');
const reportPath = path.join(root, 'review-practice-java.json');
if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const paths = report.pages.map(p => p.path).sort();
  if (JSON.stringify(paths) !== JSON.stringify(files)) errors.push('Report page inventory mismatch');
  if (report.pages.filter(p=>p.disposition==='revised').length !== report.counts.revised_by_this_review ||
      report.pages.filter(p=>p.disposition==='retained').length !== report.counts.retained_by_this_review ||
      report.pages.some(p=>!p.full_read)) errors.push('Report disposition/read counts mismatch');
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`PASS: ${files.length} pages, ${diagrams} diagrams parsed, ${java} Java fences inventoried, ${links} local file links, original heading lines preserved, ASCII diff additions`);
if (process.argv.includes('--serve')) {
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const html = `<!doctype html><meta name="viewport" content="width=device-width"><title>Scoped diagram review</title>
    <style>body{font:16px sans-serif;margin:16px}article{overflow:auto;border:1px solid #aaa;margin:20px 0;padding:12px}svg{max-width:none!important}</style>
    ${renderCases.map((c, i) => `<article><h2>${i + 1}. ${escape(c.file)}</h2><pre class="mermaid">${escape(c.code)}</pre></article>`).join('')}
    <script type="module">import mermaid from '/mermaid.esm.min.mjs';mermaid.initialize({startOnLoad:false,securityLevel:'strict'});await mermaid.run();document.querySelectorAll('svg').forEach(svg=>svg.style.width=svg.viewBox.baseVal.width+'px');window.reviewDone=true;</script>`;
  const assets = path.resolve(root, 'node_modules/mermaid/dist');
  const server = createServer((req, res) => {
    if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
    const file = path.resolve(assets, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(assets + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(file));
  });
  server.listen(18765, '127.0.0.1', () => console.log('Diagram fixture: http://127.0.0.1:18765 (auto-closes in 120 seconds)'));
  setTimeout(() => server.close(), 120000);
}
