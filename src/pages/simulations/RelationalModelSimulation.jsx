'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "relational-model",
  "title": "A Relational Model of Data for Large Shared Data Banks",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Foundations • Data Independence",
  "accent": "indigo",
  "heroIcon": "Layers",
  "paper": {
    "filename": "A Relational Model of Data for Large Shared Data Banks.pdf"
  },
  "abstract": "Information Retrieval P. BAXENDALE, Editor A Relational Model of Data for Large Shared Data Banks E. F. CODD IBM Research Laboratory, San Jose, California Future users of large data banks must be protected from having to know how the data is organized in the machine (the internal representation). A prompting service which supplies such information is not a satisfactory solution. Activities of users at terminals and most application programs should remain unaffected when the internal representation of data is changed and even when some aspects of the external representation are changed. Changes in data representation will often be needed as a result of changes in query, update, and report traffic and natural growth in the types of stored information. Existing noninferential, formatted data systems provide users with tree-structured files or slightly more general network models of the data",
  "diagram": {
    "nodes": [
      {
        "id": "user",
        "label": "User / Query",
        "icon": "Terminal",
        "hint": "SQL, updates, reports"
      },
      {
        "id": "parser",
        "label": "Relational Model",
        "icon": "Layers",
        "hint": "Relations, tuples, algebra"
      },
      {
        "id": "optimizer",
        "label": "Optimizer",
        "icon": "Search",
        "hint": "Rewrites & access paths"
      },
      {
        "id": "executor",
        "label": "Executor",
        "icon": "Cpu",
        "hint": "Runs operators"
      },
      {
        "id": "storage",
        "label": "Data Bank",
        "icon": "Database",
        "hint": "Stored relations"
      }
    ],
    "flow": [
      "user",
      "parser",
      "optimizer",
      "executor",
      "storage"
    ]
  },
  "steps": [
    {
      "title": "Model data as relations",
      "description": "Represent data as relations (tables) of tuples with attributes.",
      "active": [
        "parser",
        "storage"
      ],
      "log": "Relations & tuples defined.",
      "message": {
        "from": "Relational Model",
        "to": "Data Bank",
        "label": "Relational schema → relations"
      }
    },
    {
      "title": "Compose query in algebra",
      "description": "Queries are expressed as algebraic operators (σ, π, ⋈, etc.).",
      "active": [
        "user",
        "parser"
      ],
      "log": "Query expressed as relational algebra.",
      "message": {
        "from": "User / Query",
        "to": "Relational Model",
        "label": "SQL → algebra tree"
      }
    },
    {
      "title": "Rewrite for independence",
      "description": "Algebraic equivalences enable query rewriting independent of physical layout.",
      "active": [
        "optimizer"
      ],
      "log": "Optimizer rewrites algebra tree.",
      "message": {
        "from": "Optimizer",
        "to": "Executor",
        "label": "Rewrite rules"
      }
    },
    {
      "title": "Choose access paths",
      "description": "Pick scans, indexes, and join order to minimize cost.",
      "active": [
        "optimizer",
        "executor"
      ],
      "log": "Optimizer selects physical plan.",
      "message": {
        "from": "Optimizer",
        "to": "Executor",
        "label": "Plan selection"
      }
    },
    {
      "title": "Execute & return relation",
      "description": "Execution produces a relation; users don't depend on storage internals.",
      "active": [
        "executor",
        "storage",
        "user"
      ],
      "log": "Result returned (still a relation).",
      "message": {
        "from": "Executor",
        "to": "Data Bank",
        "label": "Result relation"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What the paper introduced",
        "icon": "Info",
        "bullets": [
          "A formal, mathematical model of data based on **relations** (sets of tuples).",
          "**Data independence**: shield users/applications from changes in physical storage layout.",
          "A foundation for declarative query languages and optimizers (relational algebra)."
        ]
      },
      {
        "title": "Core building blocks",
        "icon": "Layers",
        "bullets": [
          "Relation (table), tuple (row), attribute (column).",
          "Relational operators: selection (σ), projection (π), join (⋈), union, difference.",
          "Schema + constraints enable logical reasoning and normalization."
        ]
      },
      {
        "title": "Why optimizers are possible",
        "icon": "Search",
        "bullets": [
          "Algebraic equivalences allow rewriting queries into cheaper but equivalent plans.",
          "Separation of **logical** vs **physical** representation enables cost-based choices."
        ]
      },
      {
        "title": "Practical takeaways",
        "icon": "BookOpen",
        "bullets": [
          "Modeling data cleanly is a prerequisite for scalable systems and evolvable schemas.",
          "Most modern SQL engines still follow this pipeline: parse → logical plan → optimize → execute."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Relation",
        "def": "A set of tuples over a fixed set of attributes (a table)."
      },
      {
        "term": "Tuple",
        "def": "An ordered set of attribute values (a row)."
      },
      {
        "term": "Projection (π)",
        "def": "Operator that keeps selected attributes/columns."
      },
      {
        "term": "Selection (σ)",
        "def": "Operator that filters tuples/rows by a predicate."
      },
      {
        "term": "Join (⋈)",
        "def": "Operator combining tuples from two relations based on a condition."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function RelationalModelSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
