// Order is persisted by the original ?chapter=N links. Append; do not reorder.
const entries = [
  ['mendel', 'Experimentation', 'Explore how independent experiment layers share traffic without sharing parameters.', 'https://research.google/pubs/overlapping-experiment-infrastructure-more-better-faster-experimentation/', 'mendel.html'],
  ['gfs', 'Storage', 'Trace chunk replication, leases, and recovery after a chunkserver failure.', 'https://research.google/pubs/the-google-file-system/', 'google_file_system.html'],
  ['mapreduce', 'Data Processing', 'Follow map, shuffle, and reduce and reason about task retries.', 'https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/', 'map_reduce.html'],
  ['bigtable', 'Storage', 'Understand row locality, tablets, and the write path through memory and SSTables.', 'https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/', 'bigtable.html'],
  ['chubby', 'Consensus', 'Distinguish advisory locking, sessions, and sequencers from database transactions.', 'https://research.google/pubs/the-chubby-lock-service-for-loosely-coupled-distributed-systems/', 'chubby.html'],
  ['spanner', 'Storage', 'Connect clock uncertainty to commit wait and externally consistent transactions.', 'https://research.google/pubs/spanner-googles-globally-distributed-database/'],
  ['borg', 'Infrastructure', 'Compare resource requests, placement, and admission under cluster pressure.', 'https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/'],
  ['dremel', 'Data Processing', 'Trace nested column reads and aggregation through a serving tree.', 'https://research.google/pubs/dremel-interactive-analysis-of-web-scale-datasets/'],
  ['anycast-load-balancing', 'Networking', 'Explore route selection and traffic movement when a serving location fails.', 'https://www.rfc-editor.org/rfc/rfc4786', null, 'Related standard'],
  ['bitcoin', 'Consensus', 'Explore proof of work, competing chains, and confirmation depth.', 'https://bitcoin.org/bitcoin.pdf'],
  ['bloom-paradox', 'Storage', 'Reason about false positives and the memory tradeoff of probabilistic filters.', 'https://en.wikipedia.org/wiki/Bloom_filter', null, 'Background reference; exact paper unspecified'],
  ['druid', 'Data Processing', 'Explore real-time ingestion, immutable segments, and analytical queries.', 'https://druid.apache.org/docs/latest/design/architecture/', null, 'System documentation'],
  ['dynamo', 'Storage', 'Test quorum availability, concurrent versions, and read repair across replicas.', 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf'],
  ['f1', 'Storage', 'Connect hierarchical schemas and distributed SQL to the Spanner transaction layer.', 'https://research.google/pubs/f1-a-distributed-sql-database-that-scales/'],
  ['federated-optimizations', 'Machine Learning', 'Trace local training and model aggregation without centralizing raw examples.', 'https://arxiv.org/abs/1602.05629', null, 'Related paper: federated averaging'],
  ['flumejava', 'Data Processing', 'Follow deferred pipeline construction, optimization, and parallel execution.', 'https://research.google/pubs/flumejava-easy-efficient-data-parallel-pipelines/'],
  ['google-search-anatomy', 'Search', 'Follow crawling, indexing, and ranking in an early web search engine.', 'https://research.google/pubs/the-anatomy-of-a-large-scale-hypertextual-web-search-engine/'],
  ['gorilla', 'Storage', 'Understand delta-of-delta timestamps and XOR value compression.', 'https://www.vldb.org/pvldb/vol8/p1816-teller.pdf'],
  ['magnet-shuffle', 'Data Processing', 'Trace push-based shuffle merging and reducer-local intermediate blocks.', 'https://doi.org/10.14778/3415478.3415558'],
  ['megastore', 'Storage', 'Explore entity groups and synchronous wide-area replication.', 'https://research.google/pubs/megastore-providing-scalable-highly-available-storage-for-interactive-services/'],
  ['monarch', 'Observability', 'Follow time-series ingestion and regional query aggregation.', 'https://research.google/pubs/monarch-googles-planet-scale-in-memory-time-series-database/'],
  ['myrocks', 'Storage', 'Compare LSM storage, compaction, and write amplification.', 'https://myrocks.io/', null, 'Project documentation'],
  ['myrocks1', 'Storage', 'Examine LSM tuning and the read, write, and space amplification tradeoff.', 'https://github.com/facebook/mysql-5.6/wiki', null, 'Project documentation'],
  ['napa', 'Data Processing', 'Follow incremental ingestion and analytical serving over changing data.', 'https://research.google/pubs/napa-powering-scalable-data-warehousing-with-robust-query-performance-at-google/'],
  ['parallelism-optimizing-data-placement', 'Infrastructure', 'Reason about skew, locality, and balanced parallel work.', 'https://doi.org/10.14778/3574245.3574260'],
  ['paxos-made-live', 'Consensus', 'Separate the consensus protocol from recovery and operational engineering.', 'https://research.google/pubs/paxos-made-live-an-engineering-perspective-2006-invited-talk/'],
  ['paxos-simple', 'Consensus', 'Step through promises and accepts; show why a later proposer must preserve a chosen value.', 'https://lamport.azurewebsites.net/pubs/paxos-simple.pdf'],
  ['pregel', 'Data Processing', 'Compute shortest paths with messages that cross superstep barriers.', 'https://research.google/pubs/pregel-a-system-for-large-scale-graph-processing/'],
  ['quic', 'Networking', 'Compare stream isolation and retransmission after packet loss.', 'https://www.rfc-editor.org/rfc/rfc9000', null, 'Protocol standard'],
  ['relational-model', 'Storage', 'Separate logical relations and algebra from physical access paths.', 'https://doi.org/10.1145/362384.362685'],
  ['scaling-pagerank', 'Search', 'Trace iterative rank propagation and communication-efficient supersteps.', 'https://research.google/pubs/scaling-pagerank-to-100-billion-pages/'],
  ['sre-capacity-management', 'Infrastructure', 'Trace demand forecasts into capacity plans and provisioning.', 'https://sre.google/sre-book/software-engineering-in-sre/', null, 'Related SRE chapter'],
  ['sundial', 'Infrastructure', 'Explore fault-tolerant clock synchronization and recovery through backup clock parents.', 'https://www.usenix.org/conference/osdi20/presentation/li-yuliang'],
  ['thread-per-core-tail-latency', 'Infrastructure', 'Explore core affinity, queues, and tail-latency bottlenecks.', 'https://www.scylladb.com/architecture/', null, 'Related architecture reference'],
  ['trickle', 'Networking', 'Connect TCP congestion-window caps to smoother video delivery and reduced bursts.', 'https://research.google/pubs/trickle-rate-limiting-youtube-video-streaming/'],
  ['twitter-wtf', 'Search', 'Follow graph-based candidate generation for who-to-follow recommendations.', 'https://doi.org/10.1145/2488388.2488433'],
  ['virtual-memory', 'Infrastructure', 'Translate virtual addresses and distinguish TLB misses from page faults.', 'https://pages.cs.wisc.edu/~remzi/OSTEP/', null, 'Textbook reference'],
  ['web-search-for-a-planet', 'Search', 'Trace distributed search fan-out and result aggregation.', 'https://research.google/pubs/web-search-for-a-planet-the-google-cluster-architecture/'],
  ['windows-azure-storage', 'Storage', 'Separate partition management, stream replication, and storage frontends.', 'https://sigops.org/s/conferences/sosp/2011/current/2011-Cascais/printable/11-calder.pdf'],
  ['zanzibar', 'Security', 'Explore relationship-based authorization and consistency of access decisions.', 'https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/'],
  ['colossus', 'Storage', 'Compare replication and erasure coding under fragment loss and repair.', 'https://cloud.google.com/blog/products/storage-data-transfer/a-peek-behind-colossus-googles-file-system', null, 'Official architecture overview, not a standalone paper'],
  ['percolator', 'Storage', 'Step through prewrite, primary commit, and crash recovery of a two-row transaction.', 'https://research.google/pubs/large-scale-incremental-processing-using-distributed-transactions-and-notifications/'],
  ['millwheel', 'Data Processing', 'Test event-time watermarks, late records, and duplicate suppression.', 'https://research.google/pubs/millwheel-fault-tolerant-stream-processing-at-internet-scale/'],
  ['tensorflow', 'Machine Learning', 'Compute gradients for a small graph and compare stable and divergent learning rates.', 'https://www.usenix.org/conference/osdi16/technical-sessions/presentation/abadi'],
  ['lambda-architecture', 'Data Processing', 'Reconcile batch and speed views without double-counting overlapping events.', 'https://www.manning.com/books/big-data', null, 'Architecture reference; not a Google paper'],
  ['google-infrastructure-security', 'Security', 'Evaluate layered identity, authorization, transport, and storage checks.', 'https://cloud.google.com/docs/security/infrastructure/design', null, 'Official security design overview'],
  ['photon-pubsub', 'Data Processing', 'Compare at-least-once delivery with durable event-ID deduplication after a lost acknowledgement.', 'https://research.google/pubs/photon-fault-tolerant-and-scalable-joining-of-continuous-data-streams/', null, 'Photon paper; Pub/Sub is a separate system'],
  ['jupiter-rising', 'Networking', 'Route flows over parallel spines and measure oversubscription after a failure.', 'https://research.google/pubs/jupiter-rising-a-decade-of-clos-topologies-and-centralized-control-in-googles-datacenter-network/'],
  ['autopilot', 'Infrastructure', 'Compare automatic CPU sizing with throttling, waste, and OOM risk.', 'https://doi.org/10.1145/3342195.3387524'],
  ['inside-google-datacenters', 'Infrastructure', 'Compute usable compute and network capacity after a rack failure.', 'https://www.google.com/about/datacenters/', null, 'Official overview; thematic companion, not a single paper'],
  ['sre-workbook', 'Observability', 'Calculate error budgets and burn rates, then test a release decision.', 'https://sre.google/workbook/implementing-slos/', null, 'SRE Workbook chapter'],
  ['idf-symbolic-sim', 'Search', 'Calculate term frequency and inverse document frequency for a small corpus.', 'https://nlp.stanford.edu/IR-book/html/htmledition/term-frequency-and-weighting-1.html', null, 'Textbook reference'],
];

export const labIds = ['pregel', 'colossus', 'percolator', 'millwheel', 'tensorflow', 'lambda-architecture', 'google-infrastructure-security', 'photon-pubsub', 'jupiter-rising', 'autopilot', 'inside-google-datacenters', 'sre-workbook', 'dynamo', 'paxos-simple'];
const walkthroughs = new Set(['bloom-paradox', 'druid', 'f1', 'federated-optimizations', 'flumejava', 'google-search-anatomy', 'gorilla', 'magnet-shuffle', 'monarch', 'myrocks1', 'napa', 'parallelism-optimizing-data-placement', 'paxos-made-live', 'relational-model', 'scaling-pagerank', 'sre-capacity-management', 'trickle', 'twitter-wtf', 'web-search-for-a-planet']);

export const paperMetadata = entries.map(([id, category, objective, source, html, sourceLabel]) => ({
  id, category, objective, source, sourceLabel: sourceLabel || 'Original paper',
  contentPath: html ? `/library/${html}` : `/library/whitepapers/${id}`,
  kind: html ? 'Legacy interactive' : labIds.includes(id) ? 'Model lab' : walkthroughs.has(id) ? 'Guided walkthrough' : 'Interactive demo',
}));

export function resolvePaperChapter(value) {
  if (!/^[1-9]\d*$/.test(value || '')) return null;
  return paperMetadata[Number(value) - 1]?.contentPath || null;
}
