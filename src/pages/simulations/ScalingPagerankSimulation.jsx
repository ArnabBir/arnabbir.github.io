'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "scaling-pagerank",
  "title": "Scaling Pagerank",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Graph Processing • Superstep Optimization",
  "accent": "cyan",
  "heroIcon": "GitBranch",
  "paper": {
    "filename": "Scaling Pagerank.pdf"
  },
  "abstract": "Distributed graph processing frameworks formulate tasks as se- quences of supersteps within which communication is performed asynchronously by sending messages over the graph edges. PageR- ank’s communication pattern is identical across all its supersteps since each vertex sends messages to all its edges. We exploit this pattern to develop a new communication paradigm that allows us to exchange messages that include only edge payloads, dramatically reducing bandwidth requirements. Experiments on a web graph of 38 billion vertices and 3.1 trillion edges yield execution times of 34.4 seconds per iteration, suggesting more than an order of magnitude improvement over the state-of-the-art.",
  "diagram": {
    "nodes": [
      {
        "id": "graph",
        "label": "Web Graph",
        "icon": "Database",
        "hint": "Vertices + edges"
      },
      {
        "id": "compute",
        "label": "Superstep Compute",
        "icon": "Cpu",
        "hint": "Update ranks"
      },
      {
        "id": "msg",
        "label": "Messaging Layer",
        "icon": "ArrowRight",
        "hint": "Vertex-to-vertex messages"
      },
      {
        "id": "opt",
        "label": "Implicit Targets",
        "icon": "Layers",
        "hint": "Avoid redundant messaging"
      },
      {
        "id": "agg",
        "label": "Aggregator",
        "icon": "Search",
        "hint": "Combine partials"
      }
    ],
    "flow": [
      "graph",
      "compute",
      "msg",
      "agg"
    ]
  },
  "steps": [
    {
      "title": "Initialize ranks",
      "description": "Assign initial PageRank values to all vertices.",
      "active": [
        "graph",
        "compute"
      ],
      "log": "Ranks initialized.",
      "message": {
        "from": "Web Graph",
        "to": "Superstep Compute",
        "label": "Init"
      }
    },
    {
      "title": "Superstep compute",
      "description": "Each vertex updates rank based on inbound contributions.",
      "active": [
        "compute"
      ],
      "log": "Ranks updated for iteration.",
      "message": {
        "from": "Superstep Compute",
        "to": "Messaging Layer",
        "label": "Compute"
      }
    },
    {
      "title": "Standard messaging",
      "description": "Naively, each vertex sends messages over all outgoing edges.",
      "active": [
        "msg"
      ],
      "log": "Messages sent over edges.",
      "message": {
        "from": "Messaging Layer",
        "to": "Aggregator",
        "label": "Send"
      }
    },
    {
      "title": "Exploit repeated pattern",
      "description": "PageRank communication pattern is identical each iteration.",
      "active": [
        "opt"
      ],
      "log": "Replace messages with edge payloads + implicit targets.",
      "message": {
        "from": "Implicit Targets",
        "to": "—",
        "label": "Optimize"
      }
    },
    {
      "title": "Reduce bandwidth",
      "description": "Exchange only edge payloads; avoid sending redundant identifiers.",
      "active": [
        "msg",
        "opt"
      ],
      "log": "Bandwidth requirements reduced.",
      "message": {
        "from": "Messaging Layer",
        "to": "Implicit Targets",
        "label": "Bandwidth ↓"
      }
    },
    {
      "title": "Iterate to convergence",
      "description": "Repeat until ranks converge; optimized messaging keeps iterations fast.",
      "active": [
        "compute",
        "agg"
      ],
      "log": "Convergence iterations run efficiently.",
      "message": {
        "from": "Superstep Compute",
        "to": "Aggregator",
        "label": "Converge"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What this paper optimizes",
        "icon": "Info",
        "bullets": [
          "PageRank's per-iteration message pattern repeats; typical frameworks resend a lot of redundant info.",
          "Reducing communication is the key to scaling to very large graphs."
        ]
      },
      {
        "title": "Technique",
        "icon": "Layers",
        "bullets": [
          "Use a new communication paradigm: send only edge payloads with **implicit targets**.",
          "Leverage static graph structure to avoid re-sending addressing metadata every iteration."
        ]
      },
      {
        "title": "Why it matters",
        "icon": "BookOpen",
        "bullets": [
          "Bandwidth often dominates iteration time in graph processing at scale.",
          "Communication-aware designs can outperform generic frameworks by orders of magnitude."
        ]
      }
    ],
    "glossary": [
      {
        "term": "PageRank",
        "def": "Link-analysis algorithm computing importance as a stationary distribution."
      },
      {
        "term": "Superstep",
        "def": "Bulk-synchronous iteration step in graph frameworks."
      },
      {
        "term": "Message passing",
        "def": "Vertices send values along edges each iteration."
      },
      {
        "term": "Implicit targeting",
        "def": "Inferring message destinations without explicitly listing them."
      },
      {
        "term": "Convergence",
        "def": "When iterative updates stabilize within a threshold."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function ScalingPagerankSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
