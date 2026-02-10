'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "flumejava",
  "title": "FlumeJava",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Data Processing • Pipeline API + Optimizer",
  "accent": "cyan",
  "heroIcon": "Layers",
  "paper": {
    "filename": "FlumeJava.pdf"
  },
  "abstract": "MapReduce and similar systems signiﬁcantly ease the task of writ- ing data-parallel code. However, many real-world computations re- quire a pipeline of MapReduces, and programming and managing such pipelines can be difﬁcult. We present FlumeJava, a Java li- brary that makes it easy to develop, test, and run efﬁcient data- parallel pipelines. At the core of the FlumeJava library are a cou- ple of classes that represent immutable parallel collections, each supporting a modest number of operations for processing them in parallel. Parallel collections and their operations present a simple, high-level, uniform abstraction over different data representations and execution strategies. To enable parallel operations to run efﬁ- ciently, FlumeJava defers their evaluation, instead internally con- structing an execution plan dataﬂow graph. When the ﬁnal results of the parallel operations are eventually needed, FlumeJava ﬁrst op- timizes the execution plan, and then executes the optimized opera- tions on appropriate underlying primitives (e.g., MapReduces). The combination of high-level abstractions for parallel data and compu- tation, deferred evaluation and optimization, and efﬁcient parallel primitives yields an easy-to-use system that approaches the efﬁ- ciency of hand-optimized pipelines. FlumeJava is in active use by hundreds of pipeline developers within Google.",
  "diagram": {
    "nodes": [
      {
        "id": "api",
        "label": "FlumeJava API",
        "icon": "Code",
        "hint": "Build pipeline in Java"
      },
      {
        "id": "dag",
        "label": "Logical DAG",
        "icon": "GitBranch",
        "hint": "Deferred pipeline graph"
      },
      {
        "id": "opt",
        "label": "Optimizer",
        "icon": "Search",
        "hint": "Fuses stages, removes waste"
      },
      {
        "id": "runner",
        "label": "Execution Runner",
        "icon": "Server",
        "hint": "MapReduce-like backend"
      },
      {
        "id": "output",
        "label": "Sinks",
        "icon": "HardDrive",
        "hint": "Files/tables"
      }
    ],
    "flow": [
      "api",
      "dag",
      "opt",
      "runner",
      "output"
    ]
  },
  "steps": [
    {
      "title": "Build pipeline",
      "description": "Develop pipelines as operations over parallel collections.",
      "active": [
        "api",
        "dag"
      ],
      "log": "Pipeline DAG constructed lazily.",
      "message": {
        "from": "FlumeJava API",
        "to": "Logical DAG",
        "label": "Build DAG"
      }
    },
    {
      "title": "Defer execution",
      "description": "Pipeline is represented; nothing runs until a sink is invoked.",
      "active": [
        "dag"
      ],
      "log": "Execution deferred until needed.",
      "message": {
        "from": "Logical DAG",
        "to": "Optimizer",
        "label": "Lazy"
      }
    },
    {
      "title": "Optimize graph",
      "description": "Optimizer fuses/combines stages and chooses execution strategy.",
      "active": [
        "opt",
        "dag"
      ],
      "log": "DAG rewritten into efficient stages.",
      "message": {
        "from": "Optimizer",
        "to": "Logical DAG",
        "label": "Fuse"
      }
    },
    {
      "title": "Create physical plan",
      "description": "Translate into backend jobs (e.g., MapReduce stages).",
      "active": [
        "opt",
        "runner"
      ],
      "log": "Physical stages generated.",
      "message": {
        "from": "Optimizer",
        "to": "Execution Runner",
        "label": "Plan"
      }
    },
    {
      "title": "Execute distributed",
      "description": "Run on cluster; materialize intermediates only when needed.",
      "active": [
        "runner"
      ],
      "log": "Jobs run on workers.",
      "message": {
        "from": "Execution Runner",
        "to": "Sinks",
        "label": "Execute"
      }
    },
    {
      "title": "Write results",
      "description": "Outputs are committed to sinks.",
      "active": [
        "output"
      ],
      "log": "Results materialized.",
      "message": {
        "from": "Sinks",
        "to": "—",
        "label": "Commit"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Problem",
        "icon": "Info",
        "bullets": [
          "Real workloads require **pipelines** of data-parallel stages, not a single MapReduce.",
          "Hand-writing and managing multi-stage jobs is error-prone and slow to iterate."
        ]
      },
      {
        "title": "Key idea",
        "icon": "Layers",
        "bullets": [
          "Expose a high-level API (parallel collections) + a whole-pipeline optimizer.",
          "Deferred execution enables global optimization across stages."
        ]
      },
      {
        "title": "Benefits",
        "icon": "Zap",
        "bullets": [
          "Fewer stages via fusion → less I/O and shuffle.",
          "Easier testing and iteration: build locally, run at scale with the same code."
        ]
      }
    ],
    "glossary": [
      {
        "term": "PCollection",
        "def": "An immutable parallel collection processed in distributed fashion."
      },
      {
        "term": "Lazy evaluation",
        "def": "Defer running until outputs are requested."
      },
      {
        "term": "Fusion",
        "def": "Combine adjacent operations into one physical stage."
      },
      {
        "term": "Shuffle",
        "def": "Redistribution of data by key between stages."
      },
      {
        "term": "Sink",
        "def": "A terminal operation that materializes results (file/table)."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function FlumejavaSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
