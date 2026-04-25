import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function AnalyticsPanel() {
  const [state, setState] = useState({ loading: true, error: '', items: [] });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson('/projects');
      setState({ loading: false, error: '', items: Array.isArray(items) ? items : [] });
    } catch (error) {
      setState({ loading: false, error: error.message || 'Failed to load analytics.', items: [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const live = state.items.filter((item) => item.isVisible !== false).length;
    const hidden = state.items.length - live;
    const featured = state.items.filter((item) => item.isFeatured).length;
    const privateProtected = state.items.filter((item) => Boolean(item.accessPassword)).length;
    return [
      ['Total', state.items.length],
      ['Live', live],
      ['Hidden', hidden],
      ['Featured', featured],
      ['Protected', privateProtected],
    ];
  }, [state.items]);

  return (
    <ConsolePanelShell eyebrow="INSIGHTS" title="Analytics" description="基础项目统计概览，包括公开、隐藏、精选和私密保护状态。" badge={{ label: 'LIVE DATA', tone: 'warning' }}>
      {state.loading ? <p className="text-sm text-zinc-400">Loading analytics...</p> : null}
      {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl tracking-[0.08em] text-white">{value}</p>
          </div>
        ))}
      </div>
    </ConsolePanelShell>
  );
}

export default AnalyticsPanel;
