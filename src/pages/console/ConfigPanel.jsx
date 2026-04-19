import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import Modal from '../../components/Modal.jsx';
import ReviewNotice from '../../components/ReviewNotice.jsx';

const editableKeys = ['siteTitle', 'siteSubtitle', 'homeHeadline', 'homeDescription', 'contactEmail', 'contactWeChat'];
const configLabels = {
  siteTitle: 'Site Title',
  siteSubtitle: 'Site Subtitle',
  homeHeadline: 'Home Headline',
  homeDescription: 'Home Description',
  contactEmail: 'Contact Email',
  contactWeChat: 'Contact WeChat',
};

const createEmptyDraft = () => ({
  siteTitle: '',
  siteSubtitle: '',
  homeHeadline: '',
  homeDescription: '',
  contactEmail: '',
  contactWeChat: '',
});

function ConfigPanel() {
  const [state, setState] = useState({ loading: true, saving: false, error: '', data: {}, draft: createEmptyDraft(), isOpen: false });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetchJson('/config');
      setState((prev) => ({ ...prev, loading: false, error: '', data: data || {}, draft: { ...createEmptyDraft(), ...(data || {}) } }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load config.', data: {}, draft: createEmptyDraft() }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const previewRows = useMemo(() => {
    return editableKeys.map((key) => [key, state.draft?.[key] || '']);
  }, [state.draft]);

  const updateDraft = (key, value) => {
    setState((prev) => ({ ...prev, draft: { ...(prev.draft || {}), [key]: value } }));
  };

  const save = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await fetchJson('/config', {
        method: 'POST',
        body: JSON.stringify(state.draft || {}),
      });
      await load();
      setState((prev) => ({ ...prev, isOpen: false, saving: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save config.' }));
    }
  };

  return (
    <>
      <Card className="p-6 md:p-8">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">MODULE</p>
          <h2 className="mt-2 text-xl tracking-[0.08em] text-white">Config</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-400">全局配置与首页文案的读取与编辑入口。</p>
        </div>

        {state.loading ? <p className="mt-4 text-sm text-zinc-400">Loading config...</p> : null}
        {state.error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

        <ReviewNotice className="mt-4" />

        <div className="mt-4 grid gap-3">
          {previewRows.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] tracking-[0.18em] text-zinc-500">{configLabels[key] || key}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{String(value || '—')}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <Button type="button" variant="subtle" onClick={load}>
            REFRESH
          </Button>
          <Button type="button" variant="default" onClick={() => setState((prev) => ({ ...prev, isOpen: true }))}>
            EDIT CONFIG
          </Button>
        </div>
      </Card>

      <Modal open={state.isOpen} title="Edit Config" onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-4">
          {editableKeys.map((key) => (
            <label key={key} className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{configLabels[key] || key}</p>
              {key.includes('Description') || key.includes('Subtitle') ? (
                <Textarea value={state.draft?.[key] || ''} onChange={(event) => updateDraft(key, event.target.value)} />
              ) : (
                <Input value={state.draft?.[key] || ''} onChange={(event) => updateDraft(key, event.target.value)} />
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false }))}>
            CANCEL
          </Button>
          <Button type="button" variant="primary" onClick={save}>
            {state.saving ? 'SAVING...' : 'SAVE CONFIG'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default ConfigPanel;
