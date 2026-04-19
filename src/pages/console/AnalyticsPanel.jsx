import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';

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
    <Card className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">MODULE</p>
          <h2 className="mt-2 text-xl tracking-[0.08em] text-white">Analytics</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-400">基础项目统计概览，包括公开、隐藏、精选和私密保护状态。</p>
        </div>
        <Badge tone="warning">LIVE DATA</Badge>
      </div>

      {state.loading ? <p className="mt-4 text-sm text-zinc-400">Loading analytics...</p> : null}
      {state.error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl tracking-[0.08em] text-white">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default AnalyticsPanel;
