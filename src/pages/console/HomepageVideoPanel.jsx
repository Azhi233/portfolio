import { useEffect, useState } from 'react';
import { fetchJson, uploadFile } from '../../utils/api.js';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

const createDraft = () => ({
  homeVideoTitle: '',
  homeVideoUrl: '',
});

export default function HomepageVideoPanel() {
  const [state, setState] = useState({ loading: true, saving: false, uploading: false, error: '', draft: createDraft() });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const config = await fetchJson('/config');
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '',
        draft: {
          homeVideoTitle: config?.homeVideoTitle || '',
          homeVideoUrl: config?.homeVideoUrl || '',
        },
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load homepage video.' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateDraft = (key, value) => setState((prev) => ({ ...prev, draft: { ...(prev.draft || {}), [key]: value } }));

  const uploadHomeVideo = async (file) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, error: '' }));
    try {
      const result = await uploadFile(file, 'public');
      setState((prev) => ({
        ...prev,
        uploading: false,
        draft: {
          ...(prev.draft || {}),
          homeVideoUrl: result?.url || '',
          homeVideoTitle: file.name || 'Homepage video',
        },
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, uploading: false, error: error.message || 'Failed to upload homepage video.' }));
    }
  };

  const save = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await fetchJson('/config', { method: 'POST', body: JSON.stringify(state.draft || {}) });
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save homepage video.' }));
      return;
    }
    setState((prev) => ({ ...prev, saving: false }));
  };

  const clear = () => setState((prev) => ({ ...prev, draft: createDraft() }));

  return (
    <ConsolePanelShell
      eyebrow="HOMEPAGE"
      title="Homepage Video"
      description="单独管理首页欢迎语下方的循环视频。"
      badge={{ label: 'HOME HERO', tone: 'warning' }}
      footer={(
        <div className="flex gap-3">
          <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          <Button type="button" variant="subtle" onClick={clear}>CLEAR</Button>
          <Button type="button" variant="primary" onClick={save}>{state.saving ? 'SAVING...' : 'SAVE'}</Button>
        </div>
      )}
    >
      {state.loading ? <p className="text-sm text-white/75">Loading homepage video...</p> : null}
      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      <div className="grid gap-4">
        <MediaPicker
          label="Upload Homepage Video"
          accept="video/*"
          onPick={uploadHomeVideo}
          value={state.draft?.homeVideoUrl}
          uploading={state.uploading}
          helperText="Upload the homepage hero video here."
        />
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Homepage Video Title</p>
          <Input value={state.draft?.homeVideoTitle || ''} onChange={(event) => updateDraft('homeVideoTitle', event.target.value)} />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Homepage Video URL</p>
          <Input value={state.draft?.homeVideoUrl || ''} onChange={(event) => updateDraft('homeVideoUrl', event.target.value)} />
        </label>
      </div>
    </ConsolePanelShell>
  );
}
