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
    customerName: file?.customerName || '',
    accessPassword: file?.accessPassword || '',
  };
}

export default function PrivateFilesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [draft, setDraft] = useState(createDraft());
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const projects = await fetchJson('/projects');
      setItems(Array.isArray(projects) ? projects : []);
    } catch (err) {
      const message = err?.message || 'Failed to load private files.';
      setError(/502/.test(message) ? '' : message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => items
    .map((project) => ({
      id: project.id,
      title: project.title,
      category: project.category || project.title || '默认分类',
      project,
      files: Array.isArray(project.privateFiles) ? project.privateFiles.filter((file) => file?.enabled !== false) : [],
    }))
    .filter((item) => item.files.length > 0), [items]);

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
    setSelectedProject(project);
    setSelectedFile(file);
    setDraft(createDraft(file || {}));
    setUploadStatus('');
    setUploadError('');
    setEditorOpen(true);
  };

  const saveFile = async () => {
    if (!selectedProject) return;
    setSaving(true);
    setError('');
    try {
      const currentFiles = Array.isArray(selectedProject.privateFiles) ? selectedProject.privateFiles : [];
      const nextFiles = selectedFile
        ? currentFiles.map((file) => (file.id === selectedFile.id ? { ...file, ...draft } : file))
        : [...currentFiles, { id: crypto.randomUUID(), ...draft }];

      await fetchJson(`/projects/${selectedProject.id}`, {
        method: 'PUT',
        data: {
          ...selectedProject,
          customerName: draft.customerName || selectedProject.customerName || '',
          accessPassword: draft.accessPassword || selectedProject.accessPassword || '',
          privateFiles: nextFiles,
        },
      });

      await load();
      setEditorOpen(false);
      setSelectedProject(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err?.message || 'Failed to save private file.');
    } finally {
      setSaving(false);
    }
  };

  const uploadPrivateFile = async (file) => {
    if (!file) return;
    const category = String(selectedProject?.category || selectedProject?.title || '默认分类').trim() || '默认分类';
    setUploading(true);
    setUploadError('');
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const displayName = String(selectedProject?.title || draft.label || draft.name || file.name || 'private-file').trim() || 'private-file';
      const result = await uploadFile(file, 'private', undefined, { root: 'Private Files', assetSpace: 'Private Files', category, displayName });
      setDraft((prev) => ({ ...prev, url: result.url || file.name, name: file.name, type: file.type || prev.type }));
      setUploadStatus(`Uploaded: ${result.url || file.name}`);
    } catch (err) {
      const message = err?.message || 'Failed to upload private file.';
      setUploadError(/502/.test(message) ? '' : message);
      setError(/502/.test(message) ? '' : message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <ConsolePanelShell eyebrow="DELIVERY" title="Private Files" description="私密交付文件管理。" badge={{ label: 'DELIVERY', tone: 'success' }}>
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        <div className="flex items-center justify-end gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
          <Badge tone="success">{filteredRows.length} PROJECT(S) / {totalFiles} FILE(S)</Badge>
          <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          <Button type="button" variant="primary" onClick={() => openEditor(null, null)}>UPLOAD</Button>
          <Button type="button" variant="subtle" onClick={() => setListOpen(true)}>OPEN PROJECT LIST</Button>
        </div>
      </ConsolePanelShell>

      <Modal open={listOpen} title="Private Files" onClose={() => setListOpen(false)}>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-[220px] flex-1 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40"
            placeholder="Search project / label / URL"
          />
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
          {loading ? <p className="text-sm text-zinc-400">Loading private files...</p> : null}
          {!loading && filteredRows.length === 0 ? <p className="text-sm text-zinc-500">No private files yet.</p> : null}
          {filteredRows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">Category · {item.category}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.files.length} private files</p>
                </div>
                <Button type="button" variant="subtle" onClick={() => openEditor(item.project)}>EDIT</Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={editorOpen} title="Private File Editor" onClose={() => { setEditorOpen(false); setSelectedProject(null); setSelectedFile(null); }}>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Customer Name</p>
              <Input value={draft.customerName} onChange={(event) => setDraft((prev) => ({ ...prev, customerName: event.target.value }))} />
            </label>
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Access Password</p>
              <Input type="password" value={draft.accessPassword} onChange={(event) => setDraft((prev) => ({ ...prev, accessPassword: event.target.value }))} />
            </label>
          </div>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Label</p>
            <Input value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Name</p>
            <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">URL</p>
            <Input value={draft.url} onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))} />
          </label>

          <MediaPicker label="Upload File" accept="*/*" value={draft.url} uploading={uploading} helperText="Uploads to MinIO and stores the returned URL." onPick={uploadPrivateFile} />
          {uploadStatus ? <p className="text-xs tracking-[0.12em] text-zinc-400">{uploadStatus}</p> : null}
          {uploadError ? <p className="text-xs text-rose-300">{uploadError}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => { setEditorOpen(false); setSelectedProject(null); setSelectedFile(null); }}>CANCEL</Button>
            <Button type="button" variant="primary" onClick={saveFile}>{saving ? 'SAVING...' : 'SAVE FILE'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
