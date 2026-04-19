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
  visibility: 'Public',
  mainVideoUrl: '',
  videoUrl: '',
  btsMedia: [],
  privateFiles: [],
};

function cloneDraft(project) {
  return JSON.parse(JSON.stringify(project || blankDraft));
}

function ProjectsPanel() {
  const [state, setState] = useState({
    loading: true,
    saving: false,
    uploading: false,
    uploadProgress: 0,
    uploadStage: 'idle',
    uploadStatus: '',
    deleting: false,
    error: '',
    items: [],
    query: '',
    category: 'all',
    isOpen: false,
    mode: 'create',
    draft: blankDraft,
    filterMode: 'all',
    uploadTarget: 'auto',
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson(`/projects${state.filterMode && state.filterMode !== 'all' ? `?kind=${state.filterMode}` : ''}`);
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load projects.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, [state.filterMode]);

  const categories = useMemo(() => ['all', ...new Set(state.items.map((item) => item.category || 'Uncategorized'))], [state.items]);

  const filtered = useMemo(() => {
    const query = state.query.trim().toLowerCase();
    return state.items.filter((item) => {
      const matchesCategory = state.category === 'all' || (item.category || 'Uncategorized') === state.category;
      const matchesQuery = !query || `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [state.category, state.items, state.query]);

  const liveCount = state.items.filter((item) => item.isVisible !== false).length;

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

    setState((prev) => ({ ...prev, saving: true, error: '' }));
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      setState((prev) => ({ ...prev, saving: false, isOpen: false, draft: { ...blankDraft } }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to save project.' }));
    }
  };

  const uploadAsset = async (file, kind = 'image') => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, uploadProgress: 0, uploadStage: 'preparing', uploadStatus: `Preparing ${file.name}...`, error: '', uploadFailureStage: '' }));
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
        draft: {
          ...prev.draft,
          coverUrl: kind === 'image' ? result?.url : prev.draft.coverUrl,
          coverAssetUrl: kind === 'image' ? result?.url : prev.draft.coverAssetUrl,
          coverAssetObjectName: result?.objectName || prev.draft.coverAssetObjectName,
          coverAssetFileType: uploadFileObject?.type || prev.draft.coverAssetFileType || 'application/octet-stream',
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

  const addBtsItem = async (file) => {
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
        title: uploadFileObject.name,
        label: uploadFileObject.name,
        url: result?.url,
        kind: uploadFileObject.type.startsWith('video/') ? 'video' : 'image',
      };
      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'done',
        uploadProgress: 100,
        uploadStatus: `Upload succeeded: ${result?.url || file.name}`,
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
    if (!window.confirm('Delete this project?')) return;
    setState((prev) => ({ ...prev, deleting: true, error: '' }));
    try {
      await fetchJson(`/projects/${projectId}`, { method: 'DELETE' });
      await load();
      setState((prev) => ({ ...prev, deleting: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, deleting: false, error: error.message || 'Failed to delete project.' }));
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant={state.filterMode === 'all' ? 'primary' : 'subtle'} onClick={() => setState((prev) => ({ ...prev, filterMode: 'all' }))}>ALL</Button>
          <Button type="button" variant={state.filterMode === 'photos' ? 'primary' : 'subtle'} onClick={() => setState((prev) => ({ ...prev, filterMode: 'photos' }))}>PHOTOS</Button>
          <Button type="button" variant={state.filterMode === 'videos' ? 'primary' : 'subtle'} onClick={() => setState((prev) => ({ ...prev, filterMode: 'videos' }))}>VIDEOS</Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input value={state.query} onChange={(event) => setState((prev) => ({ ...prev, query: event.target.value }))} placeholder="Search projects..." />
          <Select value={state.category} onChange={(event) => setState((prev) => ({ ...prev, category: event.target.value }))}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Button type="button" variant="subtle" onClick={load}>
            REFRESH
          </Button>
        </div>

        {state.loading ? <p className="mt-4 text-sm text-zinc-400">Loading projects...</p> : null}
        {state.error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}
        {state.deleting ? <p className="mt-4 text-sm text-zinc-400">Deleting project...</p> : null}

        <div className="mt-4 grid gap-3">
          {filtered.length === 0 ? <p className="text-sm text-zinc-500">No matching projects.</p> : null}
          {filtered.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-zinc-500">{item.category || 'Uncategorized'}</p>
                  <p className="mt-2 text-sm tracking-[0.08em] text-white">{item.title}</p>
                </div>
                <Badge tone={item.isVisible === false ? 'danger' : 'success'}>{item.isVisible === false ? 'HIDDEN' : 'LIVE'}</Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description || 'No description yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="subtle" onClick={() => openEdit(item)}>
                  EDIT
                </Button>
                <Button type="button" variant="default" onClick={() => remove(item.id)}>
                  DELETE
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="default" onClick={openNew}>
            NEW PROJECT
          </Button>
          <Button type="button" variant="subtle" onClick={load}>
            RELOAD
          </Button>
        </div>
      </Card>

      <Modal open={state.isOpen} title={state.mode === 'edit' ? 'Edit Project' : 'Create Project'} onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-4">
          <label className="block">
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
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
            <Textarea value={state.draft.description || ''} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, description: event.target.value } }))} />
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Upload Type</p>
              <Select value={state.uploadTarget} onChange={(event) => setState((prev) => ({ ...prev, uploadTarget: event.target.value }))}>
                <option value="auto">Auto detect</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </Select>
            </label>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-500">
              <p className="tracking-[0.12em] text-zinc-400">封面图可不传</p>
              <p className="mt-1">不上传封面图也可以保存项目。</p>
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
          <ProjectMediaUploader
            items={Array.isArray(state.draft.btsMedia) ? state.draft.btsMedia : []}
            uploading={state.uploading}
            progress={state.uploadProgress}
            uploadStage={state.uploadStage}
            uploadStatus={state.uploadStatus}
            failedStage={state.uploadFailureStage}
            uploadTarget={state.uploadTarget}
            onUpload={addBtsItem}
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Cover Preview</p>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <MediaPreview src={state.draft.coverUrl} title="Cover preview" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Preview</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <MediaPreview src={state.draft.mainVideoUrl} title="Video preview" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input type="checkbox" checked={Boolean(state.draft.isVisible)} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, isVisible: event.target.checked } }))} />
              <span className="text-sm text-zinc-300">Visible</span>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input type="checkbox" checked={Boolean(state.draft.isFeatured)} onChange={(event) => setState((prev) => ({ ...prev, draft: { ...prev.draft, isFeatured: event.target.checked } }))} />
              <span className="text-sm text-zinc-300">Featured</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
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
