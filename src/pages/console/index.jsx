import ProjectsPanel from './ProjectsPanel.jsx';
import HomepageVideoPanel from './HomepageVideoPanel.jsx';
import ConfigPanel from './ConfigPanel.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import PrivateFilesPanel from './PrivateFilesPanel.jsx';
import TestimonialsPanel from './TestimonialsPanel.jsx';
import { useEffect } from 'react';
import { fetchJson, getAccessToken, storeAccessToken } from '../../utils/api.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { normalizePassword, readStoredPassword } from '../clientAccessUtils.js';

function ConsoleHome() {
  const { t } = useI18n();

  useEffect(() => {
    const token = getAccessToken();
    if (token) return;
    const password = normalizePassword(readStoredPassword());
    if (!password) return;

    fetchJson('/client-access/unlock', { method: 'POST', data: { password } })
      .then((response) => {
        if (response?.token) storeAccessToken(response.token);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] px-4 pb-20 pt-18 text-zinc-100 md:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050507]/92 px-4 py-4 backdrop-blur md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] tracking-[0.32em] text-white/70">{t('console.eyebrow')}</p>
              <h1 className="mt-3 font-serif text-4xl tracking-[0.08em] text-white md:text-5xl">{t('console.title')}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 md:text-base">{t('console.subtitle')}</p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Workspace</p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <ProjectsPanel filterMode="all" />
          <div className="grid gap-6">
            <HomepageVideoPanel />
            <ConfigPanel />
            <AnalyticsPanel />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <PrivateFilesPanel />
          <TestimonialsPanel />
        </div>
      </section>
    </main>
  );
}

export default ConsoleHome;
