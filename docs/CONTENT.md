# Add or update portfolio content

Portfolio entries are data-driven. Add an object to the relevant file in
`src/content/` and the existing UI will render it automatically. You do not
need to edit a React component when adding an experience, education entry,
project, article, skill group, or certification.

## Workflow

1. Open the relevant file in `src/content/`.
2. Copy a template from this guide into the exported array.
3. Replace the placeholder values and remove unused optional fields.
4. Put any new images in `public/images/`.
5. Run `npm run dev` and review the result.
6. Run `npm run lint` and `npm run build` before publishing.

Content is validated by Zod in `src/content/schema.js`. A missing required
field or invalid value will produce a validation error rather than silently
rendering incorrect content.

## Site profile

Edit `src/content/site.js` to update your name, role, introduction, email,
resume, social links, or mentoring links. This file is an object rather than
an array; edit its existing values instead of adding another object.

## Experience

Edit `src/content/experience.js` and add an object to the exported array:

```js
{
  company: "Company name",
  role: "Role title",
  location: "City or Remote", // optional
  start: "Jan 2024",
  end: "Present",
  logo: "/images/company.png", // optional
  website: "https://company.example", // optional
  summary: "A short description of your scope.", // optional
  highlights: [
    "Describe an outcome, preferably with a measurable result.",
    "Explain another important contribution.",
  ],
  tech: ["Java", "Kafka", "Kubernetes"],
  links: [
    { label: "Case study", href: "https://example.com/case-study" },
  ],
},
```

`highlights`, `tech`, and `links` may be empty arrays. Put the newest role
first and the strongest result first within `highlights`.

## Education

Edit `src/content/education.js`:

```js
{
  school: "University name",
  degree: "Degree and subject",
  start: "2018", // optional
  end: "2022", // optional
  logo: "/images/university.png", // optional
  website: "https://university.example", // optional
  details: ["GPA: 9.0", "Class rank: 3"],
  links: [
    { label: "Coursework", href: "https://example.com/coursework" },
  ],
},
```

`details` and `links` may be empty arrays.

## Projects

Edit `src/content/projects.js`:

```js
{
  name: "Project name",
  description: "One sentence explaining what the project does.",
  image: "/images/project.png", // optional
  tags: ["React", "Node.js"],
  highlights: [
    "What makes the project useful or technically interesting?",
    "Include a measurable result when possible.",
  ],
  links: [
    { label: "GitHub", href: "https://github.com/user/project" },
    { label: "Live", href: "https://project.example" },
  ],
  featured: true,
  kind: "featured",
},
```

Allowed `kind` values are `"featured"`, `"open-source"`, and `"lab"`. They
control which project tab contains the entry. `tags`, `highlights`, and
`links` may be empty arrays.

## Writing

Edit `src/content/writing.js`:

```js
{
  title: "Article title",
  publication: "Publication name", // optional
  date: "Jul 2026", // optional
  description: "A short reason someone should read this.", // optional
  href: "https://example.com/article",
  tag: "Distributed Systems", // optional
  image: "/images/article.png", // optional
},
```

## Skills

Edit `src/content/skills.js`. Each object creates a skill category:

```js
{
  category: "Languages",
  items: ["Java", "Go", "Python"],
},
```

To add a skill to an existing category, append its name to that category's
`items` array instead of creating another category.

## Certifications

Edit `src/content/certifications.js`:

```js
{
  title: "Certification or course name",
  issuer: "Issuing organization",
  date: "Jan 2026", // optional
  image: "/images/certification.png", // optional
  href: "https://example.com/verify", // optional
},
```

## Library

Library entries support chapters, difficulty, reading time, and internal
content routes. Follow [the library guide](LIBRARY.md) rather than copying a
basic portfolio entry.

## Images

Place images under `public/images/` and reference them from content with a
root-relative path:

```js
image: "/images/project.png"
```

Use descriptive lowercase filenames, optimize large files before adding them,
and verify that filename capitalization matches exactly.

## Adding a new section type

Adding another entry to an existing section requires content changes only.
Creating an entirely new section currently requires application code:

1. Add its Zod schema and field to `src/content/schema.js`.
2. Add and export its data through `src/content/index.js`.
3. Create a renderer in `src/components/sections/`.
4. Add the renderer to `src/pages/Index.jsx`.
5. Add its navigation metadata to `SiteHeader.jsx` and `CommandMenu.jsx`.

Keep a distinct renderer when the section needs a distinct layout, such as a
timeline, carousel, or tabbed grid. Reuse existing layout primitives instead
of duplicating the section shell or card styles.

## Troubleshooting

- A blank page after editing content usually indicates a Zod validation error.
  Check the browser console for the failing field.
- Use arrays for `highlights`, `tags`, `links`, `details`, and `items`, even
  when there is only one value.
- Every link object requires both `label` and `href`.
- Use one of the documented project `kind` values exactly.
- Include a trailing comma after an object when another object follows it.
- See [the debugging guide](DEBUGGING.md) for build and runtime problems.
