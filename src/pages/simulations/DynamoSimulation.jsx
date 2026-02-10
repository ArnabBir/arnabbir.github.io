'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "dynamo",
  "title": "Dynamo Amazon's Highly Available Key-value Store",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Storage • High Availability KV Store",
  "accent": "indigo",
  "heroIcon": "Database",
  "paper": {
    "filename": "Dynamo Amazon’s Highly Available Key-value Store.pdf"
  },
  "abstract": "Reliability at massive scale is one of the biggest challenges we face at Amazon.com, one of the largest e-commerce operations in the world; even the slightest outage has significant financial consequences and impacts cust omer trust. The Amazon.com platform, which provides services for many web sites worldwide, is implemented on top of an infrastr ucture of tens of thousands of servers and network components located in many datacenters around the world. At this scale, small and large components fail continuously and the way persistent state is managed in the face of these failures drives the reliability and scalability of the software systems. This paper presents the design and implementation of Dynamo, a highly available key-value storage system that some of Amazon’s core services use to provide an “always-on” experience. To achieve this level of availability , Dynamo sacrifices consistency under certain failure scenarios. It makes extensive use of object versioning and application-assisted conflict resolution in a manner that provides a novel interface for developers to use.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "icon": "Monitor",
        "hint": "Get/Put requests"
      },
      {
        "id": "coordinator",
        "label": "Coordinator",
        "icon": "Server",
        "hint": "Routes to preference list"
      },
      {
        "id": "ring",
        "label": "Node Ring",
        "icon": "Globe",
        "hint": "Consistent hashing"
      },
      {
        "id": "replicas",
        "label": "Replicas",
        "icon": "Database",
        "hint": "N-way replication"
      },
      {
        "id": "repair",
        "label": "Repair",
        "icon": "Activity",
        "hint": "Read repair + anti-entropy"
      }
    ],
    "flow": [
      "client",
      "coordinator",
      "replicas",
      "repair"
    ]
  },
  "steps": [
    {
      "title": "Map key to ring",
      "description": "Consistent hashing maps the key to a coordinator + replica set.",
      "active": [
        "coordinator",
        "ring"
      ],
      "log": "Key mapped to preference list.",
      "message": {
        "from": "Coordinator",
        "to": "Node Ring",
        "label": "Hash → nodes"
      }
    },
    {
      "title": "Write with quorum (W)",
      "description": "Coordinator sends write to N replicas; waits for W acks.",
      "active": [
        "client",
        "coordinator",
        "replicas"
      ],
      "log": "Write committed after W responses.",
      "message": {
        "from": "Client",
        "to": "Coordinator",
        "label": "Put(k,v)"
      }
    },
    {
      "title": "Read with quorum (R)",
      "description": "Coordinator reads from N; waits for R responses.",
      "active": [
        "client",
        "coordinator",
        "replicas"
      ],
      "log": "Read returns versions from R replicas.",
      "message": {
        "from": "Client",
        "to": "Coordinator",
        "label": "Get(k)"
      }
    },
    {
      "title": "Version reconciliation",
      "description": "Vector clocks help detect concurrent updates and conflicts.",
      "active": [
        "coordinator"
      ],
      "log": "Client/server reconciles divergent versions.",
      "message": {
        "from": "Coordinator",
        "to": "Replicas",
        "label": "Vector clocks"
      }
    },
    {
      "title": "Sloppy quorum + hinted handoff",
      "description": "During failures, writes go to fallback nodes with hints for later handoff.",
      "active": [
        "replicas",
        "repair"
      ],
      "log": "Availability preserved during node outages.",
      "message": {
        "from": "Replicas",
        "to": "Repair",
        "label": "Hinted handoff"
      }
    },
    {
      "title": "Anti-entropy & read repair",
      "description": "Background sync (e.g., Merkle trees) repairs divergence over time.",
      "active": [
        "repair",
        "replicas"
      ],
      "log": "Replica sets converge eventually.",
      "message": {
        "from": "Repair",
        "to": "Replicas",
        "label": "Anti-entropy"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Design goal",
        "icon": "Info",
        "bullets": [
          "Keep the service available during failures and partitions.",
          "Move complexity to the client/application via **eventual consistency** knobs."
        ]
      },
      {
        "title": "Core mechanisms",
        "icon": "Layers",
        "bullets": [
          "Consistent hashing ring and preference lists for partitioning and replication.",
          "Quorums (N, R, W) trade latency vs consistency.",
          "Vector clocks for sibling version detection."
        ]
      },
      {
        "title": "Repair mechanisms",
        "icon": "Activity",
        "bullets": [
          "Read repair fixes inconsistencies on the read path.",
          "Anti-entropy (Merkle-tree-based) repairs in the background.",
          "Hinted handoff speeds recovery after temporary failures."
        ]
      }
    ],
    "glossary": [
      {
        "term": "N/R/W",
        "def": "Replication factor and read/write quorum thresholds."
      },
      {
        "term": "Vector clock",
        "def": "Version metadata tracking causality of updates."
      },
      {
        "term": "Sloppy quorum",
        "def": "Write/read to any N healthy nodes (not strict replica set)."
      },
      {
        "term": "Hinted handoff",
        "def": "Temporarily store a write on a helper node for later delivery."
      },
      {
        "term": "Merkle tree",
        "def": "Hash tree used to compare replica states efficiently."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function DynamoSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
