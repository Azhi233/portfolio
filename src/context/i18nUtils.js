const STORAGE_KEY = 'site.locale';

export const LOCALES = {
  zh: 'zh',
  en: 'en',
};

export function normalizeLocale(nextLocale) {
  return nextLocale === 'en' ? 'en' : 'zh';
}

export function getInitialLocale() {
  if (typeof window === 'undefined') return LOCALES.zh;
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
}

export function persistLocale(locale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, normalizeLocale(locale));
}
