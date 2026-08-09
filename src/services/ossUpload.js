import { API_BASE_URL, resolveAuthToken } from '../utils/api.js';

const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 1000;
const UPLOAD_TIMEOUT_MS = 60 * 60 * 1000;
const SSE_RETRY_DELAY_MS = 1500;

function authHeaders(extra = {}) {
  const token = resolveAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildEventSourceUrl() {
  if (typeof window === 'undefined') return `${API_BASE_URL}/events`;
  const directBase = API_BASE_URL.replace(/\/api$/, '');
  return `${directBase}/api/events`;
}

function openEventSource() {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return null;
  return new EventSource(buildEventSourceUrl());
}

async function fetchTaskStatus(taskId) {
  const response = await fetch(`${API_BASE_URL}/uploads/status/${encodeURIComponent(taskId)}`, { headers: authHeaders() });
  if (!response.ok) return null;
  const result = await response.json();
  return result?.data || null;
}

async function waitForTaskCompletion(taskId, { timeoutMs = UPLOAD_TIMEOUT_MS } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    let finished = false;
    let fallbackStarted = false;
    const eventSource = openEventSource();

    const cleanup = () => {
      finished = true;
      eventSource?.close?.();
    };

    const resolveOnce = (value) => {
      if (finished) return;
      cleanup();
      resolve(value);
    };

    const rejectOnce = (error) => {
      if (finished) return;
      cleanup();
      reject(error);
    };

    const pollFallback = async () => {
      if (fallbackStarted) return;
      fallbackStarted = true;

      while (!finished && Date.now() - startedAt < timeoutMs) {
        const status = await fetchTaskStatus(taskId).catch(() => null);
        if (status?.status === 'completed') {
          resolveOnce(status);
          return;
        }
        if (status?.status === 'error') {
          rejectOnce(new Error(status.message || 'Video transcode failed'));
          return;
        }
        await wait(SSE_RETRY_DELAY_MS);
      }

      rejectOnce(new Error('Video transcode timeout'));
    };

    if (!eventSource) {
      pollFallback();
      return;
    }

    eventSource.addEventListener('video-transcode-completed', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        if (data.taskId === taskId) resolveOnce(data);
      } catch {
        // ignore invalid payload
      }
    });

    eventSource.addEventListener('video-transcode-error', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        if (data.taskId === taskId) rejectOnce(new Error(data.message || 'Video transcode failed'));
      } catch {
        rejectOnce(new Error('Video transcode failed'));
      }
    });

    eventSource.onerror = () => {
      if (finished) return;
      eventSource.close();
      pollFallback();
    };

    setTimeout(() => {
      if (!finished && !fallbackStarted) pollFallback();
    }, 250);
  });
}

async function refreshSignedUrl(path) {
  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Refresh signed url failed: ${response.status} ${detail}`);
  }

  const result = await response.json();
  return result?.data?.url || '';
}

export async function uploadFileToOSS({ file, dir = 'uploads', onProgress }) {
  if (!(file instanceof File)) {
    throw new Error('Invalid file');
  }

  onProgress?.(10);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('dir', dir);
  formData.append('type', 'public');

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  const result = await response.json().catch(() => null);
  const payload = result?.data;

  if (response.status === 202) {
    if (!payload?.taskId) {
      throw new Error('Invalid async upload response');
    }

    onProgress?.(100);

    return {
      taskId: payload.taskId,
      status: payload.status || 'queued',
      fileName: payload.fileName || file.name,
      fileType: payload.fileType || file.type || 'application/octet-stream',
      waitForCompletion: () => waitForTaskCompletion(payload.taskId),
    };
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upload failed: ${response.status} ${detail}`);
  }

  if (!payload?.url) {
    throw new Error('Invalid upload response');
  }

  const expiresInSeconds = Number(payload?.expiresInSeconds || 0);
  const expiresAt = expiresInSeconds > 0 ? Date.now() + expiresInSeconds * 1000 : 0;

  onProgress?.(100);

  return {
    ...payload,
    expiresAt,
    async refreshUrl() {
      if (!payload?.path) return payload.url;
      const nextUrl = await refreshSignedUrl(payload.path);
      if (!nextUrl) throw new Error('Failed to refresh signed url');
      payload.url = nextUrl;
      payload.expiresAt = expiresAt > 0 ? Date.now() + expiresInSeconds * 1000 : 0;
      return nextUrl;
    },
    isExpiringSoon() {
      return expiresAt > 0 && Date.now() >= expiresAt - SIGNED_URL_REFRESH_BUFFER_MS;
    },
  };
}
