# Whitepaper Reading Room

Entry point: `/library/rack/whitepapers`.

## Coverage

All 52 catalog positions have a destination. The existing chapter order is a compatibility contract for `/library/whitepapers?chapter=N` links.

| Format | Count | Behavior |
| --- | ---: | --- |
| Model lab | 14 | Deterministic reducers or computed models, interactive assumptions, observations, reset, and explicit boundaries |
| Existing interactive demo | 14 | Preserved custom React experiences, now with catalog navigation and source context |
| Guided walkthrough | 19 | Fixed explanatory sequences, not executable system simulations |
| Legacy interactive | 5 | Standalone Mendel, GFS, MapReduce, Bigtable, and Chubby HTML pages |

The twelve newly implemented destinations are Pregel, Colossus, Percolator, MillWheel, TensorFlow, Lambda Architecture, Google Infrastructure Security, Photon/PubSub, Jupiter Rising, Autopilot, Inside Google Datacenters, and SRE Workbook. Dynamo and Paxos Simple now route to model labs instead of their old scaffold configurations. Those old configuration files remain in the repository but are not mounted by `App.jsx`.

## Files

- `src/content/whitepapers.js`: stable IDs, destinations, formats, categories, learning objectives, source URLs, and the old-chapter resolver.
- `src/content/library.js`: display titles in their original chapter order, enriched with paper metadata.
- `src/content/schema.js`: explicit chapter metadata validation. Zod strips unknown fields, so new metadata must be added here as well.
- `src/pages/WhitepaperRack.jsx`: searchable rack with topic and format filters, empty state, reset, and direct links.
- `src/pages/LibraryItem.jsx`: compatibility routing. React destinations use `Navigate`; standalone HTML uses document replacement, not an iframe of the rack.
- `src/pages/simulations/labs/models.js`: pure model state, transitions, and calculations.
- `src/pages/simulations/labs/PaperLab.jsx`: paper-specific controls, tables, visualizations, challenges, and limitations.
- `src/pages/simulations/labs/labs.css`: responsive, theme-aware lab presentation.
- `src/pages/simulations/_shared/PaperSimulationScaffold.jsx`: clearly labeled walkthrough player; stops at the last step and supports direct step selection.
- `src/pages/simulations/_shared/PaperExperienceNav.jsx`: navigation and source context for preserved custom demos.

## Authoring Rules

1. Append a metadata record and matching title; never reorder existing chapter positions. Use a unique stable ID and a real destination.
2. Classify the experience honestly. A graph with highlighted nodes and a fixed sequence is a guided walkthrough, not a model lab.
3. Link the exact original paper when identified. For architecture overviews, standards, textbooks, or related papers, state that relationship in `sourceLabel`. Do not invent paper titles or source URLs.
4. For a new lab, add its ID to `labIds`, define `initialLab` and `reduceLab` behavior, and add a distinct view and lesson in `PaperLab.jsx`. The parameterized route handles lab routing; unknown slugs render an explicit not-found view.
5. Keep transitions deterministic and immutable. Use no random values, wall clocks, hidden network calls, or unbounded autoplay in a teaching model. Make displayed results derive from state, not a canned success message.
6. Include a prediction challenge, a failure or comparison scenario, visible observations, reset, and precise simplifications. Sliders that recompute results do not need artificial step buttons.
7. Use native buttons, labeled controls, visible focus, accessible tables, and text alternatives for graphics. Keep tables locally scrollable instead of overflowing the page.
8. Add invariant tests and verify the new route at desktop and mobile widths. Check that the content schema preserves its metadata.

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
node --test src/pages/simulations/labs/models.test.js
npm run build
```

Tests cover all 52 destinations, old chapter bounds, schema preservation, reset, and the model invariants above. Browser checks should additionally cover combined search/topic/format filters, empty state, direct card navigation, native and HTML old-chapter links, all lab controls and reset, light/dark themes, and narrow screens.

Delivery verification: 24 Node tests pass. All 47 React destinations mounted at 390px and 1440px without document overflow; all five standalone HTML pages rendered. Every new lab's controls changed its displayed state and reset restored the initial view. Lighthouse snapshot audits scored 100 for accessibility, best practices, and SEO on the desktop rack and a dark mobile Pregel lab; these are sampled audits, not certification of every legacy experience. The separate agentic-browsing audit reports a pre-existing `llms.txt` recommendation failure.

## Known Limits

- The 19 remaining scaffold experiences are still guided walkthroughs. Their underlying narratives and fixed diagrams were preserved, not replaced by executable models. The shared shell now makes that distinction visible.
- The 14 pre-existing custom React demos and five HTML experiences have not received a complete scientific-correctness audit. New navigation and metadata do not imply full fidelity to their papers.
- Colossus, security, Lambda Architecture, datacenter foundations, and SRE are explicitly labeled architecture or book companions where appropriate. Photon and Pub/Sub are distinct systems; their companion isolates delivery/dedup concepts rather than claiming a unified implementation.
- New numerical examples are synthetic, not Google/Amazon production parameters or performance measurements. Each lab lists omitted mechanisms near its source link.
- The legacy HTML pages still depend on third-party CDNs for styling or visualization. Mendel's unnecessary `polyfill.io` script was removed; the legacy pages are not offline bundles.
- Publisher DOI pages may return bot challenges to automated HTTP checks. Their titles/DOIs were cross-checked against Crossref; the Google research and other direct source pages were checked for successful responses and matching titles.
- Repository-wide `npm run lint` is currently blocked by the repository's missing ESLint configuration. Production builds succeed with existing sourcemap-reporting warnings in simulation files and an outdated Browserslist database notice.

## Delivery Checklist

- [x] Preserve the original 52 chapter positions and resolve every destination.
- [x] Add distinct metadata, searchable topics/formats, learning objectives, and source labels.
- [x] Implement twelve missing labs and upgrade Dynamo/Paxos Simple to computed models.
- [x] Label remaining walkthrough limitations and improve common navigation.
- [x] Add deterministic invariant and schema regression tests.
- [x] Exercise all 47 React routes and five standalone HTML destinations in the browser.
- [x] Exercise all fourteen lab controls and reset; check narrow-screen overflow.
- [x] Run production compilation; document existing lint/build warnings.
