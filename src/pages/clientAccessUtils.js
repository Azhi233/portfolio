export const ACCESS_PASSWORD_KEY = 'client-access-password';

export function normalizePassword(value) {
  return String(value || '').trim();
}

export function readStoredPassword() {
  try {
    return window.sessionStorage.getItem(ACCESS_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

export function storePassword(password) {
  try {
    window.sessionStorage.setItem(ACCESS_PASSWORD_KEY, password);
  } catch {
    // ignore storage errors
  }
}
