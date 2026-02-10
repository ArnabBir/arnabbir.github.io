'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "f1",
  "title": "F1 A Distributed SQL Database That Scales",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Databases • Distributed SQL at Scale",
  "accent": "violet",
  "heroIcon": "Database",
  "paper": {
    "filename": "F1 _ A Distributed SQL Database That Scales.pdf"
  },
  "abstract": "F1 is a distributed relational database system built at Google to support the AdWords business. F1 is a hybrid database that combines high availability, the scalability of NoSQL systems like Bigtable, and the consistency and us- ability of traditional SQL databases. F1 is built on Span- ner, which provides synchronous cross-datacenter replica- tion and strong consistency. Synchronous replication im- plies higher commit latency, but we mitigate that latency by using a hierarchical schema model with structured data types and through smart application design. F1 also in- cludes a fully functional distributed SQL query engine and automatic change tracking and publishing. 1. INTRODUCTION F11 is a fault-tolerant globally-distributed OLTP and OLAP database built at Google as the new storage system for Google’s AdWords system. It was designed to replace a sharded MySQL implementation that was not able to meet our growing scalability and reliability requirements. The key goals of F1’s design are: 1. Scalability: The system must be able to scale up, trivially and transparently, just by adding resources. Our sharded database based on MySQL was hard to scale up, and even more diﬃcult to rebalance. Our users needed complex queries and joins, which meant they had to carefully shard their data, and resharding data without breaking applications was challenging. 2. Availability: The system must never go down for any reason – datacenter outages, planned maintenance, schema changes, etc. The system stores data for Google’s core business. Any downtime has a signiﬁ- cant revenue impact. 3. Consistency: The system must provide ACID trans- actions, and must always present applications with 1Previously described brieﬂy in [22]. Permission to make digital or hard copies of all or part of this work for personal or classroom use is granted without fee provided that copies are not made or distributed for proﬁt or commercial advantage and that copies bear this notice and the full citation on the ﬁrst page. To copy otherwise, to republish, to post on servers or to redistribute to lists, requires prior speciﬁc permission and/or a fee. Articles from this volume were invited to present their results at The 39th International Conference on Very Large Data Bases, August 26th - 30th 2013, Riva del Garda, Trento, Italy. Proceedings of the VLDB Endowment, Vol. 6, No. 11 Copyright 2013 VLDB Endowment 2150-8097/13/09...$ 10.00. consistent and correct data. Designing applications to cope with concurrency anomalies in their data is very error-prone, time- consuming, and ultimately not worth the performance gains. 4. Usability: The system must provide full SQL query support and other functionality users expect from a SQL database. Features like indexes and ad hoc query are not just nice to have, but absolute requirements for our business. Recent publications have suggested that these design goals are mutually exclusive [5, 11, 23]. A key contribution of this paper is to show how we achieved all of these goals in F1’s design, and where we made trade-oﬀs and sacriﬁces. The name F1 comes from genetics, where a Filial 1 hybrid is the ﬁrst generation oﬀspring resulting from a cross mating of distinctly diﬀerent parental types. The F1 database system is indeed such a hybrid, combining the best aspects of tradi- tional relational databases and scalable NoSQL systems like Bigtable [6]. F1 is built on top of Spanner [7], which provides extremely scalable data storage, synchronous replication, and strong consistency and ordering properties. F1 inherits those fea- tures from Spanner and adds several more: • Distributed SQL queries, including joining data from external data sources • Transactionally consistent secondary indexes • Asynchronous schema changes including database re- organizations • Optimistic transactions • Automatic change history recording and publishing Our design choices in F1 result in higher latency for typi- cal reads and writes. We have developed techniques to hide that increased latency, and we found that user-facing trans- actions can be made to perform as well as in our previous MySQL system: • An F1 schema makes data clustering explicit, using ta- bles with hierarchical relationships and columns with structured data types. This clustering improves data locality and reduces the number and cost of RPCs re- quired to read remote data. • F1 users make heavy use of batching, parallelism and asynchronous reads. We use a new ORM (object- relational mapping) library that makes these concepts explicit. This places an upper bound on the number of RPCs required for typical application-level operations, making those operations scale well by default. The F1 system has been managing all AdWords advertis- ing campaign data in production since early 2012. AdWords is a vast and diverse ecosystem including 100s of applica- tions and 1000s of users, all sharing the same database. This database is over 100 TB, serves up to hundreds of thousands of requests per second, and runs SQL queries that scan tens of trillions of data rows per day. Availability reaches ﬁve nines, even in the presence of unplanned outages, and ob- servable latency on our web applications has not increased compared to the old MySQL system. We discuss the AdWords F1 database throughout this pa- per as it was the original and motivating user for F1. Several other groups at Google are now beginning to deploy F1. 2. BASIC ARCHITECTURE Users interact with F1 through the F1 client library. Other tools like the command-line ad-hoc SQL shell are im- plemented using the same client. The client sends requests to one of many F1 servers, which are responsible for reading and writing data from remote data sources and coordinating query execution. Figure 1 depicts the basic architecture and the communication between components. F1 Client Load Balancer ... Spanner CFS F1 Server Slave Pool Slave Pool Spanner CFS F1 Server Slave Pool Slave Pool F1 Master F1 Master Figure 1: The basic architecture of the F1 system, with servers in two datacenters. Because of F1’s distributed architecture, special care must be taken to avoid unnecessarily increasing request latency. For example, the F1 client and load balancer prefer to con- nect to an F1 server in a nearby datacenter whenever possi- ble. However, requests may transparently go to F1 servers in remote datacenters in cases of high load or failures. F1 servers are typically co-located in the same set of dat- acenters as the Spanner servers storing the data. This co- location ensures that F1 servers generally have fast access to the underlying data. For availability and load balancing, F1 servers can communicate with Spanner servers outside their own datacenter when necessary. The Spanner servers in each datacenter in turn retrieve their data from the Colos- sus File System (CFS) [14] in the same datacenter. Unlike Spanner, CFS is not a globally replicated service and there- fore Spanner servers will never communicate with remote CFS instances. F1 servers are mostly stateless, allowing a client to com- municate with a diﬀerent F1 server for each request. The one exception is when a client uses pessimistic transactions and must hold locks. The client is then bound to one F1 server for the duration of that transaction. F1 transactions are described in more detail in Section 5. F1 servers can be quickly added (or removed) from our system in response to the total load because F1 servers do not own any data and hence a server addition (or removal) requires no data movement. An F1 cluster has several additional components that allow for the execution of distributed SQL queries. Dis- tributed execution is chosen over centralized execution when the query planner estimates that increased parallelism will reduce query processing latency. The shared slave pool con- sists of F1 processes that exist only to execute parts of dis- tributed query plans on behalf of regular F1 servers. Slave pool membership is maintained by the F1 master, which monitors slave process health and distributes the list of avail- able slaves to F1 servers. F1 also supports large-scale data processing through Google’s MapReduce framework [10]. For performance reasons, MapReduce workers are allowed to communicate directly with Spanner servers to extract data in bulk (not shown in the ﬁgure). Other clients perform reads and writes exclusively through F1 servers. The throughput of the entire system can be scaled up by adding more Spanner servers, F1 servers, or F1 slaves. Since F1 servers do not store data, adding new servers does not involve any data re-distribution costs. Adding new Spanner servers results in data re-distribution. This process is com- pletely transparent to F1 servers (and therefore F1 clients). The Spanner-based remote storage model and our geo- graphically distributed deployment leads to latency char- acteristics that are very diﬀerent from those of regu- lar databases. Because the data is synchronously repli- cated across multiple datacenters, and because we’ve cho- sen widely distributed datacenters, the commit latencies are relatively high (50-150 ms). This high latency necessitates changes to the patterns that clients use when interacting with the database. We describe these changes in Section 7.1, and we provide further detail on our deployment choices, and the resulting availability and latency, in Sections 9 and 10. 2.1 Spanner F1 is built on top of Spanner. Both systems were devel- oped at the same time and in close collaboration. Spanner handles lower-level storage issues like persistence, caching, replication, fault tolerance, data sharding and movement, location lookups, and transactions. In Spanner, data rows are partitioned into clusters called directories using ancestry relationships in the schema. Each directory has at least one fragment, and large directories can have multiple fragments. Groups store a collection of directory fragments. Each group typically has one replica tablet per datacenter. Data is replicated synchronously using the Paxos algorithm [18], and all tablets for a group store",
  "diagram": {
    "nodes": [
      {
        "id": "app",
        "label": "Application",
        "icon": "Monitor",
        "hint": "SQL client"
      },
      {
        "id": "f1",
        "label": "F1 Servers",
        "icon": "Server",
        "hint": "SQL layer + schema"
      },
      {
        "id": "spanner",
        "label": "Spanner",
        "icon": "Globe",
        "hint": "Globally-consistent storage"
      },
      {
        "id": "indexes",
        "label": "Indexing",
        "icon": "Layers",
        "hint": "Secondary indexes / interleaving"
      },
      {
        "id": "txn",
        "label": "Transactions",
        "icon": "ShieldCheck",
        "hint": "Serializable reads/writes"
      }
    ],
    "flow": [
      "app",
      "f1",
      "spanner"
    ]
  },
  "steps": [
    {
      "title": "Parse & analyze SQL",
      "description": "F1 parses SQL and binds it to the schema.",
      "active": [
        "app",
        "f1"
      ],
      "log": "SQL parsed and validated.",
      "message": {
        "from": "Application",
        "to": "F1 Servers",
        "label": "SQL → plan"
      }
    },
    {
      "title": "Optimize distributed plan",
      "description": "Planner chooses indexes, pushdowns, and join strategies.",
      "active": [
        "f1"
      ],
      "log": "Distributed query plan created.",
      "message": {
        "from": "F1 Servers",
        "to": "Spanner",
        "label": "Optimize"
      }
    },
    {
      "title": "Execute with Spanner",
      "description": "Reads/writes go through Spanner with strong consistency.",
      "active": [
        "f1",
        "spanner",
        "txn"
      ],
      "log": "Spanner provides transactional semantics.",
      "message": {
        "from": "F1 Servers",
        "to": "Spanner",
        "label": "Execute"
      }
    },
    {
      "title": "Maintain indexes",
      "description": "Secondary indexes (and interleaved tables) support fast queries.",
      "active": [
        "indexes",
        "spanner"
      ],
      "log": "Index updates committed transactionally.",
      "message": {
        "from": "Indexing",
        "to": "Spanner",
        "label": "Index update"
      }
    },
    {
      "title": "Online schema changes",
      "description": "Schema changes are applied without taking the system offline.",
      "active": [
        "f1",
        "spanner"
      ],
      "log": "Schema evolves while serving traffic.",
      "message": {
        "from": "F1 Servers",
        "to": "Spanner",
        "label": "Schema change"
      }
    },
    {
      "title": "Return results",
      "description": "F1 streams results to the application with consistent semantics.",
      "active": [
        "app",
        "f1"
      ],
      "log": "Results returned.",
      "message": {
        "from": "Application",
        "to": "F1 Servers",
        "label": "Result set"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What F1 combines",
        "icon": "Info",
        "bullets": [
          "A familiar SQL layer with **strong consistency** and horizontal scalability.",
          "A globally-consistent storage foundation (Spanner) under a relational schema."
        ]
      },
      {
        "title": "Key system techniques",
        "icon": "Layers",
        "bullets": [
          "Hierarchical schema (e.g., interleaved tables) to colocate related data.",
          "Distributed query planning and execution with pushdowns.",
          "Online schema evolution with minimal disruption."
        ]
      },
      {
        "title": "Engineering lessons",
        "icon": "BookOpen",
        "bullets": [
          "SQL usability matters for large organizations—schemas, tools, and audits.",
          "Strong consistency simplifies application logic but demands careful latency engineering."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Spanner",
        "def": "Google’s globally distributed database providing external consistency."
      },
      {
        "term": "Interleaving",
        "def": "Physical co-location of child rows with parent rows for locality."
      },
      {
        "term": "Secondary index",
        "def": "Additional access path to speed up queries."
      },
      {
        "term": "Distributed query plan",
        "def": "Execution strategy spanning many storage nodes."
      },
      {
        "term": "Serializable transaction",
        "def": "Strongest isolation: outcome equivalent to some serial order."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function F1Simulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
