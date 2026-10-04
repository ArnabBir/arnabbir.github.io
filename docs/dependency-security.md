# Dependency security review

Reviewed on 2026-10-04. Counts below are local npm audit package counts, not
GitHub advisory counts. Audits used `https://registry.npmjs.org` with TLS
verification enabled because the configured private registry was unreachable.

## Scope and results

| Scope | Before | After |
| --- | --- | --- |
| Portfolio root, all dependencies | 34: 1 critical, 24 high, 7 moderate, 2 low | 5 high, all from one advisory |
| Downloaded Taskflow frontend | 0 | 0; archive unchanged |

GitHub's API reported 99 open alerts, all against the root `package-lock.json`:
2 critical, 41 high, 48 moderate, 8 low. Those remain remote alerts until these
changes are pushed to the default branch and GitHub scans them. No alerts were
dismissed, and no commit, push or deployment was performed during this review.

The Taskflow ZIP was extracted into a temporary directory and its own lockfile
audited separately. System-design published snapshots contain no separate npm
manifests or lockfiles. Imported artifacts and their original/output hashes were
not changed. Their existing integrity checks passed. This review does not claim
an audit of the Java backend or of upstream dependencies absent from the snapshots.

## Changes

- Vite: 5.3.5 to 6.4.3. This is the patched Vite 6 release identified by
  [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff).
- React Vite plugin: 4.3.1 to 4.7.0, whose declared peers include Vite 6.
- React Router DOM: 6.25.1 to 7.18.4. Version 7.18.0 is the minimum fix for
  [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6).
  Its React 18 and Node 20 minimums fit this application's React version and
  Pages workflow. Existing declarative routing passed browser checks.
- Removed unused `jspdf`, `jspdf-autotable`, and `xlsx` and their explicit Vite
  export chunk. There were no application imports or export call sites. This
  removes the vulnerable PDF tree and the npm SheetJS release with no audit fix.
- Applied compatible transitive fixes with `npm audit fix`, without `--force`.
  Examples include PostCSS 8.5.28, Rollup 4.64.0, lodash 4.18.1, js-yaml 4.3.2,
  nanoid 3.3.19 and brace-expansion 1.1.21/2.1.7.
- Disabled browser dependency discovery in the SSR-only catalog checker. Vite 6
  otherwise started an unused HTML scan that raced with checker shutdown.

## Remaining advisory

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
affects `braces` through 3.0.3. GitHub lists no patched release, and npm's current
release was verified as 3.0.3. Deeply nested brace patterns can exhaust the Node
stack and terminate the process.

The five affected audit entries are `braces`, `chokidar`, `micromatch`,
`fast-glob`, and `tailwindcss`. They all arise from Tailwind 3's build-time glob
and watch processing. This site's glob patterns are repository-controlled in
`tailwind.config.js`; no visitor-controlled path to those Node APIs was found.
Malicious build configuration or future acceptance of external glob patterns
would change that assessment. This is reduced exposure, not a patched package.

`npm audit --omit=dev` also reports the same five entries: the production-listed
`tailwindcss-animate` package brings Tailwind through a peer dependency. Thus a
zero production audit is not claimed, even though the affected processing is
build-time and GitHub Pages serves static output.

npm suggests Tailwind 4.3.3 as a major-version workaround. That requires a
separate CSS/PostCSS/configuration and plugin compatibility migration, with
visual regression checks across the simulations and readers. It was not forced
as a lockfile-only update. Alternatives are that tested migration or a future
upstream braces patch. No advisory suppression or forced transitive override
was added.

## Verification

- Clean `npm ci --registry=https://registry.npmjs.org --no-audit --no-fund`.
- `npm ls --all --omit=optional`: no invalid dependency or peer tree.
- `npm test`: 63 tests passed, plus catalog, import-integrity and punctuation
  checks. Includes all 389 masterclass artifacts, 8 practice-lab artifacts and
  the unchanged Frontend Atlas ZIP.
- `npm run build`: passed, including validation of 54 emitted assets and links.
- `npm run test:browser`: all five recovery modes, 24 readers, 8 racks, legacy
  redirect, desktop/mobile navigation, Frontend Atlas progress, React/TSX
  playground execution and reference download passed. Playwright was installed
  in a temporary tools directory and supplied through `PLAYWRIGHT_MODULE`.
- Final full and omit-dev npm audits: both 5 high package entries for the one
  residual advisory above; no critical, moderate or low entries.
- `git diff --check`: passed.

Build/browser verification used Node 24.13.0 and npm 11.6.2 locally. CI Node 20
compatibility was checked against declared package engines, not by running a
second local Node runtime. Generated tracked `dist/index.html` was restored after
verification; CI builds deployment artifacts from the updated lockfile.
