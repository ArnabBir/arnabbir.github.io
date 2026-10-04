import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeCurriculum, schemaVersion } from '../src/content/linux/curriculum.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src/content/linux');
const target = path.join(root, 'public/library');
const nav = JSON.parse(await readFile(path.join(root, 'src/content/tlpi_nav.json'), 'utf8'));
const units = makeCurriculum(nav);
const check = process.argv.includes('--check');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let files = 0;
async function emit(relative, content) {
  const file = path.join(target, relative);
  if (check) { if (await readFile(file, 'utf8') !== content) throw Error(`Stale generated file: ${relative}`); }
  else { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, content); }
  files++;
}
const link = (unit, prefix, label = unit.title) => `<a href="${prefix}${unit.href}">${esc(label)}</a>`;
function shell(title, body, prefix, id = '') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title)} | Linux Systems Companion</title><meta name="description" content="Original Linux systems programming lessons with worked traces, API contracts, assessments, and primary references."><link rel="stylesheet" href="${prefix}assets/linux/reader.css"></head>
<body data-unit="${id}"><a class="skip" href="#main">Skip to lesson</a><header><a class="brand" href="${prefix}index.html">LINUX / SYSTEMS COMPANION</a><nav aria-label="Site"><a href="${prefix}index.html#catalog">70 units</a><a href="${prefix}models.html">Model bench</a><a href="${prefix}labs/index.html">C labs</a><button id="theme" type="button">Toggle theme</button></nav></header>
<div class="layout"><aside aria-label="Find a lesson"><label for="search">Search lessons and APIs</label><input id="search" type="search" placeholder="Try mmap, SIGUSR1, TIME_WAIT" aria-describedby="search-help"><p id="search-help" class="small">All words must match. Press / to focus; Escape clears. Use Tab to browse results.</p><p id="search-status" role="status"></p><ul id="search-results"></ul><p id="progress" role="status">Progress is stored on this device.</p><button id="reset-progress" type="button">Reset saved progress</button><p id="storage-status" role="status"></p></aside>
<main id="main" tabindex="-1">${body}</main></div><footer>Independent instruction, not book text, figures, or book exercise solutions. Linux behavior and portability boundaries are stated per lesson. Browser models are abstractions, not kernel executions.</footer><script type="module" src="${prefix}assets/linux/reader.mjs"></script></body></html>\n`;
}
function lesson(unit, i) {
  const prefix = '../'; const w = unit.worked;
  const options = i % 2 ? [[false, unit.assessment.distractor], [true, unit.assessment.answer]] : [[true, unit.assessment.answer], [false, unit.assessment.distractor]];
  return shell(unit.title, `<p class="eyebrow">${i < 64 ? `TOPIC ${i + 1} / 64` : `APPENDIX ${unit.id.toUpperCase()} / F`} · ${esc(unit.topic)}</p><h1>${esc(unit.title)}</h1><p class="lead">${esc(unit.problem)}</p>
