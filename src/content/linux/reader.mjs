import { loadState, saveState, sanitizeState, storageKey } from './state.mjs';
import { descriptorInitial, descriptorStep, signalInitial, signalStep, pipeRead, tcpClose, weightedShares, ptyStep, readinessStep } from './models.mjs';

const $ = id => document.getElementById(id);
const base = new URL('../../', import.meta.url);
let storage;
try { storage = window.localStorage; } catch { /* Sandboxed/private browsing: memory only. */ }
const theme = value => { if (['light', 'dark'].includes(value)) document.documentElement.dataset.theme = value; };
theme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'THEME_CHANGE') theme(event.data.theme);
});
$('theme').addEventListener('click', () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

async function init() {
  const response = await fetch(new URL('assets/linux/curriculum.json', base));
  if (!response.ok) throw Error('Curriculum unavailable');
  const { units } = await response.json();
  const ids = units.map(u => u.id);
  const queryPosition = new URLSearchParams(location.search).get('chapter');
  if (!document.body.dataset.unit && location.pathname.endsWith('/index.html') && /^\d+$/.test(queryPosition || '')) {
    const target = units[Number(queryPosition) - 1];
    if (target) { location.replace(new URL(target.href, base).href); return; }
  }
  let state = loadState(storage, ids);
  const id = document.body.dataset.unit;
  const unit = units.find(u => u.id === id);
  const update = () => {
    $('progress').textContent = `${state.completed.length} of 70 units completed; ${Object.values(state.answers).filter(Boolean).length} assessments currently correct.`;
    if ($('complete')) {
      const complete = state.completed.includes(id);
      $('complete').setAttribute('aria-pressed', String(complete));
      $('complete').textContent = complete ? 'Completed: mark incomplete' : 'Mark lesson complete';
    }
  };
  const persist = () => {
    $('storage-status').textContent = saveState(storage, state) ? 'Saved on this device.' : 'Storage unavailable or full. Changes last only for this page session.';
    update();
  };
  if (!storage) $('storage-status').textContent = 'Storage unavailable. Progress remains in memory for this page session.';
  const search = () => {
    const words = $('search').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    document.body.dataset.searching = String(words.length > 0);
    const found = units.filter(u => words.every(word => JSON.stringify(u).toLowerCase().includes(word)));
    $('search-status').textContent = `${found.length} matching units`;
    const fragment = document.createDocumentFragment();
    for (const u of found) {
      const li = document.createElement('li'); const a = document.createElement('a');
      a.href = new URL(u.href, base).href; a.textContent = `${u.position < 64 ? u.position + 1 : u.id.toUpperCase()}. ${u.title}`;
      if (u.id === id) a.setAttribute('aria-current', 'page');
      li.append(a); fragment.append(li);
    }
    $('search-results').replaceChildren(fragment);
  };
  $('search').addEventListener('input', search);
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    const editing = event.target.matches('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !editing) { event.preventDefault(); $('search').focus(); }
    if (event.key === 'Escape' && event.target === $('search')) { $('search').value = ''; search(); }
  });
  $('reset-progress').addEventListener('click', () => {
    if (!window.confirm('Clear this companion\'s completion, answers, and notes on this device?')) return;
    state = sanitizeState(null, ids); if ($('notes')) $('notes').value = ''; if ($('feedback')) $('feedback').textContent = '';
    $('assessment')?.reset(); persist();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    state = loadState(storage, ids); update();
    if ($('notes') && document.activeElement !== $('notes')) $('notes').value = state.notes[id] || '';
  });
  if (unit) {
    $('notes').value = state.notes[id] || '';
    $('notes').addEventListener('input', () => { state.notes[id] = $('notes').value; persist(); });
    $('complete').addEventListener('click', () => {
      state.completed = state.completed.includes(id) ? state.completed.filter(x => x !== id) : [...state.completed, id]; persist();
    });
    $('assessment').addEventListener('submit', event => {
      event.preventDefault(); const selected = new FormData(event.target).get('answer');
      if (selected === null) return;
      const correct = selected === 'true'; state.answers[id] = correct;
      $('feedback').textContent = `${correct ? 'Correct.' : 'Try again.'} ${unit.assessment.answer}`; persist();
    });
    if (id in state.answers) $('feedback').textContent = `Saved attempt: ${state.answers[id] ? 'correct' : 'needs review'}. You can answer again.`;
  }
  update(); search();
}
init().catch(() => { $('search-status').textContent = 'Interactive search and progress could not load. The complete lessons and catalog links remain available.'; });

