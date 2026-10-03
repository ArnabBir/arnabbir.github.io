# Whitepaper Reading Room

Entry point: `/library/rack/whitepapers`.

## Coverage

The catalog contains **76 entries: 52 preserved experiences and 24 research reading guides**. All 52 preserved experiences now also have research workspaces, for **76/76 workspaces without duplicate catalog entries**. It is a curated mixture of papers, standards, books, documentation, and topic companions, not a claim that every entry is an original research paper or a simulation. The first 52 chapter positions are a compatibility contract for `/library/whitepapers?chapter=N` links. New entries have stable ID-based URLs and are appended after that prefix.

## Complete workspace coverage, 2026-10-03

This section supersedes the historical 38-workspace counts below. Bibliography backlog: **0**. Workspace backlog: **0**. The worktree was clean at the start of this continuation; existing tracked work was preserved. No agent-delegation tool was available, so the three disjoint content batches were authored and integrated directly.

### Completion checklist

- [x] Inspect current citation/schema/content/routing patterns and prior verification records.
- [x] Add 38 individually authored workspaces: 10 storage/authorization, 15 data/search/ML, and 13 systems/networking/consensus guides.
- [x] Preserve all 76 entries, all 52 historical chapter mappings, and every original interactive destination.
- [x] Include a distinct problem, mechanisms, assumptions, two-pass reading plan, semantic concept diagram, glossary, exercise with reasoning guidance, related guides, and real source links in each workspace.
- [x] Verify same-work public alternatives and keep canonical publisher citations and access caveats.
- [x] Polish comparison, guide classification, source access, worksheet exports, and bidirectional navigation.
- [x] Validate metadata coverage, uniqueness, related references, source URLs, and routes with automated tests.
- [x] Run production build, strict-TLS source checks, desktop/mobile browser checks, and punctuation/diff checks.

### Reading-room polish

- All 52 original experiences retain prominent hero links from their workspace. All five standalone HTML demos now link back to their own reading workspace.
- Previous/next navigation follows the frozen catalog order. Related links always lead to a reading workspace; a grouped, alphabetized comparison selector covers every other entry.
- Book/chapter, standards, and topic guides have distinct labels. Corporate attribution is no longer described as a number of personal authors. Citation dates remain separate from access-check observations.
- Verified public copies are offered next to canonical source links. Restricted canonical sources display their actual access caveat in the hero and evidence shelf.
- Diagrams remain semantic ordered lists with an accessible figure caption, responsive stacking, and text explanations. Mobile section links have larger touch areas and long content wraps locally.
- Worksheet exports now include prerequisites, the conceptual sequence, glossary, and reasoning guidance alongside source caveats and user notes. Existing note keys, browser persistence, export behavior, and demo progress behavior are retained.
- Bloom and Gorilla remain the existing bounded computed experiments. None of the 38 new editorial workspaces is presented as an executable implementation.

### Source review and access report

Source-level provenance and caveats are recorded in [WHITEPAPER-SOURCE-REVIEW.md](WHITEPAPER-SOURCE-REVIEW.md). The six new public-copy links were checked by inspecting PDF titles/bylines and the matching work, not merely an HTTP status. Author summaries and institutional abstracts support the reading plans; this is not a claim to have reproduced every experiment or audited every implementation.

Strict-TLS source-health run at **2026-10-03T08:24:30.010Z**:

| Result | Distinct URLs |
| --- | ---: |
| Reachable, not automatically content-verified | 89 |
| Manual review required, HTTP 403 at ACM | 9 |
| Hard failures or TLS failures | 0 |
| Total, including six added public copies | 98 |

Both canonical O'Reilly book records returned success in this run, after HTTP 403 in the preceding session. Their public `sre.google` chapter links remain the reading sources. This variability is documented, not treated as permanently fixed access. An intermediate RFC 9000 timeout cleared in the final full run. Bloom is the one blocked work for which no public full-text alternate was verified; retain the canonical restricted citation. The other eight ACM-linked works have a public full text through either an existing primary PDF or one of the six added copies.

