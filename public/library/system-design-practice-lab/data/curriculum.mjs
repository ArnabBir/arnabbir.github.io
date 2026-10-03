export const tracks = [
 ['requirements','Requirements & framing','Turn vague asks into testable constraints.','Scope, workloads, SLOs, invariants, stakeholders'],
 ['networks','Networks & delivery','Reason about every hop on the request path.','DNS, TCP, TLS, HTTP, QUIC, proxies, load balancers'],
 ['apis','API & protocol design','Design contracts that survive retries and change.','Pagination, idempotency, webhooks, gRPC, versioning'],
 ['storage','Storage internals','Connect data structures to durability and latency.','WAL, B-trees, LSM trees, compaction, object stores'],
 ['modeling','Data models & indexes','Choose representations for actual access patterns.','Indexes, constraints, documents, search, time series'],
 ['transactions','Transactions & isolation','Protect invariants under overlapping operations.','MVCC, write skew, deadlocks, atomicity, uniqueness'],
 ['consistency','Replication & consistency','Separate visibility, durability and availability.','Quorums, CAP, session guarantees, conflict resolution'],
 ['coordination','Consensus & coordination','Reason about authority when processes fail.','Raft, leases, fencing, clocks, elections, membership'],
 ['partitioning','Partitioning & placement','Scale without ignoring the hot keys.','Hash/range sharding, resharding, routing, IDs'],
 ['caching','Caching & content delivery','Keep fast copies useful and safe.','Invalidation, stampedes, TTLs, CDN, hot keys'],
 ['messaging','Queues & event logs','Make delivery, processing and acknowledgement precise.','Ordering, retries, offsets, deduplication, backpressure'],
 ['streaming','Stream & batch processing','Reason about incomplete, late and replayed data.','Watermarks, windows, joins, checkpoints, ETL'],
 ['concurrency','Concurrency & memory','Find the race, not just the shared variable.','Locks, atomics, memory ordering, ABA, thread pools'],
 ['lld','Low-level design','Translate invariants into maintainable components.','Interfaces, state machines, composition, extensibility'],
 ['reliability','Reliability & disaster recovery','Design for partial failure and recovery.','SLOs, timeouts, bulkheads, RPO/RTO, failover'],
 ['observability','Observability & incident reasoning','Choose evidence that distinguishes competing causes.','Metrics, tracing, cardinality, alerting, diagnosis'],
 ['security','Security & privacy','Protect boundaries, identities and sensitive data.','Authorization, tenant isolation, crypto, abuse, deletion'],
 ['delivery','Deployments & migrations','Change a live system without breaking its contracts.','Canaries, schema evolution, CDC, backfill, rollback'],
 ['performance','Performance engineering','Identify bottlenecks before choosing optimizations.','Profiling, tail latency, batching, CPU/IO, locality'],
 ['products','Product-scale architectures','Compose systems around end-user behavior.','Feeds, chat, search, notifications, media, collaboration'],
 ['domains','Domain invariants','Apply design tools to hard business constraints.','Booking, payments, wallets, games, ads, logistics'],
 ['platforms','Staff-level architecture','Make durable decisions across teams and regions.','Cells, control planes, build/buy, cost, ownership'],
 ['testing','Testing distributed systems','Seek counterexamples to the design.','Property tests, load tests, fault injection, models'],
 ['ai-data','AI & data platforms','Design the system around model and data behavior.','Inference, retrieval, feature stores, evaluation, quotas'],
 ['capacity','Capacity & quantitative reasoning','Make the units, assumptions and arithmetic explicit.','24 calculation families with clearly labeled parameter variants'],
 ['traces','Execution & failure traces','Follow the state, one event at a time.','12 executable models: races, fences, caches, logs, queues and clocks']
].map(([id,title,description,topics],index)=>({id,title,description,topics,index:index+1}));

export const paths = [
 {id:'foundations',title:'Build the foundations',description:'Start with requirements, contracts, data and failure assumptions.',tracks:['requirements','networks','apis','modeling','transactions','consistency'],level:'all'},
 {id:'senior',title:'The senior interview loop',description:'Connect requirements, sizing, architecture and deep dives.',tracks:['requirements','capacity','partitioning','caching','messaging','products','domains','reliability'],level:'senior'},
 {id:'staff',title:'Staff-level judgment',description:'Practice ambiguity, migration, blast radius and cross-team trade-offs.',tracks:['platforms','delivery','reliability','security','observability','ai-data','testing'],level:'staff'},
 {id:'low-level',title:'Concurrency & low-level design',description:'Prove the invariant, trace the schedule, and evolve the interface.',tracks:['concurrency','lld','transactions','storage','performance'],level:'all'}
];
