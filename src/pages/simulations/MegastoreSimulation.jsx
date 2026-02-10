'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "megastore",
  "title": "Megastore",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Storage • ACID within Partitions",
  "accent": "violet",
  "heroIcon": "ShieldCheck",
  "paper": {
    "filename": "Megastore.pdf"
  },
  "abstract": "Megastore is a storage system developed to meet the re- quirements of today's interactive online services. Megas- tore blends the scalability of a NoSQL datastore with the convenience of a traditional RDBMS in a novel way, and provides both strong consistency guarantees and high avail- ability. We provide fully serializable ACID semantics within ne-grained partitions of data. This partitioning allows us to synchronously replicate each write across a wide area net- work with reasonable latency and support seamless failover between datacenters. This paper describes Megastore's se- mantics and replication algorithm. It also describes our ex- perience supporting a wide range of Google production ser- vices built with Megastore.",
  "diagram": {
    "nodes": [
      {
        "id": "app",
        "label": "Application",
        "icon": "Monitor",
        "hint": "Reads/writes entities"
      },
      {
        "id": "coord",
        "label": "Megastore Coordinator",
        "icon": "Server",
        "hint": "Transaction + schema"
      },
      {
        "id": "paxos",
        "label": "Paxos Replicas",
        "icon": "Layers",
        "hint": "Synchronous WAN replication"
      },
      {
        "id": "store",
        "label": "Underlying Store",
        "icon": "Database",
        "hint": "Bigtable-like storage"
      },
      {
        "id": "index",
        "label": "Indexing",
        "icon": "Search",
        "hint": "Secondary indexes"
      }
    ],
    "flow": [
      "app",
      "coord",
      "paxos",
      "store"
    ]
  },
  "steps": [
    {
      "title": "Choose entity group",
      "description": "Data is partitioned into entity groups for ACID semantics.",
      "active": [
        "coord"
      ],
      "log": "Transaction scoped to an entity group.",
      "message": {
        "from": "Megastore Coordinator",
        "to": "Paxos Replicas",
        "label": "Entity group"
      }
    },
    {
      "title": "Begin transaction",
      "description": "Coordinator starts transaction and performs reads.",
      "active": [
        "app",
        "coord"
      ],
      "log": "Transaction begins.",
      "message": {
        "from": "Application",
        "to": "Megastore Coordinator",
        "label": "Begin"
      }
    },
    {
      "title": "Commit via Paxos",
      "description": "Writes replicate synchronously across datacenters via Paxos.",
      "active": [
        "coord",
        "paxos",
        "store"
      ],
      "log": "Commit requires majority agreement.",
      "message": {
        "from": "Megastore Coordinator",
        "to": "Paxos Replicas",
        "label": "Paxos commit"
      }
    },
    {
      "title": "Serve consistent reads",
      "description": "Reads within an entity group are strongly consistent.",
      "active": [
        "coord",
        "store"
      ],
      "log": "Consistent snapshot served.",
      "message": {
        "from": "Megastore Coordinator",
        "to": "Underlying Store",
        "label": "Consistent read"
      }
    },
    {
      "title": "Secondary index maintenance",
      "description": "Indexes enable richer queries beyond primary key access.",
      "active": [
        "index",
        "store"
      ],
      "log": "Index entries updated atomically.",
      "message": {
        "from": "Indexing",
        "to": "Underlying Store",
        "label": "Index update"
      }
    },
    {
      "title": "Failover & availability",
      "description": "Replica groups allow seamless failover between datacenters.",
      "active": [
        "paxos"
      ],
      "log": "Leader can change without downtime.",
      "message": {
        "from": "Paxos Replicas",
        "to": "Underlying Store",
        "label": "Failover"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What Megastore targets",
        "icon": "Info",
        "bullets": [
          "Interactive applications needing **strong consistency** and high availability.",
          "Scale via partitioning while keeping ACID within each partition."
        ]
      },
      {
        "title": "Key ideas",
        "icon": "Layers",
        "bullets": [
          "Entity groups: small transactional partitions replicated with Paxos.",
          "Blend NoSQL scalability with relational-style semantics (indexes, schema)."
        ]
      },
      {
        "title": "Trade-offs",
        "icon": "AlertTriangle",
        "bullets": [
          "Cross-entity-group transactions are expensive; app design must embrace partitions.",
          "Synchronous WAN replication increases write latency but simplifies correctness."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Entity group",
        "def": "Transactional partition replicated across datacenters."
      },
      {
        "term": "Paxos",
        "def": "Consensus protocol used to replicate commits."
      },
      {
        "term": "Serializable ACID",
        "def": "Strong transactional semantics within a partition."
      },
      {
        "term": "Secondary index",
        "def": "Access path for non-primary-key queries."
      },
      {
        "term": "Failover",
        "def": "Switching leaders/replicas after failure without downtime."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function MegastoreSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