The checker now includes artifacts from **all 76 workspaces**, refuses disabled TLS verification, and flags a purported PDF that returns HTML even with HTTP 200. Reachability never updates bibliographic verification dates. The first exploratory Node request inherited disabled TLS verification; it was discarded as validation evidence, and the institutional checks and all final source checks were rerun with `NODE_TLS_REJECT_UNAUTHORIZED=1`.

### Verification

- `npm test`: **51/51 passed**, plus playbook/catalog checks, Frontend Atlas validation, and zero U+2014 punctuation violations.
- `npm run build`: **passed**, with **54 emitted assets** and their references validated. Existing simulation sourcemap warnings and outdated Browserslist data remain non-fatal.
- `npm run papers:test-browser` with the existing Playwright installation: **76/76 workspaces at 1440px and 390px**. Tests cover all source/artifact and public-copy hrefs, original demo links, guide-type labels, accessible figures, exercise reveals, related and adjacent routes, 76-option comparison menus, notebook isolation/persistence/export/storage failure, keyboard exercise access, rack filters, six learning paths, and light/dark behavior. Original Bloom/Gorilla controls/reset and representative native demos remain covered.
- All five standalone HTML demos are checked for return-workspace links and document overflow at both widths. Node tests retain exact assertions for every historical chapter mapping.
- No commits, pushes, or deployment are part of this work.

## Historical legacy curation continuation, 2026-10-03 local date

### Implementation checklist

- [x] Inspect and preserve the existing worktree and all 76 catalog entries.
- [x] Review the remaining 48 legacy citations against primary institutional, publisher, project, or author records.
- [x] Add exact citation titles independent of local experience titles, complete author lists or explicit project attribution, venues, dates where supported, and edition/provenance notes.
- [x] Keep living documentation undated instead of substituting copyright years.
- [x] Add 14 native legacy research workspaces with original demo links, diagrams, exercises, glossary, assumptions, and related references.
- [x] Add deterministic Bloom filter and Gorilla timestamp experiments alongside the preserved walkthroughs.
- [x] Extend schema-preservation, routing, bibliography, relationship, and model-invariant tests.
- [x] Complete final test, build, strict-TLS source-health, and desktop/mobile browser checks.
- [x] Resume from the interrupted worktree and revalidate the implementation rather than replacing it.
- [x] Expose exact citation titles and expandable attribution on all 76 catalog cards; classify the linked Spanner journal edition as a research article.
- [x] Fix undated comparison labels and demo attribution; retain source type, citation caveats, and original demo paths in exported worksheets.
- [x] Extend and rerun regression checks for all-card citation coverage, single-author and undated demos, and worksheet provenance.

All **52/52 legacy entries now have reviewed bibliographic records**, including the four from the preceding phase. Together with the 24 newer guides, **76/76 catalog entries have source metadata**. Five living-source entries deliberately omit a publication year: Druid, MyRocks, MyRocks Extended, ScyllaDB architecture, and Inside Google Datacenters. Google infrastructure security uses the explicitly stated June 2024 revision, not a claimed original publication year.

That phase added Chubby, Borg, Dremel, Megastore, Percolator, MillWheel, Colossus, Druid, SRE capacity planning, Implementing SLOs, Virtual Memory, Bloom filters, Gorilla, and infrastructure security. They use `/library/whitepapers/<legacy-id>/research`; existing chapter routes and demo URLs still resolve to their original experiences. At that checkpoint, 38 legacy entries had citations but still lacked dedicated workspaces; the complete-coverage phase above closes that backlog.

### Source decisions and verification boundaries

