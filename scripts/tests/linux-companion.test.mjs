import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { makeCurriculum, labNames } from '../../src/content/linux/curriculum.mjs';
import * as m from '../../src/content/linux/models.mjs';
import { loadState, saveState, sanitizeState } from '../../src/content/linux/state.mjs';
import { categorySlug, categorySummary, curatedCategories } from '../../src/content/libraryCategories.js';

const root = new URL('../../', import.meta.url);
const nav = JSON.parse(await readFile(new URL('src/content/tlpi_nav.json', root), 'utf8'));
const units = makeCurriculum(nav);
test('70 unique substantive units preserve the legacy positional crosswalk', () => {
  assert.equal(units.length, 70);
  for (const key of ['title','explanation','contract','exercise']) assert.equal(new Set(units.map(u => u[key])).size, 70, key);
  units.forEach((u, i) => {
    assert.equal(u.position, i);
    assert.equal(u.href, i < 64 ? `chapters/ch${String(i + 1).padStart(2,'0')}.html` : `appendices/${'abcdef'[i - 64]}.html`);
    assert.ok(u.sources.length >= 2, u.id);
    assert.ok(u.explanation.length > 200 && u.contract.length > 170 && u.exercise.length > 120, `depth ${u.id}`);
    assert.equal(Object.values(u.worked).length, 5);
    assert.notEqual(u.assessment.answer, u.assessment.distractor);
    assert.ok(!JSON.stringify(u).includes(String.fromCodePoint(0x2014)));
    assert.ok(!u.lab || labNames.includes(u.lab));
  });
});
test('generated unit data matches authorship source and all local links and fragments exist', async () => {
  const generated = JSON.parse(await readFile(new URL('public/library/assets/linux/curriculum.json', root), 'utf8'));
  assert.deepEqual(generated.units, units);
  const coverage = JSON.parse(await readFile(new URL('public/library/coverage.json', root), 'utf8'));
  coverage.units.forEach((unit, index) => assert.equal(unit.legacyQueryPosition, index + 1));
  const pages = [...units.map(u => u.href), 'index.html', 'models.html', 'labs/index.html'];
  let links = 0;
  for (const page of pages) {
    const url = new URL(`public/library/${page}`, root);
    const html = await readFile(url, 'utf8');
    assert.match(html, /<html lang="en">/); assert.match(html, /<main id="main"/);
    assert.equal((html.match(/<h1>/g) || []).length, 1, page);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(match[1].replaceAll('&amp;', '&'), url);
      if (target.protocol !== 'file:') continue;
      const fragment = target.hash; target.hash = ''; await access(target); links++;
      if (fragment) assert.ok((await readFile(target, 'utf8')).includes(`id="${fragment.slice(1)}"`), `${page}: ${match[1]}`);
    }
  }
  console.log(`Linux local link inventory: ${pages.length} pages, ${links} local references checked.`);
});
test('dup shares OFD offset and status, not CLOEXEC; exec drops only flagged entries', () => {
  const initial = m.descriptorInitial(); let s = m.descriptorStep(initial, 'dup');
  assert.equal(s.fds[4].cloexec, false); assert.equal(s.fds[4].ofd, s.fds[3].ofd);
  s = m.descriptorStep(s, 'write3'); s = m.descriptorStep(s, 'write4');
  assert.equal(s.bytes, 'ABCD'); assert.equal(s.ofds[1].offset, 4);
  s = m.descriptorStep(s, 'append'); assert.equal(s.ofds[s.fds[4].ofd].append, true);
  s = m.descriptorStep(s, 'exec'); assert.equal(s.fds[3], undefined); assert.ok(s.fds[4]); assert.ok(s.ofds[1]);
  assert.equal(initial.bytes, '', 'input state immutable');
});
test('independent open has independent position and may overwrite', () => {
  let s = m.descriptorStep(m.descriptorInitial(), 'open');
  s = m.descriptorStep(m.descriptorStep(s, 'write3'), 'write4');
  assert.equal(s.bytes, 'CD'); assert.notEqual(s.fds[3].ofd, s.fds[4].ofd);
});
test('standard pending signals coalesce; default terminates, ignore discards, handler catches', () => {
  let s = m.signalInitial(); for (let i = 0; i < 3; i++) s = m.signalStep(s, 'send');
  assert.equal(s.pending, 1); assert.equal(m.signalStep(s, 'unblock').terminated, true);
  let caught = m.signalStep(m.signalStep(s, 'handler'), 'unblock'); assert.equal(caught.handled, 1); assert.equal(caught.pending, 0);
  caught = m.signalStep(caught, 'send'); assert.equal(caught.handled, 2, 'unblocked generations can be delivered separately');
  s = m.signalStep(s, 'ignore'); assert.equal(s.pending, 0); assert.equal(m.signalStep(s, 'send').pending, 0);
});
test('zero-count is not EOF; buffered data precedes EOF; live writer makes EAGAIN', () => {
  const p = { bytes: 'XYZ', writers: 0 };
  assert.equal(m.pipeRead(p, 0).bytes, 'XYZ'); assert.match(m.pipeRead(p, 0).meaning, /no EOF/);
  assert.equal(m.pipeRead(p, 2).result, 2); assert.equal(m.pipeRead(p, 2).bytes, 'Z');
  assert.equal(m.pipeRead({ bytes: '', writers: 0 }, 1).result, 0);
  assert.equal(m.pipeRead({ bytes: '', writers: 1 }, 1).result, 'EAGAIN');
  assert.equal(m.pipeRead({ bytes: '', writers: 1, nonblock: false }, 1).result, 'would block');
  assert.throws(() => m.pipeRead(p, -1));
});
test('ordinary TIME_WAIT follows active closer, independently of server/client', () => {
  for (const active of ['client','server']) {
    const trace = m.tcpClose(active); const passive = active === 'client' ? 'server' : 'client';
    assert.equal(trace.at(-1)[active], 'TIME-WAIT'); assert.equal(trace.at(-1)[passive], 'CLOSED');
    assert.equal(trace[2][active], 'FIN-WAIT-2');
  }
});
test('weighted shares normalize without claiming a scheduling order', () => {
  const shares = m.weightedShares([1024,335]); assert.ok(Math.abs(shares[0] - 0.7535) < .0001);
  assert.equal(shares.reduce((a,b) => a+b), 1); assert.throws(() => m.weightedShares([0]));
});
test('PTY echo, canonical buffering and ISIG are separate controls', () => {
  const start = { pending:'', canonical:true, echo:true, isig:true };
  let s = m.ptyStep(start, 'text'); assert.equal(s.pending, 'a'); assert.equal(s.readable, ''); assert.equal(s.echoOutput, 'a');
  s = m.ptyStep(s, 'newline'); assert.equal(s.readable, 'a\n'); assert.equal(s.pending, '');
  s = m.ptyStep(start, 'interrupt'); assert.match(s.signal, /SIGINT/); assert.equal(s.readable, '');
  s = m.ptyStep({ ...start, canonical:false, isig:false }, 'interrupt'); assert.equal(s.readable, '\u0003'); assert.equal(s.signal, null);
  s = m.ptyStep({ ...start, echo:false }, 'text'); assert.equal(s.echoOutput, ''); assert.equal(s.pending, 'a');
});
test('partial drain retains bytes but does not guarantee another edge', () => {
  for (const mode of ['edge','level']) {
    let s = { bytes:0, edge:false, observed:false, mode };
    for (const action of ['arrive','poll','read','poll']) s = m.readinessStep(s, action);
    assert.equal(s.bytes, 5); assert.equal(s.observed, mode === 'level');
    s = m.readinessStep(s, 'drain'); assert.equal(s.bytes, 0);
  }
});
test('corrupt, unavailable and stale storage cannot break reader state', () => {
  const ids = units.map(u => u.id);
  for (const text of ['{', 'null', '[]', '{"version":9}']) assert.equal(loadState({ getItem: () => text }, ids).completed.length, 0);
  assert.equal(loadState(undefined, ids).version, 1); assert.equal(saveState(undefined, {}), false);
  const s = sanitizeState({ version:1, completed:['ch01','ch01','bogus'], notes:{ ch01:'x'.repeat(5000) }, answers:{ ch02:true, ch03:'true' } }, ids);
  assert.deepEqual(s.completed, ['ch01']); assert.equal(s.notes.ch01.length, 4000); assert.deepEqual(s.answers, { ch02:true });
});
test('homepage category priority and slug compatibility', () => {
  assert.deepEqual(curatedCategories.slice(0,4).map(x => x[0]), ['System Design','Whitepapers','Search & AI Systems','Systems Programming']);
  assert.equal(categorySlug('Search & AI Systems'), 'search-and-ai-systems');
  assert.deepEqual(categorySummary([{ category:'Systems Programming', chapters:units }], 'Systems Programming'), { books:1, units:70 });
});
