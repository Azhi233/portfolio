import axios from 'axios';
import { getStoredToken } from '../context/configAuth.js';

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

function rewriteMinioUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const localMinioMatch = trimmed.match(/^https?:\/\/[^/]+:9000(\/.*)$/i);
  if (localMinioMatch) {
    return `${window.location.origin}${encodeURI(localMinioMatch[1])}`;
  }

  return trimmed;
}

export function resolveResourceUrl(url) {
  const value = rewriteMinioUrl(url);
  if (!value) return '';
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('/api/')) return value;
  if (value.startsWith('/private-docs/') || value.startsWith('/public-assets/')) {
    return `${window.location.origin}${encodeURI(value)}`;
  }
  if (value.startsWith('/')) return `${API_ORIGIN}${encodeURI(value)}`;
  return `${API_ORIGIN}/${encodeURI(value)}`;
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

/** 解析优先凭证:管理端 JWT(localStorage)优先,客户 token(sessionStorage)兑底 */
export function resolveAuthToken() {
  const adminToken = typeof window === 'undefined' ? '' : getStoredToken();
  return adminToken || readAccessToken();
}

export async function fetchJson(url, options = {}) {
  const { body, data, headers, auth = 'auto', ...rest } = options;
  const requestData = data !== undefined ? data : body;
  const isFormData = typeof FormData !== 'undefined' && requestData instanceof FormData;
  // auto:管理端 JWT 优先,客户 token 兑底(控制台面板的写操作由此自动携带 admin 凭证)
  const adminToken = typeof window === 'undefined' ? '' : getStoredToken();
  const useAdmin = auth === 'admin' || (auth === 'auto' && Boolean(adminToken));
  const token = useAdmin ? adminToken : readAccessToken();

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

export async function uploadFile(file, type = 'public', onUploadProgress, extraFields = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  Object.entries(extraFields || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  return fetchJson('/uploads', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
}
