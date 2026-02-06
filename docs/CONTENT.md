# Content guide (templates)

This portfolio is **data-driven**: sections render from files in `src/content/`.

If you want to add/update things, you usually only touch **one file**.

## Quick start

1. Open a content file (for example: `src/content/experience.js`).
2. Copy an existing entry.
3. Paste, edit, save.
4. Run `npm run dev` and refresh.

The content is validated with **Zod** (`src/content/schema.js`). If you break the schema, you’ll see an error in the console.

## Templates

### 1) Add a new experience

Edit: `src/content/experience.js`

```js
export default [
  {
    company: "Acme",
    role: "Senior Software Engineer",
    location: "Remote",
    start: "Jan 2025",
    end: "Present",
    logo: "/images/acme.png", // optional (place in public/images)
    website: "https://acme.com", // optional
    summary: "One-line summary of scope.",
    highlights: [
      "Impact bullet with a metric.",
      "Second bullet — problem, approach, result.",
    ],
    tech: ["Java", "Kubernetes", "Kafka"],
    links: [
      { label: "Press", href: "https://example.com" },
    ],
  },
];
```

Tips:
- Keep **highlights** to 2–4 bullets.
- Put the **most impressive metric first**.
- Tech should be **curated**, not exhaustive.

### 2) Add a new project

Edit: `src/content/projects.js`

```js
export default [
  {
    name: "My Project",
    description: "A crisp one-liner.",
    image: "/images/my-project.png", // optional
    tags: ["React", "TypeScript"],
    highlights: [
      "What makes it special?",
      "Any measurable outcome?",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/..." },
      { label: "Live", href: "https://..." },
    ],
    featured: true,
    kind: "featured", // "featured" | "open-source" | "lab"
  },
];
```

### 3) Add a blog post / article

Edit: `src/content/writing.js`

```js
export default [
  {
    title: "Article title",
    publication: "Where it was published",
    date: "2026",
    tag: "Distributed Systems",
    description: "1–2 lines on why someone should read it.",
    href: "https://...",
  },
];
```

### 4) Add skills

Edit: `src/content/skills.js`

```js
export default [
  {
    category: "Languages",
    items: ["Java", "Go", "Python"],
  },
];
```

### 5) Add certifications

Edit: `src/content/certifications.js`

```js
export default [
  {
    title: "Course name",
    issuer: "Issuer",
    date: "Jan 2026",
    image: "/images/cert.png", // optional
    href: "https://verification-link" // optional
  },
];
```

## Images

Put images in:
- `public/images/...`

Then reference them like:
- `"/images/my-image.png"`

## Common gotchas

- Ensure every entry has a unique `name`/`href` so React keys remain stable.
- If the page goes blank, open DevTools → Console: the Zod validator will tell you which field is wrong.
