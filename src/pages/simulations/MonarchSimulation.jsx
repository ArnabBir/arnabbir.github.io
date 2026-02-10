'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "monarch",
  "title": "Monarch",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Observability • Planet-Scale Monitoring",
  "accent": "indigo",
  "heroIcon": "Activity",
  "paper": {
    "filename": "Monarch.pdf"
  },
  "abstract": "Monarch is a globally-distributed in-memory time series data- base system in Google. Monarch runs as a multi-tenant ser- vice and is used mostly to monitor the availability, correct- ness, performance, load, and other aspects of billion-user- scale applications and systems at Google. Every second, the system ingests terabytes of time series data into memory and serves millions of queries. Monarch has a regionalized archi- tecture for reliability and scalability, and global query and conﬁguration planes that integrate the regions into a uniﬁed system. On top of its distributed architecture, Monarch has ﬂexible conﬁguration, an expressive relational data model, and powerful queries. This paper describes the structure of the system and the novel mechanisms that achieve a reliable and ﬂexible uniﬁed system on a regionalized distributed ar- chitecture. We also share important lessons learned from a decade’s experience of developing and running Monarch as a service in Google. PVLDB Reference Format: Colin Adams, Luis Alonso, Benjamin Atkin, John Banning, Sumeer Bhola, Rick Buskens, Ming Chen, Xi Chen, Yoo Chung, Qin Jia, Nick Sakharov, George Talbot, Adam Tart, Nick Taylor. Monarch: Google’s Planet-Scale In-Memory Time Series Data- base. PVLDB, 13(12): 3181-3194, 2020. DOI: https://doi.org/10.14778/3181-3194 1. INTRODUCTION Google has massive computer system monitoring require- ments. Thousands of teams are running global user facing services (e.g., YouTube, GMail, and Google Maps) or pro- viding hardware and software infrastructure for such services (e.g., Spanner [13], Borg [46], and F1 [40]). These teams need to monitor a continually growing and changing collec- tion of heterogeneous entities (e.g. devices, virtual machines and containers) numbering in the billions and distributed around the globe. Metrics must be collected from each of This work is licensed under the Creative Commons Attribution- NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/. For any use beyond those covered by this license, obtain permission by emailing info@vldb.org. Copyright is held by the owner/author(s). Publication rights licensed to the VLDB Endowment. Proceedings of the VLDB Endowment,V ol. 13, No. 12 ISSN 2150-8097. DOI: https://doi.org/10.14778/3181-3194 these entities, stored in time series, and queried to support use cases such as: (1) Detecting and alerting when moni- tored services are not performing correctly; (2) Displaying dashboards of graphs showing the state and health of the services; and (3) Performing ad hoc queries for problem di- agnosis and exploration of performance and resource usage. Borgmon [47] was the initial system at Google responsi- ble for monitoring the behavior of internal applications and infrastructure. Borgmon revolutionized how people think about monitoring and alerting by making collection of met- ric time series a ﬁrst-class feature and providing a rich query language for users to customize analysis of monitoring data tailored to their needs. Between 2004 and 2014, Borgmon deployments scaled up signiﬁcantly due to growth in moni- toring traﬃc, which exposed the following limitations: •Borgmon’s architecture encourages a decentralized op- erational model where each team sets up and manages their own Borgmon instances. However, this led to non-trivial operational overhead for many teams who do not have the necessary expertise or staﬃng to run Borgmon reliably. Additionally, users frequently need to examine and correlate monitoring data across appli- cation and infrastructure boundaries to troubleshoot issues; this is diﬃcult or impossible to achieve in a world of many isolated Borgmon instances; •Borgmon’s lack of schematization for measurement di- mensions and metric values has resulted in semantic ambiguities of queries, limiting the expressiveness of the query language during data analysis; •Borgmon does not have good support for a distribution (i.e., histogram) value type, which is a powerful data structure that enables sophisticated statistical analysis (e.g., computing the 99th percentile of request laten- cies across many servers); and •Borgmon requires users to manually shard the large number of monitored entities of global services across multiple Borgmon instances and set up a query evalu- ation tree. With these lessons in mind, Monarch was created as the next-generation large-scale monitoring system at Google. It is designed to scale with continued traﬃc growth as well as supporting an ever-expanding set of use cases. It provides multi-tenant monitoring as a single uniﬁed service for all teams, minimizing their operational toil. It has a schema- tized data model facilitating sophisticated queries and com- prehensive support of distribution-typed time series. Mon- arch has been in continuous operation since 2010, collecting, organizing, storing, and querying massive amounts of time series data with rapid growth on a global scale. It presently stores close to a petabyte of compressed time series data in memory, ingests terabytes of data per second, and serves millions of queries per second. This paper makes the following contributions: •We present the architecture of Monarch, a multi-tenant, planet-scale in-memory time series database. It is de- ployed across many geographical regions and supports the monitoring and alerting needs of Google’s applica- tions and infrastructure. Monarch ingests and stores monitoring time series data regionally for higher reli- ability and scalability, is equipped with a global query federation layer to present a global view of geographi- cally distributed data, and provides a global conﬁgura- tion plane for uniﬁed control. Monarch stores data in memory to isolate itself from failures at the persistent storage layer for improved availability (it is also backed by log ﬁles, for durability, and a long-term repository). •We describe the novel, type-rich relational data model that underlies Monarch’s expressive query language for time series analysis. This allows users to perform a wide variety of operations for rich data analysis while allowing static query analysis and optimizations. The data model supports sophisticated metric value types such as distribution for powerful statistical data analy- sis. To our knowledge, Monarch is the ﬁrst planet-scale in-memory time series database to support a relational time series data model for monitoring data at the very large scale of petabyte in-memory data storage while serving millions of queries per second. •We outline Monarch’s (1) scalable collection pipeline that provides robust, low-latency data ingestion, au- tomatic load balancing, and collection aggregation for signiﬁcant eﬃciency gains; (2) powerful query subsys- tem that uses an expressive query language, an eﬃ- cient distributed query execution engine, and a com- pact indexing subsystem that substantially improves performance and scalability; and (3) global conﬁgu- ration plane that gives users ﬁne-grained control over many aspects of their time series data; •We present the scale of Monarch and describe the im- plications of key design decisions on Monarch’s scala- bility. We also share the lessons learned while devel- oping, operating, and evolving Monarch in the hope that they are of interest to readers who are building or operating large-scale monitoring systems. The rest of the paper is organized as follows. In Section 2 we describe Monarch’s system architecture and key compo- nents. In Section 3 we explain its data model. We describe Monarch’s data collection in Section 4; its query subsystem, including the query language, execution engine, and index in Section 5; and its global conﬁguration system in Sec- tion 6. We evaluate Monarch experimentally in Section 7. In Section 8 we compare Monarch to related work. We share lessons learned from developing and operating Monarch in Section 9, and conclude the paper in Section 10. Logging & Recovery Components Root Mixers Root Index Servers Root Evaluator Zone Mixers Configuration Mirror Zone Evaluator Zone Index Servers Range Assigner GLOBAL Zone-1 Configuration Server Other Zones WriteQuery Index Conﬁg File I/OAssign LeavesLeaves Leaf Routers Ingestion Routers Figure 1: System overview. Components on the left (blue) persist state; those in the middle (green) execute queries; components on the right (red) ingest data. For clarity, some inter-component communications are omitted. 2. SYSTEM OVERVIEW Monarch’s design is determined by its primary usage for monitoring and alerting. First, Monarch readily trades con- sistency for high availability and partition tolerance [21, 8, 9]. Writing to or reading from a strongly consistent data- base like Spanner [13] may block for a long time; that is unacceptable for Monarch because it would increase mean- time-to-detection and mean-time-to-mitigation for potential outages. To promptly deliver alerts, Monarch must serve the most recent data in a timely fashion; for that, Monarch drops delayed writes and returns partial data for queries if necessary. In the face of network partitions, Monarch con- tinues to support its users’ monitoring and alerting needs, with mechanisms to indicate the underlying data may be in- complete or inconsistent. Second, Monarch must be low de- pendency on the alerting critical path. To minimize depen- dencies, Monarch stores monitoring data in memory despite the high cost. Most of Google’s storage systems, includ- ing Bigtable [10], Colossus ([36], the successor to GFS [20]), Spanner [13], Blobstore [18], and F1 [40], rely on Monarch for reliable monitoring; thus, Monarch cannot use them on the alerting path to avoid a potentially dangerous circular dependency. As a result, non-monitoring applications (e.g., quota services) using Monarch as a global time series data- base are forced to accept reduced consistency. The primary organizing principle of Monarch, as shown in Figure 1, is local monitoring in regional zones combined with global management and querying. Local monitoring allows Monarch to keep data near where it is collected, re- ducing transmission costs, latency, and reliability issues, and allowing monitoring within a zone independently of compo- nents outside that zone. Global management and querying supports the monitoring of global systems by presenting a uniﬁed view of the whole system. Each Monarch zone is autonomous, and consists of a col- lection of clusters, i.e., independent failure domains, that are in a strongly network-connected region. Components in a zone are replicated across the clusters for reliability. Mon- arch stores data in memory and avoids hard dependencies so that each zone can work continuously during transient out- ages of other zones, global components, and underlying stor- age systems. Monarch’s global components are geographi- cally replicated and interact with zonal components using the closest replica to exploit locality.",
  "diagram": {
    "nodes": [
      {
        "id": "agents",
        "label": "Collectors",
        "icon": "Monitor",
        "hint": "Scrape or push metrics"
      },
      {
        "id": "ingest",
        "label": "Ingest Frontends",
        "icon": "Server",
        "hint": "Receive & shard"
      },
      {
        "id": "store",
        "label": "In-Memory TS Store",
        "icon": "Database",
        "hint": "High-throughput storage"
      },
      {
        "id": "query",
        "label": "Query Layer",
        "icon": "Search",
        "hint": "Aggregations + joins"
      },
      {
        "id": "ui",
        "label": "Dashboards/Alerts",
        "icon": "Globe",
        "hint": "Visualization + SLOs"
      }
    ],
    "flow": [
      "agents",
      "ingest",
      "store",
      "query",
      "ui"
    ]
  },
  "steps": [
    {
      "title": "Collect metrics",
      "description": "Agents collect metrics from services and infrastructure.",
      "active": [
        "agents"
      ],
      "log": "Time series samples collected.",
      "message": {
        "from": "Collectors",
        "to": "Ingest Frontends",
        "label": "Collect"
      }
    },
    {
      "title": "Ingest & shard",
      "description": "Ingest layer routes series to shards for scale and reliability.",
      "active": [
        "ingest",
        "agents"
      ],
      "log": "Samples ingested and sharded.",
      "message": {
        "from": "Ingest Frontends",
        "to": "Collectors",
        "label": "Shard"
      }
    },
    {
      "title": "Store in memory",
      "description": "Recent time series are stored in memory for fast queries.",
      "active": [
        "store"
      ],
      "log": "Samples appended to in-memory store.",
      "message": {
        "from": "In-Memory TS Store",
        "to": "Query Layer",
        "label": "Store"
      }
    },
    {
      "title": "Query & aggregate",
      "description": "Queries compute aggregations (rates, percentiles, rollups).",
      "active": [
        "query",
        "store"
      ],
      "log": "Aggregations executed.",
      "message": {
        "from": "Query Layer",
        "to": "In-Memory TS Store",
        "label": "Aggregate"
      }
    },
    {
      "title": "Global views",
      "description": "Users view dashboards and alert evaluations across regions.",
      "active": [
        "ui",
        "query"
      ],
      "log": "Dashboards and alerts updated.",
      "message": {
        "from": "Dashboards/Alerts",
        "to": "Query Layer",
        "label": "Visualize"
      }
    },
    {
      "title": "Resilience patterns",
      "description": "Regionalization and replication keep monitoring available.",
      "active": [
        "ingest",
        "store"
      ],
      "log": "Service remains available during failures.",
      "message": {
        "from": "Ingest Frontends",
        "to": "In-Memory TS Store",
        "label": "Resilience"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Workload shape",
        "icon": "Info",
        "bullets": [
          "Massive ingest (time series samples) + high query fan-out for dashboards/alerts.",
          "Multi-tenant: many teams and products share the same monitoring substrate."
        ]
      },
      {
        "title": "System design patterns",
        "icon": "Layers",
        "bullets": [
          "Regionalized architecture for scalability and reliability.",
          "In-memory storage with compression and rollups for efficiency."
        ]
      },
      {
        "title": "Why monitoring is special",
        "icon": "AlertTriangle",
        "bullets": [
          "Monitoring must stay up when everything else is failing.",
          "Tail latency matters: one slow query can break dashboards and alert freshness."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Time series",
        "def": "Metric samples over time (timestamp,value)."
      },
      {
        "term": "Rollup",
        "def": "Pre-aggregated data at coarser resolution."
      },
      {
        "term": "Shard",
        "def": "Partition of series assigned to a subset of servers."
      },
      {
        "term": "Multi-tenant",
        "def": "Shared service used by many independent customers/teams."
      },
      {
        "term": "SLO",
        "def": "Service Level Objective; target reliability/latency for a service."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function MonarchSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
