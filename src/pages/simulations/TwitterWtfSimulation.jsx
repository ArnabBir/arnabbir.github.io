'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "twitter-wtf",
  "title": "WTF - The Who to Follow Service at Twitter",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Graph Recs • Who To Follow",
  "accent": "violet",
  "heroIcon": "Users",
  "paper": {
    "filename": "WTF - The Who to Follow Service at Twitter.pdf"
  },
  "abstract": "Wtf (“Who to Follow”) is Twitter’s user recommendation service, which is responsible for creating millions of connec- tions daily between users based on shared interests, common connections, and other related factors. This paper provides an architectural overview and shares lessons we learned in building and running the service over the past few years. Particularly noteworthy was our design decision to process the entire Twitter graph in memoryon a single server, which signiﬁcantly reduced architectural complexity and allowed us to develop and deploy the service in only a few months. At the core of our architecture is Cassovary, an open-source in-memory graph processing engine we built from scratch for Wtf. Besides powering Twitter’s user recommenda- tions, Cassovary is also used for search, discovery, promoted products, and other services as well. We describe and evalu- ate a few graph recommendation algorithms implemented in Cassovary, including a novel approach based on a combina- tion of random walks and SALSA. Looking into the future, we revisit the design of our architecture and comment on its limitations, which are presently being addressed in a second- generation system under development.",
  "diagram": {
    "nodes": [
      {
        "id": "graph",
        "label": "FlockDB Graph Store",
        "icon": "Database",
        "hint": "Source-of-truth graph"
      },
      {
        "id": "etl",
        "label": "ETL / Batch",
        "icon": "Layers",
        "hint": "Snapshot + preprocess"
      },
      {
        "id": "cass",
        "label": "Cassovary",
        "icon": "Server",
        "hint": "In-memory graph engine"
      },
      {
        "id": "algo",
        "label": "Recommendation",
        "icon": "GitBranch",
        "hint": "Random walks + SALSA"
      },
      {
        "id": "serve",
        "label": "Serving API",
        "icon": "Monitor",
        "hint": "Low-latency results"
      }
    ],
    "flow": [
      "graph",
      "etl",
      "cass",
      "algo",
      "serve"
    ]
  },
  "steps": [
    {
      "title": "Snapshot the graph",
      "description": "Extract a snapshot of the Twitter follower graph from storage.",
      "active": [
        "graph",
        "etl"
      ],
      "log": "Graph snapshot created.",
      "message": {
        "from": "FlockDB Graph Store",
        "to": "ETL / Batch",
        "label": "Snapshot"
      }
    },
    {
      "title": "Load into memory",
      "description": "Build an in-memory representation for fast traversal.",
      "active": [
        "cass",
        "etl"
      ],
      "log": "Graph loaded into Cassovary.",
      "message": {
        "from": "Cassovary",
        "to": "ETL / Batch",
        "label": "Load"
      }
    },
    {
      "title": "Generate candidates",
      "description": "Traverse neighborhoods / random walks to find candidate accounts.",
      "active": [
        "algo",
        "cass"
      ],
      "log": "Candidate set produced.",
      "message": {
        "from": "Recommendation",
        "to": "Cassovary",
        "label": "Candidates"
      }
    },
    {
      "title": "Score & rank",
      "description": "Apply ranking (e.g., SALSA-style) and filters for quality.",
      "active": [
        "algo"
      ],
      "log": "Candidates scored and ranked.",
      "message": {
        "from": "Recommendation",
        "to": "Serving API",
        "label": "Rank"
      }
    },
    {
      "title": "Cache & serve",
      "description": "Store results and serve quickly to clients/UI.",
      "active": [
        "serve"
      ],
      "log": "Recommendations served at low latency.",
      "message": {
        "from": "Serving API",
        "to": "—",
        "label": "Serve"
      }
    },
    {
      "title": "Iterate & refresh",
      "description": "Regularly refresh snapshots and improve models/features.",
      "active": [
        "etl",
        "algo"
      ],
      "log": "Pipeline repeats as graph evolves.",
      "message": {
        "from": "ETL / Batch",
        "to": "Recommendation",
        "label": "Refresh"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Two sides of recommendations",
        "icon": "Info",
        "bullets": [
          "Suggest accounts a user is **interested in** and accounts **similar to** the user.",
          "Graph structure provides strong signals via common neighbors and random walks."
        ]
      },
      {
        "title": "System architecture",
        "icon": "Layers",
        "bullets": [
          "Separate OLTP graph store from OLAP recommendation computation via ETL.",
          "In-memory processing reduces complexity and enables fast iteration/launch."
        ]
      },
      {
        "title": "Limitations & evolution",
        "icon": "AlertTriangle",
        "bullets": [
          "Single-machine in-memory assumption has limits as the graph grows.",
          "Second-generation systems often incorporate ML ranking and richer features."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Interest graph",
        "def": "Directed follow graph capturing interests rather than friendships."
      },
      {
        "term": "Random walk",
        "def": "Traversal that samples paths to estimate similarity/importance."
      },
      {
        "term": "SALSA",
        "def": "Graph-based ranking combining hubs/authorities ideas."
      },
      {
        "term": "ETL",
        "def": "Extract–Transform–Load process to move data from OLTP to analytics."
      },
      {
        "term": "In-memory graph",
        "def": "Graph structure held in RAM for fast traversals."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function TwitterWtfSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
