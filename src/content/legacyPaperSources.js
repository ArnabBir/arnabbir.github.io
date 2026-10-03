// Public copies checked with strict TLS on 2026-10-03. Titles/bylines were
// inspected in the PDFs; HTTP success alone is not evidence of identity.
const copy = (label, url, note) => ({ label, url, kind: 'Paper', note: `${note} Public copy checked 2026-10-03; the canonical citation is retained separately.` });
export const legacyPublicCopies = {
  flumejava: copy('FlumeJava: Google-hosted paper', 'https://research.google.com/pubs/archive/35650.pdf', 'Institutional copy with the same title and complete seven-author byline as the PLDI work.'),
  'magnet-shuffle': copy('Magnet: open PVLDB paper', 'https://www.vldb.org/pvldb/vol13/p3382-shen.pdf', 'PVLDB 13(12), pages 3382-3395; title, authors, and DOI match the cited work.'),
  'parallelism-optimizing-data-placement': copy('Parallelism-Optimizing Data Placement: open PVLDB paper', 'https://www.vldb.org/pvldb/vol16/p760-kraft.pdf', 'PVLDB 16(4), pages 760-771; title and five-author byline match the cited work.'),
  'relational-model': copy('Codd: university-hosted article', 'https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf', 'University of Pennsylvania course copy of the June 1970 CACM article, with original title and E. F. Codd byline.'),
  'twitter-wtf': copy('Who to Follow: author-hosted paper', 'https://stanford.edu/~rezab/papers/wtf_overview.pdf', 'Reza Zadeh university copy, matching the six authors and WWW 2013 proceedings work.'),
  autopilot: copy('Autopilot: author-hosted paper', 'https://john.e-wilkes.com/papers/2020-EuroSys-Autopilot.pdf', 'John Wilkes copy of the EuroSys 2020 paper, with matching title and byline.'),
};

// Access observations, not a claim that a publisher is permanently restricted.
const acm = 'Publisher citation retained. Automated access returned HTTP 403 during the 2026-10-03 strict-TLS review; this is an access limitation, not evidence that the paper is missing.';
export const sourceAccessNotes = Object.fromEntries([
  '10.1145/362686.362692', '10.1145/1806596.1806638', '10.14778/2824032.2824078',
  '10.14778/3415478.3415558', '10.14778/3574245.3574260', '10.1145/362384.362685',
  '10.1145/2488388.2488433', '10.1145/2043556.2043571', '10.1145/3342195.3387524',
].map(doi => [`https://doi.org/${doi}`, acm]));
sourceAccessNotes['https://doi.org/10.1145/362686.362692'] += ' No same-work public alternate was verified for this review. The filter guide and local experiment do not substitute for reading the original article.';
for (const url of ['https://www.oreilly.com/library/view/site-reliability-engineering/9781491929117/', 'https://www.oreilly.com/library/view/the-site-reliability/9781492029496/']) {
  sourceAccessNotes[url] = 'Canonical publisher book record. Automated access has varied between HTTP 403 and success; the specific chapter is publicly available at the primary sre.google link above. Publisher access does not imply that the full book is freely downloadable.';
}
