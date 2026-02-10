export default [
  {
    name: "PhonePe Transaction Store (TStore)",
    description:
    "Transaction Store (TStore) is the transactional data storage and retrieval system that powers post payment experience at PhonePe.",
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
    name: "Google Cloud Directory Sync (GCDS)",
    description:
      "An enterprise synchronization tool used by Google Workspace and Cloud Identity customers worldwide to sync users, groups, org units, contacts, and calendar resources from Active Directory / LDAP to their Google domain.",
    image: "/images/gcds-screenshot.png",
    tags: ["Google Cloud", "Identity", "Enterprise", "LDAP", "Active Directory"],
    highlights: [
      "Syncs users, groups, org units, shared contacts, calendar resources, and custom schemas from any LDAP-compliant directory.",
      "Powers identity lifecycle management for enterprises across Google Workspace, GCP, Android, and Chrome.",
      "Built analytics pipelines to understand sync reliability, adoption, and usage patterns at scale.",
    ],
    links: [
      {
        label: "Product page",
        href: "https://tools.google.com/dlpage/dirsync/",
      },
      {
        label: "Documentation",
        href: "https://support.google.com/a/topic/2679497",
      },
    ],
    featured: true,
    kind: "featured",
  },
  {
    name: "Google Cloud User Auto Provisioning",
    description:
      "Automated user provisioning for SAML apps in Google Workspace — changes to user identities in the Admin console are automatically synced to supported third-party cloud applications.",
    image: "/images/auto-provisioning-screenshot.png",
    tags: ["Google Cloud", "Identity", "SAML", "Provisioning", "Enterprise"],
    highlights: [
      "Add, modify, or delete users in the Admin console and changes propagate automatically to third-party apps.",
      "Supports up to 100 SAML apps for Business Standard, Business Plus, Frontline, and Enterprise editions.",
      "Operates on active, suspended, and deleted users with periodic sync cycles.",
    ],
    links: [
      {
        label: "Documentation",
        href: "https://support.google.com/a/answer/7681608?hl=en",
      },
    ],
    featured: true,
    kind: "featured",
  },
  {
    name: "Arkham — Supply Chain Insights Platform (Flipkart)",
    description:
      "A real-time supply chain intelligence platform at Flipkart that provides end-to-end visibility into the fulfilment journey — from warehouse to last-mile delivery — enabling proactive decision-making and reducing SLA breaches.",
    image: "/images/arkham-screenshot.png",
    tags: ["Supply Chain", "Full Stack", "Data Platform", "Flipkart"],
    highlights: [
      "End-to-end fulfilment visibility across warehousing, transportation, and last-mile delivery.",
      "Proactive alerting and insights to reduce SLA breaches and improve delivery performance.",
      "Built as the cockpit for Flipkart's supply chain — ensuring passengers within the airport never miss a flight.",
    ],
    links: [
      {
        label: "Flipkart Tech Blog",
        href: "https://blog.flipkart.tech/services-fulfilment-cockpit-why-passengers-within-flipkarts-airport-never-miss-a-flight-693855697f45",
      },
    ],
    featured: true,
    kind: "featured",
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
