import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
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
  const [editor, setEditor] = useState({ open: false, project: null, file: null, draft: createDraft() });
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
    setEditor({ open: true, project, file, draft: createDraft(file || {}) });
    setUploadStatus('');
    setUploadError('');
  };

  const saveFile = async () => {
    if (!editor.project) return;
    setSaving(true);
    setError('');
    try {
      const currentFiles = Array.isArray(editor.project.privateFiles) ? editor.project.privateFiles : [];
      const nextFiles = editor.file
        ? currentFiles.map((file) => (file.id === editor.file.id ? { ...file, ...editor.draft } : file))
        : [...currentFiles, { id: crypto.randomUUID(), ...editor.draft }];

      await fetchJson(`/projects/${editor.project.id}`, {
        method: 'PUT',
        data: {
          ...editor.project,
          customerName: editor.draft.customerName || editor.project.customerName || '',
          accessPassword: editor.draft.accessPassword || editor.project.accessPassword || '',
          privateFiles: nextFiles,
        },
      });

      await load();
      setEditor({ open: false, project: null, file: null, draft: createDraft() });
    } catch (err) {
      setError(err?.message || 'Failed to save private file.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <>
      <ConsolePanelShell eyebrow="DELIVERY" title="Private Files" description="私密交付文件管理。" badge={{ label: 'DELIVERY', tone: 'success' }}>
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        <div className="flex items-center justify-end gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
          <Badge tone="success">{filteredRows.length} PROJECT(S) / {totalFiles} FILE(S)</Badge>
          <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          <Button type="button" variant="primary" onClick={() => setEditor({ open: true, project: null, file: null, draft: createDraft() })}>UPLOAD</Button>
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

      <Modal open={editor.open} title="Private File Editor" onClose={() => setEditor({ open: false, project: null, file: null, draft: createDraft() })}>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Customer Name</p>
              <Input value={editor.draft.customerName} onChange={(event) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, customerName: event.target.value } }))} />
            </label>
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Access Password</p>
              <Input type="password" value={editor.draft.accessPassword} onChange={(event) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, accessPassword: event.target.value } }))} />
            </label>
          </div>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Label</p>
            <Input value={editor.draft.label} onChange={(event) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, label: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Name</p>
            <Input value={editor.draft.name} onChange={(event) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, name: event.target.value } }))} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">URL</p>
            <Input value={editor.draft.url} onChange={(event) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, url: event.target.value } }))} />
          </label>

          {uploadStatus ? <p className="text-xs tracking-[0.12em] text-zinc-400">{uploadStatus}</p> : null}
          {uploadError ? <p className="text-xs text-rose-300">{uploadError}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => setEditor({ open: false, project: null, file: null, draft: createDraft() })}>CANCEL</Button>
            <Button type="button" variant="primary" onClick={saveFile}>{saving ? 'SAVING...' : 'SAVE FILE'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
