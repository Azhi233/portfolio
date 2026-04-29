import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Textarea from '../../components/Textarea.jsx';
import ProjectMediaUploader from '../../components/ProjectMediaUploader.jsx';
import { fetchJson } from '../../utils/api.js';
import { uploadMediaAsset } from '../../utils/projectVideoUpload.js';
import { blankDraft, cloneDraft, serializeProjectPayload } from './projectsPanelHelpers.js';

function makePrivateDraft(base = {}) {
  return {
    ...blankDraft,
    ...base,
    visibility: 'private',
    isVisible: false,
    status: base.status || 'delivery',
    category: base.category || 'Client Deliverables',
    kind: base.kind || 'private',
    mediaType: base.mediaType || 'image',
    displayOn: [],
    privateFiles: Array.isArray(base.privateFiles) ? base.privateFiles : [],
  };
}

function uploadPatch(fileName) {
  return {
    uploading: true,
    uploadProgress: 0,
    uploadStage: 'preparing',
    uploadStatus: `Preparing ${fileName}...`,
    error: '',
  };
}

function progressPatch(prev, stage, progress, fileName) {
  return {
    ...prev,
    uploadStage: stage,
    uploadProgress: Math.max(prev.uploadProgress, progress || 0),
    uploadStatus: stage === 'transcoding' ? `Transcoding ${fileName}...` : `Uploading ${fileName}...`,
  };
}

function createLocalId(prefix = 'deliverable') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ProjectFields({ draft, setDraft }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">项目名称</p>
        <Input value={draft.title || ''} onChange={(event) => setDraft((prev) => makePrivateDraft({ ...prev, title: event.target.value }))} />
      </label>
      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">客户名称</p>
        <Input value={draft.clientAgency || ''} onChange={(event) => setDraft((prev) => makePrivateDraft({ ...prev, clientAgency: event.target.value, customerName: event.target.value }))} />
      </label>
      <label className="block">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">进入密码</p>
        <Input value={draft.accessPassword || ''} onChange={(event) => setDraft((prev) => makePrivateDraft({ ...prev, accessPassword: event.target.value, password: event.target.value }))} />
      </label>
      <label className="block md:col-span-1">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">分类</p>
        <Input value={draft.category || ''} onChange={(event) => setDraft((prev) => makePrivateDraft({ ...prev, category: event.target.value }))} />
      </label>
      <label className="block md:col-span-2">
        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">介绍</p>
        <Textarea value={draft.description || ''} onChange={(event) => setDraft((prev) => makePrivateDraft({ ...prev, description: event.target.value }))} />
      </label>
    </div>
  );
}

