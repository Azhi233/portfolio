import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function AnalyticsPanel() {
  const [state, setState] = useState({ loading: true, error: '', items: [], isOpen: false });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson('/projects');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load analytics.', items: [] }));
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
    <>
      <ConsolePanelShell
        eyebrow="INSIGHTS"
        title="Analytics"
        description="项目状态摘要。"
        badge={{ label: 'LIVE DATA', tone: 'warning' }}
        footer={(
          <div className="flex gap-3">
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
            <Button type="button" variant="default" onClick={() => setState((prev) => ({ ...prev, isOpen: true }))}>VIEW STATS</Button>
          </div>
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            {state.loading ? <p className="text-sm text-white/70">Loading analytics...</p> : null}
            {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
            {!state.loading && !state.error ? <p className="text-sm text-white/70">Live project counts update from the backend.</p> : null}
          </div>
          <Badge tone="warning">SUMMARY</Badge>
        </div>
      </ConsolePanelShell>

      <Modal open={state.isOpen} title="Analytics" onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-2 sm:grid-cols-2">
          {stats.map(([label, value]) => (
            <div key={label} className="border-b border-white/10 py-3">
              <p className="text-[11px] tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl tracking-[0.08em] text-white">{value}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default AnalyticsPanel;