<nav class="section-nav" aria-label="On this page"><a href="#idea">Concept</a><a href="#contract">API contract</a><a href="#trace">Worked trace</a><a href="#exercise">Practice</a><a href="#sources">Sources</a></nav>
<section id="idea"><h2>The underlying idea</h2><p>${esc(unit.explanation)}</p></section>
<section id="contract"><h2>Contract and implementation boundary</h2><p>${esc(unit.contract)}</p><p class="source-note">Contract references: ${unit.sources.slice(0, 3).map(s => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}. Check the documented return convention and platform notes before using an interface.</p></section>
<section class="warning"><h2>Where reasoning goes wrong</h2><p>${esc(unit.pitfall)}</p></section>
<section id="trace"><h2>Worked reasoning trace</h2><p><strong>Assumptions:</strong> ${esc(w.assumptions)}</p><ol class="trace"><li><strong>Starting state</strong><p>${esc(w.before)}</p></li><li><strong>Operation</strong><p>${esc(w.operation)}</p></li><li><strong>Expected observation</strong><p>${esc(w.observation)}</p></li></ol><p><strong>Tradeoff:</strong> ${esc(w.tradeoff)}</p><p class="small">This is a hand-authored prediction, not captured runtime output.</p></section>
<section id="exercise"><h2>Original practice problem</h2><p>${esc(unit.exercise)}</p>${unit.lab ? `<p><a href="../labs/index.html#${unit.lab}">Build and run the ${unit.lab} C lab</a> · <a href="../labs/${unit.lab}.c" download>Download source</a></p>` : ''}<p><a href="../models.html">Explore the model bench</a> to distinguish predicted state from observed system behavior.</p><label for="notes">Your prediction and evidence</label><textarea id="notes" rows="5" maxlength="4000" placeholder="State the starting conditions, predict the result, then record evidence and remaining uncertainty."></textarea><p class="small">Notes stay in this browser. Maximum 4,000 characters per unit.</p></section>
<section><h2>Check your understanding</h2><form id="assessment"><fieldset><legend>${esc(unit.assessment.question)}</legend>${options.map(([correct, text], n) => `<label class="answer"><input type="radio" name="answer" value="${correct}" required> <span>${esc(text)}</span></label>`).join('')}<button type="submit">Check answer</button></fieldset></form><p id="feedback" role="status"></p><details><summary>Explain the answer</summary><p>${esc(unit.assessment.answer)}</p><p>${esc(w.observation)}</p></details><button id="complete" type="button" aria-pressed="false">Mark lesson complete</button></section>
<section id="sources"><h2>Primary references and scope</h2><p>The API contract and failure discussion use these references. Linux man-pages describe Linux and libc behavior and identify portability differences; standards and kernel internals are separate layers.</p><ul>${unit.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('')}</ul><p><a href="../sources.json">Source ledger</a>: claim-review notes are distinct from URL reachability. Consult installed manual pages for your deployment version.</p></section>
<nav class="pagination" aria-label="Lesson navigation">${i ? link(units[i - 1], prefix, 'Previous: ' + units[i - 1].title) : '<span></span>'}${i < 69 ? link(units[i + 1], prefix, 'Next: ' + units[i + 1].title) : link(units[0], prefix, 'Return to first lesson')}</nav>`, prefix, unit.id);
}
const catalog = units.map(u => `<li>${link(u, '', `${u.position < 64 ? String(u.position + 1).padStart(2, '0') : u.id.toUpperCase()} / ${u.title}`)}<p>${esc(u.topic)}</p></li>`).join('');
await emit('index.html', shell('Learn the Linux interface', `<p class="eyebrow">A PRIMARY-SOURCE-GROUNDED LEARNING PATH</p><h1>Understand the contract.<br>Predict the machine.</h1><p class="lead">64 original topic lessons and six appendices about the Linux interfaces beneath real software. Follow object ownership, failure returns, and observable state before reaching for a syscall.</p><div class="stats"><span><strong>70</strong> worked traces</span><span><strong>70</strong> assessments</span><span><strong>10</strong> original C labs</span></div><p>${link(units[0], '', 'Start with portability')} · <a href="models.html">Open the model bench</a></p><section><h2>How to study</h2><ol><li>Read the problem and API contract.</li><li>Predict the worked example before examining its observation.</li><li>Try the original exercise, then use the cited primary reference to challenge your answer.</li><li>Record environment details for C labs. Mark completion separately from assessment correctness.</li></ol><p>The ordering is a TLPI topic crosswalk for existing bookmarks. The instruction and problems are original; no book text or book solutions are reproduced.</p><p>Prerequisites: basic C pointers, compilation, and shell use. Linux-specific labs require a Linux environment; the reader itself runs in a browser.</p></section><section id="catalog"><h2>The complete curriculum</h2><ol class="catalog">${catalog}</ol></section>`, ''));
for (const [i, unit] of units.entries()) await emit(unit.href, lesson(unit, i));
await emit('models.html', shell('Model bench', `<p class="eyebrow">PREDICT · CHANGE ONE INPUT · COMPARE</p><h1>Model bench</h1><p class="lead">Seven deterministic teaching models. These expose ownership and state transitions; they do not execute C or simulate a complete Linux kernel.</p><label for="model-kind">Choose a model</label><select id="model-kind"><option value="descriptors">Descriptors and open file descriptions</option><option value="signals">Standard SIGUSR1 delivery</option><option value="pipes">Pipe reads and EOF</option><option value="tcp">TCP active close</option><option value="scheduler">Weighted CPU shares</option><option value="pty">Canonical terminal input</option><option value="readiness">Edge and level readiness</option></select><section id="model"><h2 id="model-title"></h2><p id="model-assumptions"></p><div id="model-controls" class="controls"></div><pre id="model-output" tabindex="0" aria-label="Current model state" aria-live="polite"></pre><p id="model-feedback" role="status"></p><button id="model-reset" type="button">Reset model</button></section><p>Compare with <a href="chapters/ch05.html">descriptor ownership</a>, <a href="chapters/ch20.html">signals</a>, <a href="chapters/ch35.html">scheduling</a>, <a href="chapters/ch44.html">pipes</a>, <a href="chapters/ch58.html">TCP</a>, <a href="chapters/ch63.html">readiness</a>, and <a href="chapters/ch64.html">PTYs</a>.</p>`, ''));
await emit('assets/linux/curriculum.json', JSON.stringify({ schemaVersion, units }, null, 2) + '\n');
for (const file of ['reader.mjs', 'reader.css', 'models.mjs', 'state.mjs']) await emit(`assets/linux/${file}`, await readFile(path.join(source, file), 'utf8'));
for (const file of await readdir(path.join(source, 'labs'))) await emit(`labs/${file}`, await readFile(path.join(source, 'labs', file), 'utf8'));
const labGuide = JSON.parse(await readFile(path.join(source, 'labs.json'), 'utf8'));
await emit('labs/index.html', shell('Original C labs', `<h1>Ten bounded C labs</h1><p class="lead">Small, independently written experiments for Linux. These sources are not book examples. Run as an ordinary user in a private working directory.</p><p>Download <a href="common.h" download>common.h</a> beside the C source. Use a C11 compiler and Linux libc headers. All commands below are Linux commands. A watchdog ends an unexpectedly blocked experiment; timing is not a scheduling guarantee.</p><pre>cc -std=c11 -Wall -Wextra -Werror -O2 -pthread descriptors.c -o descriptors
timeout 5s ./descriptors</pre><p>Replace descriptors with the selected lab name. Exit 0 means its internal checks passed. A nonzero exit or timeout needs investigation; expected observations below are predictions, not a claim of a Linux run. No root, network listeners, or kernel configuration changes are required.</p>${labGuide.map(l => `<section id="${l.id}"><h2>${esc(l.title)}</h2><p>${esc(l.purpose)}</p><p><a href="${l.id}.c" download>Download ${l.id}.c</a> · <a href="common.h" download>Download common.h</a></p><pre>cc -std=c11 -Wall -Wextra -Werror -O2 -pthread ${l.id}.c -o ${l.id}
timeout 5s ./${l.id}</pre><p><strong>Expected:</strong> ${esc(l.expected)}</p><p><strong>Change one condition:</strong> ${esc(l.extension)}</p><p><strong>Cleanup and assumptions:</strong> ${esc(l.scope)}</p></section>`).join('')}<p>Record uname -sr, compiler version, libc/distribution, command, exit code, and observed output. Compare with <a href="../appendices/a.html">the tracing appendix</a>.</p>`, '../'));
const reviewed = {
  'dup.2': 'Reviewed descriptor-local CLOEXEC, shared offset/status, dup3 standardization against man-pages 6.19.',
  'read.2': 'Reviewed short reads, positive-size EOF context, and zero-count reads against man-pages 6.19.',
  'signal.7': 'Reviewed standard coalescing, default SIGUSR1 termination, masks and dispositions against man-pages 6.19.',
  'Kernel EEVDF design': 'Reviewed eligibility and virtual deadlines. Weighted-share illustration is not an EEVDF trace.',
  'RFC 9293 section 3.6: closing a connection': 'Reviewed ordinary active/passive close and TIME_WAIT role independence.',
};
let sourceReport = { results: [] };
try { sourceReport = JSON.parse(await readFile(path.join(root, 'docs/TLPI-SOURCE-CHECK.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sources = [...new Map(units.flatMap(u => u.sources.map(s => [s.url, s]))).values()].map(s => {
  const check = sourceReport.results.find(result => result.url === s.url);
  return { ...s, review: reviewed[s.label] || 'Further primary reading; no individual claim-review assertion recorded.',
    reachability: check ? { checkedAt: sourceReport.checkedAt, status: check.status || check.error, ok: check.ok } : 'Not checked in rebuild',
    units: units.filter(u => u.sources.some(x => x.url === s.url)).map(u => u.id) };
});
await emit('sources.json', JSON.stringify({ policy: 'Reachability does not certify interpretation. URLs are live references, not pinned snapshots.', sources }, null, 2) + '\n');
await emit('coverage.json', JSON.stringify({ schemaVersion, chapters: 64, appendices: 6, assessments: units.length, workedTraces: units.length, labs: labGuide.length, models: 7, units: units.map(u => ({ id: u.id, legacyQueryPosition: u.position + 1, href: u.href, title: u.title, sources: u.sources.length, lab: u.lab })) }, null, 2) + '\n');
console.log(`${check ? 'Verified' : 'Generated'} ${files} Linux companion files; 70 units, 10 labs, 7 models.`);
