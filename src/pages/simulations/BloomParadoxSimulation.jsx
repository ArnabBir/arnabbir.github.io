'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "bloom-paradox",
  "title": "The Bloom Paradox - When not to use a Bloom Filter",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Data Structures • Probabilistic Membership",
  "accent": "amber",
  "heroIcon": "Binary",
  "paper": {
    "filename": "The Bloom Paradox - When not to use a Bloom Filter.pdf"
  },
  "abstract": "—In this paper, we uncover the Bloom paradox in Bloom ﬁlters: sometimes, the Bloom ﬁlter is harmful and should not be queried. We ﬁrst analyze conditions under which the Bloom paradox occurs in a Bloom ﬁlter, and demonstrate that it depends on the a priori probability that a given element belongs to the represented set. We show that the Bloom paradox also applies to Counting Bloom Filters (CBFs), and depends on the product of the hashed counters of each element. In addition, we further suggest improved architectures that deal with the Bloom paradox in Bloom ﬁlters, CBFs and their variants. We further present an application of the presented theory in cache sharing among Web proxies. Last, using simulations, we verify our theoretical results, and show that our improved schemes can lead to a large improvement in the performance of Bloom ﬁlters and CBFs.",
  "diagram": {
    "nodes": [
      {
        "id": "query",
        "label": "Membership Query",
        "icon": "Search",
        "hint": "Is x in set?"
      },
      {
        "id": "bloom",
        "label": "Bloom Filter",
        "icon": "Layers",
        "hint": "Fast probabilistic check"
      },
      {
        "id": "cache",
        "label": "Cache",
        "icon": "Database",
        "hint": "Fast path if hit"
      },
      {
        "id": "memory",
        "label": "Main Memory",
        "icon": "HardDrive",
        "hint": "Slow but definitive"
      },
      {
        "id": "policy",
        "label": "Decision Policy",
        "icon": "Info",
        "hint": "Use prior + costs"
      }
    ],
    "flow": [
      "query",
      "bloom",
      "cache",
      "memory"
    ]
  },
  "steps": [
    {
      "title": "Estimate prior probability",
      "description": "Before querying the filter, estimate Pr(x ∈ cache).",
      "active": [
        "policy"
      ],
      "log": "Prior probability estimated.",
      "message": {
        "from": "Decision Policy",
        "to": "—",
        "label": "Prior"
      }
    },
    {
      "title": "Query Bloom filter",
      "description": "Bloom filter returns positive/negative with false positives.",
      "active": [
        "query",
        "bloom"
      ],
      "log": "Bloom filter queried.",
      "message": {
        "from": "Membership Query",
        "to": "Bloom Filter",
        "label": "BF(x)"
      }
    },
    {
      "title": "Compute posterior",
      "description": "If BF=1, compute Pr(x ∈ cache | BF=1) using prior + FPR.",
      "active": [
        "policy",
        "bloom"
      ],
      "log": "Posterior may still be tiny.",
      "message": {
        "from": "Decision Policy",
        "to": "Bloom Filter",
        "label": "Posterior"
      }
    },
    {
      "title": "Decide whether to probe cache",
      "description": "If posterior is below threshold, skip cache even if BF=1.",
      "active": [
        "policy",
        "memory"
      ],
      "log": "Bloom paradox: filter can be harmful.",
      "message": {
        "from": "Decision Policy",
        "to": "Main Memory",
        "label": "Decision"
      }
    },
    {
      "title": "Selective insertion/query",
      "description": "Avoid inserting or querying elements where Bloom is unhelpful.",
      "active": [
        "bloom",
        "policy"
      ],
      "log": "Selective schemes improve performance.",
      "message": {
        "from": "Bloom Filter",
        "to": "Decision Policy",
        "label": "Selective BF"
      }
    },
    {
      "title": "Measure cost improvement",
      "description": "Compare expected cost of cache-probe vs direct memory access.",
      "active": [
        "policy"
      ],
      "log": "Expected cost optimized.",
      "message": {
        "from": "Decision Policy",
        "to": "—",
        "label": "Cost"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "The paradox",
        "icon": "Info",
        "bullets": [
          "A Bloom filter's false-positive rate alone is not enough—**priors matter**.",
          "If Pr(x ∈ set) is very small, a positive Bloom result can still be overwhelmingly likely to be wrong."
        ]
      },
      {
        "title": "Decision-theoretic view",
        "icon": "Layers",
        "bullets": [
          "Choose actions based on expected cost of false positives vs false negatives.",
          "There exists a threshold where you should **ignore** a positive Bloom result."
        ]
      },
      {
        "title": "Practical implications",
        "icon": "BookOpen",
        "bullets": [
          "Bloom filters are best when the represented set is not extremely sparse relative to queries.",
          "Selective insertion/query can reduce load and prevent harmful lookups."
        ]
      }
    ],
    "glossary": [
      {
        "term": "False positive",
        "def": "Filter says 'present' for an element not in the set."
      },
      {
        "term": "Prior probability",
        "def": "Membership probability before consulting the filter."
      },
      {
        "term": "Posterior probability",
        "def": "Membership probability after observing BF output."
      },
      {
        "term": "Counting Bloom Filter",
        "def": "Bloom variant using counters, enabling deletions."
      },
      {
        "term": "Expected cost",
        "def": "Decision metric combining probabilities and error costs."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function BloomParadoxSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
