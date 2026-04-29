import { useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
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

export default function PrivateDeliverablesPanel({ projects = [], onRefresh }) {
  const privateProjects = useMemo(() => projects.filter((item) => String(item.visibility || '').toLowerCase() === 'private'), [projects]);
  const [mode, setMode] = useState('new');
  const [draft, setDraft] = useState(makePrivateDraft());
  const [state, setState] = useState({ saving: false, uploading: false, uploadProgress: 0, uploadStage: 'idle', uploadStatus: '', error: '', notice: '' });

  const selectProject = (projectId) => {
    const selected = privateProjects.find((item) => String(item.id) === String(projectId));
    if (selected) setDraft(makePrivateDraft(cloneDraft(selected)));
  };

  const saveDraft = async (nextDraft = draft) => {
    const title = String(nextDraft.title || '').trim();
    const accessPassword = String(nextDraft.accessPassword || nextDraft.password || '').trim();
    if (!title) throw new Error('项目名称必填。');
    if (!accessPassword) throw new Error('进入密码必填。');

    const payload = serializeProjectPayload(makePrivateDraft({ ...nextDraft, title, accessPassword, password: accessPassword }));
    const endpoint = nextDraft.id ? `/projects/${nextDraft.id}` : '/projects';
    const method = nextDraft.id ? 'PUT' : 'POST';
    const saved = await fetchJson(endpoint, { method, data: payload });
    setDraft(makePrivateDraft(saved));
    await onRefresh?.();
    return makePrivateDraft(saved);
  };

  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      await saveDraft();
      setState((prev) => ({ ...prev, saving: false, notice: '私密交付项目已保存。' }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || '保存失败。' }));
    }
  };

  const uploadDeliverable = async (file, kind = 'image', meta = {}) => {
    if (!file) return;
    setState((prev) => ({ ...prev, ...uploadPatch(file.name), notice: '' }));
    try {
      const ensuredProject = draft.id ? draft : await saveDraft(draft);
      const { result, file: uploadFileObject } = await uploadMediaAsset(file, {
        type: 'private',
        root: 'Private Files',
        assetSpace: 'Private Files',
        category: ensuredProject.title || 'Client Deliverables',
        displayName: meta.title || meta.displayName || file.name,
        onProgress: ({ stage, progress, fileName }) => setState((prev) => progressPatch(prev, stage, progress, fileName || file.name)),
        onStage: ({ stage, status, message, fileName }) => setState((prev) => ({ ...prev, uploadStage: stage, uploadStatus: message || status || `Processing ${fileName || file.name}...` })),
      });
      const resolvedKind = kind || (uploadFileObject?.type?.startsWith('video/') ? 'video' : 'image');
      const nextFile = {
        id: crypto.randomUUID(),
        title: String(meta.title || uploadFileObject?.name || file.name || '').trim(),
        label: String(meta.title || uploadFileObject?.name || file.name || '').trim(),
        url: result?.url,
        kind: resolvedKind,
        mediaType: resolvedKind,
        isPrivate: true,
        enabled: true,
      };
      const nextDraft = makePrivateDraft({ ...ensuredProject, privateFiles: [...(Array.isArray(ensuredProject.privateFiles) ? ensuredProject.privateFiles : []), nextFile] });
      const saved = await saveDraft(nextDraft);
      setState((prev) => ({ ...prev, uploading: false, uploadProgress: 100, uploadStage: 'done', uploadStatus: `Upload succeeded: ${result?.url || file.name}`, notice: '文件已上传并写入交付项目。' }));
      setDraft(saved);
    } catch (error) {
      setState((prev) => ({ ...prev, uploading: false, uploadProgress: 0, uploadStage: 'error', uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`, error: error.message || '上传失败。' }));
    }
  };

  const updatePrivateFile = (index, item) => setDraft((prev) => makePrivateDraft({ ...prev, privateFiles: (prev.privateFiles || []).map((entry, i) => (i === index ? item : entry)) }));
  const removePrivateFile = (index) => setDraft((prev) => makePrivateDraft({ ...prev, privateFiles: (prev.privateFiles || []).filter((_, i) => i !== index) }));
  const movePrivateFile = (from, to) => setDraft((prev) => {
    const items = [...(prev.privateFiles || [])];
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return prev;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return makePrivateDraft({ ...prev, privateFiles: items });
  });

  return (
    <section className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-400/10 via-white/[0.03] to-transparent p-4 md:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-violet-200/80">PRIVATE DELIVERABLES</p>
          <h2 className="mt-2 text-2xl tracking-[0.08em] text-white md:text-3xl">私密项目上传</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">先新建或选择已有私密项目，在项目层级设置项目名称、客户名称和进入密码，再单个或批量上传到 MinIO Private Files。</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant={mode === 'new' ? 'primary' : 'subtle'} onClick={() => { setMode('new'); setDraft(makePrivateDraft()); }}>新建项目</Button>
          <Button type="button" variant={mode === 'existing' ? 'primary' : 'subtle'} onClick={() => setMode('existing')}>选择已有</Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        {mode === 'existing' ? (
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">已有私密项目</p>
            <select className="w-full rounded-2xl border border-white/10 bg-[#0c0d10] px-4 py-3 text-sm text-zinc-100 outline-none" value={draft.id || ''} onChange={(event) => selectProject(event.target.value)}>
              <option value="">选择项目</option>
              {privateProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </label>
        ) : null}

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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={handleSave} disabled={state.saving}>{state.saving ? 'SAVING...' : '保存项目设置'}</Button>
          {draft.id ? <a className="text-xs uppercase tracking-[0.18em] text-violet-100/70 hover:text-white" href={`/client-deliverables/${draft.id}`} target="_blank" rel="noreferrer">打开交付页</a> : null}
        </div>

        {state.error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">{state.error}</p> : null}
        {state.notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">{state.notice}</p> : null}

        <ProjectMediaUploader
          items={Array.isArray(draft.privateFiles) ? draft.privateFiles : []}
          uploading={state.uploading}
          progress={state.uploadProgress}
          uploadStage={state.uploadStage}
          uploadStatus={state.uploadStatus}
          uploadTarget="auto"
          onUpload={(file, kind, meta) => uploadDeliverable(file, kind, meta)}
          onRemove={removePrivateFile}
          onUpdate={updatePrivateFile}
          onMoveUp={(index) => movePrivateFile(index, index - 1)}
          onMoveDown={(index) => movePrivateFile(index, index + 1)}
          onReorder={movePrivateFile}
        />
      </div>
    </section>
  );
}
