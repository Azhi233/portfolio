const STORAGE_KEY = 'site.locale';
const REVIEW_KEY = 'site.locale.reviewed';

export const SUPPORTED_LOCALES = ['zh', 'en'];

export function normalizeLocale(nextLocale) {
  return nextLocale === 'en' ? 'en' : 'zh';
}

export function getInitialLocale() {
  if (typeof window === 'undefined') return 'zh';
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
}

export function persistLocale(locale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, normalizeLocale(locale));
}

export function getReviewMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(REVIEW_KEY) === '1';
}

export function setReviewMode(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REVIEW_KEY, enabled ? '1' : '0');
}
