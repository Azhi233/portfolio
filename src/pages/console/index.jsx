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
  const [syncState, setSyncState] = useState({ status: 'idle', message: '' });

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <p className="text-[11px] tracking-[0.32em] text-cyan-200/80">SYNC</p>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] tracking-[0.18em] text-cyan-100/80">MANUAL</span>
              </div>
              <h2 className="text-2xl tracking-[0.08em] text-white md:text-3xl">MinIO 资源同步</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                点击后会扫描 `Homepage Video`、`Projects` 和 `Private Files`，把新增资源同步更新到后台列表。
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button
                type="button"
                variant="subtle"
                onClick={async () => {
                  setSyncState({ status: 'loading', message: '同步中，请稍候...' });
                  try {
                    const result = await fetchJson('/sync/media-assets', { method: 'POST' });
                    const scanned = Number(result?.scanned || 0);
                    const upserted = Number(result?.upserted || 0);
                    setSyncState({ status: 'success', message: `同步成功：扫描 ${scanned} 项，更新 ${upserted} 项，正在刷新页面...` });
                    window.location.reload();
                  } catch (error) {
                    setSyncState({ status: 'error', message: error?.message || '同步失败，请稍后重试。' });
                  }
                }}
              >
                立即同步
              </Button>
            </div>
          </div>
          {syncState.status !== 'idle' ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${syncState.status === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : syncState.status === 'error' ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50'}`}>
              {syncState.message}
            </div>
          ) : null}
        </section>

        <ConsolePanelShell
          eyebrow="SYNC DETAILS"
          title="同步说明"
          description="保持手动触发，避免后台频繁扫描影响性能。"
          badge={{ label: 'MANUAL SYNC', tone: 'warning' }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] tracking-[0.18em] text-white/55">范围</p>
              <p className="mt-2 text-sm text-white/85">扫描 `Homepage Video`、`Projects`、`Private Files`。</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] tracking-[0.18em] text-white/55">方式</p>
              <p className="mt-2 text-sm text-white/85">只在点击按钮时触发，不后台轮询。</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] tracking-[0.18em] text-white/55">结果</p>
              <p className="mt-2 text-sm text-white/85">同步后自动刷新页面，拉取最新资源。</p>
            </div>
          </div>
        </ConsolePanelShell>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
            <ProjectsPanel filterMode="all" />
          </div>
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
              <HomepageVideoPanel />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
                <ConfigPanel />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
                <AnalyticsPanel />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
            <PrivateFilesPanel />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.03)]">
            <TestimonialsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}

export default ConsoleHome;
