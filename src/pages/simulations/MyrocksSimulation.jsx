'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "myrocks",
  "title": "MyRocks LSM-Tree Database Storage Engine Serving Facebook s Social Graph",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Storage Engines • LSM Trees at Scale",
  "accent": "amber",
  "heroIcon": "HardDrive",
  "paper": {
    "filename": "MyRocks LSM-Tree Database Storage Engine Serving Facebook_s Social Graph.pdf"
  },
  "abstract": "Facebook uses MySQL to manage tens of petabytes of data in its main database named the User Database (UDB). UDB serves social activities such as likes, comments, and shares. In the past, Facebook used InnoDB, a B+Tree based storage engine as the backend. The challenge was to find an index structure using less space and write amplification [1]. LSM-tree [2] has the potential to greatly improve these two bottlenecks. RocksDB, an LSM tree-based key/value store was already widely used in variety of applications but had a very low-level key-value interface. To overcome these limitations, MyRocks, a new MySQL storage engine, was built on top of RocksDB by adding relational capabilities. With MyRocks, using the RocksDB API, significant efficiency gains were achieved while still benefiting from all the MySQL features and tools. The transition was mostly transparent to client applications. Facebook completed the UDB migration from InnoDB to MyRocks in 2017. Since then, ongoing improvements in production operations, and additional enhancements to MySQL, MyRocks, and RocksDB, provided even greater efficiency wins. MyRocks also reduced the instance size by 62.3% for UDB data sets and performed fewer I/O operations than InnoDB. Finally, MyRocks consumed less CPU time for serving the same production traffic workload. These gains enabled us to reduce the number of database servers in UDB to less than half, saving significant resources. In this paper, we describe our journey to build and run an OLTP LSM-tree SQL database at scale. We also discuss the features we implemented to keep pace with UDB workloads, what made migrations easier, and what operational and software development challenges we faced during the two years of running MyRocks in production. Among the new features we introduced in RocksDB were transactional support, bulk loading, and prefix bloom filters, all are available for the benefit of all RocksDB users. PVLDB Reference Format: Yoshinori Matsunobu, Siying Dong, Herman Lee. MyRocks: LSM-Tree Database Storage Engine Serving Facebook's Social Graph. PVLDB, 13(12): 3217 - 3230, 2020. DOI: https://doi.org/10.14778/3415478.3415546 1. INTRODUCTION The Facebook UDB serves the most important social graph workloads [3]. The initial Facebook deployments used the InnoDB storage engine using MySQL as the backend. InnoDB was a robust, widely used database and it performed well. Meanwhile, hardware trends shifted from slow but affordable magnetic drives to fast but more expensive flash storage. Transitioning to flash storage in UDB shifted the bottleneck from Input/Output Operations Per Second (IOPS) to storage capacity. From a space perspective, InnoDB had three big challenges that were hard to overcome, index fragmentation, compression inefficiencies, and space overhead per row (13 bytes) for handling transactions. To further optimize space, as well as serving reads and writes with appropriate low latency, we believed an LSM-tree database optimized for flash storage was better in UDB. However, there were many different types of client applications accessing UDB. Rewriting client applications for a new database was going to take a long time, possibly multiple years, and we wanted to avoid that as well. We decided to integrate RocksDB, a modern open source LSM-tree based key/value store library optimized for flash, into MySQL. As seen in Figure 1, by using the MySQL pluggable storage engine architecture, it was possible to replace the storage layer without changing the upper layers such as client protocols, SQL and Replication. Figure 1: MySQL and MyRocks Storage Engine We called this engine MyRocks. When we started the project, our goal was to reduce the number of UDB servers by 50%. That required the MyRocks space usage to be no more than 50% of the compressed InnoDB format, while maintaining comparable CPU and I/O utilization. We expected that achieving similar CPU utilization vs InnoDB was the hardest challenge, since flash I/O had sufficient read IOPS capacity and the LSM-tree database had less write amplification. Since InnoDB was a fast, reliable database with many features on which our Engineering team relied, there were many challenges ensuring there was no gap between InnoDB and MyRocks. Among the significant challenges were: (1) Increased CPU, memory, and I/O pressure. MyRocks compresses the database size This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/. For any use beyond those covered by this license, obtain permission by emailing info@vldb.org. Copyright is held by the owner/author(s). Publication rights licensed to the VLDB Endowment. Proceedings of the VLDB Endowment, Vol. 13, No. 12 ISSN 2150-8097. DOI: https://doi.org/10.14778/3415478.3415546 by half which requires more CPU, memory, and I/O to handle the 2x number of instances on the host. (2) A larger gap between forward and backward range scans. The LSM-tree allows data blocks to be encoded in a more compacted form. As a result, forward scans are faster than backward scans. (3) Key comparisons. LSM-tree key comparisons are invoked more frequently than B-tree. (4) Query performance. MyRocks was slower than InnoDB in range query performance. (5) LSM-tree performance needs memory-based caching bloom filters for optimal performance. Caching bloom filters in memory is important to LSM-tree performance, but this consumes a non-trivial amount of DRAM and increases memory pressure. (6) Tombstone Management. With LSM-trees, deletes are processed by adding markers, which can sometimes cause performance problem with frequently updated/deleted rows. (7) Compactions, especially when triggered by burst writes, may cause stalls. Section 3 provides the details for how those challenges were addressed. In short, the highlighted innovations implemented are the (1) prefix bloom filter so that range scans with equal predicates are faster (Section 3.2.2.1), the (2) mem comparable keys in MyRocks allowing more efficient character comparisons (Section 3.2.1.1), a (3) new tombstone/deletion type to more efficiently handle secondary index maintenance (Section 3.2.2.2), (4) bulk loading to skip compactions on data loading, (Section 3.2.3.4), (5) rate limited compaction file generations and deletions to prevent stalls (Section 3.2.3.2), and (6) hybrid compressions – using a faster compression algorithm for upper RocksDB levels, and a stronger algorithm for the bottommost level, so that MemTable flush and compaction can keep up with write ingestion rates with minimal space overhead (Section 3.3.4). MyRocks also has native performance benefits over InnoDB such as not needing random reads for maintaining non-unique secondary indexes. More writes can be consolidated, with fewer total bytes written to flash. The read performance improvements and write performance benefits were evident when the UDB was migrated from InnoDB to MyRocks with no degradation of CPU utilization. Comprehensive correctness, performance and reliability validations were needed prior to migration. We built two infrastructure services to help the migration. One was MyShadow, which captured production queries and replayed them to test instances. The other was a data correctness tool which compared full index data and query results between InnoDB and MyRocks instances. We ran these two tools to verify that MySQL instances running MyRocks did not return wrong results, did not return unexpected errors, did not regress CPU utilizations, and did not cause outstanding stalls. After completing the validations, the InnoDB to MyRocks migration itself was relatively easy. Since MySQL replication was independent of storage engine, adding MyRocks instances and removing InnoDB instances were simple. The bulk data loading feature in MyRocks greatly reduced data migration time as it could load indexes directly into the LSM-tree and bypass all MemTable writes and compactions. The InnoDB to MyRocks UDB migrations were completed in August 2017. For the same data sets, MyRocks and modern LSM-tree structures and compression techniques reduced the instance size by 62.3% compared to compressed InnoDB. Lower secondary index maintenance overhead and overall read performance improvements resulted in slightly reduced CPU time. Bytes written to flush storage went down by 75%, which helped not to hit IOPS bottlenecks, and opened possibilities to use more affordable flash storage devices that had lower write cycles. These enabled us to reduce the number of database servers in UDB to less than half with MyRocks. Since 2017, regressions have been continuously tracked via MyShadow and data correctness. We improved compaction to guarantee the removal of stale data, meeting the increasing demands of data privacy. This practice is valuable because: (1) Since SQL databases built on LSM-tree are gaining popularity, the practical techniques of tuning and improving LSM-tree are valuable. To the best of our knowledge, this is the first time these techniques have been implemented on a large-scale production system. (2) While some high-level B-tree vs LSM-tree comparisons are documented, our work exposed implementation challenges for LSM-tree to match B-tree performance, extra benefits from a LSM-tree, and optimizations that can narrow the gap. (3) Migrating data across different databases or storage engines is common. This paper shares the processes used to migrate the database to a different storage engine. The experience is more interesting because the storage engine moved to is relatively immature. In this paper, we describe three contributions: 1. UDB overview, challenges with B-Tree indexes and why we thought LSM-tree database optimized for flash storage was suitable (Section 2). 2. How we optimized MyRocks for various read workloads and compactions (Section 3). 3. How we migrated to MyRocks in production (Section 4). Then we show migration results in Section 5, followed by lessons learned in Section 6. Finally, we show related work in Section 7, and concluding remarks in Section 8. 2. BACKGROUND AND MOTIV ATION 2.1 UDB Architecture UDB is our massively sharded database service. We have customized MySQL with hundreds of features to operate the database for our needs. All customized extensions to MySQL are released as open source [4]. Facebook has many geographically distributed data centers across the world [5] and the UDB instances are running in some of them. Where other distributed database solutions place up to three copies in the same region and synchronously replicate among them, the Facebook ecosystem is so large that adopting this architecture for UDB is not practical as it would force us to maintain more than 10 database copies. We only maintain one database copy for each region. However, there are many applications which relied on short commit latency and did not function well with tens of millisecond for synchronous cross region transaction commits. These constraints led us to deploy a MySQL distributed systems architecture as shown in Figure 2. We used traditional asynchronous MySQL replication for cross region MySQL replication. However, for in-region fault tolerance, we created a middleware called Binlog Server (Log Backup Unit) which can retrieve and serve the MySQL replication logs known as Binary Logs. Binlog Servers only retain a short period of recent transaction logs and do not maintain a full copy of the database. Each MySQL instance replicates its log to two Binlog Servers using MySQL Semi-Synchronous protocol. All three servers are spread across different failure domains within the region. This architecture",
  "diagram": {
    "nodes": [
      {
        "id": "mysql",
        "label": "MySQL",
        "icon": "Database",
        "hint": "SQL layer"
      },
      {
        "id": "engine",
        "label": "MyRocks",
        "icon": "Layers",
        "hint": "RocksDB-based storage engine"
      },
      {
        "id": "mem",
        "label": "MemTable + WAL",
        "icon": "Zap",
        "hint": "Fast writes"
      },
      {
        "id": "sst",
        "label": "SSTables",
        "icon": "HardDrive",
        "hint": "Sorted, immutable files"
      },
      {
        "id": "compaction",
        "label": "Compaction",
        "icon": "Activity",
        "hint": "Merge levels, reclaim space"
      }
    ],
    "flow": [
      "mysql",
      "engine",
      "mem",
      "sst",
      "compaction"
    ]
  },
  "steps": [
    {
      "title": "Write to WAL + MemTable",
      "description": "Writes are appended to WAL and inserted into MemTable.",
      "active": [
        "mem",
        "engine"
      ],
      "log": "Durable write (WAL) and in-memory buffer updated.",
      "message": {
        "from": "MemTable + WAL",
        "to": "MyRocks",
        "label": "Write"
      }
    },
    {
      "title": "Flush MemTable",
      "description": "MemTable is flushed to an immutable SSTable file.",
      "active": [
        "sst",
        "mem"
      ],
      "log": "SSTable created (Level 0).",
      "message": {
        "from": "SSTables",
        "to": "MemTable + WAL",
        "label": "Flush"
      }
    },
    {
      "title": "Background compaction",
      "description": "Compaction merges SSTables across levels to control amplification.",
      "active": [
        "compaction",
        "sst"
      ],
      "log": "Levels merged; space reclaimed.",
      "message": {
        "from": "Compaction",
        "to": "SSTables",
        "label": "Compaction"
      }
    },
    {
      "title": "Read path checks filters",
      "description": "Reads consult memtables + Bloom filters to avoid unnecessary I/O.",
      "active": [
        "engine",
        "sst"
      ],
      "log": "Bloom filters prune SSTables.",
      "message": {
        "from": "MyRocks",
        "to": "SSTables",
        "label": "Read"
      }
    },
    {
      "title": "Point lookups & range scans",
      "description": "Engine balances point and range query performance.",
      "active": [
        "engine"
      ],
      "log": "Lookup/scan executed.",
      "message": {
        "from": "MyRocks",
        "to": "MemTable + WAL",
        "label": "Query"
      }
    },
    {
      "title": "Tune trade-offs",
      "description": "Parameters affect write amp, space amp, and read latency.",
      "active": [
        "compaction"
      ],
      "log": "Tuning changes performance envelope.",
      "message": {
        "from": "Compaction",
        "to": "—",
        "label": "Tune"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Motivation",
        "icon": "Info",
        "bullets": [
          "Reduce space usage and write amplification compared to B+Tree engines for write-heavy workloads.",
          "Bring LSM-tree benefits to MySQL workloads at large scale."
        ]
      },
      {
        "title": "Core mechanics",
        "icon": "Layers",
        "bullets": [
          "Write-optimized structure: memtable → SSTables → leveled compaction.",
          "Bloom filters and indexes reduce read amplification."
        ]
      },
      {
        "title": "Trade-offs",
        "icon": "AlertTriangle",
        "bullets": [
          "Compaction consumes background I/O/CPU and must be tuned carefully.",
          "Range scans can be more expensive than in B+Tree designs depending on layout."
        ]
      }
    ],
    "glossary": [
      {
        "term": "LSM-tree",
        "def": "Log-Structured Merge-tree; write-optimized multi-level structure."
      },
      {
        "term": "MemTable",
        "def": "In-memory sorted structure buffering writes before flushing."
      },
      {
        "term": "WAL",
        "def": "Write-ahead log for durability."
      },
      {
        "term": "SSTable",
        "def": "Sorted String Table; immutable sorted file on disk."
      },
      {
        "term": "Compaction",
        "def": "Process of merging SSTables across levels."
      },
      {
        "term": "Write amplification",
        "def": "Extra bytes written internally per byte written by the user."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function MyrocksSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
