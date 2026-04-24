import axios from 'axios';

const fallbackBaseURL = '/api';

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value || value === 'undefined' || value === 'null') return fallbackBaseURL;

  try {
    return value.replace(/\/+$/, '');
  } catch {
    return fallbackBaseURL;
  }
}

function getWindowOrigin() {
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || fallbackBaseURL);
const API_ORIGIN = API_BASE_URL.startsWith('/') ? getWindowOrigin() : (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return getWindowOrigin();
  }
})();

export function resolveResourceUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('/api/')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

const ACCESS_TOKEN_KEY = 'client-access-token';

function readAccessToken() {
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function storeAccessToken(token) {
  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, String(token || ''));
  } catch {
    // ignore storage errors
  }
}

export function clearAccessToken() {
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getAccessToken() {
  return readAccessToken();
}

export async function fetchJson(url, options = {}) {
  const { body, data, headers, ...rest } = options;
  const requestData = data !== undefined ? data : body;
  const isFormData = typeof FormData !== 'undefined' && requestData instanceof FormData;
  const token = readAccessToken();

  const response = await client.request({
    url,
    data: requestData,
    headers: {
      ...(isFormData ? {} : headers),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
  });
  return response.data?.data ?? response.data;
}

export async function uploadFile(file, type = 'public', onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return fetchJson('/uploads', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
}