function RenameFileModal({ open, onClose, value, setValue, onSave, fileLabel }) {
  return (
    <Modal open={open} title="Rename Private File" onClose={onClose}>
      <div className="grid gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs tracking-[0.12em] text-zinc-400">当前文件</p>
          <p className="mt-2 text-sm text-zinc-200">{fileLabel || 'Private file'}</p>
        </div>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">新的文件名称</p>
          <Input value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={onClose}>取消</Button>
          <Button type="button" variant="primary" onClick={onSave}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}

function ManagerModal({ open, onClose, projects, query, setQuery, selectedCategory, setSelectedCategory, onOpenProject, onDeleteProject, onEditFile, onDeleteFile }) {
  const categories = useMemo(() => ['all', ...new Set(projects.map((item) => item.category || 'Client Deliverables'))], [projects]);
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesCategory = selectedCategory === 'all' || String(project.category || 'Client Deliverables') === selectedCategory;
    const files = Array.isArray(project.privateFiles) ? project.privateFiles : [];
    const matchesQuery = !normalizedQuery || [project.title, project.clientAgency, project.description, ...files.flatMap((file) => [file.title, file.label, file.description, file.category])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    return matchesCategory && matchesQuery;
  }), [normalizedQuery, projects, selectedCategory]);

  return (
    <Modal open={open} title="Private File Manager" onClose={onClose}>
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_240px]">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">搜索项目 / 文件 / 介绍</p>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search private files" />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">分类筛选</p>
            <select className="w-full rounded-2xl border border-white/10 bg-[#0c0d10] px-4 py-3 text-sm text-zinc-100 outline-none" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category === 'all' ? '全部分类' : category}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-4">
          {filtered.length === 0 ? <p className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">暂无匹配的私密项目或文件。</p> : null}
          {filtered.map((project) => {
            const files = Array.isArray(project.privateFiles) ? project.privateFiles : [];
            return (
              <article key={project.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-violet-200/60">{project.category || 'Client Deliverables'}</p>
                    <h3 className="mt-2 text-xl tracking-[0.08em] text-white">{project.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{project.clientAgency || 'Private client'} · {files.length} files</p>
                    {project.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{project.description}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="subtle" onClick={() => onOpenProject?.(project)}>定位并编辑</Button>
                    <a className="text-xs uppercase tracking-[0.18em] text-violet-100/70 hover:text-white" href={`/client-deliverables/${project.id}`} target="_blank" rel="noreferrer">打开交付页</a>
                    <Button type="button" variant="danger" onClick={() => onDeleteProject?.(project)}>删除项目</Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {files.length === 0 ? <p className="text-sm text-zinc-600">No private files.</p> : null}
                  {files.map((file, index) => (
                    <div key={file.id || file.url || index} className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-zinc-300 md:grid-cols-[1fr_120px_160px_auto] md:items-center">
                      <span className="min-w-0 truncate">{file.title || file.label || `File ${index + 1}`}</span>
                      <span className="text-zinc-500">{file.kind || file.mediaType || 'file'}</span>
                      <span className="text-zinc-500">{file.category || project.category || 'Uncategorized'}</span>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-[0.16em] text-violet-100/70 hover:text-white">打开</a>
                        <Button type="button" variant="subtle" onClick={() => onEditFile?.(project, index)}>重命名</Button>
                        <Button type="button" variant="danger" onClick={() => onDeleteFile?.(project, index)}>删除</Button>
                      </div>
                      {file.description ? <span className="text-xs text-zinc-600 md:col-span-4">{file.description}</span> : null}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default function PrivateDeliverablesPanel({ projects = [], onRefresh }) {
  const [loadedPrivateProjects, setLoadedPrivateProjects] = useState([]);
  const externalPrivateProjects = useMemo(() => projects.filter((item) => String(item.visibility || '').toLowerCase() === 'private'), [projects]);
  const privateProjects = useMemo(() => {
    const merged = [...externalPrivateProjects, ...loadedPrivateProjects];
    const seen = new Set();
    return merged.filter((item) => {
      const key = String(item.id || '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [externalPrivateProjects, loadedPrivateProjects]);
  const [draft, setDraft] = useState(makePrivateDraft());
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', category: 'Client Deliverables', description: '' });
  const [modalMode, setModalMode] = useState('');
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerQuery, setManagerQuery] = useState('');
  const [managerCategory, setManagerCategory] = useState('all');
  const [state, setState] = useState({ saving: false, uploading: false, uploadProgress: 0, uploadStage: 'idle', uploadStatus: '', error: '', notice: '' });
  const [projectDirty, setProjectDirty] = useState(false);
  const [renameFileState, setRenameFileState] = useState({ open: false, projectId: '', fileIndex: -1, value: '' });

  const loadPrivateProjects = async () => {
    const items = await fetchJson('/projects?kind=private');
    setLoadedPrivateProjects(Array.isArray(items) ? items : []);
  };

  useEffect(() => {
    loadPrivateProjects().catch(() => {});
  }, []);

  const closeAllModals = () => {
    setModalMode('');
    setManagerOpen(false);
    setRenameFileState({ open: false, projectId: '', fileIndex: -1, value: '' });
    setSelectedProject(null);
    setProjectDirty(false);
    setState((prev) => ({ ...prev, error: '', notice: '' }));
  };

  const openNewProject = () => {
    setDraft(makePrivateDraft());
    setSelectedProject(null);
    setUploadMeta({ title: '', category: 'Client Deliverables', description: '' });
    setProjectDirty(false);
    setState((prev) => ({ ...prev, error: '', notice: '' }));
    setModalMode('workspace');
  };

  const openExistingSelector = () => {
    setDraft(makePrivateDraft());
    setSelectedProject(null);
    setProjectDirty(false);
    setState((prev) => ({ ...prev, error: '', notice: '' }));
    loadPrivateProjects().catch(() => {});
    setModalMode('workspace');
  };

  const openManagerProject = (project) => {
    const normalized = makePrivateDraft(cloneDraft(project));
    setSelectedProject(normalized);
    setDraft(normalized);
    setUploadMeta((prev) => ({ ...prev, category: normalized.category || prev.category || 'Client Deliverables' }));
    setProjectDirty(false);
    setModalMode('workspace');
    setManagerOpen(false);
  };

  const persistManagedProject = async (project) => {
    const normalized = makePrivateDraft(cloneDraft(project));
    setDraft(normalized);
    setProjectDirty(false);
    await saveDraft(normalized, { silent: true });
    await loadPrivateProjects().catch(() => {});
    await onRefresh?.();
  };

  const saveDraft = async (nextDraft = draft, { silent = false } = {}) => {
    const title = String(nextDraft.title || '').trim();
    const accessPassword = String(nextDraft.accessPassword || nextDraft.password || '').trim();
    if (!title) throw new Error('项目名称必填。');
    if (!accessPassword) throw new Error('进入密码必填。');

    const payload = serializeProjectPayload(makePrivateDraft({ ...nextDraft, title, accessPassword, password: accessPassword }));
    const endpoint = nextDraft.id ? `/projects/${nextDraft.id}` : '/projects';
    const method = nextDraft.id ? 'PUT' : 'POST';
    const saved = await fetchJson(endpoint, { method, data: payload });
    const normalizedSaved = makePrivateDraft(saved);
    setDraft(normalizedSaved);
    setProjectDirty(false);
    setLoadedPrivateProjects((prev) => {
      const others = prev.filter((item) => String(item.id) !== String(normalizedSaved.id));
      return [normalizedSaved, ...others];
    });
    await onRefresh?.();
    await loadPrivateProjects().catch(() => {});
    if (!silent) setState((prev) => ({ ...prev, notice: '私密交付项目已保存。' }));
    return normalizedSaved;
  };

  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      const saved = await saveDraft();
      setState((prev) => ({ ...prev, saving: false, notice: '私密交付项目已保存。' }));
      setSelectedProject(saved);
      setModalMode('workspace');
      return saved;
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || '保存失败。' }));
      return null;
    }
  };

  const ensureSavedProject = async () => {
    if (draft.id && !projectDirty) return draft;
    return saveDraft(draft, { silent: true });
  };

  const uploadDeliverable = async (file, kind = 'image', meta = {}) => {
    if (!file) return;
    setState((prev) => ({ ...prev, ...uploadPatch(file.name), notice: '' }));
    try {
      const ensuredProject = await ensureSavedProject();
      const mergedMeta = {
        ...meta,
        title: meta.title || uploadMeta.title || file.name,
        category: meta.category || uploadMeta.category || ensuredProject.category || 'Client Deliverables',
        description: meta.description || uploadMeta.description || '',
      };
      const clientFolder = String(ensuredProject.clientAgency || ensuredProject.customerName || ensuredProject.clientCode || ensuredProject.title || 'Client Deliverables').trim();
      const categoryFolder = String(mergedMeta.category || ensuredProject.category || 'Client Deliverables').trim();
      const { result, file: uploadFileObject } = await uploadMediaAsset(file, {
        type: 'private',
        root: 'Private Files',
        assetSpace: categoryFolder,
        category: categoryFolder,
        displayName: mergedMeta.title || file.name,
        onProgress: ({ stage, progress, fileName }) => setState((prev) => progressPatch(prev, stage, progress, fileName || file.name)),
        onStage: ({ stage, status, message, fileName }) => setState((prev) => ({ ...prev, uploadStage: stage, uploadStatus: message || status || `Processing ${fileName || file.name}...` })),
      });
      const resolvedKind = kind || (uploadFileObject?.type?.startsWith('video/') ? 'video' : 'image');
      const fileTitle = String(mergedMeta.title || uploadFileObject?.name || file.name || '').trim();
      const nextFile = {
        id: createLocalId('private-file'),
        title: fileTitle,
        label: fileTitle,
        description: String(mergedMeta.description || '').trim(),
        category: categoryFolder,
        clientFolder,
        url: result?.url,
        kind: resolvedKind,
        mediaType: resolvedKind,
        isPrivate: true,
        enabled: true,
      };
      const nextDraft = makePrivateDraft({ ...ensuredProject, privateFiles: [...(Array.isArray(ensuredProject.privateFiles) ? ensuredProject.privateFiles : []), nextFile] });
      const saved = await saveDraft(nextDraft, { silent: true });
      setState((prev) => ({ ...prev, uploading: false, uploadProgress: 100, uploadStage: 'done', uploadStatus: `Upload succeeded: ${result?.url || file.name}`, notice: '文件已上传并写入交付项目。' }));
      setDraft(saved);
      setUploadMeta((prev) => ({ ...prev, title: '', description: '' }));
    } catch (error) {
      setState((prev) => ({ ...prev, uploading: false, uploadProgress: 0, uploadStage: 'error', uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`, error: error.message || '上传失败。' }));
    }
  };

  const updatePrivateFile = (index, item) => {
    setProjectDirty(true);
    setDraft((prev) => makePrivateDraft({ ...prev, privateFiles: (prev.privateFiles || []).map((entry, i) => (i === index ? item : entry)) }));
  };

  const renameManagedFile = (project, fileIndex) => {
    const file = project?.privateFiles?.[fileIndex];
    if (!file) return;
    setRenameFileState({
      open: true,
      projectId: String(project.id || ''),
      fileIndex,
      value: String(file.title || file.label || ''),
    });
  };

  const saveRenamedFile = async () => {
    const { projectId, fileIndex, value } = renameFileState;
    const title = String(value || '').trim();
    if (!projectId || fileIndex < 0 || !title) return;
    const project = privateProjects.find((item) => String(item.id) === String(projectId));
    if (!project) return;
    const nextProject = {
      ...project,
      privateFiles: (project.privateFiles || []).map((item, index) => (index === fileIndex ? { ...item, title, label: title } : item)),
    };
    try {
      await persistManagedProject(nextProject);
      setRenameFileState({ open: false, projectId: '', fileIndex: -1, value: '' });
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || '重命名文件失败。' }));
    }
  };

  const deleteManagedFile = async (project, fileIndex) => {
    const nextProject = {
      ...project,
      privateFiles: (project.privateFiles || []).filter((_, index) => index !== fileIndex),
    };
    try {
      await persistManagedProject(nextProject);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || '删除文件失败。' }));
    }
  };

  const deleteManagedProject = (project) => {
    if (!window.confirm(`Delete private project “${project.title}”?`)) return;
    fetchJson(`/projects/${project.id}`, { method: 'DELETE' })
      .then(async () => {
        setLoadedPrivateProjects((prev) => prev.filter((item) => String(item.id) !== String(project.id)));
        await onRefresh?.();
      })
      .catch((error) => {
        setState((prev) => ({ ...prev, error: error.message || '删除项目失败。' }));
      });
  };

  const removePrivateFile = (index) => {
    setProjectDirty(true);
    setDraft((prev) => makePrivateDraft({ ...prev, privateFiles: (prev.privateFiles || []).filter((_, i) => i !== index) }));
  };
  const movePrivateFile = (from, to) => setDraft((prev) => {
    const items = [...(prev.privateFiles || [])];
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return prev;
    setProjectDirty(true);
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return makePrivateDraft({ ...prev, privateFiles: items });
  });

  const uploadModalOpen = modalMode === 'workspace';

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-400/10 via-white/[0.03] to-transparent p-4 md:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-violet-200/80">PRIVATE DELIVERABLES</p>
          <h2 className="mt-2 text-2xl tracking-[0.08em] text-white md:text-3xl">私密项目上传</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">项目操作已收进弹窗：新建或选择已有项目后进入上传流程，支持文件名称、分类和介绍，并可集中管理已上传私密文件。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={openNewProject}>新建项目</Button>
          <Button type="button" variant="subtle" onClick={openExistingSelector}>选择已有项目</Button>
          <Button type="button" variant="subtle" onClick={() => { loadPrivateProjects().catch(() => {}); setManagerOpen(true); }}>私密文件管理</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] tracking-[0.18em] text-zinc-500">私密项目</p>
          <p className="mt-2 text-2xl text-white">{privateProjects.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] tracking-[0.18em] text-zinc-500">私密文件</p>
          <p className="mt-2 text-2xl text-white">{privateProjects.reduce((sum, project) => sum + (Array.isArray(project.privateFiles) ? project.privateFiles.length : 0), 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] tracking-[0.18em] text-zinc-500">当前流程</p>
          <p className="mt-2 text-sm text-zinc-300">点击按钮进入弹窗后上传和保存。</p>
        </div>
      </div>

      <Modal open={uploadModalOpen} title="Private Deliverables Workspace" onClose={closeAllModals}>
        <div className="grid gap-5">
          <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Workspace</p>
                <h3 className="mt-1 text-lg tracking-[0.08em] text-white">{selectedProject ? 'Selected Project' : 'Create or Pick a Project'}</h3>
              </div>
              {draft.id ? <a className="text-xs uppercase tracking-[0.18em] text-violet-100/70 hover:text-white" href={`/client-deliverables/${draft.id}`} target="_blank" rel="noreferrer">打开交付页</a> : null}
            </div>

            {!selectedProject ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {privateProjects.length === 0 ? <p className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">暂无私密项目，请先新建。</p> : null}
                {privateProjects.map((project) => (
                  <button key={project.id} type="button" onClick={() => setSelectedProject(makePrivateDraft(cloneDraft(project)))} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-violet-200/40 hover:bg-white/[0.04]">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-violet-200/60">{project.category || 'Client Deliverables'}</p>
                    <h3 className="mt-2 text-lg tracking-[0.08em] text-white">{project.title}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{project.clientAgency || 'Private client'}</p>
                    <p className="mt-3 text-xs text-zinc-600">{Array.isArray(project.privateFiles) ? project.privateFiles.length : 0} files</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 md:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Current</p>
                  <h4 className="mt-2 text-xl tracking-[0.08em] text-white">{selectedProject.title}</h4>
                  <p className="mt-2 text-sm text-zinc-400">{selectedProject.clientAgency || 'Private client'}</p>
                  <p className="mt-2 text-xs text-zinc-600">{selectedProject.privateFiles?.length || 0} private files</p>
                </div>
                <div className="md:col-span-2 flex flex-wrap items-start justify-end gap-2">
                  <Button type="button" variant="subtle" onClick={() => setSelectedProject(null)}>切换项目</Button>
                  <Button type="button" variant="primary" onClick={() => { setDraft(selectedProject); setUploadMeta((prev) => ({ ...prev, category: selectedProject.category || prev.category || 'Client Deliverables' })); }}>加载到编辑区</Button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Project Level</p>
              <h3 className="mt-1 text-lg tracking-[0.08em] text-white">项目设置</h3>
            </div>
            <ProjectFields draft={draft} setDraft={(updater) => {
              setProjectDirty(true);
              setDraft(updater);
            }} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" variant="primary" onClick={handleSave} disabled={state.saving}>{state.saving ? 'SAVING...' : '保存项目'}</Button>
              {state.error ? <span className="text-sm text-rose-200">{state.error}</span> : null}
              {state.notice ? <span className="text-sm text-emerald-200">{state.notice}</span> : null}
              {projectDirty ? <span className="text-xs text-amber-200">项目已修改，上传前会自动保存。</span> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">Upload Metadata</p>
              <h3 className="mt-1 text-lg tracking-[0.08em] text-white">上传信息</h3>
              <p className="mt-1 text-sm text-zinc-500">这里设置将写入单个/批量上传文件的名称、分类和介绍。</p>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">客户目录</p>
                <p className="mt-2 text-sm text-zinc-200">{draft.clientAgency || draft.customerName || draft.clientCode || draft.title || 'Client Deliverables'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">分类目录</p>
                <p className="mt-2 text-sm text-zinc-200">{uploadMeta.category || draft.category || 'Client Deliverables'}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">文件名称</p>
                <Input value={uploadMeta.title} onChange={(event) => setUploadMeta((prev) => ({ ...prev, title: event.target.value }))} placeholder="留空则使用文件名" />
              </label>
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">文件分类</p>
                <Input value={uploadMeta.category} onChange={(event) => setUploadMeta((prev) => ({ ...prev, category: event.target.value }))} />
              </label>
              <label className="block md:col-span-1">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">文件介绍</p>
                <Textarea value={uploadMeta.description} onChange={(event) => setUploadMeta((prev) => ({ ...prev, description: event.target.value }))} />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <ProjectMediaUploader
              items={Array.isArray(draft.privateFiles) ? draft.privateFiles : []}
              uploading={state.uploading}
              progress={state.uploadProgress}
              uploadStage={state.uploadStage}
              uploadStatus={state.uploadStatus}
              uploadTarget="auto"
              onUpload={(file, kind, meta) => uploadDeliverable(file, kind, { ...uploadMeta, ...meta, category: meta.category || uploadMeta.category, description: meta.description || uploadMeta.description })}
              onRemove={removePrivateFile}
              onUpdate={(index, item) => {
                setProjectDirty(true);
                updatePrivateFile(index, item);
              }}
              onMoveUp={(index) => movePrivateFile(index, index - 1)}
              onMoveDown={(index) => movePrivateFile(index, index + 1)}
              onReorder={(from, to) => {
                setProjectDirty(true);
                movePrivateFile(from, to);
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="primary" onClick={handleSave} disabled={state.saving || !draft.id}>{state.saving ? 'SAVING...' : '保存当前文件列表'}</Button>
            </div>
          </section>
        </div>
      </Modal>

      <ManagerModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        projects={privateProjects}
        query={managerQuery}
        setQuery={setManagerQuery}
        selectedCategory={managerCategory}
        setSelectedCategory={setManagerCategory}
        onOpenProject={openManagerProject}
        onDeleteProject={deleteManagedProject}
        onEditFile={renameManagedFile}
        onDeleteFile={deleteManagedFile}
      />

      <RenameFileModal
        open={renameFileState.open}
        onClose={() => setRenameFileState({ open: false, projectId: '', fileIndex: -1, value: '' })}
        value={renameFileState.value}
        setValue={(nextValue) => setRenameFileState((prev) => ({ ...prev, value: nextValue }))}
        onSave={saveRenamedFile}
        fileLabel={(() => {
          const project = privateProjects.find((item) => String(item.id) === String(renameFileState.projectId));
          const file = project?.privateFiles?.[renameFileState.fileIndex];
          return file?.title || file?.label || '';
        })()}
      />
    </section>
  );
}
