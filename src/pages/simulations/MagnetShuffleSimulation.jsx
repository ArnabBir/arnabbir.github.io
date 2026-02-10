'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "magnet-shuffle",
  "title": "Magnet Push-based Shuffle Service for Large-scale Data Processing",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Data Processing • Push-based Shuffle",
  "accent": "emerald",
  "heroIcon": "ArrowDown",
  "paper": {
    "filename": "Magnet_ Push-based Shuffle Service for Large-scale Data Processing.pdf"
  },
  "abstract": "Over the past decade, Apache Spark has become a popu- lar compute engine for large scale data processing. Similar to other compute engines based on the MapReduce com- pute paradigm, the shuﬄe operation, namely the all-to-all transfer of the intermediate data, plays an important role in Spark. At LinkedIn, with the rapid growth of the data size and scale of the Spark deployment, the shuﬄe operation is becoming a bottleneck of further scaling the infrastructure. This has led to overall job slowness and even failures for long running jobs. This not only impacts developer productivity for addressing such slowness and failures, but also results in high operational cost of infrastructure. In this work, we describe the main bottlenecks impact- ing shuﬄe scalability. We propose Magnet, a novel shuf- ﬂe mechanism that can scale to handle petabytes of daily shuﬄed data and clusters with thousands of nodes. Mag- net is designed to work with both on-prem and cloud-based cluster deployments. It addresses a key shuﬄe scalability bottleneck by merging fragmented intermediate shuﬄe data into large blocks. Magnet provides further improvements by co-locating merged blocks with the reduce tasks. Our benchmarks show that Magnet signiﬁcantly improves shuﬄe performance independent of the underlying hardware. Mag- net reduces the end-to-end runtime of LinkedIn’s production Spark jobs by nearly 30%. Furthermore, Magnet improves user productivity by removing the shuﬄe related tuning bur- den from users. PVLDB Reference Format: M. Shen, Y. Zhou and C. Singh. Magnet: Push-based Shuﬄe Service for Large-scale Data Processing. PVLDB, 13(12): 3382- 3395, 2020. DOI: https://doi.org/10.14778/3415478.3415558 1. INTRODUCTION Distributed data processing frameworks such as Hadoop [1] and Spark [40] have gained in popularity over the past decade for large-scale data analysis use cases. Based on the This work is licensed under the Creative Commons Attribution- NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/. For any use beyond those covered by this license, obtain permission by emailing info@vldb.org. Copyright is held by the owner/author(s). Publication rights licensed to the VLDB Endowment. Proceedings of the VLDB Endowment, V ol. 13, No. 12 ISSN 2150-8097. DOI: https://doi.org/10.14778/3415478.3415558 MapReduce computing paradigm [22] and leveraging a large suite of commodity machines, these distributed data pro- cessing frameworks have shown good characteristics of scal- ability and broad applicability to diverse use cases, ranging from data analytics to machine learning and AI. In more re- cent years, a collection of modern computation engines, such as Spark SQL [18], Presto [35], and Flink [19], have emerged and gone mainstream. Diﬀerent from Hadoop MapReduce, these modern computation engines leverage SQL optimizers to optimize the computation logic speciﬁed by the users, be- fore handing over to DAG execution engines to execute the optimized operations. Take Spark as an example (Figure 1). Suppose the user wants to perform an inner join between the job post view table and the job dimension table before ﬁl- tering the joined results based on certain conditions. In this example, the former table contains tracking information for which member viewed which job post on the LinkedIn plat- form, and the latter contains detailed information of each job post. Spark optimizes this query by pushing down the ﬁlter condition before the join operation (Figure 1(a)). Spark’s DAG execution engine then takes this optimized compute plan and converts it into one or more jobs. Each job con- sists of a DAG of stages, representing the lineage of how the data is transformed to produce the ﬁnal results of current job (Figure 1(b)). The intermediate data between stages is transferred via the shuﬄe operation. The shuﬄe operation, where intermediate data is trans- ferred via all-to-all connections between the map and reduce tasks of the corresponding stages, is key to the MapRe- duce computing paradigm [22]. Although the basic con- cept of the shuﬄe operation is straightforward, diﬀerent frameworks have taken diﬀerent approaches to implement it. Some frameworks such as Presto [35] and Flink stream- ing [19] materialize intermediate shuﬄe data in memory for low latency needs, while others such as Spark [40] and Flink batch [19] materialize it on local disks for better fault- tolerance. When materializing the intermediate shuﬄe data on disks, there are hash-based solutions, where each map task produces separate ﬁles for each reduce task, or sort- based solutions, where the map task’s output is sorted by the hashed value of the partition keys and materialized as a single ﬁle. While the sort-based shuﬄe incurs the overhead of sorting, it is a more performant and scalable solution when the size of the intermediate shuﬄe data is large [21, 32]. Frameworks such as Spark and Flink have adopted ex- ternal shuﬄe services [5, 7, 11] to serve materialized interme- diate shuﬄe data, in order to achieve better fault-tolerance and performance isolation. With the recent improvements 3382 Scan [jobview] Scan [jobs]Filter [memberid>0] InnerJoin [on jobid] Scan Filter Scan Stage 0 Stage 1 Stage 2 Join OutputShuffle (a) Optimized compute plan (b) Stage DAG Figure 1: Compute logical plan and associated stage DAG of a Spark query. in networking and storage hardware, some solutions [36, 15] materialize the intermediate shuﬄe data in disaggregated storage instead of local storage. Other solutions [20, 23] by- pass materializing the intermediate shuﬄe data, where the map tasks’ output is directly pushed to the reduce tasks to achieve low latency. This diversity of shuﬄe implementa- tions provides a rich optimization space for shuﬄe operation in these computation engines. In fact, improving shuﬄe in Spark was the key for it to win the Sort Benchmark [2]. At LinkedIn, as a global professional social network com- pany, very large batch analysis and machine learning jobs run on our production Spark clusters spanning thousands of nodes on a daily basis. This leads to petabytes of data being shuﬄed by Spark each day. When processing such a mas- sive amount of data, the shuﬄe operation becomes critical to the operation of the Spark infrastructure. Spark materi- alizes the shuﬄe data on disks in a sort-based fashion and serves it with external shuﬄe services. While this provides a good balance of fault-tolerance and performance, the fast growth of Spark workloads at LinkedIn still poses multiple challenges. First, the requirement of establishing all-to-all connec- tions to transfer the shuﬄe data between the map and reduce tasks is posing reliability issues. In clusters with thousands of nodes, intermittent issues with individual node availabil- ity can be common. During peak hours, the increased shuﬄe workloads can also stress the deployed shuﬄe services, fur- ther increasing the likelihood of connection failures. Second, the disk I/O operations generated during shuf- ﬂe present eﬃciency issues. The materialized Spark shuﬄe data is portioned into shuﬄe blocks, which are fetched indi- vidually in a random order. These blocks are usually small. The average block size in LinkedIn’s Spark clusters is only around 10s of KBs. Billions of such blocks are read on our clusters daily, which can severely stress the disks if served from HDDs. The small random disk reads, combined with other overhead such as small network I/Os, lead to increased latency in fetching shuﬄe data. Around 15% of the total Spark computation resources on our clusters are wasted due to this latency. Finally, as pointed out in [41], the reduction of average block size as the shuﬄe data size grows also introduces a scalability issue. As our Spark workload trends towards pro- cessing more data, this eﬃciency issue has gradually gotten worse. Some poorly conﬁgured Spark applications with un- necessarily small blocks further exacerbate this problem. While solutions such as storing shuﬄe data on SSDs can help alleviate these problems, switching out HDDs with SSDs at LinkedIn scale is not practical. More details on this are discussed in Section 2.2. In addition, cloud-based cluster deployments that leverage disaggregated storage also suf- fer from small reads due to network overhead. To tackle these challenges, we propose an alternative shuﬄe mecha- nism named Magnet. With Magnet, we push the fragmented shuﬄe blocks produced by every map task to remote shuﬄe services, and merge them into large chunks per shuﬄe par- tition opportunistically. Some of its beneﬁts are highlighted below: • Magnet opportunistically merges fragmented interme- diate shuﬄe data into large blocks and co-locates them with the reduce tasks. This allows Magnet to signif- icantly improve the eﬃciency of the shuﬄe operation and decrease the job end-to-end runtime, independent of the underlying storage hardware. • Magnet adopts a hybrid approach where both merged and unmerged shuﬄe data can serve as input to reduce tasks. This helps improve reliability during shuﬄe. • Magnet is designed to work well in both on-prem or cloud-based deployments, and can scale to handle peta- bytes of daily shuﬄed data and clusters with thousands of nodes. The rest of this paper is organized as follows: Section 2 introduces the Spark shuﬄe operation and discusses exist- ing issues. Section 3 presents the detailed design of Magnet. Section 4 shows some optimizations adopted in the imple- mentation of Magnet. Section 5 gives the evaluation setup, key results, and analysis. Section 6 talks about related work. We conclude this paper in Section 7. 2. BACKGROUND AND MOTIV ATION In this section, we motivate and provide the background for Magnet. Section 2.1 reviews the current Spark shuﬄe operation. Sections 2.2-2.4 discuss the major shuﬄe issues we have encountered with operating Spark infrastructure at very-large scale. 2.1 Current Spark Shufﬂe Operation As mentioned earlier, the intermediate data between stages is transferred via the shuﬄe operation. In Spark, the way shuﬄe is performed varies slightly based on the deployment mode. At LinkedIn, we deploy Spark on YARN [37] and leverage the external shuﬄe service [5] to manage the shuf- ﬂe data. Such a deployment mode is also widely adopted across the industry, including companies having some of the largest Spark deployments such as Netﬂix [10], Uber [9], and Facebook [16]. With such a Spark deployment, the shuﬄe operation in Spark works as illustrated in Figure 2: 1. Each Spark executor upon starting up registers with the Spark External Shuﬄe Service (ESS) that is lo- cated on the same node. Such registrations allow the Spark ESS to know about the location of the materi- alized shuﬄe data produced by local map tasks from each registered executor. Note that the Spark ESS in- stances are external to the Spark executors and shared across potentially many Spark applications. 2. Each task within a shuﬄe map stage processes its por- tion of the data. At the end of the map task, it pro- duces a pair of ﬁles, one for the shuﬄe data and an- other to index shuﬄe blocks in the former. To do so, 3383",
  "diagram": {
    "nodes": [
      {
        "id": "map",
        "label": "Map Tasks",
        "icon": "Cpu",
        "hint": "Produce partitioned output"
      },
      {
        "id": "service",
        "label": "Magnet Shuffle Service",
        "icon": "Server",
        "hint": "Receives pushed partitions"
      },
      {
        "id": "persist",
        "label": "Buffer/Spill",
        "icon": "HardDrive",
        "hint": "In-memory + spill-to-disk"
      },
      {
        "id": "reduce",
        "label": "Reduce Tasks",
        "icon": "Layers",
        "hint": "Consume partitions"
      },
      {
        "id": "coord",
        "label": "Scheduler",
        "icon": "Activity",
        "hint": "Tracks task completion"
      }
    ],
    "flow": [
      "map",
      "service",
      "reduce"
    ]
  },
  "steps": [
    {
      "title": "Map output ready",
      "description": "Map tasks finish and produce partitioned shuffle blocks.",
      "active": [
        "map"
      ],
      "log": "Map outputs produced.",
      "message": {
        "from": "Map Tasks",
        "to": "Magnet Shuffle Service",
        "label": "Map output"
      }
    },
    {
      "title": "Push to shuffle service",
      "description": "Instead of reducers pulling, mappers push data to Magnet.",
      "active": [
        "map",
        "service"
      ],
      "log": "Partitions pushed to service.",
      "message": {
        "from": "Map Tasks",
        "to": "Magnet Shuffle Service",
        "label": "Push shuffle"
      }
    },
    {
      "title": "Buffer & spill",
      "description": "Service buffers in memory and spills to disk when needed.",
      "active": [
        "service",
        "persist"
      ],
      "log": "Data staged for reducers.",
      "message": {
        "from": "Magnet Shuffle Service",
        "to": "Buffer/Spill",
        "label": "Buffer/spill"
      }
    },
    {
      "title": "Reducers register",
      "description": "Reducers learn where their partitions are staged.",
      "active": [
        "coord",
        "reduce",
        "service"
      ],
      "log": "Reducers discover partitions.",
      "message": {
        "from": "Scheduler",
        "to": "Reduce Tasks",
        "label": "Register"
      }
    },
    {
      "title": "Stream partitions",
      "description": "Reducers fetch/stream partitions efficiently (fewer random reads).",
      "active": [
        "reduce",
        "service"
      ],
      "log": "Reducers consume partitions.",
      "message": {
        "from": "Reduce Tasks",
        "to": "Magnet Shuffle Service",
        "label": "Stream"
      }
    },
    {
      "title": "Less tail + contention",
      "description": "Push-based design reduces stragglers and network hotspots.",
      "active": [
        "coord"
      ],
      "log": "Shuffle completion improves tail latency.",
      "message": {
        "from": "Scheduler",
        "to": "—",
        "label": "Tail reduction"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Why shuffle is hard",
        "icon": "Info",
        "bullets": [
          "Shuffle is the dominant cost in many data-parallel pipelines.",
          "Pull-based shuffle can create bursts, hot links, and long tails."
        ]
      },
      {
        "title": "Magnet approach",
        "icon": "Layers",
        "bullets": [
          "Make shuffle **push-based**: producers push partitions to a dedicated service.",
          "Centralize buffering/spilling to smooth demand and reduce stragglers."
        ]
      },
      {
        "title": "Engineering focus",
        "icon": "BookOpen",
        "bullets": [
          "Control network usage and tail latency at scale.",
          "Make shuffles more predictable and easier to operate."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Shuffle",
        "def": "Redistribution of intermediate data from mappers to reducers by partition."
      },
      {
        "term": "Push-based",
        "def": "Producers send data proactively rather than consumers pulling it."
      },
      {
        "term": "Straggler",
        "def": "Slow task that determines overall job completion time."
      },
      {
        "term": "Spill",
        "def": "Write buffered data to disk when memory is insufficient."
      },
      {
        "term": "Partition",
        "def": "Subset of keys assigned to a particular reducer."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function MagnetShuffleSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
