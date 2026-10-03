# Workspace completion: source review

Review date: 2026-10-03. Scope: the 38 previously missing workspaces, plus alternatives for the 11 publisher URLs blocked at the previous checkpoint. All citations remain in the existing 76-entry catalog. Summaries, conceptual diagrams, and worksheets are original editorial teaching material, not copied paper figures, full-book reproductions, or benchmark reproductions.

## Source grounding by content batch

The exact canonical URLs and bibliography are in `whitepapers.js` and `legacyPaperCitations.js`. `paperGuides.js` includes those URLs in each evidence shelf and exported worksheet.

| Guides | Primary source and reading focus |
| --- | --- |
| GFS, Bigtable, Spanner, F1 | Google institutional publication records and their cited systems papers. File mutation semantics, sorted-map/tablet layout, time uncertainty versus transaction ordering, and relational hierarchy versus remote-call latency are treated as distinct contracts. Spanner retains the 2013 journal citation, not an invented 2012 metadata replacement. |
| Dynamo | Existing author-hosted SOSP PDF and Amazon Science record. Causal siblings, application reconciliation, sloppy quorum limitations, and repair are distinguished from linearizable quorum agreement. |
| MyRocks, MyRocks Extended | Official project homepage and Facebook MySQL wiki, both read during this review. One guide covers engine selection and compatibility, the other sustained tuning and amplification. They remain separate topic guides with undated documentation citations, not duplicate papers. |
| Relational Model | Codd's original CACM article in the university-hosted copy below. Data independence and relational operations are separated from modern SQL semantics. |
| Windows Azure Storage | Existing SOSP proceedings PDF. Front end, partition, and stream layers; intra-stamp versus asynchronous inter-stamp replication. Its restricted DOI remains bibliographic evidence. |
| Zanzibar | Google institutional record and linked paper. Userset relationships and causal authorization freshness, with a stale-permission counterexample. |
| MapReduce, FlumeJava | Google publication records; the verified FlumeJava PDF additionally resolves its complete byline. Task retries and grouping are separated from deferred collection graphs and fusion. |
| Magnet, Parallelism-Optimizing Data Placement | Publisher-deposited Crossref abstracts and the matching open PVLDB PDFs below. Small-block shuffle merging is distinct from per-query placement parallelism. The data-placement filename uses Kraft, not first author Baruah. |
| Monarch, Napa | Google publication abstracts. Regional monitoring aggregation and missing-region semantics; consistently maintained materialized views, query shape, freshness, and maintenance cost. No claim of inspecting private service configurations. |
| Pregel, Scaling PageRank | Institutional publication records and graph-processing papers. General superstep barriers versus repeated fixed edge communication. Scaling PageRank's abstract describes 38 billion evaluated vertices; the guide does not turn the 100-billion-page title into a benchmark claim. |
| Google Search Anatomy, Web Search for a Planet | Google institutional records. Retrieval signals and indexing are kept separate from inter-query/intra-query serving parallelism and historical cluster economics. |
| Who to Follow | Author-hosted WWW 2013 PDF, title/byline and abstract inspected. The first-generation single-server in-memory Cassovary design is not misdescribed as a distributed graph engine. |
| TF-IDF | Stanford's online Introduction to Information Retrieval, chapter 6 and its IDF continuation. The worksheet states its logarithm and smoothing convention. No exact formula is attributed to every TF-IDF implementation. |
| Photon | Google institutional abstract, including its separate at-most-once, near-exact, and eventual exactly-once statements. The guide explicitly distinguishes Photon joins from Pub/Sub and the small local deduplication demo. |
| Lambda architecture | Manning's Big Data book overview and contents. A narrow architecture companion with an original coverage/reconciliation exercise, not an asserted standalone paper or a substitute for the book. |
| TensorFlow, Federated averaging | USENIX OSDI 2016 record and arXiv:1602.05629 abstract/version notes. Historical dataflow execution versus decentralized model averaging. The guide records that raw-data locality alone is not a formal privacy guarantee. |
| Mendel | Google publication abstract and overlapping-experiment framework. Assignment independence is distinguished from the absence of treatment interaction. |
| Anycast, QUIC | RFC Editor, RFC 4786 and RFC 9000, read over strict HTTPS. Best-current-practice operational routing versus transport streams and migration. TLS and loss-recovery companion specifications are not folded into RFC 9000 claims. |
| Bitcoin, Paxos Made Simple | Original Bitcoin PDF and Lamport-hosted PDF, opening text inspected during this review. Probabilistic proof-of-work confirmation versus fixed-member majority safety and separate liveness assumptions. |
| Paxos Made Live | Google institutional record and cited engineering work. Persistence, corruption, and recovery obligations rather than a second generic Paxos explanation. |
| Sundial, Trickle | USENIX OSDI record and Google/USENIX publication record respectively. Failure-aware clock uncertainty and backup dependency paths; application-rate/RTT congestion-window caps, not exact packet pacing guarantees. |
| Shard-per-core | ScyllaDB official technology overview. Explicitly a living vendor architecture companion; per-shard ownership and tail queueing, not a paper with the demo title. |
| Jupiter Rising, Autopilot | Google publication abstracts and the verified Autopilot author copy. Multi-stage Clos/control-plane design versus workload resource sizing and asymmetric CPU/memory failure costs. |
| Inside Google Datacenters | Official corporate overview read during this review. Toy rack capacity values are explicitly editorial assumptions, not a published Google deployment dataset. |

