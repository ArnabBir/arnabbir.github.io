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
  {
    company: "Flipkart",
    role: "Software Development Engineer Intern",
    location: "Bengaluru, India",
    start: "May 2018",
    end: "Jul 2018",
    logo: "/images/flipkart-logo.png",
    website: "https://www.flipkart.com/",
    summary:
      "Built a full-stack validation platform for Flipkart's Incremental Data Transformation Pipeline and prototyped an alert framework for supply chain event prediction.",
    highlights: [
      "Built a full-stack application to validate data correctness and data quality of Flipkart's Incremental Data Transformation Pipeline.",
      "Developed the prototype of an alert framework to predict severity and impact of different events to decrease breach in supply chain.",
    ],
    tech: ["Java", "Full Stack", "Data Pipeline", "Supply Chain"],
    links: [
      {
        label: "Flipkart Tech — Services Fulfilment Cockpit",
        href: "https://tech.flipkart.com/services-fulfilment-cockpit-why-passengers-within-flipkarts-airport-never-miss-a-flight-693855697f45",
      },
    ],
  },
  {
    company: "HiLabs Inc",
    role: "Software Engineer Intern",
    location: "Mumbai, India",
    start: "Jan 2018",
    end: "Apr 2018",
    logo: "/images/hilabs-logo.png",
    website: "https://www.hilabs.com/",
    summary:
      "Developed a Spark-based application for association rules generation and automated feature mapping on high-dimension healthcare data.",
    highlights: [
      "Developed an application for association rules generation and automated feature mapping using Spark to process high-dimension healthcare data.",
      "Created unit and integration tests and validated outcomes across several scenarios using healthcare data from California state.",
    ],
    tech: ["Apache Spark", "Healthcare Data", "Association Rules", "Testing"],
    links: [],
  },
  {
    company: "axio (Amazon)",
    role: "Intern",
    location: "Bengaluru, India",
    start: "May 2017",
    end: "Jul 2017",
    logo: "/images/axio-logo.png",
    website: "https://www.axio.co.in/",
    summary:
      "End-to-end POC work spanning fraud detection, location intelligence, lending automation, and early warning systems — at Capital Float (now axio, acquired by Amazon in 2025).",
    highlights: [
      "Built an end-to-end POC for tracking artificial bank statements and expenditure estimates based on SMS data, later branded as Walnut.",
      "Created a location profiling dashboard using Google Maps API with features for landmarks, transportation, and traffic for credit risk modelling.",
      "Automated the workflow of the Lending Policy Decision Engine for cab rental partners like Uber and Ola.",
      "Developed a batch job to create Early Warning Statement notifications for Amazon PayLater delinquent customers.",
    ],
    tech: ["Full Stack", "Maps API", "Fraud Detection", "Credit Risk", "Automation"],
    links: [
      {
        label: "Walnut (Google Play)",
        href: "https://play.google.com/store/apps/details?id=com.daamitt.walnut.app&hl=en_IN&gl=US",
      },
    ],
  },
  {
    company: "Indian Statistical Institute",
    role: "Research Intern — Machine Intelligence Unit",
    location: "Kolkata, India",
    start: "May 2016",
    end: "Jul 2016",
    logo: "/images/isi-logo.png",
    website: "https://www.isical.ac.in/",
    summary:
      "Research internship focused on stochastic simulation algorithms at the Machine Intelligence Unit.",
    highlights: [
      "Developed a new Tau Leap approximation approach using a multistep predictor-corrector method, outperforming existing algorithms (ODM, SUSSA, SUESSA).",
    ],
    tech: ["Stochastic Simulation", "Numerical Methods", "Research", "Python"],
    links: [],
  },
];
