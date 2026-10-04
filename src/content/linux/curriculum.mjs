import foundations from './foundations.mjs';
import processes from './processes.mjs';
import ipc from './ipc-network.mjs';
import appendices from './appendices.mjs';
import examples from './examples.mjs';

// Positional authoring format is validated here; downstream code uses named fields.
export const schemaVersion = 1;
export const labNames = ['descriptors', 'signals', 'processes', 'threads', 'pipes', 'mappings', 'sockets', 'readiness', 'timers', 'pty'];
export const extraSources = {
  ch01: [['POSIX.1-2024', 'https://pubs.opengroup.org/onlinepubs/9799919799/']],
  ch35: [['Kernel EEVDF design', 'https://docs.kernel.org/scheduler/sched-eevdf.html']],
  ch58: [['RFC 9293 section 3.6: closing a connection', 'https://www.rfc-editor.org/rfc/rfc9293.html#section-3.6']],
  e: [['POSIX.1-2024', 'https://pubs.opengroup.org/onlinepubs/9799919799/'], ['Linux kernel documentation', 'https://docs.kernel.org/']],
};
export function makeCurriculum(nav) {
  const rows = [...foundations, ...processes, ...ipc, ...appendices];
  const routes = [...nav.chapters, ...nav.appendices];
  if (rows.length !== 70 || routes.length !== 70 || examples.length !== 70) throw Error('Expected 64 chapters and 6 appendices');
  return rows.map((row, index) => {
    if (row.length < 10 || row.length > 11 || row.slice(0, 10).some(v => typeof v !== 'string' || !v.trim())) throw Error(`Invalid lesson ${index}`);
    const [title, problem, explanation, contract, pitfall, exercise, question, answer, distractor, references, activity] = row;
    const route = routes[index];
    const id = index < 64 ? `ch${String(index + 1).padStart(2, '0')}` : 'abcdef'[index - 64];
    const sources = references.split(' ').map(label => ({ label, url: `https://man7.org/linux/man-pages/man${label.split('.').at(-1)[0]}/${label}.html` }));
    sources.push(...(extraSources[id] || []).map(([label, url]) => ({ label, url })));
    const [assumptions, before, operation, observation, tradeoff] = examples[index];
    if (examples[index].length !== 5) throw Error(`Invalid worked trace ${id}`);
    return { id, position: index, href: route.href, topic: id === 'f' ? "Answers to this companion's original problems" : route.title, title, problem, explanation, contract, pitfall, exercise,
      assessment: { question, answer, distractor }, sources, activity: activity || null,
      lab: labNames.includes(activity) ? activity : null,
      worked: { assumptions, before, operation, observation, tradeoff } };
  });
}