## Previously blocked URLs

Canonical citations are preserved even where an accessible reading copy exists. All six added PDFs returned HTTP 200 with PDF signatures in the final strict-TLS report. Their title/byline identity was separately inspected using `pdftotext` on public HTTPS responses. No access control, authentication, or TLS checks were bypassed to obtain these copies.

| Work / record | Canonical status at 2026-10-03T08:24:30.010Z | Public reading path |
| --- | --- | --- |
| Bloom, DOI 10.1145/362686.362692 | ACM HTTP 403 | **No same-work public full-text alternate verified.** Keep the restricted source disclosure. |
| FlumeJava, DOI 10.1145/1806596.1806638 | ACM HTTP 403 | Added [Google-hosted PLDI paper](https://research.google.com/pubs/archive/35650.pdf), matching all seven authors. |
| Gorilla, DOI 10.14778/2824032.2824078 | ACM HTTP 403 | Existing [PVLDB primary PDF](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf) remains accessible. |
| Magnet, DOI 10.14778/3415478.3415558 | ACM HTTP 403 | Added [PVLDB 13(12), pp. 3382-3395](https://www.vldb.org/pvldb/vol13/p3382-shen.pdf); title, byline, and DOI match. |
| Parallelism-Optimizing Data Placement, DOI 10.14778/3574245.3574260 | ACM HTTP 403 | Added [PVLDB 16(4), pp. 760-771](https://www.vldb.org/pvldb/vol16/p760-kraft.pdf); title and five authors match. |
| Relational Model, DOI 10.1145/362384.362685 | ACM HTTP 403 | Added [University of Pennsylvania course copy](https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf), with original June 1970 CACM title and byline. |
| Who to Follow, DOI 10.1145/2488388.2488433 | ACM HTTP 403 | Added [Reza Zadeh's Stanford copy](https://stanford.edu/~rezab/papers/wtf_overview.pdf), with six authors and WWW 2013 proceedings identification. |
| Windows Azure Storage, DOI 10.1145/2043556.2043571 | ACM HTTP 403 | Existing [SOSP proceedings PDF](https://sigops.org/s/conferences/sosp/2011/current/2011-Cascais/printable/11-calder.pdf) remains accessible. |
| Autopilot, DOI 10.1145/3342195.3387524 | ACM HTTP 403 | Added [John Wilkes's EuroSys 2020 copy](https://john.e-wilkes.com/papers/2020-EuroSys-Autopilot.pdf), matching title and authors. |
| O'Reilly Site Reliability Engineering book record | HTTP 200 in final run; previously 403 | Existing public [Software Engineering in SRE chapter](https://sre.google/sre-book/software-engineering-in-sre/). |
| O'Reilly Site Reliability Workbook book record | HTTP 200 in final run; previously 403 | Existing public [Implementing SLOs chapter](https://sre.google/workbook/implementing-slos/). |

## Rejected candidates and limits

- Guessed Google publication slugs for data placement and Autopilot returned 404. The actual Autopilot record has the `autopilot-workload-autoscaling-at-google-scale` slug; the canonical citation remains its DOI.
- A guessed Stanford `wtf.pdf` path returned 404. The verified same-work filename is `wtf_overview.pdf`.
- The lowercase `2020-EuroSys-autopilot.pdf` candidate returned 404; the author's public directory supplied the verified capitalized `Autopilot` filename.
- Guessed Princeton, CMU, and Virginia Bloom course-copy paths returned 404. None were added. Lack of a verified alternate does not establish that no public copy exists anywhere.
- A guessed `p760-baruah.pdf` path returned HTTP 200 with an HTML page, not a paper. It was rejected. The checker now has a regression test for this class of soft failure.
- An intermediate RFC 9000 request timed out. It succeeded in the final full report; the timeout was not hidden by disabling verification or substituting a different source.
- The first exploratory Node request inherited `NODE_TLS_REJECT_UNAUTHORIZED=0`. It was excluded from validation evidence, followed by explicit strict-TLS institutional requests and final reports. The production source checker rejects that insecure setting.
- Reading an abstract, source excerpt, or book overview is not a claim of full-paper verification. The guides stay at the supported conceptual level, link to the originals for detailed algorithms and evaluations, and distinguish illustrative numbers from measured results.
- No external project implementation was installed, run, or benchmarked. No claim of a full accessibility audit is made by the semantic and keyboard browser checks.
