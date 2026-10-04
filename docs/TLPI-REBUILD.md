# Linux systems programming companion rebuild

## Work log

- [x] Inspect routes, legacy positions, homepage discovery and iframe integration.
- [x] Consult primary references for descriptor ownership, reads, signals, scheduling and TCP.
- [x] Author 64 original lessons and 6 original appendices in one curriculum.
- [x] Generate accessible static reader, navigation, search and coverage crosswalk.
- [x] Implement deterministic teaching models and bounded original C labs.
- [x] Replace homepage carousel with category-first discovery.
- [x] Run content, model, route, build and browser checks.
- [ ] Compile and execute all ten C labs on Linux. No Linux runtime result is claimed.

## Editorial boundary

This is independently written instruction about public Linux and POSIX interfaces. TLPI topic ordering is a compatibility crosswalk, not a source of prose, exercises, solutions or figures. No book full text or PDF is used. Appendix F contains solutions to this companion's own problems only.

## Verification policy

Primary references are Linux man-pages, POSIX Issue 8 (2024), kernel documentation and RFCs. Source reachability and factual review are different checks. The generated source ledger records reachability; successful HTTP requests do not certify every lesson claim. Browser models deliberately omit kernel scheduling, races and hardware behavior. Linux labs must be compiled and run on Linux before claiming Linux runtime verification. The editing host is macOS.

## Implemented architecture

- `src/content/linux/{foundations,processes,ipc-network,appendices}.mjs`: independently authored lessons in stable topic order, in ranges 1-23, 24-42, 43-64, and A-F.
- `src/content/linux/examples.mjs`: 70 distinct reasoning traces. Each includes assumptions, initial state, operation, observation, and tradeoff. These are predictions, not captured executions.
- `src/content/linux/curriculum.mjs`: validates the compact authoring rows and exposes named records. Required fields are title, problem, explanation, contract, pitfall, exercise, assessment question/correct answer/distractor, and primary references. A final optional activity identifies a related lab/model. Source section directories handle man-pages constant pages correctly.
- `src/content/tlpi_nav.json`: immutable compatibility ordering and paths. The book topic labels are a crosswalk, not content sources. Existing PDF-position metadata is not used by the generated reader.
- `scripts/build-linux.mjs`: deterministic static generator. Produces 70 lesson pages, catalog, model bench, lab guide, copied assets and lab files, source ledger, and coverage inventory. `--check` rejects stale generated artifacts without writing.
- `src/content/linux/reader.mjs` and `reader.css`: dependency-free progressive enhancement. Lessons, primary links, catalog and answer explanations are readable without JavaScript. Search, models, assessments and saved state use JavaScript; a load failure leaves the static content available.
- `src/content/linux/models.mjs`: pure, testable transitions. Descriptor ownership, standard SIGUSR1, pipe EOF, ordinary TCP close, weighted shares, PTY line discipline, and readiness.
- `src/content/linux/state.mjs`: versioned state validation, allowlisted unit IDs, bounded notes, deduplicated completion, storage exception handling. Completion and assessment correctness are separate. Cross-tab updates are observed; simultaneous conflicting writes are last-writer-wins. Notes are local, not synchronized or backed up remotely.
- `src/content/linux/labs/`: ten original C sources and `common.h`. `labs.json` supplies exact build/run instructions, expected results, extension exercises and cleanup assumptions.
- `src/content/libraryCategories.js`: shared category slugs and actual unit counts. Homepage priority is System Design, Whitepapers, Search & AI Systems, Systems Programming, Frontend, then Payments & Financial Infrastructure. Rack routing uses the same slug function.

## Compatibility contract

- `/library/index.html` remains the static companion entry point (repository path `public/library/index.html`).
- `/library/chapters/ch01.html` through `ch64.html` and `/library/appendices/a.html` through `f.html` are preserved.
- React wrapper query positions are **one-based**: `/library/tlpi?chapter=1` is chapter 1, `64` is chapter 64, `65` is appendix A, and `70` is appendix F. The original chapter-array order is unchanged. Static index links also accept that one-based query convention.
- `coverage.json` records each legacy query position explicitly. Authored curriculum `position` is an internal zero-based array index, not a public query value.
- Appendix F is clearly labeled as answers to this companion's own problems in both reader and React metadata.
- Same-origin parent theme messages are accepted only from the actual parent window. The React wrapper explicitly identifies this reader as supporting theme messaging.
- Four retired TLPI widget/navigation/style assets were removed after confirming no HTML consumers remained. Other library collections retain their own assets.

