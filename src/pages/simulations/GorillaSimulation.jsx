'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "gorilla",
  "title": "Gorilla - A Fast, Scalable, In Memory Time Series Database",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Observability • In-Memory TSDB",
  "accent": "indigo",
  "heroIcon": "Activity",
  "paper": {
    "filename": "Gorilla - A Fast, Scalable, In Memory Time Series Database.pdf"
  },
  "abstract": "Large-scale internet services aim to remain highly available and responsive in the presence of unexpected failures. Pro- viding this service often requires monitoring and analyzing tens of millions of measurements per second across a large number of systems, and one particularly eﬀective solution is to store and query such measurements in a time series database (TSDB). A key challenge in the design of TSDBs is how to strike the right balance between eﬃciency, scalability, and relia- bility. In this paper we introduce Gorilla, Facebook’s in- memory TSDB. Our insight is that users of monitoring sys- tems do not place much emphasis on individual data points but rather on aggregate analysis, and recent data points are of much higher value than older points to quickly detect and diagnose the root cause of an ongoing problem. Gorilla op- timizes for remaining highly available for writes and reads, even in the face of failures, at the expense of possibly drop- ping small amounts of data on the write path. To improve query eﬃciency, we aggressively leverage compression tech- niques such as delta-of-delta timestamps and XOR’d ﬂoating point values to reduce Gorilla’s storage footprint by 10x. This allows us to store Gorilla’s data in memory, reduc- ing query latency by 73x and improving query throughput by 14x when compared to a traditional database (HBase)- backed time series data. This performance improvement has unlocked new monitoring and debugging tools, such as time series correlation search and more dense visualization tools. Gorilla also gracefully handles failures from a single-node to entire regions with little to no operational overhead. 1. INTRODUCTION Large-scale internet services aim to remain highly-available and responsive for their users even in the presence of unex- pected failures. As these services have grown to support a global audience, they have scaled beyond a few systems running on hundreds of machines to thousands of individ- This work is licensed under the Creative Commons Attribution- NonCommercial-NoDerivs 3.0 Unported License. To view a copy of this li- cense, visit http://creativecommons.org/licenses/by-nc-nd/3.0/. Obtain per- mission prior to any use beyond those covered by the license. Contact copyright holder by emailing info@vldb.org. Articles from this volume were invited to present their results at the 41st International Conference on Very Large Data Bases, August 31st - September 4th 2015, Kohala Coast, Hawaii. Proceedings of the VLDB Endowment,V ol. 8, No. 12 Copyright 2015 VLDB Endowment 2150-8097/15/08. Back-end Services Web Tier FB Servers Long term storage (HBase) Gorilla Ad-hoc visualizations and dashboards Alarms and automatic remediation Time Series Correlation Figure 1: High level overview of the ODS monitor- ing and alerting system, showing Gorilla as a write- through cache of the most recent 26 hours of time series data. ual systems running on many thousands of machines, often across multiple geo-replicated datacenters. An important requirement to operating these large scale services is to accurately monitor the health and performance of the underlying system and quickly identify and diagnose problems as they arise. Facebook uses a time series database (TSDB) to store system measuring data points and provides quick query functionalities on top. We next specify some of the constraints that we need to satisy for monitoring and operating Facebook and then describe Gorilla, our new in- memory TSDB that can store tens of millions of datapoints (e.g., CPU load, error rate, latency etc.) every second and respond queries over this data within milliseconds. Writes dominate. Our primary requirement for a TSDB is that it should always be available to take writes. As we have hundreds of systems exposing multiple data items, the write rate might easily exceed tens of millions of data points each second. In constrast, the read rate is usually a couple orders of magnitude lower as it is primarily from automated systems watching ’important’ time series, data 1816 visualization systems presenting dashboards for human con- sumption, or from human operators wishing to diagnose an observed problem. State transitions. We wish to identify issues that emerge from a new software release, an unexpected side eﬀect of a conﬁguration change, a network cut and other issues that re- sult in a signiﬁcant state transition. Thus, we wish for our TSDB to support ﬁne-grained aggregations over short-time windows. The ability to display state transitions within tens of seconds is particularly prized as it allows automation to quickly remediate problems before they become wide spread. High availability. Even if a network partition or other failure leads to disconnection between diﬀerent datacenters, systems operating within any given datacenter ought to be able to write data to local TSDB machines and be able to retrieve this data on demand. Fault tolerance. We wish to replicate all writes to multi- ple regions so we can survive the loss of any given datacenter or geographic region due to a disaster. Gorilla is Facebook’s new TSDB that satisﬁes these con- straints. Gorilla functions as a write-through cache of the most recent data entering the monitoring system. We aim to ensure that most queries run within 10’s of milliseconds. The insight in Gorilla’s design is that users of monitor- ing systems do not place much emphasis on individual data points but rather on aggregate analysis. Additionally, these systems do not store any user data so traditional ACID guar- antees are not a core requirement for TSDBs. However, a high percentage of writes must succeed at all times, even in the face of disasters that might render entire datacenters unreachable. Additionally, recent data points are of higher value than older points given the intuition that knowing if a particular system or service is broken right now is more valuable to an operations engineer than knowing if it was broken an hour ago. Gorilla optimizes for remaining highly available for writes and reads, even in the face of failures, at the expense of possibly dropping small amounts of data on the write path. The challenge then arises from high data insertion rate, total data quantity, real-time aggregation, and reliability re- quirements. We addressed each of these in turn. To address the ﬁrst couple requirements, we analyzed the Operational Data Store (ODS) TSDB, an older monitoring system that was widely used at Facebook. We noticed that at least 85% of all queries to ODS was for data collected in the past 26 hours. Further analysis allowed us to determine that we might be able to serve our users best if we could replace a disk-based database with an in-memory database. Further, by treating this in-memory database as a cache of the persis- tent disk-based store, we could achieve the insertion speed of an in-memory system with the persistence of a disk based database. As of Spring 2015, Facebook’s monitoring systems gener- ate more than 2 billion unique time series of counters, with about 12 million data points added per second. This repre- sents over 1 trillion points per day. At 16 bytes per point, the resulting 16TB of RAM would be too resource intensive for practical deployment. We addressed this by repurposing an existing XOR based ﬂoating point compression scheme to work in a streaming manner that allows us to compress time series to an average of 1.37 bytes per point, a 12x reduction in size. We addressed the reliability requirements by running mul- tiple instances of Gorilla in diﬀerent datacenter regions and streaming data to each without attempting to guarantee consistency. Read queries are directed at the closest avail- able Gorilla instance. Note that this design leverages our observation that individual data points can be lost without compromising data aggregation unless there’s signiﬁcant dis- crepancy between the Gorilla instances. Gorilla is currently running in production at Facebook and is used daily by engineers for real-time ﬁreﬁghting and debugging in conjunction with other monitoring and analy- sis systems like Hive [27] and Scuba [3] to detect and diag- nose problems. 2. BACKGROUND & REQUIREMENTS 2.1 Operational Data Store (ODS) Operating and managing Facebook’s large infrastructure comprised of hundreds of systems distributed across mul- tiple data centers would be very diﬃcult without a moni- toring system that can track their health and performance. The Operational Data Store (ODS) is an important portion of the monitoring system at Facebook. ODS comprises of a time series database (TSDB), a query service, and a de- tection and alerting system. ODS’s TSDB is built atop the HBase storage system as described in [26]. Figure 1 repre- sents a high-level view of how ODS is organized. Time series data from services running on Facebook hosts is collected by the ODS write service and written to HBase. There are two consumers of ODS time series data. The ﬁrst consumers are engineers who rely on a charting system that generates graphs and other visual representations of time series data from ODS for interactive analysis. The second consumer is our automated alerting system that read counters oﬀ ODS, compares them to preset thresholds for health, performance and diagnostic metrics and ﬁres alarms to oncall engineers and automated remediation systems. 2.1.1 Monitoring system read performance issues In early 2013, Facebook’s monitoring team realized that its HBase time series storage system couldn’t scale handle future read loads. While the average read latency was ac- ceptable for interactive charts, the 90 th percentile query time had increased to multiple seconds blocking our au- tomation. Additionally, users were self-censoring their us- age as interactive analysis of even medium-sized queries of a few thousand time series took tens of seconds to execute. Larger queries executing over sparse datasets would time- out as the HBase data store was tuned to prioritize writes. While our HBase-based TSDB was ineﬃcient, we quickly re- jected wholesale replacement of the storage system as ODS’s HBase store held about 2 PB of data [5]. Facebook’s data warehouse solution, Hive, was also unsuitable due to its al- ready orders of magnitude higher query latency comparing to ODS, and query latency and eﬃciency were our main concerns [27]. We next turned our attention to in-memory caching. ODS already used a simple read-through cache but it was pri- marily targeted at charting systems where multiple dash- boards shared the same time series. A particularly diﬃcult scenario was when dashboards queried for the most recent data point, missed in the cache, and then issued requests 1817",
  "diagram": {
    "nodes": [
      {
        "id": "emit",
        "label": "Metrics Emitters",
        "icon": "Zap",
        "hint": "Produce samples"
      },
      {
        "id": "ingest",
        "label": "Ingest",
        "icon": "Server",
        "hint": "Receives & shards"
      },
      {
        "id": "compress",
        "label": "Compression",
        "icon": "Binary",
        "hint": "Delta/XOR encoding"
      },
      {
        "id": "mem",
        "label": "In-Memory Blocks",
        "icon": "Database",
        "hint": "Store recent history"
      },
      {
        "id": "query",
        "label": "Query",
        "icon": "Search",
        "hint": "Range queries + downsampling"
      }
    ],
    "flow": [
      "emit",
      "ingest",
      "compress",
      "mem",
      "query"
    ]
  },
  "steps": [
    {
      "title": "Append sample",
      "description": "New (timestamp,value) sample arrives for a time series.",
      "active": [
        "emit",
        "ingest"
      ],
      "log": "Sample ingested.",
      "message": {
        "from": "Metrics Emitters",
        "to": "Ingest",
        "label": "Append"
      }
    },
    {
      "title": "Encode timestamp deltas",
      "description": "Store timestamps as deltas (often delta-of-delta).",
      "active": [
        "compress"
      ],
      "log": "Timestamp compressed.",
      "message": {
        "from": "Compression",
        "to": "In-Memory Blocks",
        "label": "ΔΔt"
      }
    },
    {
      "title": "Encode value deltas",
      "description": "Store values efficiently (e.g., XOR-based encoding).",
      "active": [
        "compress"
      ],
      "log": "Value compressed.",
      "message": {
        "from": "Compression",
        "to": "In-Memory Blocks",
        "label": "XOR"
      }
    },
    {
      "title": "Write to in-memory block",
      "description": "Compressed samples are appended to an in-memory block.",
      "active": [
        "mem",
        "compress"
      ],
      "log": "Block updated in RAM.",
      "message": {
        "from": "In-Memory Blocks",
        "to": "Compression",
        "label": "Block append"
      }
    },
    {
      "title": "Query a range",
      "description": "Query engine scans blocks and decompresses on demand.",
      "active": [
        "query",
        "mem"
      ],
      "log": "Range query served.",
      "message": {
        "from": "Query",
        "to": "In-Memory Blocks",
        "label": "Decompress"
      }
    },
    {
      "title": "Downsample/aggregate",
      "description": "Return aggregated points appropriate for the requested resolution.",
      "active": [
        "query"
      ],
      "log": "Result downsampled for UI.",
      "message": {
        "from": "Query",
        "to": "—",
        "label": "Downsample"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Problem",
        "icon": "Info",
        "bullets": [
          "Monitoring systems ingest **tens of millions** of samples/sec and must stay fast.",
          "Disk-heavy designs struggle with latency and operational complexity at this scale."
        ]
      },
      {
        "title": "Core insight",
        "icon": "Layers",
        "bullets": [
          "Time series are highly compressible: timestamps and values often change slowly.",
          "Compression enables keeping large windows **in memory** cost-effectively."
        ]
      },
      {
        "title": "System shape",
        "icon": "Activity",
        "bullets": [
          "Sharded ingest path, compressed block store, query + downsampling APIs.",
          "Designed for high fan-out dashboards and alert evaluation."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Time series",
        "def": "Sequence of (timestamp,value) points for a metric."
      },
      {
        "term": "Delta-of-delta",
        "def": "Compression using differences of timestamp differences."
      },
      {
        "term": "XOR encoding",
        "def": "Value compression using XOR of floating-point representations."
      },
      {
        "term": "Downsampling",
        "def": "Reducing resolution by aggregating points."
      },
      {
        "term": "Shard",
        "def": "Partition of time series space handled by a subset of servers."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function GorillaSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
