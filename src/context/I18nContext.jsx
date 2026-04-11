import { createContext, useContext, useMemo, useState } from 'react';
import { messages } from '../i18n/messages.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return 'zh';
    const saved = window.localStorage.getItem('site.locale');
    return saved === 'en' ? 'en' : 'zh';
  });

  const switchLocale = (nextLocale) => {
    const normalized = nextLocale === 'en' ? 'en' : 'zh';
    setLocale(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('site.locale', normalized);
    }
  };

  const t = (path, fallback = '') => {
    const dict = messages[locale] || messages.zh;
    const value = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
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
