// Read-only, bounded network checks. Reports never edit or approve catalog entries.
import { pathToFileURL } from 'node:url';
import { researchPapers } from '../src/content/paperResearch.js';
import { paperMetadata, whitepaperCatalog } from '../src/content/whitepapers.js';

export const discoveryFeeds = [
  'https://www.usenix.org/conferences',
  'https://www.vldb.org/pvldb/',
  'https://arxiv.org/list/cs.DC/recent',
  'https://arxiv.org/list/cs.IR/recent',
  'https://arxiv.org/list/cs.CL/recent',
];
export function candidateLinks(html, base, known = new Set()) {
  const results = new Set();
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1].replaceAll('&amp;', '&'), base);
      const path = url.pathname.replace(/v\d+$/, '');
      if (url.origin !== new URL(base).origin || url.protocol !== 'https:') continue;
      if (!(path.match(/^\/abs\/\d{4}\.\d+$/) || path.includes('/presentation/') || path.match(/\/vol\d+\/.*\.pdf$/))) continue;
      url.pathname = path; url.search = ''; url.hash = '';
      if (!known.has(url.href)) results.add(url.href);
    } catch { /* Ignore non-URL navigation. */ }
  }
  return [...results].slice(0, 50);
}
async function request(url) {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('Source checks require TLS certificate verification. Run with NODE_TLS_REJECT_UNAUTHORIZED=1.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'SystemsReadingRoom-SourceReview/1.0 (manual-curation; read-only)' } });
    const reader = response.body?.getReader();
    let bytes = 0; const chunks = [];
    if (reader) {
      try {
        while (bytes < 2_000_000) {
          const { value, done } = await reader.read();
          if (done) break;
          chunks.push(value); bytes += value.length;
        }
      } finally { await reader.cancel(); }
    }
    return { status: response.status, finalUrl: response.url, contentType: response.headers.get('content-type') || '', body: Buffer.concat(chunks).toString('utf8') };
  } finally { clearTimeout(timeout); }
}
export async function sourceReport() {
  const records = new Map();
  for (const paper of [...researchPapers, ...paperMetadata.filter(p => p.verifiedOn)]) {
    for (const url of new Set([paper.source, ...(paper.evidenceUrl ? [paper.evidenceUrl] : []), ...(paper.artifacts || []).map(a => a.url)])) {
      if (!records.has(url)) records.set(url, { url, papers: [] });
      records.get(url).papers.push(paper.id);
    }
  }
  const results = [];
  // Sequential requests are deliberately polite and make rate limits visible.
  for (const record of records.values()) {
    try {
      const { body, ...response } = await request(record.url);
      const blocked = response.status === 403 || response.status === 429 || /captcha|just a moment|verify you are human/i.test(body.slice(0, 8000));
      results.push({ ...record, ...response, result: blocked ? 'manual-review-required' : response.status >= 200 && response.status < 300 ? 'reachable-not-content-verified' : 'failed' });
    } catch (error) { results.push({ ...record, result: 'failed', error: error.message }); }
  }
  return { checkedAt: new Date().toISOString(), mode: 'source-health', note: 'Reachability is not bibliographic or scientific verification. Do not update verifiedOn from this report.', results };
}
export async function discoveryReport() {
  const known = new Set(whitepaperCatalog.map(p => p.source));
  const feeds = [];
  for (const url of discoveryFeeds) {
    try {
      const { body, status, finalUrl } = await request(url);
      feeds.push({ url, status, finalUrl, unreviewedCandidates: status === 200 ? candidateLinks(body, url, known) : [], note: 'Empty results may mean a changed feed or a navigation-only index. Inspect the source manually.' });
    } catch (error) { feeds.push({ url, error: error.message, unreviewedCandidates: [] }); }
  }
  return { checkedAt: new Date().toISOString(), mode: 'discovery', note: 'Unreviewed links only. No summaries, acceptance decisions, catalog writes, or publication.', feeds };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await (process.argv.includes('--discover') ? discoveryReport() : sourceReport());
  console.log(JSON.stringify(report, null, 2));
  if (report.results?.some(item => item.result === 'failed') || report.feeds?.some(item => item.error || item.status !== 200)) process.exitCode = 1;
}
