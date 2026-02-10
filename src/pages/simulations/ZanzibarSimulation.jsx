'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "zanzibar",
  "title": "Zanzibar - Google s Consistent, Global Authorization System",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Security • Global Authorization",
  "accent": "rose",
  "heroIcon": "ShieldCheck",
  "paper": {
    "filename": "Zanzibar - Google_s Consistent, Global Authorization System.pdf"
  },
  "abstract": "Determining whether online users are authorized to access digital objects is central to preserving privacy. This pa- per presents the design, implementation, and deployment of Zanzibar, a global system for storing and evaluating ac- cess control lists. Zanzibar provides a uniform data model and configuration language for expressing a wide range of access control policies from hundreds of client services at Google, including Calendar, Cloud, Drive, Maps, Photos, and YouTube. Its authorization decisions respect causal or- dering of user actions and thus provide external consistency amid changes to access control lists and object contents. Zanzibar scales to trillions of access control lists and millions of authorization requests per second to support services used by billions of people. It has maintained 95th-percentile la- tency of less than 10 milliseconds and availability of greater than 99.999% over 3 years of production use.",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client Service",
        "icon": "Monitor",
        "hint": "Requests authorization checks"
      },
      {
        "id": "api",
        "label": "Zanzibar API",
        "icon": "Server",
        "hint": "Read/write tuples + checks"
      },
      {
        "id": "engine",
        "label": "Check Engine",
        "icon": "Layers",
        "hint": "Evaluates userset expressions"
      },
      {
        "id": "spanner",
        "label": "Spanner Storage",
        "icon": "Globe",
        "hint": "Externally consistent tuples"
      },
      {
        "id": "cache",
        "label": "Caching",
        "icon": "Zap",
        "hint": "Intermediate + final results"
      }
    ],
    "flow": [
      "client",
      "api",
      "engine",
      "spanner"
    ]
  },
  "steps": [
    {
      "title": "Write relation tuple",
      "description": "Clients write tuples like object#relation@user/userset.",
      "active": [
        "client",
        "api",
        "spanner"
      ],
      "log": "Tuple written and replicated.",
      "message": {
        "from": "Client Service",
        "to": "Zanzibar API",
        "label": "Write tuple"
      }
    },
    {
      "title": "Issue zookie",
      "description": "Client obtains a consistency token tied to a causally meaningful timestamp.",
      "active": [
        "api"
      ],
      "log": "Zookie encodes a freshness bound.",
      "message": {
        "from": "Zanzibar API",
        "to": "Check Engine",
        "label": "Zookie"
      }
    },
    {
      "title": "Authorization check",
      "description": "Client asks: does user U have relation R to object O?",
      "active": [
        "client",
        "api"
      ],
      "log": "Check request received.",
      "message": {
        "from": "Client Service",
        "to": "Zanzibar API",
        "label": "Check"
      }
    },
    {
      "title": "Evaluate userset rewrite",
      "description": "Engine expands relations via union/intersection and tuple-to-userset rules.",
      "active": [
        "engine",
        "spanner"
      ],
      "log": "Evaluation traverses tuple graph.",
      "message": {
        "from": "Check Engine",
        "to": "Spanner Storage",
        "label": "Evaluate"
      }
    },
    {
      "title": "Cache & deduplicate",
      "description": "Cache intermediate results and deduplicate concurrent checks.",
      "active": [
        "cache",
        "engine"
      ],
      "log": "Hot spots mitigated via caching.",
      "message": {
        "from": "Caching",
        "to": "Check Engine",
        "label": "Cache"
      }
    },
    {
      "title": "Return decision",
      "description": "Return allow/deny with consistency guarantees (bounded by zookie).",
      "active": [
        "api",
        "client"
      ],
      "log": "Decision returned quickly at tail.",
      "message": {
        "from": "Zanzibar API",
        "to": "Client Service",
        "label": "Decision"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Authorization at scale",
        "icon": "Info",
        "bullets": [
          "Unified ACL system for many services; billions of users and objects.",
          "Tail latency is critical: search may require tens/hundreds of checks."
        ]
      },
      {
        "title": "Data model",
        "icon": "Layers",
        "bullets": [
          "Permissions expressed as **relation tuples** + a configuration language.",
          "Usersets allow ACLs to reference groups and other object relations."
        ]
      },
      {
        "title": "Consistency model",
        "icon": "ShieldCheck",
        "bullets": [
          "External consistency + bounded-staleness snapshot reads via **zookies**.",
          "Most checks can be served from local replicas without global round trips."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Relation tuple",
        "def": "⟨object#relation@user⟩ entry describing an ACL relation."
      },
      {
        "term": "Userset",
        "def": "Reference to another object#relation, enabling nested groups."
      },
      {
        "term": "Userset rewrite",
        "def": "Rules defining how one relation derives from others."
      },
      {
        "term": "Zookie",
        "def": "Opaque token encoding a timestamp bound for snapshot reads."
      },
      {
        "term": "External consistency",
        "def": "Guarantee that timestamps respect real-time order of writes."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function ZanzibarSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
