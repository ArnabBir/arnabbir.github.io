# Master playbooks: import and maintenance

## Catalog contract

`src/content/playbooks.js` is the curated registry for 24 complete HTML experiences from
[ArnabBir/master-playbooks](https://github.com/ArnabBir/master-playbooks).
Each stable ID owns `/library/<id>` (portfolio reader) and
`/library/playbooks/<id>.html` (standalone document). Do not rename IDs when changing titles.
Original chapters remain inside each document rather than becoming hundreds of rack entries.
The existing 52-paper collection and its chapter redirects remain separate.

| Category | Imported experiences |
| --- | ---: |
| Payments & Financial Infrastructure | 5 |
| Search & AI Systems | 4 |
| Geospatial & Marketplace Systems | 3 |
| Media & Communication | 4 |
| Data Platforms & Resilience | 3 |
| Programming Languages | 2 |
| Algorithms & Data Structures | 1 |
| Identity & API Platforms | 2 |

Company-named architecture studies are independent learning material, not official
company documentation or verified private internals. ChatGPT, Glean, and Postman
are product/workflow playbooks. Airflow, HBase in Action, and LLM Engineer's Handbook
are book companions. Summaries are based on document titles, reading guides, and contents.
Original attribution, evidence labels, scripts, diagrams, and citations stay intact.

## Reimport

From the portfolio root:

```sh
node scripts/import-playbooks.mjs ../master-playbooks
node scripts/check-playbooks.mjs ../master-playbooks
npm run build
git diff --check
```

The importer copies bytes, not serialized DOM. It imports only the 24 explicitly mapped
HTML files, never PDFs or transcripts. It verifies that the registry covers all unique
source HTML hashes. Four `(1)` files (Netflix, Razorpay, YouTube, ledger design) are exact
duplicates; their names are retained as aliases in `public/library/playbooks/manifest.json`.
The ledger **design blueprint** and **illustrated playbook** have distinct hashes and routes.

The manifest records source filename, SHA-256, byte length, destination, and duplicate
aliases. It is the snapshot provenance; the repository URL is not a fabricated Pages host.
Before updating, review source changes and registry descriptions. The importer refuses to
overwrite a destination modified since the last manifest. Resolve such edits explicitly;
do not remove the manifest to bypass that protection. New unique sources require a curated
registry entry before import. Reimporting unchanged sources is deterministic.

## Reader and discovery

Library search returns individual experiences, with category, format, and topic filters.
Unfiltered discovery groups categories and offers three curated paths. Homepage paths add
three compact entry points without adding 24 slides to the existing featured carousel.
Imported experiences use complete cards; existing companion chapter navigation stays available.

The reader uses a bounded, independently scrolling iframe and a prominent standalone link.
Same-origin access preserves each original localStorage namespace. Storage is browser/origin
specific; it does not migrate from file URLs, another host, or another browser. Original theme
controls are retained; imported documents do not receive portfolio theme messages. Legacy
documents receive them only when their inline scripts contain the existing protocol marker.

Only HTML is bundled. Some unchanged source text mentions companion projects, validation
reports, or downloads that are not in this source collection. The reader explains that scope;
the portfolio does not add download buttons or claim that code is available. External source
links still require network access. Any original content/layout defects should be corrected
upstream and reimported rather than silently rewriting these byte-preserved documents.

## Verification checklist

- Check hashes, uniqueness, category counts, schema acceptance, and every static route.
- Keep the 52 whitepapers and legacy chapter URLs working.
- Check desktop and narrow mobile discovery, filters, empty results, keyboard labels,
  iframe sizing/scrolling, and the full-page link.
- In Java to Go, complete a lesson, reload, and open standalone: progress should persist.
- Inspect representative static architecture and dynamic course readers, including their
  original mobile navigation and theme controls.

Automated browser checks can run against `npm run preview -- --port 8080` with Chrome
and Playwright available:

```sh
node scripts/check-playbooks-browser.mjs
# Or reuse an installed Playwright module without changing project dependencies:
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/check-playbooks-browser.mjs
```

`PLAYBOOK_BASE_URL` overrides the default `http://127.0.0.1:8080`. The browser script
uses an isolated context and does not modify your personal reading progress. It verifies
all 24 served document hashes and reader routes, all eight racks, filter intersections,
representative mobile layouts, course persistence, and the legacy GFS redirect.
