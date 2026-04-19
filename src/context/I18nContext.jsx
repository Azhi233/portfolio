import { createContext, useContext, useMemo, useState } from 'react';
import { messages } from '../i18n/messages.js';
import { getInitialLocale, normalizeLocale, persistLocale } from '../i18n/registry.js';

const I18nContext = createContext(null);

function getNestedMessage(source, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(getInitialLocale);

  const switchLocale = (nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocale(normalized);
    persistLocale(normalized);
  };

  const t = (path, fallback = '') => {
    const dict = messages[locale] || messages.zh;
    const value = getNestedMessage(dict, path);
    return value ?? fallback;
  };

  const value = useMemo(
    () => ({ locale, switchLocale, t }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