- `src/content/legacyPaperCitations.js` records the 48 citations reviewed in this continuation. Exact titles, bylines, and venues were checked on Google Research, USENIX, RFC Editor, arXiv, publisher DOI records, official project documentation, textbook author sites, and publisher book pages. Google publication metadata was also inspected through the browser directly on `research.google`; no research agents were available in this session.
- `src/content/legacyPaperResearch.js` contains individually authored learning content; `paperGuides.js` joins that content to citation and original-demo metadata by stable ID. Diagrams are editorial conceptual sequences, not reproduced paper figures.
- Dremel cites the linked 2011 CACM edition. Parallelism-Optimizing Data Placement uses its December 2022 PVLDB publication date. Paxos Made Live uses its 2007 proceedings date despite the 2006 talk in the landing-page title.
- Bloom Paradox remains an editorial companion name. Its source is now Burton H. Bloom's 1970 paper, with an explicit relationship note. Colossus remains a 2021 engineering overview. SRE entries cite specific book chapters and chapter bylines, not invented standalone papers or book-editor author lists.
- ScyllaDB's old `/architecture/` link redirected to a conference talk. The verified replacement is `/product/technology/`. MyRocks Extended remains project documentation; the repository reports archival on 2026-03-01, not an active benchmark reproduction.
- Bitcoin's 2008 date was verified against Satoshi Nakamoto's original October 31 mailing-list announcement. O'Reilly publisher pages verify April 2016 and July 2018 editions for the two SRE chapters. The OSTEP author site recommends November 2023 version 1.10. The IR book has a 2008 publication date despite its 2009 HTML update.
- Initial OSTEP and mailing-list fetches failed transiently, then succeeded through ordinary HTTPS retries. A guessed Microsoft Windows Azure Storage landing page returned 404; the existing proceedings PDF and publisher DOI are retained. Crossref returned temporary 429 responses for two DOI metadata requests; later sequential requests succeeded. No TLS bypass was used for these research fetches.
- The first source-health run inherited an insecure Node TLS environment setting and is discarded as validation evidence. Final source verification must explicitly set `NODE_TLS_REJECT_UNAUTHORIZED=1`; TLS failures must be reported rather than bypassed.

### Computed experiments and limits

- **Bloom filter:** 24 fixed inserted keys, 512 disjoint absent probes, configurable bit-array size and hash count, actual false-positive witnesses, zero false-negative invariant, and conditional expected lookup cost. The uniform-hash approximation is displayed separately from the measured deterministic probe set. A hit-heavy workload can lose despite a low false-positive rate.
- **Gorilla:** regular, missing-sample, and jittered integer timestamp traces; computed deltas, delta-of-delta residuals, control prefixes, payload widths, and reconstruction. Tests cover the asymmetric interval boundaries in section 4.1.1. This experiment excludes initial block state, value compression, and byte packing; it does not claim a binary-compatible encoder or full-series compression ratio.

Primary-source access does not imply a complete scientific reproduction. No external code was installed or benchmarked for these workspaces. Legacy explanations outside the reviewed workspace content are preserved, not certified as complete paper implementations.

### Continuation validation results

- `npm test`: 49 Node tests passed, plus playbook/catalog validation, Frontend Atlas validation, and punctuation normalization checks.
- `npm run build`: passed; 54 emitted assets and their references validated. Existing simulation sourcemap and Browserslist warnings remain non-fatal.
- Browser suite: all 38 guides at 1440px and 390px, verified original demo links, source/artifact hrefs, exercise reveals, no document overflow, both new experiment controls and reset, 76-card rack filters and paths, comparison navigation, notebook persistence/export/storage failure, and representative legacy Pregel, Spanner, and GFS chapter routing. No page errors. Browser testing found and fixed first-render notebook restoration timing.
- Strict-TLS source-health report at `2026-10-02T19:25:29.189Z` (October 3 local): **92 distinct URLs, 82 reachable, 10 manual-review responses, zero hard failures**. Nine ACM DOI destinations and the O'Reilly Workbook page returned HTTP 403. The publisher metadata/book content had been read successfully through the research tools; the checker correctly preserves these automated-access limitations. No TLS failures in the strict run. The checker now refuses an inherited `NODE_TLS_REJECT_UNAUTHORIZED=0` setting.
- Monthly discovery remains report-only with read-only repository permissions. No commits, pushes, or deployment were performed.

### Resumed-session verification, 2026-10-03

At this historical checkpoint, all 48 continuation records and 14 legacy workspaces were retained. The bibliography backlog was **0 of 48**; the workspace backlog was **38 of 52 legacy experiences**, subsequently completed above.

