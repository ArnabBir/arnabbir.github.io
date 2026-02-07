/**
 * Engineering Library - Study materials with interactive illustrations
 * Each item can be a standalone HTML page or embedded content
 */

import { tlpiAppendices, tlpiChapters, tlpiMeta } from "./tlpi";

export default [
  {
    id: "tlpi",
    title: "The Linux Programming Interface - Interactive Companion",
    description: "Interactive chapter-by-chapter companion to TLPI with kernel mental models, syscall maps, labs, and production notes.",
    category: "Systems Programming",
    tags: ["Linux", "OS", "Syscalls", "Kernel", "TLPI"],
    contentPath: "/library/index.html",
    date: "2026-02-06",
    featured: true,
    highlights: [
      "64 interactive chapters plus appendices",
      "Kernel mental model maps and syscall layers",
      "Hands-on labs: processes, files, signals, sockets",
      "Production debugging checklists and pitfalls"
    ],
    chapters: [...tlpiChapters, ...tlpiAppendices],
    difficulty: "Advanced",
    readingTime: `${tlpiMeta.chapterCount} chapters`,
  },
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
      { title: "Google Mendel: Overlapping Experiment Infrastructure" },
      {
        title: "The Google File System (GFS)",
        contentPath: "/library/google_file_system.html",
      },
      {
        title: "MapReduce: Simplified Data Processing",
        contentPath: "/library/map_reduce.html",
      },
      {
        title: "Bigtable: A Distributed Storage System",
        contentPath: "/library/bigtable.html",
      },
      { title: "The Chubby Lock Service" },
      { title: "Spanner: Globally Distributed Database" },
      { title: "Borg: The Cluster Management System" },
      { title: "Dremel: Interactive Analysis of Web-Scale Data" },
      { title: "Pregel: Large-Scale Graph Processing" },
      { title: "F1: The Fault-Tolerant Distributed SQL Database" },
      { title: "Colossus: The Google File System (Next Gen)" },
      { title: "Percolator: Incremental Processing" },
      { title: "MillWheel: Stream Processing System" },
      { title: "TensorFlow: Large-Scale Machine Learning" },
      { title: "Lambda Architecture (Google perspective)" },
      { title: "Monarch: Planet-Scale Monitoring" },
      { title: "Google Infrastructure Security Design" },
      { title: "Photon / PubSub: Messaging at Scale" },
      { title: "Jupiter Rising: Network Architecture at Google" },
      { title: "Autopilot: Workload Management" },
      { title: "Inside Google Datacenters & Networking" },
      { title: "SRE Workbook Foundations (Google SRE)" }
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
  {
    id: "ddia",
    title: "Designing Data-Intensive Applications — Interactive Atlas",
    description:
      "Chapter-by-chapter interactive companion to DDIA covering data models, replication, partitioning, transactions, consistency, batch & stream processing, and the future of data systems.",
    category: "Systems Design",
    tags: ["Distributed Systems", "Databases", "DDIA", "Data Engineering"],
    contentPath: "/library/ddia_interactive_library_atlas/index.html",
    date: "2026-02-07",
    featured: true,
    highlights: [
      "12 interactive chapters with hands-on labs",
      "Design checklists and failure-mode thinking",
      "Concept map across all chapters",
      "Glossary of key terms and tradeoffs",
    ],
    chapters: [
      {
        title: "Reliable, Scalable & Maintainable Applications",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/01-reliable-scalable-maintainable.html",
      },
      {
        title: "Data Models & Query Languages",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/02-data-models-query-languages.html",
      },
      {
        title: "Storage & Retrieval",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/03-storage-and-retrieval.html",
      },
      {
        title: "Encoding & Evolution",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/04-encoding-and-evolution.html",
      },
      {
        title: "Replication",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/05-replication.html",
      },
      {
        title: "Partitioning",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/06-partitioning.html",
      },
      {
        title: "Transactions",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/07-transactions.html",
      },
      {
        title: "The Trouble with Distributed Systems",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/08-trouble-with-distributed-systems.html",
      },
      {
        title: "Consistency & Consensus",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/09-consistency-and-consensus.html",
      },
      {
        title: "Batch Processing",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/10-batch-processing.html",
      },
      {
        title: "Stream Processing",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/11-stream-processing.html",
      },
      {
        title: "The Future of Data Systems",
        contentPath:
          "/library/ddia_interactive_library_atlas/chapters/12-future-of-data-systems.html",
      },
      {
        title: "Glossary",
        contentPath:
          "/library/ddia_interactive_library_atlas/glossary.html",
      },
    ],
    difficulty: "Advanced",
    readingTime: "12 chapters",
  },
];
