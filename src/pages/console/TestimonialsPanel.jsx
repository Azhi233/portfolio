import { useEffect, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function TestimonialsPanel() {
  const [state, setState] = useState({ loading: true, saving: false, error: '', items: [], isOpen: false, draft: { projectName: '', content: '', status: 'approved' } });
  const reviewCount = state.items.length;
  const approvedCount = state.items.filter((item) => item.status === 'approved').length;

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson('/reviews');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load testimonials.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => setState((prev) => ({ ...prev, isOpen: true, draft: { projectName: '', content: '', status: 'approved' } }));

  const save = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await fetchJson('/reviews', { method: 'POST', body: JSON.stringify(state.draft) });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save testimonial.' }));
    }
  };

  const remove = async (reviewId) => {
    if (!reviewId) return;
    if (!window.confirm('Delete this testimonial?')) return;
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await fetchJson(`/reviews/${reviewId}`, { method: 'DELETE' });
      await load();
      setState((prev) => ({ ...prev, saving: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to delete testimonial.' }));
    }
  };

  return (
    <>
      <ConsolePanelShell eyebrow="REVIEWS" title="Testimonials" description="评论与推荐的后台读取入口。" badge={{ label: 'REVIEWS', tone: 'default' }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.16em] text-zinc-500">{reviewCount} ITEM(S) / {approvedCount} APPROVED</p>
            {state.loading ? <p className="mt-2 text-sm text-zinc-400">Loading testimonials...</p> : null}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="default" onClick={openNew}>NEW REVIEW</Button>
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          </div>
        </div>

        {state.error ? <p className="py-2 text-sm text-rose-300">{state.error}</p> : null}

        <div className="mt-4 grid gap-2">
          {state.items.length === 0 ? <p className="text-sm text-zinc-500">No testimonials yet.</p> : null}
          {state.items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 border-b border-white/10 py-3">
              <div>
                <p className="text-sm tracking-[0.08em] text-white">{item.projectName || 'Review'}</p>
                <p className="mt-1 text-sm text-zinc-400">{item.content || item.message || 'No content'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{item.status || 'pending'}</Badge>
                <Button type="button" variant="default" onClick={() => remove(item.id)}>DELETE</Button>
              </div>
            </div>
          ))}
        </div>
      </ConsolePanelShell>

      <Modal open={state.isOpen} title="New Testimonial" onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-4">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Project Name</p>
            <Input value={state.draft.projectName} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, projectName: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Status</p>
            <Input value={state.draft.status} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, status: event.target.value } }))} placeholder="approved / pending / rejected" />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Content</p>
            <Textarea value={state.draft.content} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, content: event.target.value } }))} />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false }))}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={save}>{state.saving ? 'SAVING...' : 'SAVE REVIEW'}</Button>
        </div>
      </Modal>
    </>
  );
}

export default TestimonialsPanel;