- Rechecked title, year, and author metadata for all **24 legacy Google Research URLs** directly over HTTPS. Normalized punctuation, whitespace, and the Littlefield ligature account for display differences. FlumeJava's incomplete institutional byline was independently resolved against publisher-deposited Crossref metadata at `https://api.crossref.org/works/10.1145/1806596.1806638`, which returned HTTP 200 and confirmed Robert R. Henry and Nathan Weizenbaum. The Implementing SLOs chapter byline was also rechecked on `sre.google`.
- Added exact citation titles to the four preceding-phase records and surfaced citation details on the 24 newer-guide cards. GFS, MapReduce, Bigtable, and Spanner verification dates reflect this content recheck, not the link-health run. Spanner remains linked to its 2013 TOCS edition with a note distinguishing the 2012 OSDI paper.
- Fixed demo attribution so undated project documentation remains visible and single authors are not described as having collaborators. Comparison menus explicitly show `Undated`. Worksheet exports now preserve source classification, citation caveats, and the original demo route.
- Final `npm test`: **49/49 passed**, including the expanded regression assertions, catalog/chapter checks, Frontend Atlas validation, and zero U+2014 punctuation violations.
- Final `npm run build`: **passed**, with **54 emitted assets** validated. Existing sourcemap and outdated Browserslist warnings remain.
- Final browser suite against `http://127.0.0.1:4173`: **passed at 1440px and 390px**, covering all 38 research workspaces, 76 catalog citation disclosures, controls/reset, notes, export, comparison, and representative demos. Added explicit checks for Bitcoin single-author attribution and MyRocks undated documentation. No page errors or checked-page document overflow.
- Fresh strict-TLS source-health report at `2026-10-03T07:12:13.178Z`: **92 distinct URLs, 81 reachable, 11 manual-review responses, zero hard failures**. Nine ACM DOI destinations and both O'Reilly book pages returned HTTP 403. This supersedes the earlier 82/10 reachability count. Reachability does not reverify the bibliography or paper claims, and publisher access blocks remain explicit limitations.

Representative browser-tested paths, each at both widths:

- `/library/rack/whitepapers`
- `/library/whitepapers/chubby/research`
- `/library/whitepapers/druid/research`
- `/library/whitepapers/sre-workbook/research`
- `/library/whitepapers/raft`
- `/library/whitepapers/bloom-paradox`
- `/library/whitepapers/gorilla`
- `/library/whitepapers/pregel`
- `/library/whitepapers/spanner`
- `/library/whitepapers/bitcoin`
- `/library/whitepapers/myrocks`
- `/library/whitepapers?chapter=2` resolving to `/library/google_file_system.html`

| Format | Count | Behavior |
| --- | ---: | --- |
| Model lab | 14 | Deterministic reducers or computed models, interactive assumptions, observations, reset, and explicit boundaries |
| Existing interactive demo | 14 | Preserved custom React experiences, now with catalog navigation and source context |
| Guided walkthrough | 19 | Fixed explanatory sequences, not executable system simulations |
| Legacy interactive | 5 | Standalone Mendel, GFS, MapReduce, Bigtable, and Chubby HTML pages |
| Research reading guide | 24 | Source-backed editorial summaries, concept diagrams, assumptions, exercises, comparisons, artifacts, and a local notebook; not simulations |

The earlier model-lab expansion implemented Pregel, Colossus, Percolator, MillWheel, TensorFlow, Lambda Architecture, Google Infrastructure Security, Photon/PubSub, Jupiter Rising, Autopilot, Inside Google Datacenters, and SRE Workbook. Dynamo and Paxos Simple route to model labs instead of their old scaffold configurations. Those old configuration files remain in the repository but are not mounted by `App.jsx`.

## Files

