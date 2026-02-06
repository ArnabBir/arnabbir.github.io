# arnabbir.github.io

A fast, modern, **data-driven** portfolio built with **Vite + React + Tailwind (shadcn/ui)**.

- Edit your content in `src/content/*` (experience, projects, writing, skills, etc.).
- The UI reads those files and renders sections automatically.
- Works great on GitHub Pages (SPA routing supported).

## Prerequisites

- Node.js 18+ (recommended)
- npm (comes with Node)

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (by default: `http://localhost:8080`).

## Build & preview

```bash
npm run build
npm run preview
```

## Where to edit content

- `src/content/site.js` – name, tagline, socials, resume link
- `src/content/experience.js` – roles & impact
- `src/content/projects.js` – projects (featured/open-source/lab)
- `src/content/writing.js` – blog posts & articles
- `src/content/skills.js` – skills grouped by category
- `src/content/education.js` – education
- `src/content/certifications.js` – certifications

The content is validated with Zod at runtime. If you make a mistake (e.g., a missing field), you’ll see a helpful error in the browser console.

## Deploy to GitHub Pages

This repo supports **two** approaches:

1) **Deploy with `gh-pages` (manual)**

```bash
npm run deploy
```

This builds `dist/` and pushes it to the `gh-pages` branch.

2) **Deploy with GitHub Actions (recommended)**

See `docs/DEPLOYMENT.md`.

---

### Docs

- `docs/CONTENT.md` – how to add new experience/projects/etc.
- `docs/DEBUGGING.md` – common issues + how to debug
- `docs/DEPLOYMENT.md` – GitHub Pages deployment options
