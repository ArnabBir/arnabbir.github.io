'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "thread-per-core-tail-latency",
  "title": "tpc-ancs19",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Performance • Tail Latency & Concurrency",
  "accent": "slate",
  "heroIcon": "Cpu",
  "paper": {
    "filename": "tpc-ancs19.pdf"
  },
  "abstract": "—The response time of an online service depends on the tail latency of a few of the applications it invokes in parallel to satisfy the requests. The individual applications are composed of one or more threads to fully utilize the available CPU cores, but this approach can incur serious overheads. The thread-per-core architecture has emerged to reduce these overheads, but it also has its challenges from thread synchronization and OS interfaces. Applications can mitigate both issues with different techniques, but their impact on application tail latency is an open question. We measure the impact of thread-per-core architecture on ap- plication tail latency by implementing a key-value store that uses application-level partitioning, and inter-thread messaging and compare its tail latency to Memcached which uses a traditional key-value store design. We show in an experimental evaluation that our approach reduces tail latency by up to 71% compared to baseline Memcached running on commodity hardware and Linux. However, we observe that the thread-per-core approach is held back by request steering and OS interfaces, and it could be further improved with NIC hardware ofﬂoad.",
  "diagram": {
    "nodes": [
      {
        "id": "nic",
        "label": "NIC / RSS",
        "icon": "Globe",
        "hint": "Distributes packets to queues"
      },
      {
        "id": "steer",
        "label": "Request Steering",
        "icon": "Activity",
        "hint": "Choose target core"
      },
      {
        "id": "core",
        "label": "Per-core Worker",
        "icon": "Cpu",
        "hint": "Owns a shard/partition"
      },
      {
        "id": "msg",
        "label": "Inter-thread Messaging",
        "icon": "ArrowRight",
        "hint": "Cross-core communication"
      },
      {
        "id": "os",
        "label": "OS Interfaces",
        "icon": "HardDrive",
        "hint": "Syscalls, interrupts, polling"
      }
    ],
    "flow": [
      "nic",
      "steer",
      "core",
      "os"
    ]
  },
  "steps": [
    {
      "title": "Packet arrives",
      "description": "NIC receives request; RSS maps it to a receive queue.",
      "active": [
        "nic"
      ],
      "log": "Packet received via RSS.",
      "message": {
        "from": "NIC / RSS",
        "to": "Request Steering",
        "label": "RX"
      }
    },
    {
      "title": "Steer to a core",
      "description": "System steers request to the correct core/partition.",
      "active": [
        "steer",
        "nic"
      ],
      "log": "Request routed to owner core.",
      "message": {
        "from": "Request Steering",
        "to": "NIC / RSS",
        "label": "Steer"
      }
    },
    {
      "title": "Process on owner core",
      "description": "Thread-per-core worker handles request without shared locks.",
      "active": [
        "core"
      ],
      "log": "Request processed on one core.",
      "message": {
        "from": "Per-core Worker",
        "to": "OS Interfaces",
        "label": "Process"
      }
    },
    {
      "title": "Cross-core messaging (optional)",
      "description": "If data spans partitions, use message passing instead of locks.",
      "active": [
        "msg",
        "core"
      ],
      "log": "Message passed between cores.",
      "message": {
        "from": "Inter-thread Messaging",
        "to": "Per-core Worker",
        "label": "Message"
      }
    },
    {
      "title": "OS interface overheads",
      "description": "Interrupts, syscalls, and steering inefficiencies add tail latency.",
      "active": [
        "os",
        "steer"
      ],
      "log": "OS/NIC interfaces shape tail.",
      "message": {
        "from": "OS Interfaces",
        "to": "Request Steering",
        "label": "Overheads"
      }
    },
    {
      "title": "Respond",
      "description": "Worker sends response; tail latency reflects slow path components.",
      "active": [
        "core",
        "nic"
      ],
      "log": "Response sent.",
      "message": {
        "from": "Per-core Worker",
        "to": "NIC / RSS",
        "label": "TX"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Why thread-per-core",
        "icon": "Info",
        "bullets": [
          "Avoid lock contention by giving each core ownership over a partition of the data/requests.",
          "Replace shared-memory synchronization with explicit message passing."
        ]
      },
      {
        "title": "What the paper measured",
        "icon": "Layers",
        "bullets": [
          "A partitioned key-value store can reduce tail latency substantially vs traditional designs.",
          "But request steering and OS interfaces can limit gains without NIC/offload support."
        ]
      },
      {
        "title": "Design takeaway",
        "icon": "BookOpen",
        "bullets": [
          "Tail latency is often dominated by rare slow paths (interrupts, migrations, contention).",
          "Holistic design across app, OS, and NIC is needed for consistent p99 performance."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Tail latency",
        "def": "High-percentile response time (e.g., p99) that affects user experience."
      },
      {
        "term": "Thread-per-core",
        "def": "Architecture with one worker thread per CPU core and per-core state."
      },
      {
        "term": "RSS",
        "def": "Receive Side Scaling: NIC hashes flows into multiple receive queues."
      },
      {
        "term": "Request steering",
        "def": "Routing requests to the correct core/partition."
      },
      {
        "term": "IRQ affinity",
        "def": "Pinning interrupts to specific cores to improve cache locality."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function ThreadPerCoreTailLatencySimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
