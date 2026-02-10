'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "windows-azure-storage",
  "title": "Windows Azure Storage",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Storage • Cloud Object/Table/Queue",
  "accent": "cyan",
  "heroIcon": "Database",
  "paper": {
    "filename": "Windows Azure Storage_.pdf"
  },
  "abstract": "Windows Azure Storage (WAS) is a cloud storage system that provides customers the ability to store seemingly limitless amounts of data for any duration of time. WAS customers have access to their data from anywhere at any time and only pay for what they use and store. In WAS, data is stored durably using both local and geographic replication to facilitate disaster recovery. Currently, WAS storage comes in the form of Blobs (files), Tables (structured stor age), and Queues (message delivery). In this paper, we describe the WAS architecture, global namespace, and data model, as we ll as its resource provisioning, load balancing, and replication systems.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "icon": "Monitor",
        "hint": "Blobs/Tables/Queues"
      },
      {
        "id": "fe",
        "label": "Front-End",
        "icon": "Server",
        "hint": "Auth, routing"
      },
      {
        "id": "partition",
        "label": "Partition Layer",
        "icon": "Layers",
        "hint": "Partition map + load balancing"
      },
      {
        "id": "stream",
        "label": "Stream Layer",
        "icon": "HardDrive",
        "hint": "Replication + durable commits"
      },
      {
        "id": "replicas",
        "label": "Replicas",
        "icon": "Globe",
        "hint": "Local + geo replication"
      }
    ],
    "flow": [
      "client",
      "fe",
      "partition",
      "stream",
      "replicas"
    ]
  },
  "steps": [
    {
      "title": "Request arrives",
      "description": "Client issues a storage request (blob/table/queue).",
      "active": [
        "client",
        "fe"
      ],
      "log": "Request received and authenticated.",
      "message": {
        "from": "Client",
        "to": "Front-End",
        "label": "Request"
      }
    },
    {
      "title": "Find partition",
      "description": "Partition layer maps request to the correct partition server.",
      "active": [
        "partition",
        "fe"
      ],
      "log": "Partition located via map.",
      "message": {
        "from": "Partition Layer",
        "to": "Front-End",
        "label": "Partition map"
      }
    },
    {
      "title": "Commit to replicas",
      "description": "Stream layer replicates data locally for durability.",
      "active": [
        "stream",
        "replicas"
      ],
      "log": "Write committed to local replicas.",
      "message": {
        "from": "Stream Layer",
        "to": "Replicas",
        "label": "Local replicate"
      }
    },
    {
      "title": "Geo-replication",
      "description": "Optionally replicate to a remote region for disaster recovery.",
      "active": [
        "replicas"
      ],
      "log": "Geo replication progresses asynchronously.",
      "message": {
        "from": "Replicas",
        "to": "—",
        "label": "Geo replicate"
      }
    },
    {
      "title": "Serve reads",
      "description": "Reads are served with configured consistency semantics and caching.",
      "active": [
        "fe",
        "partition",
        "stream"
      ],
      "log": "Read served from appropriate replica.",
      "message": {
        "from": "Front-End",
        "to": "Partition Layer",
        "label": "Read"
      }
    },
    {
      "title": "Rebalance & recover",
      "description": "Partitions can move; replication and leases enable recovery.",
      "active": [
        "partition",
        "stream"
      ],
      "log": "System rebalances and heals after failures.",
      "message": {
        "from": "Partition Layer",
        "to": "Stream Layer",
        "label": "Recover"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What WAS provides",
        "icon": "Info",
        "bullets": [
          "A multi-tenant cloud storage system for blobs, tables, and queues.",
          "Durability via local replication and optional geo replication."
        ]
      },
      {
        "title": "Layered architecture",
        "icon": "Layers",
        "bullets": [
          "Front-end handles auth and stateless request processing.",
          "Partition layer manages namespace and load distribution.",
          "Stream layer provides durable replication and write ordering."
        ]
      },
      {
        "title": "Operational lessons",
        "icon": "BookOpen",
        "bullets": [
          "Separating metadata/partitioning from replication mechanics improves evolvability.",
          "Geo replication trades freshness for resilience and disaster recovery."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Partition layer",
        "def": "Maps objects/rows to partitions and balances load."
      },
      {
        "term": "Stream layer",
        "def": "Manages replication and durable commits within a partition."
      },
      {
        "term": "Blob",
        "def": "Object/file storage primitive."
      },
      {
        "term": "Queue",
        "def": "Message storage/delivery primitive."
      },
      {
        "term": "Geo replication",
        "def": "Copying data to a remote region for disaster recovery."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function WindowsAzureStorageSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
