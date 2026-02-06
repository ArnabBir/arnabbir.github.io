# Deployment (GitHub Pages)

This site is a static build (`dist/`) produced by Vite.

## Option A — GitHub Actions (recommended)

1. In GitHub:
   - **Settings → Pages → Build and deployment**
   - Set **Source** to **GitHub Actions**
2. Commit the workflow file in `.github/workflows/pages.yml` (already included in this repo after the redesign).
3. Push to `main`.

The action will build and deploy automatically.

## Option B — `gh-pages` branch (manual)

1. Ensure `homepage` in `package.json` matches your site URL
   - For a user site like `https://<user>.github.io`, this is:
     - `"homepage": "https://<user>.github.io/"`
2. Run:

```bash
npm install
npm run deploy
```

3. In GitHub:
   - **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` / `/ (root)`

## Notes

- SPA routing: this repo ships with `public/404.html` + a small redirect handler in `index.html`.
- If you change the `base` path in `vite.config.js`, update it carefully; user sites typically use `/`.
