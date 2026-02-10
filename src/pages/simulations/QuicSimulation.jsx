'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "quic",
  "title": "quic",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Transport • Encrypted Multiplexed Protocol",
  "accent": "emerald",
  "heroIcon": "Globe",
  "paper": {
    "filename": "quic.pdf"
  },
  "abstract": "We present our experience with QUIC, an encrypted, multiplexed, and low-latency transport protocol designed from the ground up to improve transport performance for HTTPS traffic and to enable rapid deployment and continued evolution of transport mechanisms. QUIC has been globally deployed at Google on thousands of servers and is used to serve traffic to a range of clients including a widely-used web browser (Chrome) and a popular mobile video streaming app (YouTube). We estimate that 7% of Internet traffic is now QUIC. We describe our motivations for developing a new transport, the princi- ples that guided our design, the Internet-scale process that we used to perform iterative experiments on QUIC, performance improve- ments seen by our various services, and our experience deploying QUIC globally. We also share lessons about transport design and the Internet ecosystem that we learned from our deployment.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "icon": "Monitor",
        "hint": "Browser/app"
      },
      {
        "id": "handshake",
        "label": "QUIC+TLS",
        "icon": "Lock",
        "hint": "Cryptographic handshake"
      },
      {
        "id": "server",
        "label": "Server",
        "icon": "Server",
        "hint": "HTTPS origin"
      },
      {
        "id": "streams",
        "label": "Streams",
        "icon": "Layers",
        "hint": "Multiplexed requests"
      },
      {
        "id": "recovery",
        "label": "Loss Recovery",
        "icon": "Activity",
        "hint": "ACKs + congestion control"
      }
    ],
    "flow": [
      "client",
      "handshake",
      "server",
      "streams"
    ]
  },
  "steps": [
    {
      "title": "1-RTT handshake",
      "description": "Establish keys and transport parameters with low latency.",
      "active": [
        "client",
        "handshake",
        "server"
      ],
      "log": "Handshake completes quickly.",
      "message": {
        "from": "Client",
        "to": "QUIC+TLS",
        "label": "Handshake"
      }
    },
    {
      "title": "0-RTT resumption",
      "description": "On repeat connections, send early data with cached keys (when safe).",
      "active": [
        "client",
        "handshake"
      ],
      "log": "Early data sent on resumption.",
      "message": {
        "from": "Client",
        "to": "QUIC+TLS",
        "label": "0-RTT"
      }
    },
    {
      "title": "Multiplex streams",
      "description": "Multiple independent streams share one connection without HoL blocking.",
      "active": [
        "streams",
        "client",
        "server"
      ],
      "log": "Requests multiplexed over streams.",
      "message": {
        "from": "Streams",
        "to": "Client",
        "label": "Streams"
      }
    },
    {
      "title": "Packet numbers + ACKs",
      "description": "Per-packet numbering and ACKs drive loss detection and recovery.",
      "active": [
        "recovery",
        "client",
        "server"
      ],
      "log": "Loss detected via ACK gaps.",
      "message": {
        "from": "Loss Recovery",
        "to": "Client",
        "label": "ACK/loss"
      }
    },
    {
      "title": "Congestion control",
      "description": "Control sending rate using RTT/loss signals (transport evolvable).",
      "active": [
        "recovery"
      ],
      "log": "cwnd adjusted; pacing improves.",
      "message": {
        "from": "Loss Recovery",
        "to": "—",
        "label": "CC"
      }
    },
    {
      "title": "Connection migration",
      "description": "Connection IDs help survive IP changes (e.g., mobile roaming).",
      "active": [
        "client",
        "server"
      ],
      "log": "Connection continues across network changes.",
      "message": {
        "from": "Client",
        "to": "Server",
        "label": "Migrate"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Motivation",
        "icon": "Info",
        "bullets": [
          "Improve HTTPS performance and enable rapid evolution of transport mechanisms.",
          "Reduce handshake latency and avoid head-of-line blocking at the transport layer."
        ]
      },
      {
        "title": "Key protocol features",
        "icon": "Layers",
        "bullets": [
          "Built-in encryption (TLS integrated) and multiplexed streams over UDP.",
          "Connection IDs enable migration and resilience to NAT rebinding."
        ]
      },
      {
        "title": "Operational impact",
        "icon": "BookOpen",
        "bullets": [
          "Deployable in user space → faster iteration than kernel TCP.",
          "Designed to improve tail performance for web and video traffic."
        ]
      }
    ],
    "glossary": [
      {
        "term": "1-RTT",
        "def": "Handshake requiring one round trip before application data."
      },
      {
        "term": "0-RTT",
        "def": "Sending application data in the first flight on resumption."
      },
      {
        "term": "Head-of-line blocking",
        "def": "One lost packet stalls unrelated streams in TCP."
      },
      {
        "term": "Connection ID",
        "def": "Identifier allowing a QUIC connection to survive address changes."
      },
      {
        "term": "Loss recovery",
        "def": "Algorithms to detect loss and retransmit/repair data."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function QuicSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
