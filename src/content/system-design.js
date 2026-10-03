export const systemDesign = [
  {
    id: "system-design-masterclass",
    title: "System Design Masterclass",
    description: "Study requirements, invariants, distributed-system patterns, and 65 case studies. Go deeper into networks, applied AI, staff architecture, Java concurrency, and evidence-based engineering with interactive capacity and practice tools.",
    category: "System Design",
    format: "Study course",
    tags: ["System Design", "Distributed Systems", "Networks", "AI Systems", "Java", "Architecture"],
    collection: "System Design",
    contentPath: "/library/system-design-masterclass/index.html",
    sourceFile: "site/index.html",
    sourceUrl: "https://github.com/arnabbir/system-design-masterclass",
    supportsThemeMessaging: false,
    readerNote: "Full built course with its own search, navigation, diagrams, capacity calculator, and practice console. Browser tools run here; Python fixtures and Java examples run locally. Open full page for focused study. Saved tool state belongs to this browser origin.",
    featured: false,
  },
  {
    id: "system-design-practice-lab",
    title: "Design Gym: System Design Practice Lab",
    description: "Practice across 26 tracks: 896 authored questions across 152 scenarios, 480 numerical variants, and 960 execution traces. Commit to an answer, inspect trade-offs, then revisit gaps with timed mocks and spaced review.",
    category: "System Design",
    format: "Practice studio",
    tags: ["System Design", "Interview Practice", "Capacity Planning", "Concurrency", "Reliability"],
    collection: "System Design",
    contentPath: "/library/system-design-practice-lab/index.html",
    sourceFile: "index.html",
    sourceUrl: "https://github.com/arnabbir/system-design-practice-lab",
    supportsThemeMessaging: false,
    readerNote: "Complete static practice app: five answer formats, explanations, notes, bookmarks, timed mocks, and progress backup/restore. Progress is saved on this origin, not synced from your local checkout. Generated variants are not independently authored scenarios; scores do not predict interview performance.",
    featured: false,
  },
];

export const systemDesignPath = {
  title: "Learn the system. Defend the decision.",
  description: "Theory → deliberate practice. Study an invariant and a case study in the masterclass, test the trade-offs in Design Gym, then return to an open-ended design with sizing and failure analysis.",
  ids: systemDesign.map(item => item.id),
};