- `src/content/whitepapers.js`: stable legacy IDs and order, ID-keyed titles and citation enrichments, source classifications, combined `whitepaperCatalog`, and the old-chapter resolver.
- `src/content/paperResearch.js`: 24 complete research records and six ordered learning paths. Related references use IDs, never array offsets. `legacyPaperCitations.js`, `legacyPaperResearch.js`, and `paperGuides.js` extend this framework to existing experiences without duplicating catalog entries.
- `src/content/legacyStorageGuides.js`, `legacyDataGuides.js`, `legacySystemsGuides.js`: the 38 completion workspaces, in disjoint ID-keyed batches joined by `legacyPaperResearch.js`.
- `src/content/legacyPaperSources.js`: six verified same-work public copies and explicit access notes for restricted or intermittently blocked publisher URLs.
- `src/content/paperResearchSchema.js`: strict Zod research schema and shared citation/source-type schemas. Invalid records fail validation rather than silently dropping research fields.
- `src/content/paperCatalogTools.js`: pure multiword search, combined filters, date sorting, path ordering, and Markdown worksheet export.
- `src/content/library.js`: consumes the combined catalog directly. There is no position-coupled title/metadata merge.
- `src/content/schema.js`: explicit chapter metadata validation. Zod strips unknown fields, so new metadata must be added here as well.
- `src/pages/WhitepaperRack.jsx`: URL-backed search, topic/format/source filters, publication and alphabetical sorting, six learning paths, empty state, reset, and a prominent model-lab shortcut.
- `src/pages/PaperResearch.jsx` and `paper-research.css`: native responsive research workspace, original semantic HTML concept figures, comparison panels, local notes, and worksheet downloads.
- `src/pages/LibraryItem.jsx`: compatibility routing. React destinations use `Navigate`; standalone HTML uses document replacement, not an iframe of the rack.
- `src/pages/simulations/labs/models.js`: pure model state, transitions, and calculations.
- `src/pages/simulations/labs/PaperLab.jsx`: paper-specific controls, tables, visualizations, challenges, and limitations.
- `src/pages/simulations/labs/labs.css`: responsive, theme-aware lab presentation.
- `src/pages/simulations/_shared/PaperSimulationScaffold.jsx`: clearly labeled walkthrough player; stops at the last step and supports direct step selection.
- `src/pages/simulations/_shared/PaperExperienceNav.jsx`: navigation and source context for preserved custom demos.
- `src/pages/simulations/_shared/RelatedResearch.jsx`: reverse links from existing custom demos and labs to relevant new guides.
- `scripts/paper-sources.mjs`: bounded, read-only source-health and candidate-discovery reports.
- `.github/workflows/whitepaper-discovery.yml`: manual/monthly report generation with read-only repository permissions and no publishing step.

## Authoring Rules

1. For a research guide, append one complete record to `paperResearch.js`. Its citation and content travel together. For a legacy experience, use an explicit stable ID in the title map. Never reorder existing chapter positions or merge parallel arrays by index.
2. Classify the experience honestly. A graph with highlighted nodes and a fixed sequence is a guided walkthrough, not a model lab.
3. Link the exact original paper when identified. For architecture overviews, standards, textbooks, or related papers, state that relationship in `sourceLabel`. Do not invent paper titles or source URLs.
4. For a new lab, add its ID to `labIds`, define `initialLab` and `reduceLab` behavior, and add a distinct view and lesson in `PaperLab.jsx`. The parameterized route handles lab routing; unknown slugs render an explicit not-found view.
5. Keep transitions deterministic and immutable. Use no random values, wall clocks, hidden network calls, or unbounded autoplay in a teaching model. Make displayed results derive from state, not a canned success message.
6. Include a prediction challenge, a failure or comparison scenario, visible observations, reset, and precise simplifications. Sliders that recompute results do not need artificial step buttons.
7. Use native buttons, labeled controls, visible focus, accessible tables, and text alternatives for graphics. Keep tables locally scrollable instead of overflowing the page.
8. Add invariant tests and verify the new route at desktop and mobile widths. Check that the content schema preserves its metadata.
9. Every catalog entry must have one research workspace. For an existing experience, add complete editorial content to the appropriate legacy guide module and retain its original `contentPath`; `paperGuides.js` derives `/library/whitepapers/<id>/research`. Coverage tests reject missing/duplicate IDs, unresolved relationships, and repeated whole content fields.
10. Write a paper-specific failure question, worksheet, glossary, and diagram, not a generic template with substituted names. Cite the actual source type and edition. Topic companions and books must not acquire invented paper metadata or reproduced full-book content.
11. Add an alternate only after verifying that it is the same work on a legitimate public author, institutional, or publisher site. Keep the canonical citation; document access blocks. Check PDF signatures as well as status codes and use strict TLS. Do not infer publication dates or scientific correctness from reachability.

