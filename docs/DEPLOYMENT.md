# Deployment (GitHub Pages)

The production site uses **GitHub Actions**, building Vite from source on `master`
and uploading the complete `dist/` directory. `base: "/"` is correct for this user site.

## Verify locally

```sh
npm ci
npm test
npm run build
node scripts/normalize-text.mjs --check --dist
npm run preview -- --host 127.0.0.1 --port 8080
```

The build validates the Vite manifest, static and dynamic dependency files, preload
references, CSS assets, root HTML entry, and Pages routing files before upload.
The workflow also runs the regression and import-provenance checks.

## Publish when ready

1. Keep **Settings > Pages > Source** set to **GitHub Actions**.
2. Review and commit the intended source changes, then push to `master`.
3. Wait for `.github/workflows/pages.yml` to complete successfully, then check
   `/library` and a reader route on the live site. Alternatively, dispatch that
   workflow for an already committed revision.

The obsolete `gh-pages` npm deployment path has been removed to avoid switching
between incompatible publishing modes. Do not publish the repository root or a
partial tracked build. Some legacy `dist/` files remain tracked despite `.gitignore`;
they are regenerated locally, but the workflow builds a fresh complete artifact.
The root `index.html` is Vite source and must keep `/src/main.jsx` as its entry.

## October 2, 2026 chunk failure: evidence

- Pages API returned `build_type: workflow`; the latest successful workflow was
  [37026566714](https://github.com/ArnabBir/arnabbir.github.io/actions/runs/37026566714),
  revision `d8be6e0259cfc9bcc2d91df74b00222108c04c8f`.
- The [08:10 build](https://github.com/ArnabBir/arnabbir.github.io/actions/runs/36982523114)
  emitted `index-Dk-bAVZb.js` and `LibraryHome-Br-85zsV.js`.
- The 15:23 build emitted `index-B3R77e0Z.js` and `LibraryHome-7DJKM3n6.js`.
  Live root HTML and its entry JS referenced these newer files.
- At 15:28-15:30 UTC, GET/HEAD checks found the reported old LibraryHome chunk
  returned **404**, the current chunk returned **200**, and
  `vendor-react-BGmaVxWA.js` returned **200**. The React file was shared by both builds;
  its stack frame was not evidence that the vendor asset was missing.
- Live HTML had `Cache-Control: max-age=600` and `Last-Modified: 15:23:46 GMT`.
  This is an old-client/new-artifact mismatch after replacement of hashed chunks.
  The evidence does not distinguish a previously open tab from cached HTML.
- No active service-worker registration exists in the application. Atlas includes
  a commented teaching example; it does not register a worker for the portfolio.
- The tracked `dist/index.html` referenced another older entry, but it was not the
  HTML served in production. The successful workflow builds before uploading `dist`.

## Recovery behavior and limits

`vite:preloadError` probes the root HTML with `cache: no-store` and a four-second
timeout. Only a different built entry permits an automatic reload. A persisted
session marker bounds this to one attempt per tab session, including across
different builds and URLs. Offline status, blocked storage, failed probes and
unchanged builds keep an actionable React error boundary instead. Concurrent
events share the same attempt. Reload preserves the path, query and fragment.
The boundary offers a manual reload (disabled offline) and homepage navigation.

GitHub Pages controls cache headers and removes old hashed chunks on deployment;
this change does not retain historical bundles or change those headers. Clients
running the old version must reload to acquire the new recovery handler. An entry
script that cannot boot at all is outside React/Vite lazy-import recovery.

SPA routing continues to use `public/404.html` and the root HTML redirect helper.

## Resumed implementation verification (October 2, 2026)

- Rechecked Pages API: `build_type: workflow`, status `built`. Run `37026566714`
  is successful at revision `d8be6e0259cfc9bcc2d91df74b00222108c04c8f`.
- At 17:46 UTC, live HEAD requests still returned 404 for
  `LibraryHome-Br-85zsV.js` and 200 for `LibraryHome-7DJKM3n6.js`.
  A fresh root HTML GET referenced `index-B3R77e0Z.js`.
- `npm test`: all 13 unit tests passed, plus catalog, import-manifest and
  source punctuation checks. Checks include encoded em-dash representations.
- `node scripts/check-playbooks.mjs ../master-playbooks` and
  `node scripts/check-frontend-atlas.mjs ../frontend-atlas`: passed against the
  original sibling artifacts, validating source hashes, normalized output hashes
  and byte counts. The Atlas reference ZIP remains unchanged.
- `npm run build`: passed with 50 emitted assets and their references validated.
  `node scripts/normalize-text.mjs --check --dist`: zero files needing normalization.
  CI now performs this built-output scan before uploading the Pages artifact.
- Browser checks passed in installed Chrome using an existing Playwright install:
  successful stale-entry recovery, permanent chunk failure without a reload loop,
  unchanged build, denied session storage, offline/reconnect behavior, and exact
  path/query/fragment preservation. Reader checks cover all 24 playbooks, eight
  racks, legacy GFS routing and Frontend Atlas, including mobile and persistence.
- `git diff --check`: passed. Unrelated simulation directive removals were restored.

To rerun the browser suite, supply an existing Playwright Test module (it is not
a project dependency) and have Chrome installed:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs npm run test:browser
```

Local verification used Node 24.13.0 and Vite 5.3.5; the workflow uses Node 20.
`npm run lint` is blocked by the existing missing ESLint configuration. The build
still reports the existing simulation sourcemap warnings and outdated Browserslist
notice. No commit, push, workflow dispatch or deployment was performed.
