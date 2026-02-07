export default [
  {
    name: "Demystifying TStore (PhonePe Tech Blog)",
    description:
      "A two-part series exploring the Transaction Store (TStore) that powers post-payment persistence at PhonePe.",
    image: "/images/tstore2.png",
    tags: ["Distributed Systems", "Reliability", "Payments"],
    highlights: [
      "Architecture deep dive: datastores, queues, DR strategy, and security.",
      "Practical lessons on scaling, SLOs, and operational excellence.",
    ],
    links: [
      {
        label: "Chapter 1",
        href: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/",
      },
      {
        label: "Chapter 2",
        href: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/",
      },
    ],
    featured: true,
    kind: "featured",
  },
  {
    name: "PortfolioHub",
    description:
      "A personal finance command center for net worth, asset allocation, cashflow health, and FIRE planning.",
    tags: ["React", "Data Viz", "Personal Finance"],
    highlights: [
      "Insight-rich dashboards with projections and savings diagnostics.",
      "Import/export workflows plus shareable PDF reports.",
    ],
    links: [{ label: "Open app", href: "/portfoliohub" }],
    featured: true,
    kind: "lab",
  },
  {
    name: "Orator — Web Narrator",
    description:
      "A privacy-first browser extension that narrates web pages with natural voices, click-to-seek, sentence highlighting, and speed control. Available on Chrome and Firefox.",
    image: "/images/orator-screenshot.png",
    tags: ["Chrome Extension", "Firefox Add-on", "Accessibility", "TTS"],
    highlights: [
      "Click any sentence to start narration from that exact point.",
      "Multiple system voices with searchable picker and speed control.",
      "Runs entirely on-device — no servers, no AI, no tracking.",
    ],
    links: [
      {
        label: "Chrome Web Store",
        href: "https://chromewebstore.google.com/detail/orator-%E2%80%94-web-narrator/becblgoenaekioaddgjgenjldaniadao",
      },
      {
        label: "Firefox Add-ons",
        href: "https://addons.mozilla.org/en-US/firefox/addon/orator-web-narrator/",
      },
      {
        label: "How it works",
        href: "/projects/orator",
      },
    ],
    featured: true,
    kind: "featured",
  },
  {
    name: "HUIM-ACO",
    description: "High Utility Itemset Mining using Ant Colony Optimization.",
    tags: ["Algorithms", "Research"],
    highlights: [
      "Implements HUIM with an ACO-based search strategy.",
      "Reproducible experiments and clear documentation.",
    ],
    links: [{ label: "GitHub", href: "https://github.com/ArnabBir/huim-aco" }],
    featured: false,
    kind: "open-source",
  },
  {
    name: "Scalable Matrix Computation",
    description: "Efficient algorithms for large-scale matrix operations.",
    tags: ["Distributed Systems", "Linear Algebra"],
    highlights: ["Focus on performance and practical scalability constraints."],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/ArnabBir/scalable-matrix-computation",
      },
    ],
    featured: false,
    kind: "open-source",
  },
  {
    name: "IIKH",
    description: "Interactive Intelligent Kitchen Helper — an AI-powered kitchen assistant app.",
    tags: ["AI", "Product"],
    highlights: ["Explores conversational UX and practical workflows for cooking."],
    links: [{ label: "GitHub", href: "https://github.com/ArnabBir/IIKH" }],
    featured: false,
    kind: "open-source",
  },
  {
    name: "This Website",
    description:
      "A fast, accessible portfolio built with Vite + React + Tailwind. Content is data-driven so you can keep adding entries.",
    tags: ["Vite", "React", "Tailwind"],
    highlights: [
      "Command palette (Ctrl/⌘ K) for quick navigation.",
      "Dark mode, responsive layout, and GitHub Pages-friendly routing.",
    ],
    links: [{ label: "Source", href: "https://github.com/arnabbir/arnabbir.github.io" }],
    featured: false,
    kind: "featured",
  },
];