## Model Contracts

| Model | Key invariant or comparison |
| --- | --- |
| Pregel | Updates cross one superstep barrier; unavailable worker blocks advancement; shortest paths converge |
| Colossus companion | Ideal (6,4) coding tolerates two erasures; three complete replicas tolerate two replica losses at different storage cost |
| Percolator | Before primary commit recovery aborts; after primary commit recovery rolls forward; readers resolve locks before returning a snapshot |
| MillWheel | Duplicate IDs do not contribute twice; finalized window totals do not change for late records |
| TensorFlow companion | Scalar MSE decreases with a stable learning rate and diverges above the stability threshold |
| Lambda Architecture | Batch and speed coverage are disjoint at the published cutoff; snapshot publication preserves the logical count |
| Security | Authentication, authorization, transport protection, and disk confidentiality address different gates and threats |
| Photon/PubSub companion | Durable event-ID dedup suppresses replayed join effects; atomic dedup-plus-output is an explicit assumption |
| Jupiter companion | Carried throughput cannot exceed offered demand or surviving per-spine capacity |
| Autopilot companion | Reservation margin trades unused CPU against throttling and memory exhaustion; history is not a future bound |
| Datacenter companion | Usable capacity is bounded by surviving racks, available power, and aggregate network capacity |
| SRE Workbook | Error budget depends on request volume and SLO; recent burn rate is distinct from remaining monthly budget |
| Dynamo | Concurrent vectors remain siblings; observed-context reconciliation dominates them; timed-out writes may still persist |
| Paxos | Higher ballots preserve chosen values; promises never decrease; no majority means no guaranteed progress |

## Verification

```sh
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another terminal, with Playwright available:
npm run papers:test-browser
```

Tests cover all 76 catalog entries, frozen legacy destinations, chapter bounds, strict schemas, uniqueness, related references, source URL structure, path integrity, search/filter/sort semantics, worksheet export, discovery parsing, reset, and the model invariants above. `npm test` now includes the model tests instead of requiring a separate invocation. `PLAYWRIGHT_MODULE` can point to an existing Playwright installation, and `PAPER_BASE_URL` can select another preview server.

Historical baseline verification, before the research expansion: 24 Node tests passed. All 47 original React destinations mounted at 390px and 1440px without document overflow; all five standalone HTML pages rendered. Every model lab's controls changed its displayed state and reset restored the initial view. Prior Lighthouse snapshot audits scored 100 for accessibility, best practices, and SEO on the desktop rack and a dark mobile Pregel lab. Those historical scores do not certify the expanded library.

## Research Expansion: Source Ledger and Editorial Decisions

Checked on **2026-10-02 UTC**. The registry stores every exact source URL, author list, cited-edition year, venue or arXiv identifier, and human verification date. Dates are intentionally absent on legacy entries whose editions were not reviewed in this pass.

| Area | New guides | Primary records consulted |
| --- | --- | --- |
| Coordination and transactions | Raft, ZooKeeper, Calvin, FoundationDB | USENIX ATC pages, Yale-hosted Calvin PDF, FoundationDB project-hosted SIGMOD PDF |
| Storage and indexes | Ceph, Haystack, f4, Bw-tree | USENIX OSDI pages and Microsoft Research ICDE record |
| Data processing | Kafka, Spark/RDDs, Dryad, Dataflow model, Mesa | Institutional Kafka PDF, USENIX NSDI, Microsoft Research EuroSys, Google Research VLDB records |
| Observability and latency | Dapper, The Tail at Scale | Google technical report and Communications of the ACM record |
| Vector search | HNSW, Faiss/GPU similarity search | arXiv primary author submissions |
| Language-model architecture and systems | Transformer, BERT, RAG, LoRA, Chinchilla, FlashAttention, vLLM/PagedAttention | arXiv primary author submissions; PagedAttention record explicitly identifies SOSP 2023 |

