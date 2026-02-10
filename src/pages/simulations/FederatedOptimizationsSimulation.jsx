'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "federated-optimizations",
  "title": "Federated Optimizations",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "ML Systems • Communication-Efficient Training",
  "accent": "rose",
  "heroIcon": "Cpu",
  "paper": {
    "filename": "Federated Optimizations.pdf"
  },
  "abstract": "We introduce a new and increasingly relevant setting for distributed optimization in machine learn- ing, where the data deﬁning the optimization are distributed (unevenly) over an extremely large number of nodes, but the goal remains to train a high-qualitycentralized model. We refer to this set- ting asFederated Optimization. In this setting, communication efﬁciency is of utmost importance. A motivating example for federated optimization arises when we keep the training data locally on users’ mobile devices rather than logging it to a data centerfor training. Instead, the mobile devices are used as nodes performing computation on their local datain order to update a global model. We suppose that we have an extremely large number of devices in our network, each of which has only a tiny fraction of data available totally; in particular, weexpect the number of data points available locally to be much smaller than the number of devices. Additionally, since different users generate data with different patterns, we assume that no device has a representative sample of the overall distribution. We show that existing algorithms are not suitable for this setting, and propose a new algorithm which shows encouraging experimental results. This work also sets a path for future research needed in the context of federated optimization.",
  "diagram": {
    "nodes": [
      {
        "id": "server",
        "label": "Coordinator",
        "icon": "Server",
        "hint": "Selects devices, orchestrates rounds"
      },
      {
        "id": "devices",
        "label": "Devices",
        "icon": "Monitor",
        "hint": "Local data, local training"
      },
      {
        "id": "agg",
        "label": "Aggregation",
        "icon": "Layers",
        "hint": "Secure/robust aggregation"
      },
      {
        "id": "model",
        "label": "Global Model",
        "icon": "Database",
        "hint": "Current weights/checkpoints"
      },
      {
        "id": "metrics",
        "label": "Metrics",
        "icon": "Activity",
        "hint": "Quality + system telemetry"
      }
    ],
    "flow": [
      "server",
      "devices",
      "agg",
      "model"
    ]
  },
  "steps": [
    {
      "title": "Sample clients",
      "description": "Select a subset of eligible devices for this round.",
      "active": [
        "server",
        "devices"
      ],
      "log": "Clients selected for a round.",
      "message": {
        "from": "Coordinator",
        "to": "Devices",
        "label": "Client sampling"
      }
    },
    {
      "title": "Broadcast model",
      "description": "Send the latest model weights to participating devices.",
      "active": [
        "server",
        "model",
        "devices"
      ],
      "log": "Model broadcasted.",
      "message": {
        "from": "Coordinator",
        "to": "Global Model",
        "label": "Send weights"
      }
    },
    {
      "title": "Local training",
      "description": "Devices run a few epochs of SGD on local data.",
      "active": [
        "devices"
      ],
      "log": "Local updates computed.",
      "message": {
        "from": "Devices",
        "to": "Aggregation",
        "label": "On-device SGD"
      }
    },
    {
      "title": "Compress/clip updates",
      "description": "Reduce communication: quantize, sparsify, clip, etc.",
      "active": [
        "devices",
        "agg"
      ],
      "log": "Updates prepared for upload.",
      "message": {
        "from": "Devices",
        "to": "Aggregation",
        "label": "Compress"
      }
    },
    {
      "title": "Aggregate updates",
      "description": "Server aggregates updates (e.g., FedAvg) into a new model.",
      "active": [
        "agg",
        "server",
        "model"
      ],
      "log": "Aggregated model computed.",
      "message": {
        "from": "Aggregation",
        "to": "Coordinator",
        "label": "FedAvg"
      }
    },
    {
      "title": "Evaluate & iterate",
      "description": "Track quality and system metrics; repeat rounds.",
      "active": [
        "metrics",
        "model"
      ],
      "log": "Model evaluated and next round scheduled.",
      "message": {
        "from": "Metrics",
        "to": "Global Model",
        "label": "Iterate"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Setting",
        "icon": "Info",
        "bullets": [
          "Training data is distributed across **many devices** and cannot be centralized.",
          "Data is often **non-IID** and unbalanced; communication is the bottleneck."
        ]
      },
      {
        "title": "Optimization techniques",
        "icon": "Layers",
        "bullets": [
          "Federated averaging: multiple local steps before communicating.",
          "Update compression to reduce bandwidth (quantization/sparsity).",
          "System-aware constraints: partial participation, stragglers, device availability."
        ]
      },
      {
        "title": "Privacy/security considerations",
        "icon": "ShieldCheck",
        "bullets": [
          "Often paired with secure aggregation and differential privacy in practice.",
          "Design must consider adversarial or low-quality client updates."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Federated Averaging (FedAvg)",
        "def": "Aggregate client model deltas after local training steps."
      },
      {
        "term": "Non-IID",
        "def": "Client data distributions differ; violates IID assumptions."
      },
      {
        "term": "Client sampling",
        "def": "Selecting a subset of devices per training round."
      },
      {
        "term": "Compression",
        "def": "Reducing update size via quantization/sparsity/encoding."
      },
      {
        "term": "Secure aggregation",
        "def": "Protocol to aggregate updates without revealing per-client values."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function FederatedOptimizationsSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
