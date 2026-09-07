// Network monitor — wraps the browser's own fetch() so every outgoing
// request this frontend makes is visible and classified as LOCAL (safe,
// same machine / same LAN) or EXTERNAL (would break the air-gap claim).
//
// This can only see requests made from THIS frontend's JS. It cannot see
// the backend, the agent, MCP tool calls, or database queries — those run
// in a separate process and would need their own, independent audit
// (e.g. the backend team logging their own outbound connections). Be
// upfront about that scope if you present this on demo day.
//
// installNetworkMonitor() should be called exactly once, as early as
// possible (main.jsx, before rendering <App />), so it catches the very
// first request — including the login call.

const listeners = new Set();
let log = [];
let idCounter = 0;

// RFC1918 private ranges + localhost + link-local + .local mDNS names.
// Anything NOT matching one of these is treated as "external".
const LOCAL_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./, // link-local
  /^0\.0\.0\.0$/,
  /^::1$/,
  /\.local$/i,
];

function classifyHost(hostname) {
  if (!hostname) return 'local'; // relative URL → same-origin → local
  return LOCAL_HOST_PATTERNS.some((re) => re.test(hostname)) ? 'local' : 'external';
}

function notify() {
  const snapshot = [...log];
  listeners.forEach((fn) => fn(snapshot));
}

export function subscribeNetworkLog(fn) {
  listeners.add(fn);
  fn([...log]); // push current state immediately on subscribe
  return () => listeners.delete(fn);
}

export function getNetworkLogSnapshot() {
  return [...log];
}

let installed = false;

export function installNetworkMonitor() {
  if (installed || typeof window === 'undefined' || !window.fetch) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const [input, init] = args;
    const rawUrl = typeof input === 'string' ? input : input?.url || '';

    let hostname = '';
    try {
      hostname = new URL(rawUrl, window.location.origin).hostname;
    } catch {
      hostname = window.location.hostname;
    }

    const classification = classifyHost(hostname);
    const entry = {
      id: idCounter++,
      url: rawUrl,
      hostname: hostname || window.location.hostname,
      method: (init?.method || 'GET').toUpperCase(),
      classification, // 'local' | 'external'
      status: 'pending',
      time: new Date().toLocaleTimeString(),
    };

    log = [entry, ...log].slice(0, 200); // cap so a long demo doesn't grow unbounded
    notify();

    try {
      const res = await originalFetch(...args);
      log = log.map((e) =>
        e.id === entry.id ? { ...e, status: res.ok ? 'success' : `error ${res.status}` } : e
      );
      notify();
      return res;
    } catch (err) {
      log = log.map((e) => (e.id === entry.id ? { ...e, status: 'failed' } : e));
      notify();
      throw err;
    }
  };
}