Specific decisions:

- ZooKeeper is **ATC 2010**, not OSDI. The publisher page was used to resolve this.
- The existing Spanner source points to the **2013 ACM TOCS journal version**. Its new date label uses 2013, not the 2012 conference date.
- HNSW, Faiss, Attention, BERT, RAG, LoRA, Chinchilla, and FlashAttention use **first arXiv submission year**, explicitly labeled in cards and guides. Later journal/conference publication years are not inferred.
- Dapper is labeled a **technical report**; The Tail at Scale is a **research article**. Existing standards, engineering overviews, project documentation, textbook chapters, and related references have separate source types independent of their experience format.
- In the preceding phase, GFS, MapReduce, Bigtable, and Spanner gained source-checked author/year/venue metadata. The 48 entries left by that phase were subsequently curated in the continuation documented above.
- Seven implementation links were checked through GitHub repository metadata: `apple/foundationdb`, `nmslib/hnswlib`, `facebookresearch/faiss`, `google-research/bert`, `microsoft/LoRA`, `Dao-AILab/flash-attention`, and `vllm-project/vllm`. These are evolving code artifacts, not pinned benchmark reproductions.
- The source-health pass returned **HTTP 200 for all 35 distinct URLs**: 24 new citations, seven code repositories, and four enriched legacy citations. Initial Python requests to some USENIX pages returned bot restrictions; publisher-page verification through webfetch and the final checker succeeded. Reachability alone is not treated as citation verification.
- Illustrations and explanations are editorial syntheses. They do not reproduce copyrighted paper figures. Synthetic calculations in exercises are labeled and do not claim measured benchmark results.

## Keeping the Library Useful

### Monthly curation loop

1. Run `npm run papers:check-sources` to inspect existing citation and artifact reachability. A 403/429 or challenge means manual review, not evidence that the paper disappeared. A successful HTTP response does not validate a title, author list, or result.
2. Run `npm run papers:discover` to extract a bounded list of unreviewed links from USENIX, PVLDB, and arXiv topic indexes. Inspect venue indexes manually when no paper links are emitted. Do not infer freshness from a cached response.
3. Select a small balanced batch based on a concrete missing concept or meaningful successor comparison. Check for duplicate papers, alternate titles, conference/journal editions, and overlap with existing topic companions.
4. Read the primary source, record the exact citation edition and full author list, then write the problem, mechanism, assumptions, and a falsifiable reading exercise. Check technical sections supporting each claim. Avoid unsourced performance numbers and invented repository URLs.
5. Verify optional artifacts independently. Confirm project ownership and relation to the paper. If claiming reproduction, pin a revision, dataset, hardware, dependencies, and benchmark instructions; merely linking the current repository is insufficient.
6. Append a complete schema-valid record, connect at least two related IDs with reasons, and place it on a learning path if it fits. Keep source classification separate from whether the local experience is a guide or a computed lab.
7. Run the validation commands above. Update intentional count assertions when adding entries, but retain the frozen legacy-ID fixture. Check responsive diagrams, source links, exercise guidance, notebook persistence, comparison navigation, and punctuation.
8. Only update `verifiedOn` after human content review. The source checker deliberately cannot change this field or the registry.

The workflow file schedules **monthly, non-publishing reports** and supports manual dispatch. It has `contents: read`, uploads JSON artifacts for 30 days, and performs no commits, issue creation, catalog edits, or deployment. It will run only after the file is separately committed to an enabled repository/default branch. This implementation does not establish an ongoing autonomous curation service.

The local discovery smoke run reached all five indexes. Four yielded no matching paper links; the cs.CL index yielded two unreviewed links. The parser intentionally favors bounded, inspectable suggestions over scraping and automatically accepting content. Index markup changes, bot restrictions, and cached pages remain limitations.

