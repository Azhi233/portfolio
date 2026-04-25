import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import Modal from '../../components/Modal.jsx';
import ReviewNotice from '../../components/ReviewNotice.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

const editableKeys = ['siteTitle', 'siteSubtitle', 'homeHeadline', 'homeDescription', 'contactEmail', 'contactWeChat', 'featuredImagesTitle', 'featuredImagesSubtitle', 'featuredImagesText'];
const configLabels = {
  siteTitle: 'Site Title',
  siteSubtitle: 'Site Subtitle',
  homeHeadline: 'Home Headline',
  homeDescription: 'Home Description',
  contactEmail: 'Contact Email',
  contactWeChat: 'Contact WeChat',
  featuredImagesTitle: 'Featured Images Title',
  featuredImagesSubtitle: 'Featured Images Subtitle',
  featuredImagesText: 'Featured Images URLs',
};

const createEmptyDraft = () => ({
  siteTitle: '',
  siteSubtitle: '',
  homeHeadline: '',
  homeDescription: '',
  contactEmail: '',
  contactWeChat: '',
  featuredImagesTitle: '',
  featuredImagesSubtitle: '',
  featuredImagesText: '',
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

  const previewRows = useMemo(() => editableKeys.map((key) => [key, state.draft?.[key] || '']), [state.draft]);
  const updateDraft = (key, value) => setState((prev) => ({ ...prev, draft: { ...(prev.draft || {}), [key]: value } }));

  const save = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await fetchJson('/config', { method: 'POST', body: JSON.stringify(state.draft || {}) });
      await load();
      setState((prev) => ({ ...prev, isOpen: false, saving: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save config.' }));
    }
  };

  return (
    <>
      <ConsolePanelShell
        eyebrow="SYSTEM"
        title="Config"
        description="全局配置与首页文案的读取与编辑入口。"
        badge={{ label: 'SITE WIDE', tone: 'default' }}
        footer={(
          <div className="flex gap-3">
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
            <Button type="button" variant="default" onClick={() => setState((prev) => ({ ...prev, isOpen: true }))}>EDIT CONFIG</Button>
          </div>
        )}
      >
        {state.loading ? <p className="text-sm text-zinc-400">Loading config...</p> : null}
        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        {!state.loading && !state.error ? <p className="text-sm text-zinc-500">Current site text and homepage copy are stored in the backend.</p> : null}
      </ConsolePanelShell>

      <Modal open={state.isOpen} title="Edit Config" onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-5">
          <ReviewNotice />
          {previewRows.map(([key, value]) => (
            <div key={key} className="border-b border-white/10 pb-4">
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{configLabels[key] || key}</p>
                {key.includes('Description') || key.includes('Subtitle') ? (
                  <Textarea value={value} onChange={(event) => updateDraft(key, event.target.value)} />
                ) : (
                  <Input value={value} onChange={(event) => updateDraft(key, event.target.value)} />
                )}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false }))}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={save}>{state.saving ? 'SAVING...' : 'SAVE CONFIG'}</Button>
        </div>
      </Modal>
    </>
  );
}

export default ConfigPanel;
