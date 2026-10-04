// Bounded reachability check. Does not alter the authored claim-review ledger.
import { readFile, writeFile } from 'node:fs/promises';
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw Error('Source checks require certificate verification. Run with NODE_TLS_REJECT_UNAUTHORIZED=1.');
const { sources } = JSON.parse(await readFile(new URL('../public/library/sources.json', import.meta.url), 'utf8'));
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < sources.length) {
    const { url, label } = sources[cursor++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      await response.body?.cancel(); results.push({ label, url, status: response.status, ok: response.ok });
    } catch (error) { results.push({ label, url, ok:false, error: error.cause?.code || error.message }); }
  }
}));
results.sort((a,b) => a.url.localeCompare(b.url));
const failed = results.filter(r => !r.ok);
if (process.argv.includes('--report')) await writeFile(new URL('../docs/TLPI-SOURCE-CHECK.json', import.meta.url), JSON.stringify({ checkedAt:new Date().toISOString(), policy:'HTTP reachability only, not correctness certification.', results }, null, 2) + '\n');
console.log(`Primary sources: ${results.length - failed.length}/${results.length} reachable.`);
for (const result of failed) console.log(`${result.label}: ${result.status || result.error}`);
if (failed.length) process.exitCode = 1;