### Prioritized research backlog (not yet accepted citations)

- Storage fundamentals: LSM-tree and B-tree origins, followed by modern compaction and write-amplification research.
- Transaction successors: CockroachDB, serializable SQL, and deterministic systems compared under equivalent guarantees.
- Analytics engines: vectorized execution, DuckDB, Snowflake, and columnar formats with reproducible public artifacts.
- Distributed-systems foundations: impossibility results, consistency definitions, and end-to-end arguments tied to the existing labs.
- Modern systems: disaggregated memory/storage, durable serverless execution, and inference scheduling beyond the 2023 PagedAttention paper.

These are research directions, not verified bibliography entries. Acceptance requires the same primary-source review as this batch.

## Expansion Validation

- [x] Preserve all 52 legacy IDs, destinations, and chapter positions.
- [x] Add 24 distinct source-backed guides, for 76 total entries.
- [x] Validate full research records and schema preservation through the library layer.
- [x] Verify 35 citation/artifact URLs and document edition choices.
- [x] Pass `npm test`: 44 Node tests, playbook validation, Frontend Atlas validation, and the punctuation check.
- [x] Pass the production build and emitted-asset reference check.
- [x] Browser-test every new guide at 1440px and 390px with no document overflow.
- [x] Browser-test the 76-card rack, all filter types, search persistence, publication sort, empty state, reset, and all six learning paths.
- [x] Browser-test exercises, comparisons, related links, source/artifact hrefs, note persistence, Markdown download, storage failure fallback, and light/dark mode.
- [x] Recheck existing Pregel step/reset, Spanner rendering, and the GFS legacy chapter redirect at both widths. The full legacy route/file coverage is retained in automated registry/model tests.

Known limits of the preceding pass: guides were concise research starting points rather than exhaustive paper reproductions; code was not installed or benchmarked; 48 older entries still needed complete citation curation at that time. The continuation above resolves that bibliography backlog. Remote links and discovery indexes can change. Existing Browserslist and simulation sourcemap warnings remain non-fatal build output.

## Known Limits

- The 19 remaining scaffold experiences are still guided walkthroughs. Their underlying narratives and fixed diagrams were preserved, not replaced by executable models. The shared shell now makes that distinction visible.
- The 14 pre-existing custom React demos and five HTML experiences have not received a complete scientific-correctness audit. New navigation and metadata do not imply full fidelity to their papers.
- Colossus, security, Lambda Architecture, datacenter foundations, and SRE are explicitly labeled architecture or book companions where appropriate. Photon and Pub/Sub are distinct systems; their companion isolates delivery/dedup concepts rather than claiming a unified implementation.
- New numerical examples are synthetic, not Google/Amazon production parameters or performance measurements. Each lab lists omitted mechanisms near its source link.
- The legacy HTML pages still depend on third-party CDNs for styling or visualization. Mendel's unnecessary `polyfill.io` script was removed; the legacy pages are not offline bundles.
- Publisher DOI pages may return bot challenges to automated HTTP checks. Their titles/DOIs were cross-checked against Crossref; the Google research and other direct source pages were checked for successful responses and matching titles.
- Repository-wide `npm run lint` is currently blocked by the repository's missing ESLint configuration. Production builds succeed with existing sourcemap-reporting warnings in simulation files and an outdated Browserslist database notice.

## Original Experience Delivery Checklist (Historical)

- [x] Preserve the original 52 chapter positions and resolve every destination.
- [x] Add distinct metadata, searchable topics/formats, learning objectives, and source labels.
- [x] Implement twelve missing labs and upgrade Dynamo/Paxos Simple to computed models.
- [x] Label remaining walkthrough limitations and improve common navigation.
- [x] Add deterministic invariant and schema regression tests.
- [x] Exercise all 47 React routes and five standalone HTML destinations in the browser.
- [x] Exercise all fourteen lab controls and reset; check narrow-screen overflow.
- [x] Run production compilation; document existing lint/build warnings.
