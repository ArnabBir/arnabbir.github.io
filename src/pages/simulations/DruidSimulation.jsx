'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "druid",
  "title": "Druid",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Analytics • Real-time OLAP",
  "accent": "cyan",
  "heroIcon": "Database",
  "paper": {
    "filename": "Druid.pdf"
  },
  "abstract": "Druid is an open source1 data store designed for real-time exploratory analytics on large data sets. The system combines a column-oriented storage layout, a distributed, shared-nothing architecture, and an advanced indexing structure to allow for the arbitrary exploration of billion-row tables with sub-second latencies. In this paper, we describe Druid’s architecture, and detail how it supports fast aggre- gations, ﬂexible ﬁlters, and low latency data ingestion.",
  "diagram": {
    "nodes": [
      {
        "id": "producer",
        "label": "Event Producers",
        "icon": "Zap",
        "hint": "Emit streams (logs, metrics)"
      },
      {
        "id": "indexer",
        "label": "Indexing Service",
        "icon": "Server",
        "hint": "Builds immutable segments"
      },
      {
        "id": "deep",
        "label": "Deep Storage",
        "icon": "HardDrive",
        "hint": "Durable segment store"
      },
      {
        "id": "historical",
        "label": "Historical Nodes",
        "icon": "Database",
        "hint": "Serve segments for queries"
      },
      {
        "id": "broker",
        "label": "Broker",
        "icon": "Search",
        "hint": "Fan-out queries + merge"
      }
    ],
    "flow": [
      "producer",
      "indexer",
      "deep",
      "historical",
      "broker"
    ]
  },
  "steps": [
    {
      "title": "Ingest events",
      "description": "Indexers consume events and build columnar segments.",
      "active": [
        "producer",
        "indexer"
      ],
      "log": "Events ingested into indexing service.",
      "message": {
        "from": "Event Producers",
        "to": "Indexing Service",
        "label": "Ingest"
      }
    },
    {
      "title": "Create immutable segments",
      "description": "Data is organized into immutable, time-partitioned segments.",
      "active": [
        "indexer"
      ],
      "log": "Immutable segment generated.",
      "message": {
        "from": "Indexing Service",
        "to": "Deep Storage",
        "label": "Segment"
      }
    },
    {
      "title": "Publish to deep storage",
      "description": "Segments are published to deep storage for durability.",
      "active": [
        "indexer",
        "deep"
      ],
      "log": "Segment uploaded to deep storage.",
      "message": {
        "from": "Indexing Service",
        "to": "Deep Storage",
        "label": "Publish"
      }
    },
    {
      "title": "Load on historicals",
      "description": "Historicals load relevant segments and serve queries.",
      "active": [
        "historical",
        "deep"
      ],
      "log": "Historicals load segments locally.",
      "message": {
        "from": "Historical Nodes",
        "to": "Deep Storage",
        "label": "Load"
      }
    },
    {
      "title": "Broker receives query",
      "description": "Broker routes query to the right historical nodes.",
      "active": [
        "broker",
        "historical"
      ],
      "log": "Broker fans out query to segments.",
      "message": {
        "from": "Broker",
        "to": "Historical Nodes",
        "label": "Fan-out"
      }
    },
    {
      "title": "Merge & return",
      "description": "Historicals compute partials; broker merges and returns result.",
      "active": [
        "broker"
      ],
      "log": "Results merged; sub-second response.",
      "message": {
        "from": "Broker",
        "to": "—",
        "label": "Merge"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Why Druid exists",
        "icon": "Info",
        "bullets": [
          "Exploratory analytics with **sub-second** latency over large, append-heavy datasets.",
          "Combine fast ingestion with interactive query performance."
        ]
      },
      {
        "title": "Key techniques",
        "icon": "Layers",
        "bullets": [
          "Column-oriented storage + compression for scan efficiency.",
          "Time partitioning into immutable segments simplifies concurrency and caching.",
          "Indexes (e.g., bitmap) accelerate filters and group-bys."
        ]
      },
      {
        "title": "Operational model",
        "icon": "Activity",
        "bullets": [
          "Separate ingestion, durability (deep storage), and serving (historicals/brokers).",
          "Rebalancing via segment loading/unloading without rewriting data."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Segment",
        "def": "Immutable, time-partitioned unit of storage in Druid."
      },
      {
        "term": "Broker",
        "def": "Query router that fans out requests and merges results."
      },
      {
        "term": "Historical",
        "def": "Node that stores and serves immutable segments."
      },
      {
        "term": "Deep storage",
        "def": "Durable store for segments (e.g., object storage)."
      },
      {
        "term": "Bitmap index",
        "def": "Compact structure used to accelerate filters."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function DruidSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
