import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchJson, uploadFile } from '../../utils/api.js';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [selectedBatchFiles, setSelectedBatchFiles] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [renamingBatchFileId, setRenamingBatchFileId] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const uploadInputRef = useRef(null);
  const batchUploadInputRef = useRef(null);

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

  const resetUploadState = () => {
    setUploadStatus('');
    setUploadError('');
    setUploadProgress(0);
    setSelectedUploadFile(null);
    setSelectedBatchFiles([]);
    setPendingUploads([]);
    setRenamingBatchFileId('');
    setRenameDraft('');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (batchUploadInputRef.current) batchUploadInputRef.current.value = '';
  };

  const openEditor = (project, file = null) => {
    setEditor({ open: true, project, file, draft: createDraft(file || {}) });
    resetUploadState();
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

  const uploadSelectedFile = async () => {
    if (!selectedUploadFile || !editor.project) return;
    setUploading(true);
    setUploadError('');
    setUploadStatus(`Uploading ${selectedUploadFile.name}...`);
    setUploadProgress(0);
    try {
      const uploaded = await uploadFile(selectedUploadFile, 'private', (event) => {
        if (!event?.total) return;
        const nextProgress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        setUploadProgress(nextProgress);
        setUploadStatus(`Uploading ${selectedUploadFile.name}... ${nextProgress}%`);
      }, {
        customerName: editor.draft.customerName || editor.project.customerName || '',
        accessPassword: editor.draft.accessPassword || editor.project.accessPassword || '',
        label: editor.draft.label || selectedUploadFile.name,
        name: editor.draft.name || selectedUploadFile.name,
      });

      const uploadedUrl = uploaded?.url || uploaded?.data?.url || uploaded?.location || '';
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no file URL was returned.');
      }

      setEditor((prev) => ({
        ...prev,
        draft: {
          ...prev.draft,
          url: uploadedUrl,
          name: prev.draft.name || selectedUploadFile.name,
          label: prev.draft.label || selectedUploadFile.name,
        },
      }));
      setUploadStatus('Upload complete. URL filled automatically.');
      setUploadProgress(100);
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload file.');
      setUploadStatus('');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const addBatchFilesToPending = () => {
    if (!editor.project || selectedBatchFiles.length === 0) return;
    const nextItems = selectedBatchFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
      url: '',
      error: '',
      customName: file.name,
    }));
    setPendingUploads((prev) => [...prev, ...nextItems]);
    setSelectedBatchFiles([]);
    setUploadStatus(`${selectedBatchFiles.length} file(s) added to the confirmation queue.`);
    setUploadError('');
    if (batchUploadInputRef.current) batchUploadInputRef.current.value = '';
  };

  const removeSelectedBatchFile = (target) => {
    setSelectedBatchFiles((prev) => prev.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== `${target.name}-${target.size}-${target.lastModified}`));
  };

  const removePendingUpload = (id) => {
    setPendingUploads((prev) => prev.filter((item) => item.id !== id));
    if (renamingBatchFileId === id) {
      setRenamingBatchFileId('');
      setRenameDraft('');
    }
  };

  const startRenamePendingUpload = (item) => {
    setRenamingBatchFileId(item.id);
    setRenameDraft(item.customName || item.file.name || '');
  };

  const saveSelectedBatchFileName = (target) => {
    const nextName = String(renameDraft || '').trim();
    if (!nextName) return;
    const key = `${target.name}-${target.size}-${target.lastModified}`;
    setSelectedBatchFiles((prev) => prev.map((item) => (
      `${item.name}-${item.size}-${item.lastModified}` === key
        ? { ...item, customName: nextName }
        : item
    )));
    setRenamingBatchFileId('');
    setRenameDraft('');
  };

  const saveRenamePendingUpload = (id) => {
    const nextName = String(renameDraft || '').trim();
    if (!nextName) return;
    setPendingUploads((prev) => prev.map((entry) => (entry.id === id ? { ...entry, customName: nextName } : entry)));
    setRenamingBatchFileId('');
    setRenameDraft('');
  };

  const clearAllPendingUploads = () => {
    setPendingUploads([]);
    setRenamingBatchFileId('');
    setRenameDraft('');
    setUploadStatus('Confirmation queue cleared.');
  };

  const movePendingUpload = (id, direction) => {
    setPendingUploads((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const uploadAllPendingItems = async () => {
    const queue = pendingUploads.filter((item) => item.status !== 'uploaded');
    for (const item of queue) {
      // eslint-disable-next-line no-await-in-loop
      await uploadPendingItem(item);
    }
  };

  const uploadPendingItem = async (item) => {
    if (!editor.project) return;
    setPendingUploads((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: 'uploading', error: '', progress: 0 } : entry)));
    try {
      const uploaded = await uploadFile(item.file, 'private', (event) => {
        if (!event?.total) return;
        const nextProgress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        setPendingUploads((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, progress: nextProgress } : entry)));
      }, {
        customerName: editor.draft.customerName || editor.project.customerName || '',
        accessPassword: editor.draft.accessPassword || editor.project.accessPassword || '',
        label: item.file.name,
        name: item.file.name,
      });

      const uploadedUrl = uploaded?.url || uploaded?.data?.url || uploaded?.location || '';
      if (!uploadedUrl) throw new Error('Upload succeeded but no file URL was returned.');

      setPendingUploads((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: 'uploaded', progress: 100, url: uploadedUrl } : entry)));
    } catch (err) {
      setPendingUploads((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: 'error', error: err?.message || 'Failed to upload file.' } : entry)));
    }
  };

  const confirmPendingUploads = async () => {
    if (!editor.project || pendingUploads.length === 0) return;
    const readyItems = pendingUploads.filter((item) => item.status === 'uploaded' && item.url);
    if (readyItems.length === 0) return;

    setSaving(true);
    setError('');
    try {
      const currentFiles = Array.isArray(editor.project.privateFiles) ? editor.project.privateFiles : [];
      const nextFiles = [
        ...currentFiles,
        ...readyItems.map((item) => ({
          id: crypto.randomUUID(),
          label: item.customName || item.file.name,
          name: item.customName || item.file.name,
          url: item.url,
          type: item.file.type || 'file',
          enabled: true,
          sortOrder: currentFiles.length,
          customerName: editor.draft.customerName || editor.project.customerName || '',
          accessPassword: editor.draft.accessPassword || editor.project.accessPassword || '',
        })),
      ];

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
      setPendingUploads((prev) => prev.filter((item) => !(item.status === 'uploaded' && item.url)));
      setRenamingBatchFileId('');
      setRenameDraft('');
      setUploadStatus(`${readyItems.length} file(s) confirmed and saved.`);
    } catch (err) {
      setError(err?.message || 'Failed to confirm batch uploads.');
    } finally {
      setSaving(false);
    }
  };

  const uploadProgressWidth = `${Math.max(0, Math.min(100, uploadProgress))}%`;



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

      <Modal open={editor.open} title="Private File Editor" onClose={() => { setEditor({ open: false, project: null, file: null, draft: createDraft() }); resetUploadState(); }}>
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

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]">
                CHOOSE LOCAL FILE
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedUploadFile(file);
                    setUploadError('');
                    setUploadProgress(0);
                    setUploadStatus(file ? `Selected ${file.name}` : '');
                  }}
                />
              </label>
              <Button type="button" variant="primary" disabled={!selectedUploadFile || uploading} onClick={uploadSelectedFile}>
                {uploading ? 'UPLOADING...' : 'UPLOAD SELECTED FILE'}
              </Button>
              {selectedUploadFile ? <span className="text-xs tracking-[0.12em] text-zinc-400">{selectedUploadFile.name}</span> : null}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white transition-[width] duration-150" style={{ width: uploadProgressWidth }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] tracking-[0.14em] text-zinc-500">
              <span>{uploadStatus || 'Select a local file to upload.'}</span>
              <span>{uploadProgress}%</span>
            </div>
            {uploadError ? <p className="mt-2 text-xs text-rose-300">{uploadError}</p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]">
                CHOOSE MULTIPLE FILES
                <input
                  ref={batchUploadInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setSelectedBatchFiles((prev) => {
                      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
                      const merged = [...prev];
                      files.forEach((file) => {
                        const key = `${file.name}-${file.size}-${file.lastModified}`;
                        if (!existingKeys.has(key)) {
                          existingKeys.add(key);
                          merged.push(file);
                        }
                      });
                      return merged;
                    });
                    setUploadError('');
                    setUploadStatus(files.length ? `${files.length} file(s) added to the selection.` : '');
                  }}
                />
              </label>
              <Button type="button" variant="primary" disabled={selectedBatchFiles.length === 0} onClick={addBatchFilesToPending}>
                ADD TO CONFIRMATION QUEUE
              </Button>
              {selectedBatchFiles.length ? <span className="text-xs tracking-[0.12em] text-zinc-400">{selectedBatchFiles.length} file(s)</span> : null}
            </div>
            {selectedBatchFiles.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] tracking-[0.14em] text-zinc-500">Waiting for confirmation</p>
                  <Button type="button" variant="subtle" onClick={() => { setSelectedBatchFiles([]); setRenamingBatchFileId(''); setRenameDraft(''); if (batchUploadInputRef.current) batchUploadInputRef.current.value = ''; }}>
                    CLEAR ALL
                  </Button>
                </div>
                <div className="mt-3 grid gap-2">
                  {selectedBatchFiles.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200">
                      {renamingBatchFileId === `${file.name}-${file.size}-${file.lastModified}` ? (
                        <div className="flex flex-1 items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                            onClick={() => removeSelectedBatchFile(file)}
                            aria-label={`Remove ${file.customName || file.name}`}
                            title="Remove"
                          >
                            🗑
                          </button>
                          <Input value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} />
                          <Button type="button" variant="primary" onClick={() => saveSelectedBatchFileName(file)}>
                            SAVE
                          </Button>
                          <Button type="button" variant="subtle" onClick={() => { setRenamingBatchFileId(''); setRenameDraft(''); }}>
                            CANCEL
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                              onClick={() => removeSelectedBatchFile(file)}
                              aria-label={`Remove ${file.customName || file.name}`}
                              title="Remove"
                            >
                              🗑
                            </button>
                            <span className="truncate">{file.customName || file.name}</span>
                          </div>
                          <button
                            type="button"
                            className="text-[11px] tracking-[0.14em] text-zinc-400 transition hover:text-white"
                            onClick={() => {
                              setRenamingBatchFileId(`${file.name}-${file.size}-${file.lastModified}`);
                              setRenameDraft(file.customName || file.name || '');
                            }}
                          >
                            RENAME
                          </button>
                        </>
                      )}
                      <span className="text-[11px] tracking-[0.12em] text-zinc-500">{Math.round(file.size / 1024)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {pendingUploads.length ? (
              <div className="mt-4 grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] tracking-[0.14em] text-zinc-500">Confirmation queue</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="subtle" onClick={clearAllPendingUploads}>
                      CLEAR ALL
                    </Button>
                    <Button type="button" variant="subtle" onClick={uploadAllPendingItems} disabled={pendingUploads.length === 0 || pendingUploads.every((item) => item.status === 'uploaded' && item.url)}>
                      UPLOAD ALL
                    </Button>
                    <Button type="button" variant="primary" disabled={saving || pendingUploads.every((item) => item.status !== 'uploaded' || !item.url)} onClick={confirmPendingUploads}>
                      {saving ? 'SAVING...' : 'CONFIRM UPLOADED FILES'}
                    </Button>
                  </div>
                </div>
                {pendingUploads.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {renamingBatchFileId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} />
                            <Button type="button" variant="primary" onClick={() => saveRenamePendingUpload(item.id)}>
                              SAVE
                            </Button>
                            <Button type="button" variant="subtle" onClick={() => { setRenamingBatchFileId(''); setRenameDraft(''); }}>
                              CANCEL
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm text-white">{item.customName || item.file.name}</p>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                              onClick={() => removePendingUpload(item.id)}
                              aria-label={`Remove ${item.customName || item.file.name}`}
                              title="Remove"
                            >
                              🗑
                            </button>
                          </div>
                        )}
                        <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">{item.status}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-white transition-[width] duration-150" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
                        </div>
                        {item.error ? <p className="mt-2 text-xs text-rose-300">{item.error}</p> : null}
                        {item.url ? <p className="mt-2 truncate text-xs text-emerald-300">{item.url}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="subtle" onClick={() => movePendingUpload(item.id, -1)} disabled={pendingUploads[0]?.id === item.id}>
                          UP
                        </Button>
                        <Button type="button" variant="subtle" onClick={() => movePendingUpload(item.id, 1)} disabled={pendingUploads[pendingUploads.length - 1]?.id === item.id}>
                          DOWN
                        </Button>
                        <Button type="button" variant="subtle" onClick={() => uploadPendingItem(item)} disabled={item.status === 'uploading'}>
                          UPLOAD
                        </Button>
                        <Button type="button" variant="subtle" onClick={() => startRenamePendingUpload(item)}>
                          RENAME
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => { setEditor({ open: false, project: null, file: null, draft: createDraft() }); resetUploadState(); }}>CANCEL</Button>
            <Button type="button" variant="primary" onClick={saveFile}>{saving ? 'SAVING...' : 'SAVE FILE'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
