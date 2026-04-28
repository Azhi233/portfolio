import { useEffect, useState } from 'react';
import ProjectsPanel from './ProjectsPanel.jsx';
import HomepageVideoPanel from './HomepageVideoPanel.jsx';
import ConfigPanel from './ConfigPanel.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import PrivateFilesPanel from './PrivateFilesPanel.jsx';
import TestimonialsPanel from './TestimonialsPanel.jsx';
import Button from '../../components/Button.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';
import { fetchJson, getAccessToken, storeAccessToken } from '../../utils/api.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { normalizePassword, readStoredPassword } from '../clientAccessUtils.js';

function ConsoleHome() {
  const { t } = useI18n();
  const [accessStatus, setAccessStatus] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setAccessStatus('Access token ready.');
      return;
    }
    const password = normalizePassword(readStoredPassword());
    if (!password) {
      setAccessStatus('No stored client password found.');
      return;
    }

    setAccessStatus('Restoring client access token...');
    fetchJson('/client-access/unlock', { method: 'POST', data: { password } })
      .then((response) => {
        if (response?.token) {
          storeAccessToken(response.token);
          setAccessStatus('Client access token restored.');
          return;
        }
        setAccessStatus('Client access unlock returned no token.');
      })
      .catch((error) => {
        setAccessStatus(error?.message ? `Failed to restore access token: ${error.message}` : 'Failed to restore access token.');
      });
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
              {accessStatus ? <p className="mt-2 text-xs tracking-[0.12em] text-white/55">{accessStatus}</p> : null}
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Workspace</p>
          </div>
        </header>

        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-transparent p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] tracking-[0.32em] text-cyan-200/80">SYNC</p>
              <h2 className="mt-3 text-2xl tracking-[0.08em] text-white md:text-3xl">MinIO 资源同步</h2>
              <p className="mt-3 text-sm leading-7 text-white/75 md:text-base">
                手动扫描 MinIO 中的新增资源，并同步更新后台列表。点击后会检查 `Homepage Video`、`Projects` 和 `Private Files`。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="subtle" onClick={async () => { await fetchJson('/sync/media-assets', { method: 'POST' }); window.location.reload(); }}>
                立即同步
              </Button>
            </div>
          </div>
        </section>

        <ConsolePanelShell
          eyebrow="SYNC DETAILS"
          title="同步说明"
          description="这个模块不会自动轮询，只在你点击按钮时触发。"
          badge={{ label: 'MANUAL SYNC', tone: 'warning' }}
        >
          <p className="text-sm leading-7 text-white/75">
            保持手动触发，避免后台频繁扫描影响性能。同步完成后会自动刷新当前页面，重新拉取最新资源列表。
          </p>
        </ConsolePanelShell>

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