## Inventory

| Artifact | Count |
| --- | ---: |
| Original topic chapters | 64 |
| Original appendices | 6 |
| Subject-specific explanations, contracts, pitfalls and exercises | 70 each |
| Worked traces with explicit assumptions | 70 |
| Two-choice assessments with explanations | 70 |
| Deterministic browser models | 7 |
| Original C labs | 10 |
| Unique primary-reference URLs | 173 |
| Generated files | 91 |
| HTML pages in local link inventory | 73 |
| Checked local link/asset/fragment references | 1,279 |

## Correctness boundaries

- Descriptor `FD_CLOEXEC` is per descriptor, while offsets and status flags live on the shared open file description. Ordinary dup clears the new descriptor's close-on-exec flag. Serialized alias writes produce ABCD; a fresh open can overwrite instead.
- Standard signals coalesce while pending. The SIGUSR1 model distinguishes handler, ignore, and default termination. It does not model real-time queues or all signal special cases.
- Zero-size reads do not establish EOF. Pipe EOF requires both drained bytes and no remaining writers; terminal timing and zero-length datagrams have additional meanings.
- TCP TIME_WAIT follows the ordinary active closer, whether client or server. The model excludes loss, resets, simultaneous close and timer expiration.
- Weighted shares are a ratio illustration, not a current Linux scheduler trace. EEVDF eligibility and virtual deadlines are explicitly separate.
- PTY canonical buffering, echo, and ISIG are separate controls. The model assumes an established foreground group and omits detailed editing, byte translations, VMIN/VTIME, control-character echo, and hangup behavior.
- `strace -k` requests user-space stack traces where supported; it does not display the kernel's call stack.
- Readiness is an observation, not a reservation. The edge model intentionally omits the full epoll implementation and teaches draining plus explicit fairness continuation.

## Maintenance commands

```sh
npm run linux:generate
npm run linux:check
npm test
npm run build
npm run linux:test-browser
npm run linux:test-labs # Linux host only; temporary binaries are removed afterward

# Certificate verification is required. Save evidence, then refresh the ledger.
NODE_TLS_REJECT_UNAUTHORIZED=1 node scripts/check-linux-sources.mjs --report
npm run linux:generate
```

Browser checks need Playwright and Chrome. They accept `PLAYWRIGHT_MODULE` for an existing external installation and `PLAYWRIGHT_CHANNEL` to select a browser channel. This rebuild reused cached Playwright without changing dependencies. No subagent dispatch tool was available in this session; implementation and review were performed in the main session.

To extend a lesson, edit its authoring row and corresponding trace, validate the primary API contract, and regenerate. Do not edit the published HTML directly. Keep URLs and chapter order stable. Add focused invariant tests when changing a model. Source reachability reports are maintained in `docs/TLPI-SOURCE-CHECK.json`; only five critical references currently have explicit claim-review notes in the generated ledger. Other references are identified as further primary reading rather than falsely certified.

## Verification record

- Focused suite: 12 passing tests for coverage, links, positional compatibility, model invariants, state validation, and category priority.
- Full JavaScript suite: 63 passing tests. Imported playbook, Frontend Atlas, and both System Design checks pass. Text normalization is checked across the repository.
- Production Vite build passes; artifact check validates 55 emitted assets and references. Existing unrelated simulation source-map diagnostics and an outdated Browserslist-data notice remain.
- Chrome browser checks pass: 70 route responses, static catalog, API search and keyboard focus, incorrect/correct assessment attempts, reload persistence, notes, descriptor/signal/TCP/PTY controls, wrapper query boundaries, theme messaging, homepage category order and rack navigation, 390px overflow checks, denied/corrupt storage, and no-JavaScript lesson reading.
- Source reachability: 173/173 HTTP successes using TLS verification. Three initial constant-page URL failures were corrected from `man2const`/`man3const` to the actual `man2`/`man3` directories.
- Apple clang 17 strict syntax checks pass for descriptors, processes, threads, pipes, mappings, sockets, and PTY sources with `-std=c11 -Wall -Wextra -Werror -pthread -fsyntax-only`.
- Linux-specific signal, epoll and timerfd labs have not been compiled here. None of the ten labs has been runtime-verified on Linux. Docker CLI exists, but its daemon is unavailable. Each lab includes a four-second watchdog plus a documented external five-second Linux `timeout` command.
- No commit, push or deployment performed.
