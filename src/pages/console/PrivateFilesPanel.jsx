import { useEffect, useMemo, useState } from 'react';
import { fetchJson, uploadFile } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

function groupFilesByType(files = []) {
  return files.reduce((acc, file) => {
    const type = String(file?.type || file?.kind || 'other').toLowerCase();
    const key = type.startsWith('video') ? 'video' : type.startsWith('image') ? 'image' : type === 'private' ? 'private' : type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {});
}

function PrivateFilesPanel() {
  const [state, setState] = useState({ loading: true, saving: false, uploading: false, error: '', items: [], selectedProject: null, selectedFile: null, isOpen: false, draft: { label: '', name: '', url: '', type: 'zip', enabled: true, sortOrder: 0 } });
  const [openProjects, setOpenProjects] = useState({});
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const rows = useMemo(() => state.items.map((project) => ({ id: project.id, title: project.title, files: Array.isArray(project.privateFiles) ? project.privateFiles.filter((item) => item?.enabled !== false) : [] })).filter((item) => item.files.length > 0), [state.items]);
  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return rows
      .map((row) => ({
        ...row,
        files: row.files.filter((file) => {
          const matchesQuery = !q || [row.title, file.label, file.name, file.url].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
          const fileType = String(file?.type || file?.kind || 'other').toLowerCase();
          const matchesType = typeFilter === 'all' || fileType.startsWith(typeFilter);
          return matchesQuery && matchesType;
        }),
      }))
      .filter((row) => row.files.length > 0);
  }, [rows, query, typeFilter]);
  const totalFiles = filteredRows.reduce((sum, item) => sum + item.files.length, 0);

  const openEditor = (project) => {
    setState((prev) => ({ ...prev, selectedProject: project, selectedFile: null, isOpen: true, draft: { label: '', name: '', url: '', type: 'zip', enabled: true, sortOrder: 0 } }));
  };

  const openReplaceEditor = (project, file) => {
    setState((prev) => ({ ...prev, selectedProject: project, selectedFile: file, isOpen: true, draft: { label: file?.label || '', name: file?.name || '', url: file?.url || '', type: file?.type || 'zip', enabled: file?.enabled !== false, sortOrder: file?.sortOrder || 0 } }));
  };

  const setAllProjectsOpen = (nextOpen) => {
    setOpenProjects(Object.fromEntries(filteredRows.map((row) => [row.id, nextOpen])));
  };

  const addFile = async () => {
    if (!state.selectedProject) return;
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const currentFiles = Array.isArray(state.selectedProject.privateFiles) ? state.selectedProject.privateFiles : [];
      const nextFiles = state.selectedFile
        ? currentFiles.map((file) => (file.id === state.selectedFile.id ? { ...file, ...state.draft } : file))
        : [...currentFiles, { id: crypto.randomUUID(), ...state.draft }];
      await fetchJson(`/projects/${state.selectedProject.id}`, { method: 'PUT', body: JSON.stringify({ ...state.selectedProject, privateFiles: nextFiles }) });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false, selectedProject: null, selectedFile: null }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save private file.' }));
    }
  };

  const deleteFile = async (project, file) => {
    if (!project || !file) return;
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      const currentFiles = Array.isArray(project.privateFiles) ? project.privateFiles : [];
      const nextFiles = currentFiles.filter((item) => item.id !== file.id);
      await fetchJson(`/projects/${project.id}`, { method: 'PUT', body: JSON.stringify({ ...project, privateFiles: nextFiles }) });
      await load();
      setState((prev) => ({ ...prev, saving: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to delete private file.' }));
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-zinc-500">{filteredRows.length} PROJECT(S) / {totalFiles} FILE(S)</p>
            {state.loading ? <p className="mt-2 text-sm text-zinc-400">Loading private files...</p> : null}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project / label / URL" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none">
              <option value="all">All</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="private">Private</option>
              <option value="zip">Zip</option>
              <option value="pdf">PDF</option>
              <option value="other">Other</option>
            </select>
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          </div>
        </div>

        {state.error ? <p className="py-2 text-sm text-rose-300">{state.error}</p> : null}

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setAllProjectsOpen(true)}>EXPAND ALL</Button>
          <Button type="button" variant="subtle" onClick={() => setAllProjectsOpen(false)}>COLLAPSE ALL</Button>
        </div>

        <div className="mt-4 grid gap-3">
          {filteredRows.length === 0 ? <p className="text-sm text-zinc-500">No private files yet.</p> : null}
          {filteredRows.map((item) => {
            const grouped = groupFilesByType(item.files);
            const isOpen = Boolean(openProjects[item.id]);
            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <button type="button" className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpenProjects((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}>
                  <div>
                    <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{item.files.length} private files</p>
                  </div>
                  <Badge tone="default">{isOpen ? 'COLLAPSE' : 'EXPAND'}</Badge>
                </button>

                {isOpen ? (
                  <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    {Object.entries(grouped).map(([type, files]) => (
                      <div key={type} className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{type} ({files.length})</p>
                        <div className="grid gap-2">
                          {files.slice(0, 3).map((file) => (
                            <div key={file.id || file.url} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm tracking-[0.06em] text-white">{file.label || file.name || file.url}</p>
                                <p className="mt-1 truncate text-xs text-zinc-400">{file.url}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="subtle" onClick={() => openReplaceEditor(state.items.find((project) => project.id === item.id), file)}>REPLACE</Button>
                                <Button type="button" variant="subtle" onClick={() => deleteFile(state.items.find((project) => project.id === item.id), file)}>DELETE</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button type="button" variant="subtle" onClick={() => openEditor(state.items.find((project) => project.id === item.id))}>ADD FILE</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </ConsolePanelShell>

      <Modal open={state.isOpen} title={state.selectedFile ? 'Edit Private File' : 'Add Private File'} onClose={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null, selectedFile: null }))}>
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

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false, selectedProject: null }))}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={addFile}>{state.saving ? 'SAVING...' : 'SAVE FILE'}</Button>
        </div>
      </Modal>
    </>
  );
}

export default PrivateFilesPanel;
