'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "paxos-made-live",
  "title": "paxos made live",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Consensus in Production • Lessons Learned",
  "accent": "violet",
  "heroIcon": "Server",
  "paper": {
    "filename": "paxos_made_live.pdf"
  },
  "abstract": "We describe our experience building a fault-tolerant data- base using the Paxos consensus algorithm. Despite the existing literature in the ﬁeld, building such a database proved to be non-trivial. We describe selected algorithmic and engineering problems encountere d, and the solutions we found for them. Our measurements indicate that we have built a competitive syst em.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Clients",
        "icon": "Monitor",
        "hint": "Database operations"
      },
      {
        "id": "leader",
        "label": "Leader",
        "icon": "Server",
        "hint": "Orders operations"
      },
      {
        "id": "log",
        "label": "Replicated Log",
        "icon": "Layers",
        "hint": "Sequence of commands"
      },
      {
        "id": "replicas",
        "label": "Replicas",
        "icon": "Database",
        "hint": "Apply committed log"
      },
      {
        "id": "reconfig",
        "label": "Reconfiguration",
        "icon": "Activity",
        "hint": "Membership changes"
      }
    ],
    "flow": [
      "client",
      "leader",
      "log",
      "replicas"
    ]
  },
  "steps": [
    {
      "title": "Leader is elected",
      "description": "A stable leader is chosen to drive Multi-Paxos.",
      "active": [
        "leader",
        "replicas"
      ],
      "log": "Leader established.",
      "message": {
        "from": "Leader",
        "to": "Replicas",
        "label": "Leader"
      }
    },
    {
      "title": "Append log entry",
      "description": "Leader proposes next log entry to acceptors/replicas.",
      "active": [
        "client",
        "leader",
        "log"
      ],
      "log": "Operation appended to log.",
      "message": {
        "from": "Clients",
        "to": "Leader",
        "label": "Append"
      }
    },
    {
      "title": "Replicate via Multi-Paxos",
      "description": "Replicas accept entries; majority agreement commits.",
      "active": [
        "log",
        "replicas",
        "leader"
      ],
      "log": "Entry committed by quorum.",
      "message": {
        "from": "Replicated Log",
        "to": "Replicas",
        "label": "Multi-Paxos"
      }
    },
    {
      "title": "Apply to state machine",
      "description": "Replicas apply committed log entries to local state.",
      "active": [
        "replicas"
      ],
      "log": "State machine advanced.",
      "message": {
        "from": "Replicas",
        "to": "—",
        "label": "Apply"
      }
    },
    {
      "title": "Catch-up & log management",
      "description": "Lagging replicas catch up; logs may be truncated/compacted.",
      "active": [
        "log",
        "replicas"
      ],
      "log": "Catch-up and compaction occur.",
      "message": {
        "from": "Replicated Log",
        "to": "Replicas",
        "label": "Catch-up"
      }
    },
    {
      "title": "Handle reconfiguration",
      "description": "Membership changes and failures handled without violating safety.",
      "active": [
        "reconfig",
        "leader",
        "replicas"
      ],
      "log": "Cluster reconfigured safely.",
      "message": {
        "from": "Reconfiguration",
        "to": "Leader",
        "label": "Reconfig"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Theme of the paper",
        "icon": "Info",
        "bullets": [
          "Paxos is simple on paper, but production systems need many extra pieces.",
          "Engineering decisions (timeouts, batching, disks, recovery) dominate outcomes."
        ]
      },
      {
        "title": "Multi-Paxos essentials",
        "icon": "Layers",
        "bullets": [
          "Stable leader amortizes phase-1; most entries use only accept phase.",
          "Replicated log + state machine replication is the common pattern."
        ]
      },
      {
        "title": "Production concerns",
        "icon": "AlertTriangle",
        "bullets": [
          "Leader failover, recovery, and disk corruption handling are unavoidable.",
          "Reconfiguration must be safe while keeping the system available."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Multi-Paxos",
        "def": "Optimization where a stable leader proposes many values efficiently."
      },
      {
        "term": "Replicated log",
        "def": "Ordered sequence of operations agreed upon by consensus."
      },
      {
        "term": "State machine replication",
        "def": "Apply the same log to replicas to keep state consistent."
      },
      {
        "term": "Catch-up",
        "def": "Process for a lagging replica to obtain missing log entries."
      },
      {
        "term": "Reconfiguration",
        "def": "Changing the set of replicas/acceptors safely."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function PaxosMadeLiveSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
