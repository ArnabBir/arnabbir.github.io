import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paperMetadata, paperById, whitepaperCatalog, resolvePaperChapter } from '../../src/content/whitepapers.js';
import { legacyCitations } from '../../src/content/legacyPaperCitations.js';
import { LegacyGuideSchema, legacyResearchPapers, allResearchGuides, guidePath } from '../../src/content/paperGuides.js';
import { filterPapers, researchWorksheet } from '../../src/content/paperCatalogTools.js';
import { bloomExperiment, gorillaResidualCost, gorillaExperiment, timestampPresets } from '../../src/pages/simulations/labs/paperExperiments.js';
import { sourceReport } from '../paper-sources.mjs';

test('source checker refuses disabled TLS verification before making any request', async () => {
  const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const report = await sourceReport();
    assert.ok(report.results.length >= 76);
    assert.ok(report.results.every(r => r.result === 'failed' && r.error.includes('TLS certificate verification')));
  } finally {
    if (previous === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
  }
});

test('all 48 remaining legacy citations are reviewed without inventing dates for living sources', () => {
  assert.equal(Object.keys(legacyCitations).length, 48);
  assert.equal(whitepaperCatalog.length, 76);
  for (const p of whitepaperCatalog) {
    assert.ok(p.citationTitle?.trim(), `Missing exact citation title: ${p.id}`);
    assert.equal(p.citationStatus, 'Curated', p.id);
  }
  for (const p of paperMetadata) {
    assert.ok(p.verifiedOn && p.authors.length && p.venue, p.id);
    assert.ok(p.authors.every(a => a.trim() && !/et al/.test(a)), p.id);
    assert.equal(new Set(p.authors).size, p.authors.length, p.id);
    if (p.yearBasis === 'Undated') {
      assert.equal(p.year, undefined, p.id);
      assert.ok(['Engineering overview', 'Project documentation'].includes(p.sourceType), p.id);
      assert.ok(p.citationNote, p.id);
    } else assert.ok(Number.isInteger(p.year), p.id);
  }
  assert.equal(paperById.dremel.year, 2011);
  assert.equal(paperById['parallelism-optimizing-data-placement'].year, 2022);
  assert.equal(paperById.bitcoin.year, 2008);
  assert.equal(paperById['google-infrastructure-security'].yearBasis, 'Last revision');
  assert.equal(paperById.colossus.sourceType, 'Engineering overview');
  assert.equal(paperById['sre-workbook'].sourceType, 'Textbook');
  assert.equal(paperById['bloom-paradox'].sourceType, 'Related reference');
  assert.equal(paperById.spanner.sourceType, 'Research article');
  assert.match(paperById.spanner.citationNote, /2013 ACM TOCS.*2012 OSDI/);
});

test('legacy workspaces reuse strict guide content while preserving every original destination', () => {
  assert.equal(legacyResearchPapers.length, 14);
  assert.equal(allResearchGuides.length, 38);
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /legacyResearchPapers\.map/);
  for (const p of legacyResearchPapers) {
    assert.deepEqual(LegacyGuideSchema.parse(p), p);
    const old = paperById[p.id];
    assert.equal(p.demoPath, old.contentPath);
    assert.equal(old.researchPath, guidePath(p));
    assert.notEqual(guidePath(p), p.demoPath);
    assert.equal(resolvePaperChapter(String(paperMetadata.findIndex(x => x.id === p.id) + 1)), p.demoPath);
    assert.ok(p.artifacts.some(a => a.url === p.source));
    assert.ok(p.related.every(r => r.id !== p.id && paperById[r.id] && r.reason.length > 20));
    assert.equal(new Set(p.related.map(r => r.id)).size, p.related.length);
  }
  const druid = legacyResearchPapers.find(p => p.id === 'druid');
  assert.equal(LegacyGuideSchema.safeParse({ ...druid, year: 2026 }).success, false);
  assert.equal(LegacyGuideSchema.safeParse({ ...druid, invented: true }).success, false);
  const worksheet = researchWorksheet(druid, 'Recovery is not instant availability.');
  assert.ok(worksheet.includes('Undated') && !worksheet.includes('undefined'));
  assert.ok(worksheet.includes(druid.citationNote));
  assert.ok(worksheet.includes(`Source type: ${druid.sourceType}`));
  assert.ok(worksheet.includes(`Original interactive experience: ${druid.demoPath}`));
  assert.ok(filterPapers(whitepaperCatalog, { query: 'allowable errors' }).some(p => p.id === 'bloom-paradox'));
});

test('Bloom experiment has no false negatives, stable witnesses, and conditional cost accounting', () => {
  for (const size of [32, 64, 128, 256, 512]) for (let hashes = 1; hashes <= 8; hashes++) {
    const r = bloomExperiment({ size, hashes });
    assert.deepEqual(r.falseNegatives, []);
    assert.equal(r.bits.length, size);
    assert.ok(r.bits.every(b => b === 0 || b === 1));
    assert.ok(r.falsePositives.every(key => !r.inserted.includes(key)));
    assert.equal(r.rate, r.falsePositives.length / 512);
    assert.deepEqual(r, bloomExperiment({ size, hashes }));
  }
  const negative = bloomExperiment({ size: 512, hitRate: 0 });
  assert.ok(negative.cost < 1);
  const positive = bloomExperiment({ size: 512, hitRate: 1 });
  assert.equal(positive.cost, 1.2);
  assert.equal(positive.exactLookups, 1);
  assert.throws(() => bloomExperiment({ hitRate: -0.1 }), RangeError);
});

test('Gorilla timestamp experiment preserves input and checks asymmetric bucket boundaries', () => {
  for (const values of Object.values(timestampPresets)) {
    const original = [...values], r = gorillaExperiment(values);
    assert.deepEqual(r.reconstructed, original);
    assert.deepEqual(values, original);
    assert.equal(r.rows.length, values.length - 2);
  }
  assert.equal(gorillaExperiment(timestampPresets.regular).residualBits, 6);
  assert.ok(gorillaExperiment(timestampPresets.gap).residualBits > 6);
  assert.deepEqual(gorillaExperiment([100, 110, 120, 131, 141]).rows.map(r => r.residual), [0, 1, -1]);
  for (const [value, bits] of [[0, 1], [-63, 9], [64, 9], [-64, 12], [65, 12], [-255, 12], [256, 12], [-256, 16], [257, 16], [-2047, 16], [2048, 16], [-2048, 36], [2049, 36]]) assert.equal(gorillaResidualCost(value).bits, bits);
  assert.throws(() => gorillaExperiment([1, 1, 2]), RangeError);
  assert.throws(() => gorillaResidualCost(2 ** 32), RangeError);
});
