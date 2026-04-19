import axios from 'axios';

const fallbackBaseURL = '/api';

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value || value === 'undefined' || value === 'null') return fallbackBaseURL;

  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(value, window.location.origin);
      const isLocalhostBackend = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
      const isSameOrigin = parsed.origin === window.location.origin;
      if (isLocalhostBackend && !isSameOrigin) {
        return fallbackBaseURL;
      }
    } catch {
      // ignore malformed URLs and fall back below
    }
  }

  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || fallbackBaseURL);

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function fetchJson(url, options = {}) {
  const { body, data, headers, ...rest } = options;
  const response = await client.request({
    url,
    data: data !== undefined ? data : body,
    headers,
    ...rest,
  });
  return response.data?.data ?? response.data;
}

export async function uploadFile(file, type = 'public') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return fetchJson('/uploads', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
