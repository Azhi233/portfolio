import { useEffect, useMemo, useState } from 'react';
import { fetchJson, uploadFile } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function createDraft(file = {}) {
  return {
    label: file?.label || '',
    name: file?.name || '',
    url: file?.url || '',
    type: file?.type || 'zip',
    enabled: file?.enabled !== false,
    sortOrder: file?.sortOrder || 0,
  };
}

export default function PrivateFilesPanel() {
  const [state, setState] = useState({ loading: true, saving: false, uploading: false, error: '', items: [], draft: createDraft(), uploadStage: 'idle', uploadStatus: '', uploadError: '', isOpen: false, selectedProject: null, selectedFile: null });
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const projects = await fetchJson('/projects');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(projects) ? projects : [] }));
    } catch (error) {
      const message = error?.message || 'Failed to load private files.';
      setState((prev) => ({ ...prev, loading: false, error: /502/.test(message) ? '' : message, items: [] }));
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => state.items
    .map((project) => ({ id: project.id, title: project.title, category: project.category || project.title || '默认分类', project, files: Array.isArray(project.privateFiles) ? project.privateFiles.filter((item) => item?.enabled !== false) : [] }))
    .filter((item) => item.files.length > 0), [state.items]);

  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return rows
      .map((row) => ({
        ...row,
        files: row.files.filter((file) => {
          const matchesQuery = !q || [row.title, row.category, file.label, file.name, file.url].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
          const fileType = String(file?.type || file?.kind || 'other').toLowerCase();
          const matchesType = typeFilter === 'all' || fileType.startsWith(typeFilter);
          return matchesQuery && matchesType;
        }),
      }))
      .filter((row) => row.files.length > 0);
  }, [rows, query, typeFilter]);

  const totalFiles = filteredRows.reduce((sum, item) => sum + item.files.length, 0);

  const openEditor = (project, file = null) => {
    setState((prev) => ({ ...prev, isOpen: true, selectedProject: project, selectedFile: file, draft: createDraft(file || {}), uploadStage: 'idle', uploadStatus: '', uploadError: '' }));
  };

  const saveFile = async () => {
    if (!state.selectedProject) return;
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const currentFiles = Array.isArray(state.selectedProject.privateFiles) ? state.selectedProject.privateFiles : [];
      const nextFiles = state.selectedFile
        ? currentFiles.map((file) => (file.id === state.selectedFile.id ? { ...file, ...state.draft } : file))
        : [...currentFiles, { id: crypto.randomUUID(), ...state.draft }];
      await fetchJson(`/projects/${state.selectedProject.id}`, { method: 'PUT', data: { ...state.selectedProject, privateFiles: nextFiles } });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false, selectedProject: null, selectedFile: null }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error?.message || 'Failed to save private file.' }));
    }
  };

  const uploadPrivateFile = async (file) => {
    if (!file) return;
    const category = String(state.selectedProject?.category || state.selectedProject?.title || '默认分类').trim() || '默认分类';
    setState((prev) => ({ ...prev, uploading: true, error: '', uploadStage: 'uploading', uploadStatus: `Uploading ${file.name}...`, uploadError: '' }));
    try {
      const displayName = String(state.selectedProject?.title || state.draft.label || state.draft.name || file.name || 'private-file').trim() || 'private-file';
      const result = await uploadFile(file, 'private', undefined, { root: 'Private Files', assetSpace: 'Private Files', category, displayName });
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'success', uploadStatus: `Uploaded: ${result.url || file.name}`, draft: { ...prev.draft, url: result.url, name: file.name, type: file.type || prev.draft.type } }));
    } catch (error) {
      const message = error?.message || 'Failed to upload private file.';
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'error', uploadError: /502/.test(message) ? '' : message, error: /502/.test(message) ? '' : message }));
    }
  };

  return (
    <>
      <ConsolePanelShell eyebrow="DELIVERY" title="Private Files" description="私密交付文件管理。" badge={{ label: 'DELIVERY', tone: 'success' }}>
        <div className="flex items-center justify-end gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
          <Badge tone="success">{filteredRows.length} PROJECT(S) / {totalFiles} FILE(S)</Badge>
          <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          <Button type="button" variant="primary" onClick={() => setState((prev) => ({ ...prev, isOpen: true, selectedProject: null, selectedFile: null, draft: createDraft(), uploadStage: 'idle', uploadStatus: '', uploadError: '' }))}>UPLOAD</Button>
          <Button type="button" variant="subtle" onClick={() => setListOpen(true)}>OPEN PROJECT LIST</Button>
        </div>
      </ConsolePanelShell>

      <Modal open={listOpen} title="Private Files" onClose={() => setListOpen(false)}>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-[220px] flex-1 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="Search project / label / URL" />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none">
            <option value="all">All</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="private">Private</option>
            <option value="zip">Zip</option>
            <option value="pdf">PDF</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid gap-3">
          {filteredRows.length === 0 ? <p className="text-sm text-zinc-500">No private files yet.</p> : null}
          {filteredRows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">Category · {item.category}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.files.length} private files</p>
                </div>
                <Button type="button" variant="subtle" onClick={() => openEditor(item.project)}>
                  EDIT
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={state.isOpen} title="Private File Editor" onClose={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null, selectedFile: null }))}>
        <div className="grid gap-4">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Label</p>
            <Input value={state.draft.label} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, label: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Name</p>
            <Input value={state.draft.name} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, name: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">URL</p>
            <Input value={state.draft.url} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, url: event.target.value } }))} />
          </label>
          <MediaPicker label="Upload File" accept="*/*" value={state.draft.url} uploading={state.uploading} helperText="Uploads to MinIO and stores the returned URL." onPick={uploadPrivateFile} />
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null, selectedFile: null }))}>CANCEL</Button>
            <Button type="button" variant="primary" onClick={saveFile}>{state.saving ? 'SAVING...' : 'SAVE FILE'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
