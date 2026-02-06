# Debugging guide

## 1) Basic workflow

- Run the dev server: `npm run dev`
- Open DevTools (Console + Network tabs)
- Make one change at a time (content first, then UI)

## 2) Common errors

### Blank page after editing content

This project validates content with **Zod**.

1. Open DevTools → **Console**
2. Look for an error like:
   - `ZodError: ...`
3. Fix the field it mentions in `src/content/*`

### Images not showing

- Images must live under `public/`.
- Reference them with an absolute path like `"/images/my.png"`.
- Check DevTools → Network for 404s.

### Styles look “missing”

- Ensure Tailwind is running: stop and restart `npm run dev`.
- If you added classes in `index.html`, Tailwind must scan it (already configured via `tailwind.config.js`).

### Routing breaks on GitHub Pages (refresh gives 404)

This repo includes `public/404.html` + a tiny script in `index.html` to support SPA routing.

If you delete either file, deep links like `/portfoliohub` may break on GitHub Pages.

## 3) Useful commands

```bash
npm run lint     # catch common issues
npm run build    # production build (CI-like)
npm run preview  # serve the production build locally
```

## 4) Performance & polish checks

- Run Lighthouse (Chrome DevTools → Lighthouse)
- Check mobile layout in responsive mode
- Validate contrast in dark mode

If something feels “off”, it usually comes down to spacing, typography, or too many competing accents. Keep sections clean and let your best work breathe.
