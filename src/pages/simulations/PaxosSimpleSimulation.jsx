'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "paxos-simple",
  "title": "paxos-simple",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Consensus • Single-decree Paxos",
  "accent": "amber",
  "heroIcon": "ShieldCheck",
  "paper": {
    "filename": "paxos-simple.pdf"
  },
  "abstract": "The Paxos algorithm, when presented in plain English, is very simple.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "icon": "Monitor",
        "hint": "Proposes a value"
      },
      {
        "id": "proposer",
        "label": "Proposer/Leader",
        "icon": "Server",
        "hint": "Runs Paxos rounds"
      },
      {
        "id": "acceptors",
        "label": "Acceptors",
        "icon": "Layers",
        "hint": "Vote on proposals"
      },
      {
        "id": "learners",
        "label": "Learners",
        "icon": "Database",
        "hint": "Learn chosen value"
      },
      {
        "id": "state",
        "label": "Chosen Value",
        "icon": "CheckCircle2",
        "hint": "Committed decision"
      }
    ],
    "flow": [
      "client",
      "proposer",
      "acceptors",
      "learners"
    ]
  },
  "steps": [
    {
      "title": "Client proposes",
      "description": "Client asks the proposer to commit a value.",
      "active": [
        "client",
        "proposer"
      ],
      "log": "Value proposed.",
      "message": {
        "from": "Client",
        "to": "Proposer/Leader",
        "label": "Propose(v)"
      }
    },
    {
      "title": "Prepare phase",
      "description": "Proposer sends Prepare(n) to a quorum of acceptors.",
      "active": [
        "proposer",
        "acceptors"
      ],
      "log": "Prepare sent with proposal number n.",
      "message": {
        "from": "Proposer/Leader",
        "to": "Acceptors",
        "label": "Prepare(n)"
      }
    },
    {
      "title": "Promise responses",
      "description": "Acceptors promise not to accept lower numbers; return prior accepted.",
      "active": [
        "acceptors",
        "proposer"
      ],
      "log": "Promises collected from majority.",
      "message": {
        "from": "Acceptors",
        "to": "Proposer/Leader",
        "label": "Promise"
      }
    },
    {
      "title": "Accept phase",
      "description": "Proposer sends Accept(n,v) (possibly adopting prior accepted value).",
      "active": [
        "proposer",
        "acceptors"
      ],
      "log": "Accept requests sent.",
      "message": {
        "from": "Proposer/Leader",
        "to": "Acceptors",
        "label": "Accept(n,v)"
      }
    },
    {
      "title": "Accepted by quorum",
      "description": "Once a majority accepts, the value is chosen.",
      "active": [
        "acceptors"
      ],
      "log": "Majority accepted; value chosen.",
      "message": {
        "from": "Acceptors",
        "to": "Learners",
        "label": "Chosen"
      }
    },
    {
      "title": "Learners learn",
      "description": "Learners are informed and the system exposes the chosen value.",
      "active": [
        "learners",
        "state"
      ],
      "log": "Learners learn the decision.",
      "message": {
        "from": "Learners",
        "to": "Chosen Value",
        "label": "Learn"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What Paxos guarantees",
        "icon": "Info",
        "bullets": [
          "Safety: only one value can be chosen, even with failures and retries.",
          "Progress requires a leader that can reach a quorum (in practice)."
        ]
      },
      {
        "title": "How it works",
        "icon": "Layers",
        "bullets": [
          "Two phases: Prepare/Promise and Accept/Accepted.",
          "Proposal numbers order attempts; quorums intersect to preserve safety."
        ]
      },
      {
        "title": "Engineering notes",
        "icon": "BookOpen",
        "bullets": [
          "Real systems use Multi-Paxos to amortize the Prepare phase.",
          "Leader election and timeouts are crucial for liveness in practice."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Quorum",
        "def": "Majority subset of acceptors; any two quorums intersect."
      },
      {
        "term": "Proposal number",
        "def": "Monotonic identifier ordering proposals."
      },
      {
        "term": "Prepare",
        "def": "Phase 1 message asking acceptors to promise."
      },
      {
        "term": "Accept",
        "def": "Phase 2 message asking acceptors to accept a value."
      },
      {
        "term": "Chosen value",
        "def": "A value accepted by a quorum; the decision."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function PaxosSimpleSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
