import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import { uploadMediaAsset } from '../../utils/projectVideoUpload.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Modal from '../../components/Modal.jsx';
import Textarea from '../../components/Textarea.jsx';
import ProjectMediaUploader from '../../components/ProjectMediaUploader.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import MediaPreview from '../../components/MediaPreview.jsx';

const blankDraft = {
  id: '',
  title: '',
  description: '',
  category: '',
  clientAgency: '',
  clientCode: '',
  accessPassword: '',
  isVisible: true,
  isFeatured: false,
  featuredOrder: '',
  visibility: 'Public',
  mainVideoUrl: '',
  videoUrl: '',
  btsMedia: [],
  privateFiles: [],
};

function cloneDraft(project) {
  return JSON.parse(JSON.stringify(project || blankDraft));
}

function ProjectsPanel({ filterMode = 'all' }) {
  const [state, setState] = useState({
    loading: true,
    saving: false,
    uploading: false,
    uploadProgress: 0,
    uploadStage: 'idle',
    uploadStatus: '',
    deleting: false,
    deleteStatus: '',
    error: '',
    items: [],
    query: '',
    category: 'all',
    isOpen: false,
    mode: 'create',
    draft: blankDraft,
    filterMode: 'all',
    uploadTarget: 'auto',
    notice: '',
    noticeTone: 'success',
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '', notice: '' }));
    try {
      const items = await fetchJson(`/projects${filterMode && filterMode !== 'all' ? `?kind=${filterMode}` : ''}`);
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [], notice: '' }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load projects.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, [filterMode]);

  const categories = useMemo(() => ['all', ...new Set(state.items.map((item) => item.category || 'Uncategorized'))], [state.items]);

  const featuredVideos = useMemo(
    () =>
      state.items
        .filter((item) => item.isFeatured)
        .sort((a, b) => Number(a.featuredOrder || 999) - Number(b.featuredOrder || 999)),
    [state.items],
  );

  const liveCount = state.items.filter((item) => item.isVisible !== false).length;
  const filtered = useMemo(() => {
    const query = String(state.query || '').trim().toLowerCase();
    const items = state.items.filter((item) => {
      const matchesQuery =
        !query ||
        [item.title, item.description, item.category, item.clientAgency, item.clientCode]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = state.category === 'all' || String(item.category || 'Uncategorized') === state.category;
      return matchesQuery && matchesCategory;
    });

    if (filterMode === 'photos') return items.filter((item) => !String(item.videoUrl || item.mainVideoUrl || '').trim());
    if (filterMode === 'videos') return items.filter((item) => Boolean(String(item.videoUrl || item.mainVideoUrl || '').trim()));
    return items;
  }, [state.items, state.query, state.category, filterMode]);

  const updateFeaturedOrder = async (nextOrder) => {
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      await Promise.all(
        nextOrder.map((projectId, index) => {
          const project = state.items.find((item) => String(item.id) === String(projectId));
          if (!project) return Promise.resolve();
          const payload = new FormData();
          Object.entries(project).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'btsMedia' || key === 'privateFiles' || key === 'outlineTags') {
              payload.append(key, JSON.stringify(Array.isArray(value) ? value : []));
              return;
            }
            if (typeof value === 'object') return;
            payload.append(key, String(key === 'featuredOrder' ? index + 1 : value));
          });
          return fetchJson(`/projects/${project.id}`, { method: 'PUT', data: payload });
        }),
      );
      await load();
      setState((prev) => ({ ...prev, saving: false, notice: 'Featured order updated.', noticeTone: 'success' }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to reorder featured videos.' }));
    }
  };

  const openNew = () =>
    setState((prev) => ({
      ...prev,
      isOpen: true,
      mode: 'create',
      draft: { ...blankDraft },
    }));

  const openEdit = (project) =>
    setState((prev) => ({
      ...prev,
      isOpen: true,
      mode: 'edit',
      draft: cloneDraft(project),
    }));

  const save = async () => {
    const draft = state.draft || {};
    if (!String(draft.title || '').trim()) {
      setState((prev) => ({ ...prev, error: 'Project title is required.' }));
      return;
    }

    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      const endpoint = state.mode === 'edit' && draft.id ? `/projects/${draft.id}` : '/projects';
      const method = state.mode === 'edit' ? 'PUT' : 'POST';
      const formData = new FormData();

      Object.entries(draft).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'btsMedia' || key === 'privateFiles' || key === 'outlineTags') {
          formData.append(key, JSON.stringify(Array.isArray(value) ? value : []));
          return;
        }
        if (typeof value === 'object') return;
        formData.append(key, String(value));
      });

      await fetchJson(endpoint, {
        method,
        data: formData,
      });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false, draft: { ...blankDraft }, notice: 'Project saved successfully.' }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save project.' }));
    }
  };

  const uploadAsset = async (file, kind = 'image', meta = {}) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, uploadProgress: 0, uploadStage: 'preparing', uploadStatus: `Preparing ${file.name}...`, error: '', uploadFailureStage: '', notice: '' }));
    try {
      const { result, file: uploadFileObject, converted } = await uploadMediaAsset(file, {
        type: 'public',
        onProgress: ({ stage, progress, fileName }) => {
          setState((prev) => ({
            ...prev,
            uploadStage: stage,
            uploadProgress: Math.max(prev.uploadProgress, progress || 0),
            uploadStatus:
              stage === 'uploading-source'
                ? `Uploading source video ${fileName}...`
                : stage === 'uploading'
                  ? `Uploading ${fileName}...`
                  : stage === 'transcoding'
                    ? `Transcoding ${fileName || file.name}...`
                    : prev.uploadStatus,
          }));
        },
        onStage: ({ stage, status, message, fileName }) => {
          setState((prev) => ({
            ...prev,
            uploadStage: stage,
            uploadStatus:
              stage === 'transcoding'
                ? `Transcoding ${fileName || file.name} to MP4...`
                : stage === 'preparing'
                  ? `Preparing ${fileName || file.name}...`
                  : stage === 'writing-back'
                    ? 'Writing uploaded media back to project...'
                    : status === 'completed'
                      ? 'Transcoding complete.'
                      : message || prev.uploadStatus,
          }));
        },
      });

      setState((prev) => ({ ...prev, uploadStage: 'writing-back', uploadStatus: 'Writing uploaded media back to project...' }));
      await new Promise((resolve) => setTimeout(resolve, 180));

      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'done',
        uploadProgress: 100,
        uploadStatus: `Upload succeeded: ${result?.url || uploadFileObject?.name || 'file ready'}`,
        notice: 'Media uploaded successfully.',
        noticeTone: 'success',
        draft: {
          ...prev.draft,
          title: meta.title ? String(meta.title).trim() || prev.draft.title : prev.draft.title,
          coverUrl: kind === 'image' ? result?.url : prev.draft.coverUrl,
          coverAssetUrl: kind === 'image' ? result?.url : prev.draft.coverAssetUrl,
          coverAssetObjectName: result?.objectName || prev.draft.coverAssetObjectName,
          coverAssetFileType: uploadFileObject?.type || prev.draft.coverAssetFileType || 'application/octet-stream',
          thumbnailUrl: kind === 'image' ? result?.url : prev.draft.thumbnailUrl,
          videoUrl: kind === 'video' ? result?.url : prev.draft.videoUrl,
          mainVideoUrl: kind === 'video' ? result?.url : prev.draft.mainVideoUrl,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'error',
        uploadFailureStage: 'transcoding',
        uploadProgress: 0,
        uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`,
        error: error.message || 'Failed to upload file.',
      }));
    }
  };

  const updateBtsMedia = (items) => setState((prev) => ({ ...prev, draft: { ...prev.draft, btsMedia: items } }));

  const addBtsItem = async (file, kind = 'image', meta = {}) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, uploadProgress: 0, uploadStage: 'preparing', uploadStatus: `Preparing ${file.name}...`, error: '', uploadFailureStage: '' }));
    try {
      const { result, file: uploadFileObject } = await uploadMediaAsset(file, {
        type: 'public',
        onProgress: ({ stage, progress, fileName }) => {
          setState((prev) => ({
            ...prev,
            uploadStage: stage,
            uploadProgress: Math.max(prev.uploadProgress, progress || 0),
            uploadStatus:
              stage === 'uploading-source'
                ? `Uploading source video ${fileName}...`
                : stage === 'uploading'
                  ? `Uploading ${fileName}...`
                  : stage === 'transcoding'
                    ? `Transcoding ${fileName || file.name}...`
                    : prev.uploadStatus,
          }));
        },
        onStage: ({ stage, status, message, fileName }) => {
          setState((prev) => ({
            ...prev,
            uploadStage: stage,
            uploadStatus:
              stage === 'transcoding'
                ? `Transcoding ${fileName || file.name} to MP4...`
                : stage === 'preparing'
                  ? `Preparing ${fileName || file.name}...`
                  : stage === 'writing-back'
                    ? 'Writing uploaded media back to project...'
                    : status === 'completed'
                      ? 'Transcoding complete.'
                      : message || prev.uploadStatus,
          }));
        },
      });

      const nextItem = {
        id: crypto.randomUUID(),
        title: String(meta.title || uploadFileObject.name || '').trim(),
        label: String(meta.title || uploadFileObject.name || '').trim(),
        url: result?.url,
        kind: meta.kind || kind || (uploadFileObject.type.startsWith('video/') ? 'video' : 'image'),
      };
      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'done',
        uploadProgress: 100,
        uploadStatus: `Upload succeeded: ${result?.url || file.name}`,
        notice: 'BTS media uploaded successfully.',
        noticeTone: 'success',
        draft: { ...prev.draft, btsMedia: [...(Array.isArray(prev.draft.btsMedia) ? prev.draft.btsMedia : []), nextItem] },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'error',
        uploadFailureStage: 'transcoding',
        uploadProgress: 0,
        uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`,
        error: error.message || 'Failed to upload BTS media.',
      }));
    }
  };

  const remove = async (projectId) => {
    if (!projectId) return;
    if (!window.confirm('Delete this project and its linked files?')) return;
    setState((prev) => ({ ...prev, deleting: true, deleteStatus: 'Deleting project and cleaning linked MinIO files...', error: '', notice: '' }));
    try {
      await fetchJson(`/projects/${projectId}`, { method: 'DELETE' });
      await load();
      setState((prev) => ({ ...prev, deleting: false, deleteStatus: 'Project and linked files removed.', notice: 'Project deleted successfully.', noticeTone: 'success' }));
    } catch (error) {
      setState((prev) => ({ ...prev, deleting: false, deleteStatus: '', error: error.message || 'Failed to delete project.', notice: 'Project deletion failed.', noticeTone: 'danger' }));
    }
  };

  const toggleFeatured = async (project) => {
    if (!project?.id) return;
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      const isEnabling = !project.isFeatured;
      const nextFeaturedOrder = isEnabling ? featuredVideos.length + 1 : '';
      const payload = new FormData();
      Object.entries({ ...project, isFeatured: isEnabling, featuredOrder: nextFeaturedOrder }).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'btsMedia' || key === 'privateFiles' || key === 'outlineTags') {
          payload.append(key, JSON.stringify(Array.isArray(value) ? value : []));
          return;
        }
        if (typeof value === 'object') return;
        payload.append(key, String(value));
      });

      await fetchJson(`/projects/${project.id}`, {
        method: 'PUT',
        data: payload,
      });
      await load();
      setState((prev) => ({
        ...prev,
        saving: false,
        notice: project.isFeatured ? 'Removed from featured videos.' : 'Added to featured videos.',
        noticeTone: 'success',
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to update featured status.' }));
    }
  };

  return (
    <>
      <Card className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-zinc-500">MODULE</p>
            <h2 className="mt-2 text-xl tracking-[0.08em] text-white">Projects</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">项目列表、公开状态与基础统计。</p>
          </div>
          <Badge tone="success">{liveCount} LIVE</Badge>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">FEATURED VIDEOS</p>
              <h3 className="mt-2 text-lg tracking-[0.08em] text-white">精选视频模块</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">在这里把视频单独加入精选区，视频页会优先展示这些条目。</p>
            </div>
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
          </div>

          {featuredVideos.length > 1 ? (
            <div className="mt-4 grid gap-3">
              {featuredVideos.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(item.id));
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = event.dataTransfer.getData('text/plain');
                    if (!sourceId || sourceId === String(item.id)) return;
                    const currentIds = featuredVideos.map((video) => String(video.id));
                    const sourceIndex = currentIds.indexOf(String(sourceId));
                    const targetIndex = currentIds.indexOf(String(item.id));
                    if (sourceIndex === -1 || targetIndex === -1) return;
                    const nextIds = [...currentIds];
                    const [moved] = nextIds.splice(sourceIndex, 1);
                    nextIds.splice(targetIndex, 0, moved);
                    updateFeaturedOrder(nextIds);
                  }}
                  className="flex cursor-grab items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 active:cursor-grabbing"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">#{index + 1}</p>
                    <p className="mt-1 text-sm tracking-[0.08em] text-white">{item.title}</p>
                  </div>
                  <Badge tone="warning">DRAG</Badge>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" onClick={openNew}>
            UPLOAD
          </Button>
        </div>

        {state.loading ? <p className="mt-4 text-sm text-zinc-400">Loading projects...</p> : null}
        {state.notice ? (
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${state.noticeTone === 'danger' ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'}`}>
            {state.notice}
          </p>
        ) : null}
        {state.error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}
        {state.deleting ? <p className="mt-4 text-sm text-zinc-400">{state.deleteStatus || 'Deleting project...'}</p> : null}
        {!state.deleting && state.deleteStatus ? <p className="mt-4 text-sm text-emerald-300">{state.deleteStatus}</p> : null}

        <div className="mt-4 grid gap-3">
          {filtered.length === 0 ? <p className="text-sm text-zinc-500">No matching projects.</p> : null}
          {filtered.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-zinc-500">{item.category || 'Uncategorized'}</p>
                  <p className="mt-2 text-sm tracking-[0.08em] text-white">{item.title}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={item.isVisible === false ? 'danger' : 'success'}>{item.isVisible === false ? 'HIDDEN' : 'LIVE'}</Badge>
                  {item.isFeatured ? <Badge tone="warning">FEATURED</Badge> : null}
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description || 'No description yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="subtle" onClick={() => openEdit(item)}>
                  EDIT
                </Button>
                <Button type="button" variant={item.isFeatured ? 'subtle' : 'primary'} onClick={() => toggleFeatured(item)}>
                  {item.isFeatured ? 'REMOVE FROM FEATURED' : 'ADD TO FEATURED'}
                </Button>
                <Button type="button" variant="danger" onClick={() => remove(item.id)}>
                  DELETE
                </Button>
              </div>
            </div>
          ))}
        </div>

      </Card>

      <Modal open={state.isOpen} title={state.mode === 'edit' ? 'Edit Project' : 'Create Project'} onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid gap-6">
            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-zinc-500">BASIC INFO</p>
                  <h3 className="mt-1 text-lg tracking-[0.08em] text-white">Project Details</h3>
                </div>
                <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
                  <Input value={state.draft.title} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, title: event.target.value } }))} />
                </label>
                <label className="block">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
                  <Input value={state.draft.category} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, category: event.target.value } }))} />
                </label>
                <label className="block">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Agency</p>
                  <Input value={state.draft.clientAgency || ''} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, clientAgency: event.target.value } }))} />
                </label>
                <label className="block">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Code</p>
                  <Input value={state.draft.clientCode || ''} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, clientCode: event.target.value } }))} />
                </label>
                <label className="block">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Password</p>
                  <Input value={state.draft.accessPassword || ''} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, accessPassword: event.target.value } }))} />
                </label>
                <label className="block md:col-span-2">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
                  <Textarea value={state.draft.description || ''} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, description: event.target.value } }))} />
                </label>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-zinc-500">MEDIA</p>
                  <h3 className="mt-1 text-lg tracking-[0.08em] text-white">Uploads</h3>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MediaPicker
                  label="Image Upload"
                  accept="image/*"
                  value={state.draft.coverUrl}
                  uploading={state.uploading}
                  progress={state.uploadProgress}
                  stage={state.uploadStage}
                  statusText={state.uploadStatus}
                  failedStage={state.uploadFailureStage}
                  helperText="图片会显示在图片页。"
                  onPick={(file) => uploadAsset(file, 'image')}
                />
                <MediaPicker
                  label="Video Upload"
                  accept="video/*"
                  value={state.draft.mainVideoUrl}
                  uploading={state.uploading}
                  progress={state.uploadProgress}
                  stage={state.uploadStage}
                  statusText={state.uploadStatus}
                  failedStage={state.uploadFailureStage}
                  helperText="视频会走转码逻辑并显示在视频页。"
                  onPick={(file) => uploadAsset(file, 'video')}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] tracking-[0.2em] text-zinc-500">FEATURED VIDEOS</p>
                <h4 className="mt-2 text-base tracking-[0.08em] text-white">精选视频模块</h4>
                <p className="mt-2 text-sm leading-7 text-zinc-400">在这里直接管理“精选视频”状态。勾选后，视频页会优先展示这些视频。</p>
              </div>
              <ProjectMediaUploader
                items={Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []}
                uploading={state.uploading}
                progress={state.uploadProgress}
                uploadStage={state.uploadStage}
                uploadStatus={state.uploadStatus}
                failedStage={state.uploadFailureStage}
                uploadTarget={state.uploadTarget}
                onUpload={(file, kind, meta) => addBtsItem(file, kind, meta)}
                onRemove={(index) => updateBtsMedia((Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []).filter((_, i) => i !== index))}
                onUpdate={(index, nextItem) => updateBtsMedia((Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []).map((item, i) => (i === index ? nextItem : item)))}
                onMoveUp={(index) => {
                  const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
                  if (index <= 0) return;
                  [items[index - 1], items[index]] = [items[index], items[index - 1]];
                  updateBtsMedia(items);
                }}
                onMoveDown={(index) => {
                  const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
                  if (index >= items.length - 1) return;
                  [items[index + 1], items[index]] = [items[index], items[index + 1]];
                  updateBtsMedia(items);
                }}
                onReorder={(from, to) => {
                  const items = Array.isArray(state.draft.btsMedia) ? [...state.draft.btsMedia] : [];
                  const [moved] = items.splice(from, 1);
                  items.splice(to, 0, moved);
                  updateBtsMedia(items);
                }}
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Cover Preview</p>
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <MediaPreview src={state.draft.coverUrl} title="Cover preview" />
                </div>
                <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(state.draft.isGroupCover)}
                    onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, isGroupCover: event.target.checked } }))}
                  />
                  <span>Mark this video as the group cover</span>
                </label>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Preview</p>
                <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <MediaPreview src={state.draft.mainVideoUrl} title="Video preview" />
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input type="checkbox" checked={Boolean(state.draft.isVisible)} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, isVisible: event.target.checked } }))} />
                <span className="text-sm text-zinc-300">Visible</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input type="checkbox" checked={Boolean(state.draft.isFeatured)} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, isFeatured: event.target.checked } }))} />
                <span className="text-sm text-zinc-300">Featured</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
                <span className="text-sm text-zinc-300">Featured Order</span>
                <Input
                  value={state.draft.featuredOrder || ''}
                  onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, featuredOrder: event.target.value } }))}
                  placeholder="Auto"
                />
              </label>
            </section>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <Button type="button" variant="subtle" onClick={() => setState((prev) => ({ ...prev, isOpen: false }))}>
            CANCEL
          </Button>
          <Button type="button" variant="primary" onClick={save}>
            {state.saving ? 'SAVING...' : 'SAVE PROJECT'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default ProjectsPanel;
