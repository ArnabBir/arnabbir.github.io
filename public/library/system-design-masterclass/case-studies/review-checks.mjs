import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const subtree = path.join(root, 'case-studies');
async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory()
    ? pages(path.join(dir, e.name))
    : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []))).flat();
}

const files = (await pages(subtree)).sort();
assert.equal(files.length, 65);
const diagrams = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/^```mermaid[^\n]*\n([\s\S]*?)^```\s*$/gm)) {
    diagrams.push({ file: path.relative(repo, file),
      line: text.slice(0, match.index).split('\n').length, source: match[1] });
  }
}
assert.equal(diagrams.length, 315);

const numerical = [
  ['encoder worker floor', (350 / 6 + 100 / 1.5 + 50 / .25) * 60, 19500],
  ['encoder provisioned workers', 19500 / .65 * 1.25, 37500],
  ['feed deadline ms', 25 + 70 + 55 + 45 + 65 + 45 + 25 + 70, 400],
  ['recommendation deadline ms', 20 + 10 + 20 + 40 + 35 + 20 + 45 + 10, 200],
  ['half-life at one half-life', Math.exp(-Math.log(2)), .5],
  ['aggregate minimum rows/hour', 5e6, 5e6],
  ['aggregate maximum rows/hour', 5e6 * 60, 3e8],
  ['four-zone coding survivors', 14 - Math.max(4, 4, 3, 3), 10],
  ['unsafe three-zone coding survivors', 14 - Math.max(5, 5, 4), 9],
  ['eight-character namespace', 62 ** 8, 218340105584896],
];
for (const [name, actual, expected] of numerical) {
  assert.ok(Math.abs(actual - expected) <= Math.max(1, expected) * 1e-12, name);
}

// Independent specification examples, not production implementations.
let decision = 'PREPARING';
const abort = () => { if (decision === 'PREPARING') decision = 'ABORTED'; };
const commit = () => { if (decision === 'PREPARING') decision = 'COMMITTED'; };
abort(); commit(); assert.equal(decision, 'ABORTED');
decision = 'PREPARING'; commit(); abort(); assert.equal(decision, 'COMMITTED');
const oldHold = 'h1';
const seat = { hold: 'h2', state: 'HELD' };
const confirm = hold => seat.hold === hold && seat.state === 'HELD';
assert.equal(confirm(oldHold), false);
const committedPosition = 100;
assert.deepEqual(Array.from({ length: 100 }, (_, i) => 51 + i)
  .filter(i => i > committedPosition), Array.from({ length: 50 }, (_, i) => 101 + i));
const price = (maxima, start, reserve, increment) => {
  const sorted = [...maxima].sort((a, b) => b - a);
  if (!sorted.length || sorted[0] < reserve) return null;
  return Math.min(sorted[0], Math.max(start, reserve,
    sorted.length > 1 ? sorted[1] + increment : start));
};
assert.equal(price([90, 70], 50, 100, 5), null);
assert.equal(price([120, 80], 50, 100, 5), 100);
assert.equal(price([120, 120], 50, 100, 5), 120);
assert.equal(price([120], 50, 100, 5), 100);
assert.equal([1, 2, 3].filter(x => x !== 2).length, 2);
assert.equal([1, 100][0] <= [50, 150][1] && [50, 150][0] <= [1, 100][1], true);
console.log('PASS: 65 pages, 315 diagram sources, 10 numerical checks, 6 specification example groups');

if (process.argv.includes('--serve')) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/stop') {
        res.end('stopped'); server.close(); return;
      }
      if (url.pathname === '/diagrams') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(diagrams)); return;
      }
      if (url.pathname === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Case-study diagram validation</title><style>body{margin:0}#canvas{width:100%;overflow:auto}svg{max-width:100%}</style><div id="canvas"></div>');
        return;
      }
      const file = path.resolve(repo, '.' + decodeURIComponent(url.pathname));
      const modules = path.join(repo, 'node_modules') + path.sep;
      if (!file.startsWith(modules)) { res.writeHead(403); res.end(); return; }
      res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : 'text/javascript');
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end(); }
  });
  server.listen(8769, '127.0.0.1', () => console.log('Validation server: http://127.0.0.1:8769'));
}
