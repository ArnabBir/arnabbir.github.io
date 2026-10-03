# System design: theory and deliberate practice

## Included editions and provenance

Two catalog experiences share the existing **System Design** rack at `/library/rack/system-design`. Chapters and questions remain within their original applications rather than expanding the portfolio catalog into hundreds of entries.

| Edition | Verified source directory | Source revision | Published scope |
| --- | --- | --- | --- |
| System Design Masterclass | `/Users/arnab.bir/system-design-masterclass` | `605de28e8dc4291815e51db5fee77a82cc89b188` | 389 artifacts, including 326 HTML pages |
| Design Gym | `/Users/arnab.bir/Documents/GitHub/system-design-practice-lab` | `6bfffc0ec51795a4b6d436a10e8d2ae0a375f7d9` | 8 artifacts, including one HTML application and the complete question bank |

Both source worktrees were clean at import time. Their Git remotes identify `ArnabBir/system-design-masterclass` and `ArnabBir/system-design-practice-lab`. Each edition has its own `public/library/<id>/manifest.json` containing the repository, revision, dirty flag, original filename, source byte count/hash, and published byte count/hash. The manifests themselves are additional bookkeeping files, excluded from the artifact counts above.

Masterclass imports the existing `site/` snapshot: the course, 65 case studies, networking, applied AI, staff architecture, Java concurrency, search index, local diagrams/runtime, capacity lab, practice console, and downloadable teaching fixtures. The 326 HTML pages include navigation/index pages and `404.html`; they are not 326 independent chapters. Its `site/build-manifest.json` is checked against source inputs before import to reject stale builds.

Design Gym imports exactly `index.html`, `app.mjs`, `engine.mjs`, `styles.css`, `data/bank.json`, `data/curriculum.mjs`, and two SVG files under `assets/`. The bank contains **2,336 items across 26 tracks**:

- 896 authored questions across 152 scenarios.
- 480 numerical variants across 24 calculation families.
- 960 generated execution traces across 12 models.

Generated variants are not independently authored scenarios. Inventory assertions verify these counts against the shipped question array. The five answer formats are single choice, multiple selection, ordering, matching, and numeric calculation.

## Discovery and reading

Catalog metadata lives in `src/content/system-design.js` and is included by `src/content/library.js`. Existing category, topic, format, and text filters discover both editions. The suggested path **Learn the system. Defend the decision.** connects theory to practice and back to an open-ended design. Homepage discovery uses this one compact path; neither edition adds a featured card.

| Edition | Native reader | Full-page application |
| --- | --- | --- |
| Masterclass | `/library/system-design-masterclass` | `/library/system-design-masterclass/index.html` |
| Design Gym | `/library/system-design-practice-lab` | `/library/system-design-practice-lab/index.html` |

The existing portfolio reader supplies the frame, metadata and full-page link. Both editions retain their own navigation and theme controls. Their storage namespaces are separate. Embedded and full-page views share the portfolio origin, so saved work survives that transition. Progress from localhost or another deployed origin does not transfer automatically. Use the source applications' export/import controls where available.

## Import boundaries and repeatability

From the portfolio root:

```sh
node scripts/import-system-design.mjs \
  /Users/arnab.bir/system-design-masterclass \
  /Users/arnab.bir/Documents/GitHub/system-design-practice-lab
node scripts/check-system-design.mjs \
  /Users/arnab.bir/system-design-masterclass \
  /Users/arnab.bir/Documents/GitHub/system-design-practice-lab
npm test
npm run build
```

The default source arguments are `~/system-design-masterclass` and `../system-design-practice-lab`. Run the importer from this repository. It reads and validates both editions before replacing only their two owned output directories. It never writes to source checkouts, the frontend-atlas/master-playbooks imports, or whitepaper assets.

Publication uses the same `editorial-punctuation-v1` transform as the existing imports. Masterclass canonical/sitemap URLs are relocated from `/system-design-masterclass/` to `/library/system-design-masterclass/`. Runtime relative paths are preserved. Source hashes remain hashes of original bytes, while published hashes describe normalized/relocated bytes. Reimporting the same revisions is deterministic.

Hidden paths, dependency directories, Python caches, caches, source maps and compressed `.gz` copies are excluded. Symlinks and unexpected artifact types fail review. Sensitive filenames and common private-key/access-token signatures fail import; the regression checker scans the published text too. Only the built masterclass and the explicit browser-app allowlist are copied, not source checkout internals or backend environments.

If the masterclass snapshot is stale, prepare an isolated copy of that repository with its Git provenance, install its documented Python requirements and `npm ci` dependencies there, then run `mkdocs build --strict`. Its build hook creates `site/build-manifest.json`. Pass that isolated checkout as the first importer argument and review the resulting provenance. Do not bypass the stale-build check or rebuild in a sibling as part of this portfolio integration.

## Verification

The static checker validates catalog schemas, reading-path IDs, repository metadata, exact file inventory, every published hash, normalization, same-edition HTML asset/navigation links, secret-signature exclusions, and question-bank counts. Supplying source paths additionally compares every source byte count/hash and independently reproduces the publication transform. `npm test` includes its source-independent checks.

Serve the production build using `npm run preview -- --host 127.0.0.1 --port 8080`, then run:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  node scripts/check-system-design-browser.mjs
```

The browser check uses installed Chrome, accepts `PLAYBOOK_BASE_URL`, and does not add a portfolio dependency. Verified at **1440 x 1000** and **390 x 844**:

- Homepage path, library category/format/search controls, System Design rack, both native readers, and full-page links.
- All 397 served artifact hashes, checked against manifests on desktop.
- Capacity input recalculation and practice-console save/reload persistence.
- Actual controls for all five answer formats, correct grading, bookmarks, session completion, and reload persistence.
- Shared-origin practice state when returning to the native reader.
- No page runtime errors or horizontal document overflow on tested routes.

`npm test` passed all 51 tests, existing playbook/Atlas checks, all 76 whitepaper workspace assertions, new import checks, and punctuation checks. `npm run build` passed the emitted-asset graph check. Existing simulation sourcemap diagnostics and the stale Browserslist warning remain nonfatal.

## Limitations

This is static hosting. Python fixtures and Java examples require a local runtime; no Python execution service, Java backend, server-side account, cloud environment, or progress synchronization is hosted. Masterclass calculators provide educational estimates, not measured capacity guarantees. Practice accuracy is not a prediction of interview readiness. External references still require network access.

Browser checks exercise the integration and representative learning interactions, not every pedagogical claim, every masterclass page's rendering, or every generated exercise. Backup/restore, timed mocks, notes, and other original tools are included, but their complete behavior is not exhaustively retested here. Existing datasets and routes, including all 76 whitepaper workspaces, are retained. No commit, push, deployment, or sibling edit is part of this integration.
