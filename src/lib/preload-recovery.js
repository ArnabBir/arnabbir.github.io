export const RECOVERY_KEY = 'portfolio:preload-recovery:v1';

// One automatic attempt per tab session, across builds and URLs. Do not clear on mount:
// a successful shell render does not prove that a lazy route is available.
export function createPreloadRecovery(win = window) {
  let pending = false;
  return async function recover() {
    if (pending || win.navigator.onLine === false) return false;
    pending = true;
    let timer;
    try {
      if (win.sessionStorage.getItem(RECOVERY_KEY)) return false;
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 4000);
      const response = await win.fetch('/', { cache: 'no-store', signal: controller.signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return false;
      const html = await response.text();
      const latest = html.match(/<script\b[^>]*\bsrc=["']([^"']*\/assets\/index-[^"']+\.js)["']/i)?.[1];
      const current = win.document.querySelector('script[type="module"][src]')?.getAttribute('src');
      if (!latest || !current || latest === current || win.navigator.onLine === false) return false;
      win.sessionStorage.setItem(RECOVERY_KEY, 'attempted');
      if (win.sessionStorage.getItem(RECOVERY_KEY) !== 'attempted') return false;
      win.location.reload(); // Preserve pathname, query and fragment exactly.
      return true;
    } catch {
      // Offline, blocked storage, failed probe: keep the actionable error UI.
      return false;
    } finally {
      clearTimeout(timer);
      pending = false;
    }
  };
}

export function installPreloadRecovery(win = window) {
  const recover = createPreloadRecovery(win);
  const listener = () => { void recover(); };
  // Let Vite rethrow so React's boundary also handles a failed recovery.
  win.addEventListener('vite:preloadError', listener);
  return () => win.removeEventListener('vite:preloadError', listener);
}
