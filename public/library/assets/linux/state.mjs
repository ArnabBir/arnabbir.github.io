export const storageKey = 'linux-companion:v1';
export function sanitizeState(value, ids) {
  const empty = { version: 1, completed: [], answers: {}, notes: {} };
  if (!value || value.version !== 1) return empty;
  empty.completed = [...new Set(Array.isArray(value.completed) ? value.completed.filter(id => ids.includes(id)) : [])];
  for (const id of ids) {
    if (typeof value.answers?.[id] === 'boolean') empty.answers[id] = value.answers[id];
    if (typeof value.notes?.[id] === 'string') empty.notes[id] = value.notes[id].slice(0, 4000);
  }
  return empty;
}
export function loadState(storage, ids) {
  try { return sanitizeState(JSON.parse(storage.getItem(storageKey)), ids); } catch { return sanitizeState(null, ids); }
}
export function saveState(storage, state) {
  try { storage.setItem(storageKey, JSON.stringify(state)); return true; } catch { return false; }
}
