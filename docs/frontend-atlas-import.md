# Frontend Atlas: complete offline edition

## Scope and provenance

- Catalog: `src/content/frontend-atlas.js`, included by `src/content/library.js`.
- Reader: `/library/frontend-atlas`; category rack: `/library/rack/frontend`.
- Full-page edition: `/library/frontend-atlas/index.html`.
- Source: <https://github.com/ArnabBir/frontend-atlas>, verified against the sibling's Git remote and remote HEAD at import time.
- Revision: `4cce6f464c16c3d0b3331cc663d8a2126e33b0f9` (clean source worktree).
- Exact bytes, source filenames, repository, revision and SHA-256 hashes: `public/library/frontend-atlas/manifest.json`.

The source has no `AGENTS.md`. Its README, package scripts, `build.mjs`, content modules, playground, labs, and Taskflow reference were inspected. The existing **tracked** `dist/index.html` is a self-contained browser application, not raw application source. Its build bundles native browser UI, React, TypeScript, scripts, styles and icons without CDN dependencies. It can be served directly from a subdirectory; navigation uses hash routes.

Both source build artifacts are copied byte-for-byte: the HTML and its relative `taskflow-reference.zip` download. No source rewrite, dependency installation or source build was necessary. No sibling files were modified. The ZIP contains 14 teaching-project files (README, React frontend and Spring Boot backend); no dependencies, caches, build output or environment secrets are included.

## Discovery and reader behavior

One catalog experience retains the complete curriculum: **16 chapters / 80 lessons, 9 visual labs, 8 project guides**, glossary, official references, study plan, notebook, progress export/import and a real HTML/CSS/JavaScript/React/TSX playground. Chapters remain inside Atlas rather than becoming 80 rack entries. Frontend, React, TypeScript, JavaScript, HTML, CSS, accessibility and testing topics make it discoverable through existing filters and search. The fourth suggested path connects Java developers to this curriculum; the original three paths remain intact.

The reader keeps the original navigation, theme and storage behavior. Its per-item `readerNote` accurately identifies the included companion download, rather than showing the master-playbook notice that downloads are absent. Full-page and embedded views share same-origin browser progress. Atlas has its own storage namespace; data from another origin (including the source's localhost server) does not automatically transfer—use its backup controls.

The Taskflow ZIP is a **local reference slice**, not a hosted backend or a completed production capstone. Authentication, durable persistence, editing, idempotent creates and conflict handling remain extension work as described by the original README. Playground imports support bundled React/React DOM; its isolated preview has no network or browser-storage access. TSX transformation is not full TypeScript checking. Source claims, official references and limitations are preserved.

No separate hosted Atlas URL is advertised. The local full-page edition is the playable destination; the source repository is the verified external link.

## Reimport

From the website repository:

```sh
node scripts/import-frontend-atlas.mjs ../frontend-atlas
node scripts/check-frontend-atlas.mjs ../frontend-atlas
node scripts/check-playbooks.mjs
npm run build
```

The importer only permits `dist/index.html` and `dist/taskflow-reference.zip`, reads both before writing, and records source revision/dirty status and exact hashes. It does not rebuild or mutate the sibling. Review dirty status and provenance after every update. The original 24-playbook manifest/importer remains independent, so reimporting either collection does not remove the other.

If upstream changes require regeneration, follow its README (`npm ci`, `npm run build`) in the source checkout deliberately, then reimport. Confirm that the ZIP exists: upstream's build currently tolerates a missing companion download, but this importer requires it.

## Verification

Serve the built website with `npm run preview -- --host 127.0.0.1 --port 8080`, then:

```sh
# Use an existing @playwright/test installation; no website dependency change required.
PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs node scripts/check-frontend-atlas-browser.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs node scripts/check-playbooks-browser.mjs
node --test src/pages/simulations/labs/models.test.js
```

Both browser scripts accept `PLAYBOOK_BASE_URL` and use installed Chrome. Atlas checks cover served artifact hashes, category/topic/format intersection, rack and reader routes, all chapter/lesson/lab/project routes, a state lab interaction, real TSX compilation and React state updates, completion persistence across reload/full-page view, download behavior, and mobile navigation/search/theme with no horizontal overflow. Tested at 1440×1000 and 390×844; no page runtime errors. Existing 24-reader regression and all 24 model/library tests passed.

`npm run build` passed with existing simulation sourcemap and stale Browserslist warnings. `npm run lint` cannot run because this repository lacks ESLint configuration. The downloaded Java backend and capstone deployment were not run as part of this static-site integration.
