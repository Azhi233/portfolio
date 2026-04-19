import { EDIT_MODE_STORAGE_KEY, TOKEN_STORAGE_KEY } from './configStorage.js';

export function readStoredEditMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(EDIT_MODE_STORAGE_KEY) === 'true';
}

export function isTokenPresent() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
}

export function persistAuthToken(token) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(EDIT_MODE_STORAGE_KEY);
}
