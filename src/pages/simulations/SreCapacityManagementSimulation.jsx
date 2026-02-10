'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "sre-capacity-management",
  "title": "SRE Best Practices Capacity Manaagement",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "SRE • Capacity Planning & Headroom",
  "accent": "slate",
  "heroIcon": "Activity",
  "paper": {
    "filename": "SRE Best Practices Capacity Manaagement.pdf"
  },
  "abstract": "www .usenix.org WINTER 2020 VOL. 45, NO. 4 49 SRE SRE Best Practices for Capacity Management LUIS QUESADA TORRES AND DOUG COLISH Luis Quesada Torres is a Site Reliability Engineer and Manager at Google, where he is responsible for keeping Google Cloud’s Artificial Intelligence products running reliably and efficiently. In his spare time, Luis jumps from hobby to hobby: he composes and produces music across multiple genres, he skateboards, and he speaks Spanish, English, German, Swiss German, and Esperanto. Soon Japanese as well. luis@google.com Doug Colish is a Technical Writer at Google in NYC supporting Site Reliability Engineering (SRE) teams. He contributed to several chapters of Google’s “Building Secure and Reliable Systems” book. Doug has over three decades of system engineering experience specializing in UNIX and security. His hobbies include detailing and modifying cars, atte",
  "diagram": {
    "nodes": [
      {
        "id": "signals",
        "label": "Demand Signals",
        "icon": "Activity",
        "hint": "Traffic & usage"
      },
      {
        "id": "forecast",
        "label": "Forecasting",
        "icon": "Search",
        "hint": "Predict future load"
      },
      {
        "id": "planner",
        "label": "Capacity Planner",
        "icon": "Layers",
        "hint": "Headroom, N+1"
      },
      {
        "id": "provision",
        "label": "Provisioning",
        "icon": "Server",
        "hint": "Add/remove capacity"
      },
      {
        "id": "observe",
        "label": "Monitoring",
        "icon": "Monitor",
        "hint": "Utilization + SLOs"
      }
    ],
    "flow": [
      "signals",
      "forecast",
      "planner",
      "provision",
      "observe"
    ]
  },
  "steps": [
    {
      "title": "Measure demand",
      "description": "Observe current traffic and resource utilization.",
      "active": [
        "signals",
        "observe"
      ],
      "log": "Demand signals collected.",
      "message": {
        "from": "Demand Signals",
        "to": "Monitoring",
        "label": "Measure"
      }
    },
    {
      "title": "Forecast future load",
      "description": "Project growth and seasonality to predict demand.",
      "active": [
        "forecast"
      ],
      "log": "Forecast produced.",
      "message": {
        "from": "Forecasting",
        "to": "Capacity Planner",
        "label": "Forecast"
      }
    },
    {
      "title": "Set reliability headroom",
      "description": "Compute safety margins (e.g., N+1, regional failover).",
      "active": [
        "planner"
      ],
      "log": "Headroom budget set.",
      "message": {
        "from": "Capacity Planner",
        "to": "Provisioning",
        "label": "Headroom"
      }
    },
    {
      "title": "Provision capacity",
      "description": "Add capacity or tune autoscaling policies to match plan.",
      "active": [
        "provision",
        "planner"
      ],
      "log": "Capacity provisioned.",
      "message": {
        "from": "Provisioning",
        "to": "Capacity Planner",
        "label": "Provision"
      }
    },
    {
      "title": "Validate with SLOs",
      "description": "Continuously check SLOs and revise forecasts and plans.",
      "active": [
        "observe",
        "planner"
      ],
      "log": "Feedback loop runs.",
      "message": {
        "from": "Monitoring",
        "to": "Capacity Planner",
        "label": "Validate"
      }
    },
    {
      "title": "Iterate continuously",
      "description": "Capacity management is continuous: plan → execute → learn.",
      "active": [
        "forecast",
        "planner"
      ],
      "log": "Plan updated over time.",
      "message": {
        "from": "Forecasting",
        "to": "Capacity Planner",
        "label": "Iterate"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Capacity management goals",
        "icon": "Info",
        "bullets": [
          "Keep services reliable while avoiding chronic overprovisioning.",
          "Plan for failures and growth with explicit **headroom** budgets."
        ]
      },
      {
        "title": "Key practices",
        "icon": "Layers",
        "bullets": [
          "Forecasting + scenario planning (diurnal, seasonal, launches).",
          "N+1 and regional failover planning for resilience.",
          "Feedback loops: measure, compare to forecast, adjust."
        ]
      },
      {
        "title": "Common pitfalls",
        "icon": "AlertTriangle",
        "bullets": [
          "Ignoring tail latencies and saturation effects near high utilization.",
          "Assuming autoscaling eliminates the need for capacity planning."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Headroom",
        "def": "Extra capacity reserved to absorb spikes and failures."
      },
      {
        "term": "N+1",
        "def": "Ability to lose one unit (node/zone) and still meet demand."
      },
      {
        "term": "SLO",
        "def": "Service Level Objective; reliability/latency target."
      },
      {
        "term": "Overprovisioning",
        "def": "Buying/allocating more capacity than needed."
      },
      {
        "term": "Capacity planning",
        "def": "Process of forecasting and provisioning to meet demand."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function SreCapacityManagementSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
