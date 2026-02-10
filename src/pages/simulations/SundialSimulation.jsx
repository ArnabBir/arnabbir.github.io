'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "sundial",
  "title": "Sundial",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Time • Fault-tolerant Clock Sync",
  "accent": "emerald",
  "heroIcon": "Clock",
  "paper": {
    "filename": "Sundial.pdf"
  },
  "abstract": "Clock synchronization is critical for many datacenter applica- tions such as distributed transactional databases, consistent snapshots, and network telemetry. As applications have in- creasing performance requirements and datacenter networks get into ultra-low latency, we need submicrosecond-level bound on time-uncertainty to reduce transaction delay and en- able new network management applications (e.g., measuring one-way delay for congestion control). The state-of-the-art clock synchronization solutions focus on improving clock pre- cision but may incur signiﬁcant time-uncertainty bound due to the presence of failures. This signiﬁcantly affects applica- tions because in large-scale datacenters, temperature-related, link, device, and domain failures are common. We present Sundial, a fault-tolerant clock synchronization system for dat- acenters that achieves ∼100ns time-uncertainty bound under various types of failures. Sundial provides fast failure detec- tion based on frequent synchronization messages in hardware. Sundial enables fast failure recovery using a novel graph- based algorithm to precompute a backup plan that is generic to failures. Through experiments in a >500-machine testbed and large-scale simulations, we show that Sundial can achieve ∼100ns time-uncertainty bound under different types of fail- ures, which is more than two orders of magnitude lower than the state-of-the-art solutions. We also demonstrate the ben- eﬁt of Sundial on applications such as Spanner and Swift congestion control.",
  "diagram": {
    "nodes": [
      {
        "id": "gm",
        "label": "Grandmaster",
        "icon": "Clock",
        "hint": "Reference time source"
      },
      {
        "id": "net",
        "label": "Datacenter Network",
        "icon": "Globe",
        "hint": "Distributes timing messages"
      },
      {
        "id": "hosts",
        "label": "Hosts",
        "icon": "Server",
        "hint": "Sync local clocks"
      },
      {
        "id": "detector",
        "label": "Failure Handling",
        "icon": "Activity",
        "hint": "Detect faults & reroute"
      },
      {
        "id": "apps",
        "label": "Applications",
        "icon": "Database",
        "hint": "Use bounded uncertainty"
      }
    ],
    "flow": [
      "gm",
      "net",
      "hosts",
      "apps"
    ]
  },
  "steps": [
    {
      "title": "Distribute timing messages",
      "description": "Timing packets flow through the DC network to hosts.",
      "active": [
        "gm",
        "net"
      ],
      "log": "Sync messages sent.",
      "message": {
        "from": "Grandmaster",
        "to": "Datacenter Network",
        "label": "PTP messages"
      }
    },
    {
      "title": "Measure delays",
      "description": "Hosts measure/estimate path delays and offset.",
      "active": [
        "hosts",
        "net"
      ],
      "log": "Delay/offset estimated.",
      "message": {
        "from": "Hosts",
        "to": "Datacenter Network",
        "label": "Measure"
      }
    },
    {
      "title": "Compute uncertainty bound",
      "description": "System produces a time-uncertainty bound (ε).",
      "active": [
        "hosts"
      ],
      "log": "Bound computed for each host.",
      "message": {
        "from": "Hosts",
        "to": "Applications",
        "label": "Bound ε"
      }
    },
    {
      "title": "Detect failures",
      "description": "Failures in links/devices/domains are detected and isolated.",
      "active": [
        "detector",
        "net"
      ],
      "log": "Fault detected.",
      "message": {
        "from": "Failure Handling",
        "to": "Datacenter Network",
        "label": "Detect"
      }
    },
    {
      "title": "Failover sync paths",
      "description": "Use redundant paths/clock sources to keep bounds tight.",
      "active": [
        "detector",
        "net",
        "hosts"
      ],
      "log": "Sync rerouted; bounds preserved.",
      "message": {
        "from": "Failure Handling",
        "to": "Datacenter Network",
        "label": "Failover"
      }
    },
    {
      "title": "Expose time API to apps",
      "description": "Apps use time with a known bound for correctness/performance.",
      "active": [
        "apps",
        "hosts"
      ],
      "log": "Time API served to applications.",
      "message": {
        "from": "Applications",
        "to": "Hosts",
        "label": "Use time"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Why clocks matter",
        "icon": "Info",
        "bullets": [
          "Distributed systems need tight time bounds for transactions, telemetry, and coordination.",
          "Failures can increase uncertainty even if average precision is good."
        ]
      },
      {
        "title": "Sundial focus",
        "icon": "Layers",
        "bullets": [
          "Provide **fault-tolerant** clock synchronization with tight uncertainty bounds.",
          "Design for common datacenter failures (links, devices, domains, temperature effects)."
        ]
      },
      {
        "title": "System lessons",
        "icon": "BookOpen",
        "bullets": [
          "Tail behavior under failures determines application correctness and latency impact.",
          "Clock sync must be treated as a critical distributed system with redundancy."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Clock synchronization",
        "def": "Keeping distributed clocks aligned to a reference."
      },
      {
        "term": "Uncertainty bound (ε)",
        "def": "Guaranteed error bound between reported time and true time."
      },
      {
        "term": "PTP",
        "def": "Precision Time Protocol used for network time distribution."
      },
      {
        "term": "Failover",
        "def": "Switching to alternate sources/paths during failures."
      },
      {
        "term": "One-way delay",
        "def": "Latency from sender to receiver, important for accurate sync."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function SundialSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