if ($('model-kind')) {
  let kind, state;
  const specs = {
    descriptors: ['Descriptor ownership', 'Serialized successful writes to one regular file. Descriptor numbers start at 3 for illustration; no concurrent writes, allocation failures, holes, or dup2 replacement. dup shares offset and O_APPEND, but not CLOEXEC.', [['dup','dup fd 3'],['open','Fresh open of same file'],['cloexec','Toggle fd 3 CLOEXEC'],['append','Toggle shared O_APPEND via fd 3'],['write3','Write AB via fd 3'],['write4','Write CD via fd 4'],['exec','Successful exec']]],
    signals: ['One pending standard SIGUSR1', 'Single-thread illustration; initially blocked, default disposition terminates. Send repeatedly while blocked, install a handler, then unblock. Real-time queues and SIGCONT special effects are outside this model.', [['send','Generate SIGUSR1'],['handler','Install handler'],['default','Default disposition'],['ignore','Ignore SIGUSR1'],['block','Block'],['unblock','Unblock']]],
    pipes: ['Buffered bytes before EOF', 'Nonblocking pipe, initially XYZ and one writer. All calls succeed unless they would block. Zero-count reads provide no EOF evidence. No competing reader or datagrams.', [['read','Read 2 bytes'],['zero','Read zero bytes'],['close','Close final writer']]],
    tcp: ['Which endpoint owns TIME_WAIT?', 'Ordinary established TCP close; no packet loss, simultaneous close, reset, or elapsed TIME_WAIT timer. Changing the active closer resets the trace.', [['next','Next transition'],['swap','Swap active closer']]],
    scheduler: ['Weights, not a scheduler trace', 'One CPU; two continuously runnable ordinary tasks in the same scheduling group. Shares approximate long-run ratios, not EEVDF virtual deadlines, latency, cgroup quotas, or execution order.', [['equal','Equal weights'],['unequal','Weights 1024 and 335']]],
    pty: ['The slave has a line discipline', 'Input written at the master becomes slave input; echo is separate master-visible output. Assume a configured foreground group, Ctrl-C as VINTR, and NOFLSH clear. Canonical mode holds incomplete lines; simplified noncanonical mode returns available bytes. VMIN/VTIME, control-character echo, translations, editing, and hangup are omitted.', [['text','Type a at master'],['newline','Type newline at master'],['interrupt','Type Ctrl-C at master'],['echo','Toggle ECHO'],['isig','Toggle ISIG'],['mode','Toggle canonical mode (clears input)']]],
    readiness: ['A notification is not a reservation', 'One reader; each arrival adds 8 bytes. Edge flag approximates a not-ready to ready transition, not the full epoll implementation. No new arrivals after partial read means no guaranteed new edge. Real code uses nonblocking I/O and drains to EAGAIN.', [['arrive','Arrive: 8 bytes'],['poll','Observe readiness'],['read','Read up to 3 bytes'],['drain','Drain buffer'],['mode','Switch edge/level (resets)']]],
  };
  function initial() {
    if (kind === 'descriptors') return descriptorInitial();
    if (kind === 'signals') return signalInitial();
    if (kind === 'pipes') return { bytes: 'XYZ', writers: 1, nonblock: true };
    if (kind === 'tcp') return { active: 'client', step: 0 };
    if (kind === 'scheduler') return { weights: [1024, 335] };
    if (kind === 'pty') return { pending: '', readable: '', canonical: true, echo: true, isig: true, echoOutput: '', signal: null };
    return { bytes: 0, edge: false, mode: 'edge', observed: false };
  }
  function render() {
    let visible = state;
    if (kind === 'tcp') visible = { activeCloser: state.active, ...tcpClose(state.active)[state.step] };
    if (kind === 'scheduler') visible = { weights: state.weights, approximatePercent: weightedShares(state.weights).map(n => (n * 100).toFixed(2)) };
    $('model-output').textContent = JSON.stringify(visible, null, 2);
  }
  function act(action) {
    let feedback = '';
    if (kind === 'descriptors') {
      if ((action.startsWith('write') && !state.fds[action.slice(5)]) || (['dup','cloexec','append'].includes(action) && !state.fds[3])) feedback = 'EBADF: descriptor is closed in this model.';
      else state = descriptorStep(state, action);
    }
    if (kind === 'signals') state = signalStep(state, action);
    if (kind === 'pipes') {
      if (action === 'close') state.writers = 0;
      else { const result = pipeRead(state, action === 'zero' ? 0 : 2); state.bytes = result.bytes; feedback = `${result.result}: ${result.meaning}`; }
    }
    if (kind === 'tcp') { if (action === 'swap') state = { active: state.active === 'client' ? 'server' : 'client', step: 0 }; else state.step = Math.min(5, state.step + 1); }
    if (kind === 'scheduler') state.weights = action === 'equal' ? [1024,1024] : [1024,335];
    if (kind === 'pty') state = ptyStep(state, action);
    if (kind === 'readiness') { if (action === 'mode') state = { bytes: 0, edge: false, observed: false, mode: state.mode === 'edge' ? 'level' : 'edge' }; else state = readinessStep(state, action); }
    $('model-feedback').textContent = feedback; render();
  }
  function reset() {
    kind = $('model-kind').value; state = initial();
    const [title, assumptions, actions] = specs[kind];
    $('model-title').textContent = title; $('model-assumptions').textContent = assumptions;
    $('model-controls').replaceChildren(...actions.map(([action, label]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => act(action)); return b; }));
    $('model-feedback').textContent = ''; render();
  }
  $('model-kind').addEventListener('change', reset); $('model-reset').addEventListener('click', reset); reset();
}
