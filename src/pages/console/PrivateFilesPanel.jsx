import { useEffect, useMemo, useState } from 'react';
import { fetchJson, uploadFile } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function PrivateFilesPanel() {
  const [state, setState] = useState({ loading: true, saving: false, uploading: false, error: '', items: [], selectedProject: null, isOpen: false, draft: { label: '', name: '', url: '', type: 'zip', enabled: true, sortOrder: 0 } });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const projects = await fetchJson('/projects');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(projects) ? projects : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load private files.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => state.items.map((project) => ({ id: project.id, title: project.title, count: Array.isArray(project.privateFiles) ? project.privateFiles.filter((item) => item?.enabled !== false).length : 0 })).filter((item) => item.count > 0), [state.items]);
  const totalFiles = rows.reduce((sum, item) => sum + item.count, 0);

  const openEditor = (project) => {
    setState((prev) => ({ ...prev, selectedProject: project, isOpen: true, draft: { label: '', name: '', url: '', type: 'zip', enabled: true, sortOrder: 0 } }));
  };

  const addFile = async () => {
    if (!state.selectedProject) return;
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const currentFiles = Array.isArray(state.selectedProject.privateFiles) ? state.selectedProject.privateFiles : [];
      const nextFiles = [...currentFiles, { id: crypto.randomUUID(), ...state.draft }];
      await fetchJson(`/projects/${state.selectedProject.id}`, { method: 'PUT', body: JSON.stringify({ ...state.selectedProject, privateFiles: nextFiles }) });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false, selectedProject: null }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save private file.' }));
    }
  };

  const uploadPrivateFile = async (file) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, error: '' }));
    try {
      const result = await uploadFile(file, 'private');
      setState((prev) => ({ ...prev, uploading: false, draft: { ...prev.draft, url: result.url, name: file.name, type: file.type || prev.draft.type } }));
    } catch (error) {
      setState((prev) => ({ ...prev, uploading: false, error: error.message || 'Failed to upload private file.' }));
    }
  };

  return (
    <>
      <ConsolePanelShell eyebrow="DELIVERY" title="Private Files" description="私密交付文件的项目分布。" badge={{ label: 'DELIVERY', tone: 'success' }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.16em] text-zinc-500">{rows.length} PROJECT(S) / {totalFiles} FILE(S)</p>
            {state.loading ? <p className="mt-2 text-sm text-zinc-400">Loading private files...</p> : null}
          </div>
          <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
        </div>

        {state.error ? <p className="py-2 text-sm text-rose-300">{state.error}</p> : null}

        <div className="mt-4 grid gap-2">
          {rows.length === 0 ? <p className="text-sm text-zinc-500">No private files yet.</p> : null}
          {rows.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
              <div>
                <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{item.count} private files</p>
              </div>
              <Button type="button" variant="subtle" onClick={() => openEditor(state.items.find((project) => project.id === item.id))}>ADD FILE</Button>
            </div>
          ))}
        </div>
      </ConsolePanelShell>

      <Modal open={state.isOpen} title="Add Private File" onClose={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null }))}>
        <div className="grid gap-4">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Label</p>
            <Input value={state.draft.label} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, label: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Name</p>
            <Input value={state.draft.name} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, name: event.target.value } }))} />
          </label>
          <MediaPicker label="Upload File" accept="*/*" value={state.draft.url} uploading={state.uploading} helperText="Uploads to MinIO and stores the returned URL." onPick={(file) => uploadPrivateFile(file)} />
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">URL</p>
            <Input value={state.draft.url} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, url: event.target.value } }))} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null }))}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={addFile}>{state.saving ? 'SAVING...' : 'SAVE FILE'}</Button>
        </div>
      </Modal>
    </>
  );
}

export default PrivateFilesPanel;
