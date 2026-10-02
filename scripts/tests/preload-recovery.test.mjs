import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPreloadRecovery, RECOVERY_KEY } from '../../src/lib/preload-recovery.js';

function fixture() {
  const storage = new Map();
  const win = {
    navigator: { onLine: true },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { querySelector: () => ({ getAttribute: () => '/assets/index-old.js' }) },
    location: { href: 'https://example.test/library?topic=java#saved', reload: () => { win.reloads++; } },
    reloads: 0,
    fetch: async (_, options) => {
      assert.equal(options.cache, 'no-store');
      return new Response('<script type="module" src="/assets/index-new.js"></script>', { headers: { 'content-type': 'text/html' } });
    },
  };
  return win;
}

test('changed build reloads once across instances and preserves the full address', async () => {
  const win = fixture();
  const address = win.location.href;
  assert.equal(await createPreloadRecovery(win)(), true);
  assert.equal(await createPreloadRecovery(win)(), false);
  assert.equal(win.reloads, 1);
  assert.equal(win.location.href, address);
  assert.equal(win.sessionStorage.getItem(RECOVERY_KEY), 'attempted');
});

for (const mode of ['offline', 'blocked-storage', 'failed-fetch', 'same-build', 'bad-html', '404', 'lost-connection']) {
  test(`${mode} never automatically reloads`, async () => {
    const win = fixture();
    if (mode === 'offline') win.navigator.onLine = false;
    if (mode === 'blocked-storage') win.sessionStorage.setItem = () => { throw new Error('denied'); };
    if (mode === 'failed-fetch') win.fetch = async () => { throw new Error('network'); };
    if (mode === 'same-build') win.document.querySelector = () => ({ getAttribute: () => '/assets/index-new.js' });
    if (mode === 'bad-html') win.fetch = async () => new Response('proxy response');
    if (mode === '404') win.fetch = async () => new Response('', { status: 404 });
    if (mode === 'lost-connection') { const fetch = win.fetch; win.fetch = async (...args) => { win.navigator.onLine = false; return fetch(...args); }; }
    assert.equal(await createPreloadRecovery(win)(), false);
    assert.equal(win.reloads, 0);
  });
}

test('concurrent failures share a bounded attempt', async () => {
  const win = fixture();
  const recover = createPreloadRecovery(win);
  await Promise.all([recover(), recover(), recover()]);
  assert.equal(win.reloads, 1);
});

test('unresponsive probe times out without reloading', async () => {
  const win = fixture();
  win.fetch = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))));
  assert.equal(await createPreloadRecovery(win)(), false);
  assert.equal(win.reloads, 0);
});
