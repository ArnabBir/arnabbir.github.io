export default [
  {
    company: "PhonePe",
    role: "Software Engineer",
    location: "Bengaluru, India",
    start: "May 2023",
    end: "Present",
    logo: "/images/phonepe-logo.jpeg",
    website: "https://www.phonepe.com/",
    summary:
      "Engineered TStore (Transaction Store), a high‑performance post‑payment persistence platform.",
    highlights: [
      "Scaled TStore to support 300M+ transactions/day with 99.99% availability and latency‑sensitive Transaction APIs (p99 < 100ms, p50 < 5ms, 200K RPS).",
      "Designed durability, disaster recovery, and operational tooling to keep writes safe and reads fast under load.",
      "Partnered with multiple teams to onboard new use‑cases and improve debuggability (dashboards, runbooks, and SLOs).",
    ],
    tech: ["Java", "Kubernetes", "Kafka", "Redis", "MySQL", "Observability", "SLO/SLA"],
    links: [
      {
        label: "Demystifying TStore (Chapter 1)",
        href: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/",
      },
      {
        label: "Demystifying TStore (Chapter 2)",
        href: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/",
      },
    ],
  },
  {
    company: "Google",
    role: "Software Engineer",
    location: "Bengaluru, India",
    start: "Sep 2021",
    end: "May 2023",
    logo: "/images/google-logo.jpeg",
    website: "https://cloud.google.com/",
    summary:
      "Worked on Google Cloud Directory Sync (GCDS) and customer analytics for Cloud Identity.",
    highlights: [
      "Engineered features for Google Cloud Directory Sync used by enterprise customers across Workspace, GCP, Android, and Chrome.",
      "Designed and launched an Identity Sync analytics pipeline to understand usage, reliability, and adoption patterns.",
      "Improved operational visibility and incident response with better logging, dashboards, and actionable alerts.",
    ],
    tech: ["Java", "Google Cloud", "Data pipelines", "APIs", "Observability"],
    links: [],
  },
  {
    company: "Flipkart",
    role: "Software Development Engineer II",
    location: "Bengaluru, India",
    start: "Feb 2021",
    end: "Sep 2021",
    logo: "/images/flipkart-logo.png",
    website: "https://www.flipkart.com/",
    summary:
      "Tech lead in platform team driving scalability, reliability, and platform consolidation.",
    highlights: [
      "Led platform consolidation and new use‑case adoption while owning KTLO and reliability improvements.",
      "Designed and built Atlas SLA Governance to quantify NPS impact of network changes on E‑Kart logistics metrics (SLA/Breach/Precision).",
    ],
    tech: ["Java", "Microservices", "Data", "Dashboards", "SLA/SLO"],
    links: [],
  },
  {
    company: "Flipkart",
    role: "Software Development Engineer I",
    location: "Bengaluru, India",
    start: "Jul 2019",
    end: "Jan 2021",
    logo: "/images/flipkart-logo.png",
    website: "https://www.flipkart.com/",
    summary:
      "Built and improved systems in Supply Chain Engineering to optimize delivery flows and customer experience.",
    highlights: [
      "Worked across multiple projects to improve delivery performance, resilience, and internal tooling.",
      "Collaborated with product, ops, and analytics teams to measure impact and ship iteratively.",
    ],
    tech: ["Java", "Distributed systems", "Data", "Operations"],
    links: [],
  },
];
