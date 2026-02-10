'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "parallelism-optimizing-data-placement",
  "title": "Parallelism-Optimizing Data Placement for Faster Data-Parallel Computations",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Performance • Tail Latency via Placement",
  "accent": "emerald",
  "heroIcon": "Layers",
  "paper": {
    "filename": "Parallelism-Optimizing Data Placement for Faster Data-Parallel Computations.pdf"
  },
  "abstract": "Systems performing large data-parallel computations, including online analytical processing (OLAP) systems like Druid and search engines like Elasticsearch, are increasingly being used for business- critical real-time applications where providing low query latency is paramount. In this paper, we investigate an underexplored factor in the performance of data-parallel queries: their parallelism. We find that to minimize the tail latency of data-parallel queries, it is critical to place data such that the data items accessed by each indi- vidual query are spread across as many machines as possible so that each query can leverage the computational resources of as many machines as possible. To optimize parallelism and minimize tail latency in real systems, we develop a novel parallelism-optimizing data placement algorithm that defines a linearly-computable mea- sure of query parallelism, uses it to frame data placement as an optimization problem, and leverages a new optimization problem partitioning technique to scale to large cluster sizes. We apply this algorithm to popular systems such as Solr and MongoDB and show that it reduces p99 latency by 7-64% on data-parallel workloads. PVLDB Reference Format: Nirvik Baruah, Peter Kraft, Fiodar Kazhamiaka, Peter Bailis, and Matei Zaharia. Parallelism-Optimizing Data Placement for Faster Data-Parallel Computations. PVLDB, 16(4): 760 - 771, 2022. doi:10.14778/3574245.3574260 PVLDB Artifact Availability: The source code, data, and/or other artifacts have been made avail- able at https://github.com/stanford-futuredata/parallel-lb-simulator/tree/ VLDB2023.",
  "diagram": {
    "nodes": [
      {
        "id": "workload",
        "label": "Query Workload",
        "icon": "Monitor",
        "hint": "Observed access patterns"
      },
      {
        "id": "optimizer",
        "label": "Placement Optimizer",
        "icon": "Search",
        "hint": "Compute placement"
      },
      {
        "id": "cluster",
        "label": "Cluster Machines",
        "icon": "Server",
        "hint": "Hosts shards"
      },
      {
        "id": "shards",
        "label": "Data Shards",
        "icon": "Database",
        "hint": "Units of placement"
      },
      {
        "id": "router",
        "label": "Query Router",
        "icon": "ArrowRight",
        "hint": "Fans out to shards"
      }
    ],
    "flow": [
      "workload",
      "optimizer",
      "cluster",
      "router"
    ]
  },
  "steps": [
    {
      "title": "Observe query access sets",
      "description": "Collect which shards each query touches.",
      "active": [
        "workload"
      ],
      "log": "Workload access patterns captured.",
      "message": {
        "from": "Query Workload",
        "to": "Placement Optimizer",
        "label": "Observe"
      }
    },
    {
      "title": "Compute co-access",
      "description": "Identify shards that are frequently accessed together.",
      "active": [
        "optimizer"
      ],
      "log": "Co-access relationships computed.",
      "message": {
        "from": "Placement Optimizer",
        "to": "Cluster Machines",
        "label": "Co-access"
      }
    },
    {
      "title": "Optimize placement for parallelism",
      "description": "Place shards so each query touches as many machines as possible.",
      "active": [
        "optimizer",
        "cluster"
      ],
      "log": "Placement spreads co-accessed shards.",
      "message": {
        "from": "Placement Optimizer",
        "to": "Cluster Machines",
        "label": "Place"
      }
    },
    {
      "title": "Route query to many machines",
      "description": "Router fans out to the shards needed for the query.",
      "active": [
        "router",
        "cluster",
        "shards"
      ],
      "log": "Query distributed across machines.",
      "message": {
        "from": "Query Router",
        "to": "Cluster Machines",
        "label": "Fan-out"
      }
    },
    {
      "title": "Reduce tail latency",
      "description": "More parallelism reduces the chance a single slow machine dominates.",
      "active": [
        "router"
      ],
      "log": "Tail latency improves.",
      "message": {
        "from": "Query Router",
        "to": "—",
        "label": "Tail ↓"
      }
    },
    {
      "title": "Adapt over time",
      "description": "Recompute placement as workload shifts.",
      "active": [
        "optimizer"
      ],
      "log": "Placement refreshed.",
      "message": {
        "from": "Placement Optimizer",
        "to": "Cluster Machines",
        "label": "Rebalance"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Key observation",
        "icon": "Info",
        "bullets": [
          "For data-parallel queries, tail latency often depends on the **slowest shard**.",
          "Increasing parallelism (spreading a query across more machines) can reduce tail."
        ]
      },
      {
        "title": "Placement strategy",
        "icon": "Layers",
        "bullets": [
          "Use workload-driven co-access signals to guide shard placement.",
          "Avoid placing shards that are queried together on the same machine."
        ]
      },
      {
        "title": "Practical implications",
        "icon": "BookOpen",
        "bullets": [
          "Placement is a first-class performance lever—separate from indexing or caching.",
          "Systems like OLAP stores and search engines can benefit from workload-aware placement."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Tail latency",
        "def": "High-percentile latency (e.g., p99) experienced by users."
      },
      {
        "term": "Shard",
        "def": "Partition of data assigned to a machine or replica set."
      },
      {
        "term": "Co-access",
        "def": "Two shards being accessed by the same query."
      },
      {
        "term": "Parallelism",
        "def": "Number of machines participating in serving a single query."
      },
      {
        "term": "Rebalancing",
        "def": "Moving shards between machines to change placement."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function ParallelismOptimizingDataPlacementSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
