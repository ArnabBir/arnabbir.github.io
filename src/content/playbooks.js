// Stable IDs are public routes. Keep source filenames for reproducible imports.
export const playbookSource = "https://github.com/ArnabBir/master-playbooks";
const categories = {
  payments: "Payments & Financial Infrastructure",
  search: "Search & AI Systems",
  geo: "Geospatial & Marketplace Systems",
  media: "Media & Communication",
  data: "Data Platforms & Resilience",
  languages: "Programming Languages",
  algorithms: "Algorithms & Data Structures",
  identity: "Identity & API Platforms",
};

// Summaries describe the supplied HTML, not access to proprietary internals or companion code.
const entries = [
  ["razorpay-engineering", "Razorpay_Engineering_Master_Playbook.html", "Razorpay — Money Movement Architecture", "payments", "Architecture study", "Trace payment promises through resource models, ledger evidence, settlement, and failure recovery.", ["Payments", "Ledgers", "Settlement"]],
  ["stripe-payment-infrastructure", "stripe_api_playbook.html", "Stripe — Payment Infrastructure", "payments", "Architecture study", "Connect PaymentIntents, merchant responsibilities, FX, and payouts to an original financial infrastructure design.", ["Payments", "APIs", "FX"]],
  ["cross-border-ledger-design", "cross_border_ledger_design.html", "Cross-Border Ledger — Design Blueprint", "payments", "Architecture study", "Study the production-design blueprint: accounting invariants, payment state machines, idempotency, and recovery boundaries.", ["Ledgers", "Idempotency", "Reliability"]],
  ["cross-border-ledger-playbook", "cross_border_ledger_playbook.html", "Cross-Border Ledger — Illustrated Playbook", "payments", "Architecture study", "Work through the illustrated ledger edition, with architecture diagrams, design chapters, and a measured availability target.", ["Ledgers", "Distributed Systems", "Reliability"]],
  ["stock-exchange", "stock_exchange_playbook.html", "Stock Exchange — From Orders to Matching", "payments", "Study course", "Follow an order from client and broker to the exchange, then reason about matching and resilient execution.", ["Trading", "Matching", "Reliability"]],
  ["google-search-engineering", "Google_Search_Engineering_Master_Playbook.html", "Google Search — Engineering Study", "search", "Architecture study", "Explore search architecture through public evidence, separating published internals from reference-design choices.", ["Search", "Indexing", "Distributed Systems"]],
  ["chatgpt-playbook", "chatgpt_master_playbook.html", "ChatGPT — Product & Workflow Playbook", "search", "Product playbook", "Navigate Chat, Work, and Codex, with model selection, effort levels, entitlements, and workflow boundaries.", ["AI", "ChatGPT", "Developer Tools"]],
  ["glean-playbook", "glean_master_playbook.html", "Glean — Enterprise Search & AI", "search", "Product playbook", "Learn enterprise search through queries, filters, evidence, and role-based workflows across Glean's product surfaces.", ["Search", "AI", "Enterprise"]],
  ["llm-engineers-handbook", "LLM_Engineers_Handbook_Bite_Sized_Playbook.html", "LLM Engineer’s Handbook — Study Companion", "search", "Book companion", "Review the handbook through bite-sized concepts and a searchable learning library for LLM engineering.", ["AI", "LLM", "Machine Learning"]],
  ["google-maps-engineering", "Google_Maps_Engineering_Master_Playbook.html", "Google Maps — From Capture to Arrival", "geo", "Architecture study", "Model a changing world through the map product atlas, public engineering history, and capture-to-arrival architecture.", ["Geospatial", "Maps", "Routing"]],
  ["uber-engineering", "Uber_Engineering_Master_Playbook.html", "Uber — Marketplace Architecture", "geo", "Architecture study", "Study the platform end to end, using architecture reading paths and explicit boundaries around public evidence.", ["Geospatial", "Marketplaces", "Distributed Systems"]],
  ["doordash-engineering", "DoorDash_Engineering_Master_Playbook.html", "DoorDash — Decisions & Commitments", "geo", "Architecture study", "Explore delivery-platform domain invariants and architecture that separates marketplace decisions from durable commitments.", ["Marketplaces", "Delivery", "State Machines"]],
  ["netflix-engineering", "Netflix_Engineering_Master_Playbook.html", "Netflix — Experience & Streaming", "media", "Architecture study", "Follow a streaming platform from foundations and architecture into the experience and discovery layers.", ["Streaming", "Discovery", "Distributed Systems"]],
  ["youtube-engineering", "YouTube_Engineering_Master_Playbook.html", "YouTube — Video Platform Architecture", "media", "Architecture study", "Use the engineering map to understand a video platform as six cooperating businesses, with published evidence boundaries.", ["Video", "Streaming", "Platforms"]],
  ["whatsapp-engineering", "WhatsApp_Engineering_Master_Playbook.html", "WhatsApp — Messaging & Trust", "media", "Architecture study", "Follow a message through distinct trust models, historical engineering evidence, and the facts behind delivery.", ["Messaging", "Trust", "Distributed Systems"]],
  ["twilio-engineering", "Twilio_Engineering_Master_Playbook.html", "Twilio — Communications Platform Study", "media", "Architecture study", "Study a fictional communications platform across messaging, voice, customer data, permission, and usage billing.", ["Messaging", "APIs", "Customer Data"]],
  ["airflow-study-course", "Airflow_Bite_Sized_Study_Course.html", "Airflow — One Concept at a Time", "data", "Book companion", "Use a bite-sized book companion with a course library, reading settings, and a source-based study guide.", ["Airflow", "Data Pipelines", "Orchestration"]],
  ["hbase-in-action", "HBase_in_Action_Bite_Sized_Playbook.html", "HBase in Action — Study Companion", "data", "Book companion", "Navigate HBase in Action as a learning library of focused concepts for studying distributed storage.", ["HBase", "Storage", "Distributed Systems"]],
  ["cohesity-engineering", "cohesity_engineering_playbook.html", "Cohesity — Recovery & Data Resilience", "data", "Architecture study", "Start with recovery contracts, then examine snapshot ingestion, restore verification, and public SpanFS evidence.", ["Backup", "Storage", "Recovery"]],
  ["java-to-go", "java-to-go-playbook.html", "Java to Go — One Concept at a Time", "languages", "Study course", "Bridge Java mental models to Go with 144 lessons, exercises, checkpoints, and locally saved progress.", ["Java", "Go", "Concurrency"]],
  ["java-low-level-design", "Java_Low_Level_Design_Field_Guide.html", "Java — Low-Level Design Field Guide", "languages", "Study course", "Practice low-level design interviews by tracing code, answering design questions, and working through a daily workshop.", ["Java", "Design", "Interviews"]],
  ["java-dsa", "Java_DSA_Field_Guide.html", "Java DSA — 400-Lesson Field Guide", "algorithms", "Study course", "Build a daily algorithms habit using a learning map and 400 bite-sized Java data-structure and algorithm lessons.", ["Java", "Algorithms", "Data Structures"]],
  ["okta-identity-platform", "Okta_Engineering_Master_Playbook.html", "Okta-like Identity — Platform Design", "identity", "Architecture study", "Build a mental model of an identity platform, with layered reading paths and clearly stated design limits.", ["Identity", "Security", "Platforms"]],
  ["postman-playbook", "postman_master_playbook.html", "Postman — API Workflow Playbook", "identity", "Product playbook", "Explore the request workbench, HTTP editor, agents, and platform trust boundaries through practical API workflows.", ["APIs", "Developer Tools", "HTTP"]],
];

export const playbooks = entries.map(([id, sourceFile, title, category, format, description, tags]) => ({
  id, sourceFile, title, category: categories[category], format, description, tags,
  contentPath: `/library/playbooks/${id}.html`,
  sourceUrl: playbookSource,
  collection: "Master playbooks",
  supportsThemeMessaging: false,
  featured: false,
}));

export const playbookPaths = [
  { title: "Follow the money", description: "Payment APIs → accounting invariants → recovery.", ids: ["stripe-payment-infrastructure", "cross-border-ledger-design", "cross-border-ledger-playbook"] },
  { title: "Understand a marketplace", description: "Map the world → coordinate supply → commit delivery.", ids: ["google-maps-engineering", "uber-engineering", "doordash-engineering"] },
  { title: "Build your engineering practice", description: "Language foundations → design decisions → algorithm practice.", ids: ["java-to-go", "java-low-level-design", "java-dsa"] },
];
