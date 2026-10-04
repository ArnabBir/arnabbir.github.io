// Deterministic teaching abstractions, not emulators. Each transition is serialized.
export function descriptorInitial() {
  return { fds: { 3: { ofd: 1, cloexec: true } }, ofds: { 1: { offset: 0, append: false } }, bytes: '', next: 4 };
}
export function descriptorStep(state, action) {
  const s = structuredClone(state);
  if (action === 'dup' && s.fds[3]) s.fds[s.next++] = { ofd: s.fds[3].ofd, cloexec: false };
  if (action === 'open') { const id = Math.max(...Object.keys(s.ofds).map(Number), 0) + 1; s.ofds[id] = { offset: 0, append: false }; s.fds[s.next++] = { ofd: id, cloexec: false }; }
  if (action === 'cloexec' && s.fds[3]) s.fds[3].cloexec = !s.fds[3].cloexec;
  if (action === 'append' && s.fds[3]) s.ofds[s.fds[3].ofd].append = !s.ofds[s.fds[3].ofd].append;
  if (action === 'exec') for (const [fd, entry] of Object.entries(s.fds)) if (entry.cloexec) delete s.fds[fd];
  const write = /^write([34])$/.exec(action);
  if (write && s.fds[write[1]]) {
    const ofd = s.ofds[s.fds[write[1]].ofd]; const text = write[1] === '3' ? 'AB' : 'CD';
    const offset = ofd.append ? s.bytes.length : ofd.offset;
    s.bytes = s.bytes.slice(0, offset) + text + s.bytes.slice(offset + text.length); ofd.offset = offset + text.length;
  }
  for (const id of Object.keys(s.ofds)) if (!Object.values(s.fds).some(fd => fd.ofd === Number(id))) delete s.ofds[id];
  return s;
}
export function signalInitial() { return { blocked: true, pending: 0, disposition: 'default', handled: 0, terminated: false }; }
export function signalStep(state, action) {
  const s = { ...state };
  if (s.terminated) return s;
  if (['default', 'handler', 'ignore'].includes(action)) { s.disposition = action; if (action === 'ignore') s.pending = 0; }
  if (action === 'send' && s.disposition !== 'ignore') s.pending = 1;
  if (action === 'unblock') s.blocked = false;
  if (action === 'block') s.blocked = true;
  if (!s.blocked && s.pending) { s.pending = 0; if (s.disposition === 'default') s.terminated = true; if (s.disposition === 'handler') s.handled++; }
  return s;
}
export function pipeRead({ bytes, writers, nonblock = true }, count) {
  if (!Number.isInteger(count) || count < 0) throw Error('Invalid byte count');
  if (count === 0) return { result: 0, meaning: 'Zero request: no EOF conclusion', bytes };
  if (bytes.length) return { result: Math.min(count, bytes.length), meaning: bytes.slice(0, count), bytes: bytes.slice(count) };
  return { result: writers ? (nonblock ? 'EAGAIN' : 'would block') : 0, meaning: writers ? 'A writer still exists' : 'EOF: all writers closed and buffer drained', bytes };
}
export function tcpClose(active = 'client') {
  if (!['client', 'server'].includes(active)) throw Error('Invalid endpoint');
  const passive = active === 'client' ? 'server' : 'client';
  return [
    { [active]: 'ESTABLISHED', [passive]: 'ESTABLISHED', event: 'Start; no loss or simultaneous close' },
    { [active]: 'FIN-WAIT-1', [passive]: 'CLOSE-WAIT', event: `${active} sends FIN; ${passive} receives it and sends ACK` },
    { [active]: 'FIN-WAIT-2', [passive]: 'CLOSE-WAIT', event: `${active} receives ACK of its FIN` },
    { [active]: 'FIN-WAIT-2', [passive]: 'LAST-ACK', event: `${passive} sends FIN` },
    { [active]: 'TIME-WAIT', [passive]: 'LAST-ACK', event: `${active} receives FIN and sends final ACK` },
    { [active]: 'TIME-WAIT', [passive]: 'CLOSED', event: `${passive} receives final ACK; active closer retains TIME_WAIT` },
  ];
}
export function weightedShares(weights) {
  if (!weights.length || weights.some(w => !Number.isFinite(w) || w <= 0)) throw Error('Positive finite weights required');
  const total = weights.reduce((a, b) => a + b, 0); return weights.map(w => w / total);
}
export function terminalInput(buffer, text, canonical = true) {
  const pending = buffer + text;
  const end = canonical ? pending.indexOf('\n') + 1 : pending.length;
  return { readable: pending.slice(0, end), pending: pending.slice(end) };
}
export function ptyStep(state, action) {
  const s = { ...state, readable: '', echoOutput: '', signal: null };
  if (action === 'echo') s.echo = !s.echo;
  if (action === 'isig') s.isig = !s.isig;
  if (action === 'mode') { s.canonical = !s.canonical; s.pending = ''; }
  if (action === 'interrupt' && s.isig) {
    s.pending = ''; s.signal = 'SIGINT to configured foreground process group';
    // Echo of control characters depends on additional terminal flags, omitted.
    return s;
  }
  if (['text', 'newline', 'interrupt'].includes(action)) {
    const text = action === 'text' ? 'a' : action === 'newline' ? '\n' : '\u0003';
    Object.assign(s, terminalInput(s.pending, text, s.canonical));
    if (s.echo && action !== 'interrupt') s.echoOutput = text;
  }
  return s;
}
export function readinessStep(state, action) {
  const s = { ...state };
  if (action === 'arrive') { if (!s.bytes) s.edge = true; s.bytes += 8; }
  if (action === 'poll') { s.observed = s.mode === 'edge' ? s.edge : s.bytes > 0; s.edge = false; }
  if (action === 'read') s.bytes = Math.max(0, s.bytes - 3);
  if (action === 'drain') s.bytes = 0;
  return s;
}
