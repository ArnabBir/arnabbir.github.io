'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "trickle",
  "title": "Trickle",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Networking • TCP Rate Limiting",
  "accent": "cyan",
  "heroIcon": "ArrowDown",
  "paper": {
    "filename": "Trickle.pdf"
  },
  "abstract": "YouTube trafﬁc is bursty. These bursts trigger packet losses and stress router queues, causing TCP’s congestion-control algorithm to kick in. In this pa- per, we introduce Trickle, a server-side mechanism that uses TCP torate limitYouTube video streaming. Trickle paces the video stream by placing an upper bound on TCP’s congestion window as a function of the streaming rate and the round-trip time. We evaluated Trickle on YouTube production data centers in Europe and India and analyzed its impact on losses, bandwidth, RTT, and video buffer under-run events. The results show that Trickle reduces the average TCP loss rate by up to 43% and the average RTT by up to 28% while maintaining the streaming rate requested by the application.",
  "diagram": {
    "nodes": [
      {
        "id": "app",
        "label": "Video Server App",
        "icon": "Server",
        "hint": "Writes video data"
      },
      {
        "id": "tcp",
        "label": "TCP Stack",
        "icon": "Layers",
        "hint": "cwnd, ACK clocking"
      },
      {
        "id": "net",
        "label": "Network Queue",
        "icon": "Globe",
        "hint": "Bursts cause queue spikes"
      },
      {
        "id": "client",
        "label": "Client Player",
        "icon": "Monitor",
        "hint": "Playback buffer"
      },
      {
        "id": "control",
        "label": "Trickle Control",
        "icon": "Activity",
        "hint": "cwnd clamp logic"
      }
    ],
    "flow": [
      "app",
      "tcp",
      "net",
      "client"
    ]
  },
  "steps": [
    {
      "title": "Startup burst",
      "description": "Initial phase sends quickly to build playback buffer.",
      "active": [
        "app",
        "tcp",
        "client"
      ],
      "log": "Startup phase fills buffer.",
      "message": {
        "from": "Video Server App",
        "to": "TCP Stack",
        "label": "Startup"
      }
    },
    {
      "title": "App pacing bursts",
      "description": "Timer-based writes create bursts of back-to-back packets.",
      "active": [
        "app",
        "tcp",
        "net"
      ],
      "log": "Bursts inflate queues and losses.",
      "message": {
        "from": "Video Server App",
        "to": "TCP Stack",
        "label": "App pacing"
      }
    },
    {
      "title": "Loss & RTT increase",
      "description": "Queue spikes cause loss; TCP reduces cwnd; latency increases.",
      "active": [
        "tcp",
        "net"
      ],
      "log": "Tail RTT and loss degrade QoE.",
      "message": {
        "from": "TCP Stack",
        "to": "Network Queue",
        "label": "Loss/RTT"
      }
    },
    {
      "title": "Compute cwnd clamp",
      "description": "Trickle sets cwnd ≈ rate × RTT / MSS (with headroom).",
      "active": [
        "control",
        "tcp"
      ],
      "log": "TCP itself paces using ACK clocking.",
      "message": {
        "from": "Trickle Control",
        "to": "TCP Stack",
        "label": "Clamp cwnd"
      }
    },
    {
      "title": "Catch-up when behind",
      "description": "If goodput < target rate, temporarily remove clamp to catch up.",
      "active": [
        "control",
        "tcp",
        "app"
      ],
      "log": "Avoid rebuffering by allowing catch-up.",
      "message": {
        "from": "Trickle Control",
        "to": "TCP Stack",
        "label": "Catch-up"
      }
    },
    {
      "title": "Smoother delivery",
      "description": "Reduced bursts → lower loss and RTT while meeting target rate.",
      "active": [
        "client",
        "net"
      ],
      "log": "Playback buffer stays healthy with smoother traffic.",
      "message": {
        "from": "Client Player",
        "to": "Network Queue",
        "label": "Smooth"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Problem",
        "icon": "Info",
        "bullets": [
          "Timer-based application pacing causes packet bursts and queue spikes.",
          "Bursts trigger loss and congestion control, harming tail latency and QoE."
        ]
      },
      {
        "title": "Trickle idea",
        "icon": "Layers",
        "bullets": [
          "Rate limit by bounding TCP's congestion window (cwnd) based on RTT and target rate.",
          "Let TCP's ACK clocking naturally pace packets instead of application timers."
        ]
      },
      {
        "title": "Operational considerations",
        "icon": "AlertTriangle",
        "bullets": [
          "Need headroom and catch-up logic to avoid rebuffering after congestion.",
          "Avoid too-small cwnd values that break fast recovery and TSO efficiency."
        ]
      }
    ],
    "glossary": [
      {
        "term": "cwnd",
        "def": "Congestion window: TCP's limit on in-flight data."
      },
      {
        "term": "RTT",
        "def": "Round-trip time used to size cwnd for a target rate."
      },
      {
        "term": "ACK clocking",
        "def": "Pacing effect where ACKs trigger sending new data."
      },
      {
        "term": "Token bucket",
        "def": "Mechanism to schedule average sending rate."
      },
      {
        "term": "Rebuffering",
        "def": "Playback stalls when client buffer runs out of data."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function TrickleSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
