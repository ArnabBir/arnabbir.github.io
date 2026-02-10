'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "napa",
  "title": "Napa",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Analytics • Planet-Scale Serving",
  "accent": "cyan",
  "heroIcon": "Database",
  "paper": {
    "filename": "Napa.pdf"
  },
  "abstract": "Google services continuously generate vast amounts of application data. This data provides valuable insights to business users. We need to store and serve these planet-scale data sets under the extremely demanding requirements of scalability, sub-second query response times, availability, and strong consistency; all this while ingesting a massive stream of updates from applications used around the globe. We have developed and deployed in production an analytical data management system, Napa, to meet these requirements. Napa is the backend for numerous clients in Google. These clients have a strong expectation of variance-free, robust query performance. At its core, Napa’s principal technologies for robust query performance include the aggressive use of materialized views, which are maintained consistently as new data is ingested across multiple data centers. Our clients also demand flexibility in being able to adjust their query performance, data freshness, and costs to suit their unique needs. Robust query processing and flexible configuration of client databases are the hallmark of Napa design. PVLDB Reference Format: Ankur Agiwal, Kevin Lai, Gokul Nath Babu Manoharan, Indrajit Roy, Jagan Sankaranarayanan, Hao Zhang, Tao Zou, Min Chen, Zongchang (Jim) Chen, Ming Dai, Thanh Do, Haoyu Gao, Haoyan Geng, Raman Grover, Bo Huang, Yanlai Huang, Zhi (Adam) Li, Jianyi Liang, Tao Lin, Li Liu, Yao Liu, Xi Mao, Yalan (Maya) Meng, Prashant Mishra, Jay Patel, Rajesh S. R., Vijayshankar Raman, Sourashis Roy, Mayank Singh Shishodia, Tianhang Sun, Ye (Justin) Tang, Junichi Tatemura, Sagar Trehan, Ramkumar Vadali, Prasanna Venkatasubramanian, Gensheng Zhang, Kefei Zhang, Yupu Zhang, Zeleng Zhuang, Goetz Graefe, Divyakant Agrawal, Jeff Naughton, Sujata Kosalge, Hakan Hacıgümüş. Napa: Powering Scalable Data Warehousing with Robust Query Performance at Google. PVLDB, 14(12): 2986-2998, 2021. doi:10.14778/3476311.3476377 This work is licensed under the Creative Commons BY-NC-ND 4.0 International License. Visit https://creativecommons.org/licenses/by-nc-nd/4.0/ to view a copy of this license. For any use beyond those covered by this license, obtain permission by emailing info@vldb.org. Copyright is held by the owner/author(s). Publication rights licensed to the VLDB Endowment. Proceedings of the VLDB Endowment, Vol. 14, No. 12 ISSN 2150-8097. doi:10.14778/3476311.3476377 Most of the related work in this area takes advantage of full flexibility to design the whole system without the need to support a diverse set of preexisting use cases. In comparison, a particular challenge we faced is that Napa needs to deal with hard constraints from existing applications and infrastructure, so we could not do a “green field” system, but rather had to satisfy existing constraints. These constraints led us to make particular design decisions and also devise new techniques to meet the challenges. In this paper, we share our experiences in designing, implementing, deploying, and running Napa in production with some of Google’s most demanding applications.",
  "diagram": {
    "nodes": [
      {
        "id": "producers",
        "label": "Application Producers",
        "icon": "Zap",
        "hint": "Emit updates/events"
      },
      {
        "id": "ingest",
        "label": "Ingestion",
        "icon": "ArrowDown",
        "hint": "Stream of writes/updates"
      },
      {
        "id": "store",
        "label": "Consistent Storage",
        "icon": "Database",
        "hint": "Durable, replicated"
      },
      {
        "id": "index",
        "label": "Metadata + Indexes",
        "icon": "Search",
        "hint": "Accelerate queries"
      },
      {
        "id": "query",
        "label": "Query Serving",
        "icon": "Server",
        "hint": "Sub-second interactive queries"
      }
    ],
    "flow": [
      "producers",
      "ingest",
      "store",
      "query"
    ]
  },
  "steps": [
    {
      "title": "Ingest global updates",
      "description": "Continuously ingest updates from applications worldwide.",
      "active": [
        "producers",
        "ingest"
      ],
      "log": "Update stream ingested.",
      "message": {
        "from": "Application Producers",
        "to": "Ingestion",
        "label": "Ingest"
      }
    },
    {
      "title": "Commit consistently",
      "description": "Writes are committed with strong consistency semantics.",
      "active": [
        "ingest",
        "store"
      ],
      "log": "Updates durably committed.",
      "message": {
        "from": "Ingestion",
        "to": "Consistent Storage",
        "label": "Commit"
      }
    },
    {
      "title": "Maintain indexes",
      "description": "Update indexes/materializations to support fast interactive queries.",
      "active": [
        "index",
        "store"
      ],
      "log": "Indexes updated.",
      "message": {
        "from": "Metadata + Indexes",
        "to": "Consistent Storage",
        "label": "Index"
      }
    },
    {
      "title": "Accept ad-hoc query",
      "description": "Business/ops user issues analytical query.",
      "active": [
        "query"
      ],
      "log": "Query received.",
      "message": {
        "from": "Query Serving",
        "to": "—",
        "label": "Query"
      }
    },
    {
      "title": "Plan & execute in parallel",
      "description": "Serve query using parallel scans/aggregations across shards.",
      "active": [
        "query",
        "store"
      ],
      "log": "Parallel execution across storage.",
      "message": {
        "from": "Query Serving",
        "to": "Consistent Storage",
        "label": "Parallel exec"
      }
    },
    {
      "title": "Return sub-second result",
      "description": "Merge results; exploit caching where possible.",
      "active": [
        "query"
      ],
      "log": "Result returned quickly.",
      "message": {
        "from": "Query Serving",
        "to": "—",
        "label": "Return"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Goal",
        "icon": "Info",
        "bullets": [
          "Store and serve **planet-scale analytical datasets** with strong consistency.",
          "Support sub-second query latency while ingesting massive continuous updates."
        ]
      },
      {
        "title": "System challenges",
        "icon": "AlertTriangle",
        "bullets": [
          "Balancing streaming ingest with interactive query performance.",
          "Global availability and correctness under failures and high concurrency."
        ]
      },
      {
        "title": "Design patterns",
        "icon": "Layers",
        "bullets": [
          "Separate ingest from serving, but keep a consistent storage foundation.",
          "Use indexing/materialization + parallel execution to hit latency targets."
        ]
      }
    ],
    "glossary": [
      {
        "term": "OLAP",
        "def": "Online analytical processing: large scans/aggregations for analytics."
      },
      {
        "term": "Materialization",
        "def": "Precomputing or persisting derived data to accelerate queries."
      },
      {
        "term": "Strong consistency",
        "def": "Clients observe a single, well-defined order of updates."
      },
      {
        "term": "Shard",
        "def": "Partition of data stored/served by a subset of machines."
      },
      {
        "term": "Serving layer",
        "def": "System component that answers interactive queries."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function NapaSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
