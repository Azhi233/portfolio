const RUNTIME_LOG_KEY = 'director.runtime.logs.v1';
const MAX_LOGS = 80;

function readLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RUNTIME_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RUNTIME_LOG_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
}

export function logRuntimeEvent(type, payload = {}) {
  if (typeof window === 'undefined') return;
  const logs = readLogs();
  logs.push({
    id: `rt-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    href: window.location.href,
    userAgent: window.navigator.userAgent,
  });
  writeLogs(logs);
}

export function getRuntimeLogs() {
  return readLogs().slice().reverse();
}

export function clearRuntimeLogs() {
  writeLogs([]);
}
