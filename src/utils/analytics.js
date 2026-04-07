const ANALYTICS_STORAGE_KEY = 'director.analytics.v1';
const ANALYTICS_SESSION_KEY = 'director.analytics.session';

function readAnalyticsState() {
  if (typeof window === 'undefined') {
    return { pageViews: {}, events: [], sessions: [] };
  }

  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return { pageViews: {}, events: [], sessions: [] };
    const parsed = JSON.parse(raw);
    return {
      pageViews: parsed.pageViews || {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { pageViews: {}, events: [], sessions: [] };
  }
}

function writeAnalyticsState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
}

function getSessionId() {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;

  const id = `sess-${Date.now()}-${Math.round(Math.random() * 100000)}`;
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, id);
  return id;
}

export function trackPageView(path) {
  if (typeof window === 'undefined') return;
  const state = readAnalyticsState();
  const sessionId = getSessionId();

  if (!state.sessions.includes(sessionId)) {
    state.sessions.push(sessionId);
  }

  state.pageViews[path] = (state.pageViews[path] || 0) + 1;
  state.events.push({
    id: `evt-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    type: 'page_view',
    path,
    timestamp: new Date().toISOString(),
    sessionId,
  });

  writeAnalyticsState(state);
}

export function trackEvent(type, payload = {}) {
  if (typeof window === 'undefined') return;
  const state = readAnalyticsState();
  const sessionId = getSessionId();

  if (!state.sessions.includes(sessionId)) {
    state.sessions.push(sessionId);
  }

  state.events.push({
    id: `evt-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    sessionId,
  });

  writeAnalyticsState(state);
}

export function getAnalyticsSnapshot() {
  const state = readAnalyticsState();
  const totalPV = Object.values(state.pageViews).reduce((sum, value) => sum + value, 0);
  const totalUV = state.sessions.length;

  return {
    totalPV,
    totalUV,
    pageViews: state.pageViews,
    events: state.events.slice(-120).reverse(),
  };
}

export function clearAnalytics() {
  writeAnalyticsState({ pageViews: {}, events: [], sessions: [] });
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ANALYTICS_SESSION_KEY);
  }
}
