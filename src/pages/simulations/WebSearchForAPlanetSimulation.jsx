'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "web-search-for-a-planet",
  "title": "Web Search for a Planet",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Infrastructure • Cluster-based Search Serving",
  "accent": "indigo",
  "heroIcon": "Globe",
  "paper": {
    "filename": "Web Search for a Planet.pdf"
  },
  "abstract": "22 Few Web services require as much computation per request as search engines. On average, a single query on Google reads hundreds of megabytes of data and consumes tens of billions of CPU cycles. Supporting a peak request stream of thousands of queries per second requires an infrastructure compa- rable in size to that of the largest supercom- puter installations. Combining more than 15,000 commodity-class PCs with fault-tol- erant software creates a solution that is more cost-effective than a comparable system built out of a smaller number of high-end servers. Here we present the architecture of the Google cluster, and discuss the most important factors that inﬂuence its design: energy efﬁ- ciency and price-performance ratio. Energy efﬁciency is key at our scale of operation, as power consumption and cooling issues become signiﬁcant operational factors, taxing the lim- its of available",
  "diagram": {
    "nodes": [
      {
        "id": "dns",
        "label": "DNS Load Balancing",
        "icon": "Globe",
        "hint": "Selects a cluster"
      },
      {
        "id": "lb",
        "label": "Cluster Load Balancer",
        "icon": "Layers",
        "hint": "Routes to a web server"
      },
      {
        "id": "gws",
        "label": "Google Web Server",
        "icon": "Server",
        "hint": "Coordinates query"
      },
      {
        "id": "index",
        "label": "Index Servers",
        "icon": "Database",
        "hint": "Shard lookups + scoring"
      },
      {
        "id": "doc",
        "label": "Doc Servers",
        "icon": "HardDrive",
        "hint": "Fetch titles/snippets"
      }
    ],
    "flow": [
      "dns",
      "lb",
      "gws",
      "index",
      "doc"
    ]
  },
  "steps": [
    {
      "title": "DNS selects cluster",
      "description": "DNS-based LB routes user to a nearby cluster with capacity.",
      "active": [
        "dns"
      ],
      "log": "Cluster selected by proximity/capacity.",
      "message": {
        "from": "DNS Load Balancing",
        "to": "Cluster Load Balancer",
        "label": "DNS LB"
      }
    },
    {
      "title": "LB selects GWS",
      "description": "Within the cluster, a load balancer picks a Google Web Server.",
      "active": [
        "lb",
        "gws"
      ],
      "log": "Request routed to a GWS.",
      "message": {
        "from": "Cluster Load Balancer",
        "to": "Google Web Server",
        "label": "LB"
      }
    },
    {
      "title": "Scatter to index shards",
      "description": "GWS sends query to index servers for each shard/replica.",
      "active": [
        "gws",
        "index"
      ],
      "log": "Index shard lookups in parallel.",
      "message": {
        "from": "Google Web Server",
        "to": "Index Servers",
        "label": "Scatter"
      }
    },
    {
      "title": "Compute docids & scores",
      "description": "Index servers intersect hit lists and score candidates.",
      "active": [
        "index"
      ],
      "log": "Candidate docids ranked per shard.",
      "message": {
        "from": "Index Servers",
        "to": "Doc Servers",
        "label": "Score"
      }
    },
    {
      "title": "Fetch snippets",
      "description": "Doc servers fetch titles/URLs/snippets for top docids.",
      "active": [
        "doc",
        "gws"
      ],
      "log": "Snippets fetched in parallel.",
      "message": {
        "from": "Doc Servers",
        "to": "Google Web Server",
        "label": "Fetch"
      }
    },
    {
      "title": "Merge & respond",
      "description": "GWS merges results (plus ads/spell) and returns HTML.",
      "active": [
        "gws"
      ],
      "log": "Results merged and returned.",
      "message": {
        "from": "Google Web Server",
        "to": "Index Servers",
        "label": "Respond"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Workload characteristics",
        "icon": "Info",
        "bullets": [
          "Search queries are highly parallelizable: shards can be searched independently.",
          "Throughput and cost-efficiency matter more than peak single-server performance."
        ]
      },
      {
        "title": "Architecture principles",
        "icon": "Layers",
        "bullets": [
          "Reliability via software: replication and failure handling on commodity machines.",
          "Sharding + replication for both capacity and availability."
        ]
      },
      {
        "title": "Operational constraints",
        "icon": "AlertTriangle",
        "bullets": [
          "Power and cooling become first-order design constraints at large scale.",
          "Tail latency shaped by slow shards; parallelism helps hide stragglers."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Shard",
        "def": "Partition of the index over a subset of documents."
      },
      {
        "term": "Replication",
        "def": "Multiple copies of services/data for availability and throughput."
      },
      {
        "term": "GWS",
        "def": "Front-end server coordinating query execution and response rendering."
      },
      {
        "term": "Docserver",
        "def": "Service that fetches titles/snippets for selected documents."
      },
      {
        "term": "DNS load balancing",
        "def": "Using DNS responses to select among geographically distributed clusters."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function WebSearchForAPlanetSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
