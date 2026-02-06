/**
 * Engineering Library - Study materials with interactive illustrations
 * Each item can be a standalone HTML page or embedded content
 */

export default [
  {
    id: "mendel",
    title: "Google Mendel: Overlapping Experiment Infrastructure",
    description: "Deep dive into the architecture enabling 10,000+ simultaneous experiments via orthogonal layering, cookie-based diversion, and real-time parameter injection.",
    category: "Systems Design",
    tags: ["A/B Testing", "Infrastructure", "Experimentation", "Google"],
    // thumbnail: "/images/mendel-thumb.png", // Optional: Add thumbnail image to public/images/
    contentPath: "/library/mendel.html", // Path to the HTML file (served from public/library/)
    date: "2024-01-15",
    featured: true,
    highlights: [
      "Multi-layer orthogonality explained with interactive charts",
      "Mod-1000 hashing simulation",
      "Jackknife estimation methodology",
      "Complete technical architecture breakdown"
    ],
    chapters: [
      "Chapter 01 — Google Mendel: Overlapping Experiment Infrastructure",
      "Chapter 02 — The Google File System (GFS)",
      "Chapter 03 — MapReduce: Simplified Data Processing",
      "Chapter 04 — Bigtable: A Distributed Storage System",
      "Chapter 05 — The Chubby Lock Service",
      "Chapter 06 — Spanner: Globally Distributed Database",
      "Chapter 07 — Borg: The Cluster Management System",
      "Chapter 08 — Dremel: Interactive Analysis of Web-Scale Data",
      "Chapter 09 — Pregel: Large-Scale Graph Processing",
      "Chapter 10 — F1: The Fault-Tolerant Distributed SQL Database",
      "Chapter 11 — Colossus: The Google File System (Next Gen)",
      "Chapter 12 — Percolator: Incremental Processing",
      "Chapter 13 — MillWheel: Stream Processing System",
      "Chapter 14 — TensorFlow: Large-Scale Machine Learning",
      "Chapter 15 — Lambda Architecture (Google perspective)",
      "Chapter 16 — Monarch: Planet-Scale Monitoring",
      "Chapter 17 — Google Infrastructure Security Design",
      "Chapter 18 — Photon / PubSub: Messaging at Scale",
      "Chapter 19 — Jupiter Rising: Network Architecture at Google",
      "Chapter 20 — Autopilot: Workload Management",
      "Chapter 21 — Inside Google Datacenters & Networking",
      "Chapter 22 — SRE Workbook Foundations (Google SRE)"
    ],
    difficulty: "Advanced",
    readingTime: "15 min",
  },
  {
    id: "java-reference",
    title: "Java Reference Guide: Core Concepts & Best Practices",
    description: "Comprehensive guide to Java fundamentals, object-oriented programming, collections framework, concurrency, and best practices for building robust applications.",
    category: "Programming Languages",
    tags: ["Java", "OOP", "Collections", "Concurrency", "Programming"],
    contentPath: "/library/java_reference.html",
    date: "2024-02-07",
    featured: true,
    highlights: [
      "Complete OOP concepts with code examples",
      "Collections framework overview",
      "Concurrency and multithreading basics",
      "Best practices and design patterns"
    ],
    chapters: [
      "Core Java Foundations",
      "OOP & Design Principles",
      "JVM Memory & Garbage Collection",
      "Collections & Generics",
      "Streams & Functional Style",
      "Concurrency & Java Memory Model",
      "Exceptions & Reliability",
      "I/O, NIO & Networking"
    ],
    difficulty: "Intermediate",
    readingTime: "20 min",
  },
  {
    id: "java-performance-scott-oaks",
    title: "Java Performance (Scott Oaks) — Concept Atlas",
    description: "A concept-by-concept atlas of Java Performance: measurement, GC, JIT, memory, concurrency, and tuning workflows. Structured like a study shelf with deep dives.",
    category: "Performance Engineering",
    tags: ["Java", "Performance", "JVM", "GC", "Profiling"],
    contentPath: "/library/java_performance_scott_oaks.html",
    date: "2024-02-07",
    featured: true,
    highlights: [
      "Concept rack with in-depth chapters and quizzes",
      "GC and JIT decision guides with best practices",
      "Performance testing workflow and pitfalls",
      "Tooling playbook with actionable checklists"
    ],
    chapters: [
      "Measurement First",
      "Warmup & Steady State",
      "Variance & Outliers",
      "Latency vs Throughput",
      "Heap Layout",
      "GC Algorithms",
      "GC Log Analysis",
      "JIT Compilation",
      "Inlining & Escape Analysis",
      "Lock Contention",
      "Thread Pool Tuning",
      "Memory Leak Detection",
      "Classloading & Metaspace",
      "I/O & System Calls",
      "CPU Cache Locality",
      "Profiling Workflow",
      "Performance Observability",
      "Reference Types",
      "Tuning Workflow"
    ],
    difficulty: "Advanced",
    readingTime: "35 min",
  },
];
