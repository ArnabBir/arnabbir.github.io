import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { initialLab, reduceLab, maximalVersions, networkResult, capacityResult, budgetResult } from './models.js';
import { paperMetadata, labIds, resolvePaperChapter } from '../../../content/whitepapers.js';
import { LibraryItemSchema } from '../../../content/schema.js';

const run = (id, actions) => actions.reduce((s, action) => reduceLab(id, s, typeof action === 'string' ? { type: action } : action), initialLab(id));
const set = (key, value) => ({ type: 'set', key, value });

test('52 stable chapter destinations: every native route, legacy file, and metadata record exists', () => {
  assert.equal(paperMetadata.length, 52);
  assert.equal(new Set(paperMetadata.map(p => p.id)).size, 52);
  const app = readFileSync(new URL('../../../App.jsx', import.meta.url), 'utf8');
  const routes = [...app.matchAll(/path: "([^"]+)"/g)].map(m => m[1]);
  const imports = new Map([...app.matchAll(/const (\w+) = lazy\(\(\) => import\("([^"]+)"\)\);/g)].map(m => [m[1], m[2]]));
  for (const [, id, component] of app.matchAll(/path: "([^"]+)", component: (\w+)/g)) {
    const source = readFileSync(new URL(`../../../${imports.get(component)}.jsx`, import.meta.url), 'utf8');
    const paper = paperMetadata.find(p => p.id === id);
    assert.equal(paper.kind === 'Guided walkthrough', source.includes('import PaperSimulationScaffold'), `${id}: format must match the mounted implementation`);
  }
  for (const [i, paper] of paperMetadata.entries()) {
    assert.equal(resolvePaperChapter(String(i + 1)), paper.contentPath);
    assert.ok(paper.objective && paper.category && paper.sourceLabel && new URL(paper.source).protocol === 'https:');
    if (paper.contentPath.endsWith('.html')) assert.ok(existsSync(new URL(`../../../../public${paper.contentPath}`, import.meta.url)), paper.contentPath);
    else assert.ok(routes.includes(paper.id) || labIds.includes(paper.id), paper.id);
  }
  assert.equal(paperMetadata.filter(p => p.kind === 'Model lab').length, 14);
  assert.equal(paperMetadata.filter(p => p.kind === 'Guided walkthrough').length, 19);
});

test('legacy chapter resolver rejects malformed or out-of-range indices', () => {
  for (const value of [null, '', '0', '-1', '1x', '1.5', '01', '53', 'Infinity']) assert.equal(resolvePaperChapter(value), null);
});

test('content validation preserves the metadata consumed by rack and lab pages', () => {
  const result = LibraryItemSchema.parse({ id: 'whitepapers', title: 'Papers', description: 'Test', category: 'Whitepapers', contentPath: '/library/rack/whitepapers', chapters: paperMetadata.map(p => ({ title: p.id, ...p })) });
  assert.deepEqual(result.chapters, paperMetadata.map(p => ({ title: p.id, ...p })));
});

test('each model reset restores exactly the initial state', () => {
  for (const id of labIds) assert.deepEqual(reduceLab(id, { arbitrary: true }, { type: 'reset' }), initialLab(id));
});

test('Pregel crosses one edge per barrier and converges to shortest paths', () => {
  let s = run('pregel', ['step']);
  assert.deepEqual(s.distances, [0, 2, 7, Infinity, Infinity]);
  for (let i = 0; i < 5; i++) s = reduceLab('pregel', s, { type: 'step' });
  assert.deepEqual(s.distances, [0, 2, 3, 4, 7]);
  assert.deepEqual(s.frontier, []);
});

test('Pregel worker failure cannot partially advance a barrier', () => {
  const s = run('pregel', [set('failed', true), 'step']);
  assert.equal(s.step, 0);
  assert.deepEqual(s.distances, initialLab('pregel').distances);
});

test('coded storage repairs two erasures but not three; a full replica suffices', () => {
  assert.deepEqual(run('colossus', [set('failed', [0, 1]), 'repair']).failed, []);
  assert.deepEqual(run('colossus', [set('failed', [0, 1, 2]), 'repair']).failed, [0, 1, 2]);
  assert.deepEqual(run('colossus', [{ type: 'mode', value: 'replicated' }, set('failed', [0, 1]), 'repair']).failed, []);
});

test('Percolator recovers to all old or all new values according to primary status', () => {
  const before = run('percolator', ['step', 'crash', 'recover']);
  assert.deepEqual([before.primary, before.secondary, before.locks, before.phase], [100, 100, false, 'aborted']);
  const after = run('percolator', ['step', 'step', 'crash', 'recover']);
  assert.deepEqual([after.primary, after.secondary, after.locks, after.phase], [90, 110, false, 'done']);
  assert.equal(after.primary + after.secondary, 200);
});

test('MillWheel dedup and finalization prevent duplicate or late mutation', () => {
  const early = run('millwheel', ['deliver', 'deliver', 'watermark', 'deliver', 'deliver', 'deliver']);
  assert.deepEqual([early.sum, early.duplicates, early.dropped], [10, 1, 1]);
  const late = run('millwheel', ['deliver', 'deliver', 'deliver', 'deliver', 'watermark']);
  assert.equal(late.sum, 13);
});

test('gradient descent converges below stability threshold and diverges above it', () => {
  const stable = run('tensorflow', Array(20).fill('train'));
  assert.ok(Math.abs(stable.weight - 2) < 0.00001);
  const unstable = run('tensorflow', [set('rate', 0.5), 'train', 'train', 'train']);
  assert.ok(unstable.history.at(-1) > 10);
});

test('Lambda snapshot coverage preserves the logical count across catch-up', () => {
  for (const actions of [['batch'], ['batch', 'append', 'append'], ['append', 'batch', 'append', 'batch']]) {
    const s = run('lambda-architecture', actions);
    assert.equal(s.batch + s.speed.filter(id => id > s.cutoff).length, s.events.length);
  }
});

test('security evaluation is invalidated when a policy assumption changes', () => {
  const s = run('google-infrastructure-security', ['evaluate', set('authorized', false)]);
  assert.equal(s.evaluated, false);
  assert.equal(s.authorized, false);
});

test('durable dedup prevents duplicate join outputs after a lost acknowledgement', () => {
  assert.equal(run('photon-pubsub', ['left', 'right', 'right']).outputs, 1);
  assert.equal(run('photon-pubsub', [set('dedup', false), 'left', 'right', 'right']).outputs, 2);
  assert.equal(run('photon-pubsub', ['right', 'left', 'left']).outputs, 1);
});

test('Jupiter offered demand is conserved and throughput never exceeds surviving capacity', () => {
  for (let mask = 0; mask < 16; mask++) {
    const failed = [0, 1, 2, 3].filter(i => mask & (1 << i));
    const r = networkResult({ flows: 17, capacity: 10, failed });
    assert.ok(r.carried <= (4 - failed.length) * 10);
    assert.ok(r.carried <= r.offered);
    assert.equal(r.loads.reduce((a, b) => a + b, 0), failed.length === 4 ? 0 : r.offered);
  }
});

test('Autopilot recommendations increase with margin, not with an unobserved current spike', () => {
  const small = run('autopilot', [set('margin', 0), 'recommend']);
  const large = run('autopilot', [set('margin', 100), 'recommend']);
  assert.equal(small.cpu, 2.8);
  assert.equal(large.cpu, 5.6);
  assert.equal(large.memory, 10);
});

test('datacenter capacity is limited by power, racks, and network', () => {
  const s = initialLab('inside-google-datacenters');
  assert.equal(capacityResult(s).usable, 800);
  assert.equal(capacityResult({ ...s, failed: 4 }).usable, 0);
  assert.equal(capacityResult({ ...s, power: 1 }).usable, 100);
  assert.equal(capacityResult({ ...s, uplink: 0 }).usable, 0);
});

test('SRE 99.9% SLO gives 1000 allowed errors per million and 10x burn at 1% errors', () => {
  const r = budgetResult(initialLab('sre-workbook'));
  assert.ok(Math.abs(r.allowed - 1000) < 1e-6);
  assert.ok(Math.abs(r.burn - 10) < 1e-6);
  assert.ok(Math.abs(r.remaining - 800) < 1e-6);
});

test('SRE exact exhaustion and burn thresholds are not shifted by floating-point noise', () => {
  const r = budgetResult({ ...initialLab('sre-workbook'), slo: 99.8, errors: 2000, recentRate: 2.88 });
  assert.equal(r.remaining, 0);
  assert.equal(r.burn, 14.4);
});

test('Dynamo preserves concurrent versions and reconciliation dominates observed siblings', () => {
  let s = run('dynamo', [set('w', 1), set('partition', true), 'write', set('coordinator', 1), set('value', 'cart:pen'), 'write', set('partition', false), 'read']);
  assert.equal(s.observed.length, 2);
  s = reduceLab('dynamo', s, { type: 'resolve' });
  assert.ok(s.replicas.every(v => v.length === 1));
  assert.deepEqual(s.replicas[0][0].clock, [1, 2, 0]);
});

test('Dynamo timed-out writes persist and offline replicas only repair after recovery', () => {
  let s = run('dynamo', [set('partition', true), 'write']);
  assert.match(s.note, /timeout/);
  assert.equal(s.replicas[0].length, 1);
  assert.equal(s.replicas[1].length, 0);
  s = reduceLab('dynamo', s, set('partition', false));
  s = reduceLab('dynamo', s, { type: 'read' });
  assert.ok(s.replicas.every(v => v.length === 1));
});

test('vector dominance removes ancestors but not concurrent values', () => {
  const v = clock => ({ clock, value: String(clock) });
  assert.equal(maximalVersions([v([1, 0, 0]), v([2, 0, 0])]).length, 1);
  assert.equal(maximalVersions([v([1, 0, 0]), v([0, 1, 0])]).length, 2);
});

test('Paxos higher ballot must preserve chosen value even when candidate changes', () => {
  const s = run('paxos-simple', ['prepare', 'accept', set('ballot', 2), set('value', 'red'), 'prepare', 'accept']);
  assert.equal(s.chosen, 'blue');
  assert.equal(s.round.value, 'blue');
  assert.ok(s.acceptors.every(a => a.value === 'blue' && a.promised === 2));
});

test('Paxos majority remains safe across each one-node failure and recovery', () => {
  for (let failed = 0; failed < 3; failed++) {
    const s = run('paxos-simple', [{ type: 'online', index: failed }, 'prepare', 'accept', { type: 'online', index: failed }, set('ballot', 2), set('value', 'red'), 'prepare', 'accept']);
    assert.equal(s.chosen, 'blue');
  }
});

test('Paxos cannot choose without a quorum; promises never decrease', () => {
  const s = run('paxos-simple', [{ type: 'online', index: 0 }, { type: 'online', index: 1 }, 'prepare', 'accept']);
  assert.equal(s.chosen, null);
  const high = run('paxos-simple', [set('ballot', 5), 'prepare', set('ballot', 1), 'prepare']);
  assert.ok(high.acceptors.every(a => a.promised === 5));
  assert.equal(high.round.quorum, false);
});
