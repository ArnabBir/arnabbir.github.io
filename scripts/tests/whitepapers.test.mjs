import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { researchPapers, researchById, learningPaths } from '../../src/content/paperResearch.js';
import { whitepaperCatalog, paperMetadata, paperById, resolvePaperChapter } from '../../src/content/whitepapers.js';
import { ResearchPaperSchema } from '../../src/content/paperResearchSchema.js';
import { LibraryItemSchema } from '../../src/content/schema.js';
import { filterPapers, researchWorksheet } from '../../src/content/paperCatalogTools.js';
import { candidateLinks } from '../paper-sources.mjs';

const legacyIds = 'mendel gfs mapreduce bigtable chubby spanner borg dremel anycast-load-balancing bitcoin bloom-paradox druid dynamo f1 federated-optimizations flumejava google-search-anatomy gorilla magnet-shuffle megastore monarch myrocks myrocks1 napa parallelism-optimizing-data-placement paxos-made-live paxos-simple pregel quic relational-model scaling-pagerank sre-capacity-management sundial thread-per-core-tail-latency trickle twitter-wtf virtual-memory web-search-for-a-planet windows-azure-storage zanzibar colossus percolator millwheel tensorflow lambda-architecture google-infrastructure-security photon-pubsub jupiter-rising autopilot inside-google-datacenters sre-workbook idf-symbolic-sim'.split(' ');
test('registry keeps all 52 legacy positions and adds 24 distinct research routes', () => {
  assert.deepEqual(paperMetadata.map(p => p.id), legacyIds);
  assert.equal(researchPapers.length, 24);
  assert.equal(whitepaperCatalog.length, 76);
  for (const field of ['id', 'contentPath', 'title']) assert.equal(new Set(whitepaperCatalog.map(p => p[field])).size, whitepaperCatalog.length, field);
  assert.equal(new Set(researchPapers.map(p => p.source)).size, researchPapers.length);
  for (const p of researchPapers) assert.ok(!paperMetadata.some(old => old.source === p.source));
  const legacyFiles = { mendel: 'mendel.html', gfs: 'google_file_system.html', mapreduce: 'map_reduce.html', bigtable: 'bigtable.html', chubby: 'chubby.html' };
  legacyIds.forEach((id, i) => assert.equal(resolvePaperChapter(String(i + 1)), legacyFiles[id] ? `/library/${legacyFiles[id]}` : `/library/whitepapers/${id}`));
  whitepaperCatalog.forEach((p, i) => assert.equal(resolvePaperChapter(String(i + 1)), p.contentPath));
  for (const value of ['77', '9999999999999999999999', '1e1', ' 2', '2 ', '00']) assert.equal(resolvePaperChapter(value), null);
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /researchPapers\.map\(paper => <Route/);
  assert.match(app, /<PaperResearch key=\{paper.id\} id=\{paper.id\}/);
});
test('strict research schema and library schema preserve all curated data', () => {
  for (const paper of researchPapers) assert.deepEqual(ResearchPaperSchema.parse(paper), paper);
  const parsed = LibraryItemSchema.parse({ id: 'whitepapers', title: 'Papers', description: 'Papers', category: 'Whitepapers', contentPath: '/library/rack/whitepapers', chapters: whitepaperCatalog });
  assert.deepEqual(parsed.chapters, whitepaperCatalog);
  assert.equal(ResearchPaperSchema.safeParse({ ...researchPapers[0], authors: [] }).success, false);
  assert.equal(ResearchPaperSchema.safeParse({ ...researchPapers[0], year: '2014' }).success, false);
  assert.equal(ResearchPaperSchema.safeParse({ ...researchPapers[0], inventedField: 'ignored?' }).success, false);
});
test('related references and paths resolve, contain no self references, and explain connections', () => {
  assert.equal(new Set(learningPaths.map(p => p.id)).size, learningPaths.length);
  for (const paper of researchPapers) {
    assert.equal(new Set(paper.related.map(p => p.id)).size, paper.related.length);
    for (const link of paper.related) { assert.ok(paperById[link.id], link.id); assert.notEqual(link.id, paper.id); assert.ok(link.reason.length > 20); }
  }
  for (const path of learningPaths) { assert.equal(new Set(path.ids).size, path.ids.length); for (const id of path.ids) assert.ok(paperById[id], id); }
});
test('citations use institutional or publisher records, artifacts use HTTPS, and dates are explicit', () => {
  const hosts = new Set(['www.usenix.org', 'arxiv.org', 'research.google', 'www.microsoft.com', 'cs.yale.edu', 'www.foundationdb.org']);
  for (const p of researchPapers) {
    assert.ok(hosts.has(new URL(p.source).hostname), p.id);
    assert.equal(p.artifacts[0].url, p.source);
    for (const artifact of p.artifacts) { const url = new URL(artifact.url); assert.equal(url.protocol, 'https:'); assert.equal(url.username + url.password, ''); assert.ok(artifact.note); }
    if (p.venue.startsWith('arXiv:')) assert.equal(p.yearBasis, 'First arXiv submission');
    assert.ok(Number.isFinite(Date.parse(p.verifiedOn)));
  }
  assert.equal(paperById.spanner.year, 2013);
  assert.equal(paperById.colossus.sourceType, 'Engineering overview');
  assert.equal(paperById.quic.sourceType, 'Standard');
  assert.equal(paperById['sre-workbook'].sourceType, 'Textbook');
});
test('combined filters search authors, alias IDs, years and ideas without mutating the catalog', () => {
  assert.deepEqual(filterPapers(whitepaperCatalog, { query: 'Ongaro 2014', kind: 'Reading guide' }).map(p => p.id), ['raft']);
  assert.deepEqual(filterPapers(whitepaperCatalog, { query: 'vllm', category: 'Machine Learning' }).map(p => p.id), ['pagedattention']);
  assert.equal(filterPapers(whitepaperCatalog, { category: 'Search', kind: 'Model lab' }).length, 0);
  assert.equal(filterPapers(whitepaperCatalog, { query: 'no-such-paper-zz' }).length, 0);
  assert.equal(filterPapers(whitepaperCatalog, { sourceType: 'Standard' }).length, 2);
  const path = learningPaths[0];
  assert.deepEqual(filterPapers(whitepaperCatalog, { ids: path.ids }).map(p => p.id), path.ids);
  assert.equal(filterPapers(whitepaperCatalog, { ids: path.ids, query: 'raft' }).length, 1);
  for (const sort of ['newest', 'oldest']) {
    const results = filterPapers(whitepaperCatalog, { sort });
    const missing = results.findIndex(p => !p.year);
    assert.ok(results.slice(missing).every(p => !p.year));
    const years = results.slice(0, missing).map(p => p.year);
    assert.deepEqual(years, [...years].sort((a, b) => sort === 'newest' ? b - a : a - b));
  }
  assert.deepEqual(whitepaperCatalog.slice(0, 52).map(p => p.id), legacyIds);
});
test('worksheet export includes citation, boundaries, artifacts, and user notes', () => {
  const output = researchWorksheet(researchById.raft, 'My counterexample');
  for (const content of ['Diego Ongaro', 'USENIX ATC', '2014', 'My counterexample', researchById.raft.source, researchById.raft.tradeoffs[0]]) assert.ok(output.includes(content));
});
test('discovery normalizes arXiv versions, excludes known and off-site links, deduplicates and bounds output', () => {
  const html = '<a href="/abs/2309.06180v1">known</a><a href="/abs/2601.12345v2">new</a><a href="/abs/2601.12345">same</a><a href="https://evil.example/abs/9999.12345">external</a><a href="javascript:alert(1)">bad</a>';
  assert.deepEqual(candidateLinks(html, 'https://arxiv.org/list/cs.DC/recent', new Set(['https://arxiv.org/abs/2309.06180'])), ['https://arxiv.org/abs/2601.12345']);
  assert.equal(candidateLinks(Array.from({ length: 60 }, (_, i) => `<a href="/abs/2601.${10000 + i}">paper</a>`).join(''), 'https://arxiv.org').length, 50);
});
