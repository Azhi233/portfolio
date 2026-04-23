import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import { uploadMediaAsset } from '../../utils/projectVideoUpload.js';
import { blankDraft, cloneDraft, serializeProjectPayload, upsertDraftMedia } from './projectsPanelHelpers.js';

export function useProjectsPanel(filterMode = 'all') {
  const [state, setState] = useState({
    loading: true,
    saving: false,
    uploading: false,
    uploadProgress: 0,
    uploadStage: 'idle',
    uploadStatus: '',
    uploadFailureStage: '',
    deleting: false,
    deleteStatus: '',
    error: '',
    items: [],
    query: '',
    category: 'all',
    isOpen: false,
    mode: 'create',
    draft: blankDraft,
    uploadTarget: 'auto',
    notice: '',
    noticeTone: 'success',
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '', notice: '' }));
    try {
      const items = await fetchJson(`/projects${filterMode && filterMode !== 'all' ? `?kind=${filterMode}` : ''}`);
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [], notice: '', uploadFailureStage: '' }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load projects.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, [filterMode]);

  const featuredVideos = useMemo(
    () => state.items.filter((item) => item.isFeatured && String(item.mediaType || item.kind || '').toLowerCase() === 'video').sort((a, b) => Number(a.featuredOrder || 999) - Number(b.featuredOrder || 999)),
    [state.items],
  );

  const liveCount = state.items.filter((item) => item.isVisible !== false).length;
  const filtered = useMemo(() => {
    const query = String(state.query || '').trim().toLowerCase();
    const items = state.items.filter((item) => {
      const matchesQuery =
        !query ||
        [item.title, item.description, item.category, item.clientAgency, item.clientCode].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = state.category === 'all' || String(item.category || 'Uncategorized') === state.category;
      return matchesQuery && matchesCategory;
    });
    const classify = (item) => String(item.mediaType || item.kind || (item.videoUrl || item.mainVideoUrl ? 'video' : 'image')).toLowerCase();
    if (filterMode === 'photos' || filterMode === 'images') return items.filter((item) => classify(item) === 'image');
    if (filterMode === 'videos') return items.filter((item) => classify(item) === 'video');
    if (filterMode === 'private') return items.filter((item) => String(item.visibility || '').toLowerCase() === 'private');
    return items;
  }, [state.items, state.query, state.category, filterMode]);

  const updateFeaturedOrder = async (nextOrder) => {
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      await Promise.all(
        nextOrder.map((projectId, index) => {
          const project = state.items.find((item) => String(item.id) === String(projectId));
          if (!project) return Promise.resolve();
          return fetchJson(`/projects/${project.id}`, { method: 'PUT', data: serializeProjectPayload(project, index + 1) });
        }),
      );
      await load();
      setState((prev) => ({ ...prev, saving: false, notice: 'Featured order updated.', noticeTone: 'success' }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to reorder featured videos.' }));
    }
  };


  const save = async () => {
    const draft = state.draft || {};
    if (!String(draft.title || '').trim()) return setState((prev) => ({ ...prev, error: 'Project title is required.' }));
    setState((prev) => ({ ...prev, saving: true, error: '', notice: '' }));
    try {
      const endpoint = state.mode === 'edit' && draft.id ? `/projects/${draft.id}` : '/projects';
      const method = state.mode === 'edit' ? 'PUT' : 'POST';
      await fetchJson(endpoint, { method, data: serializeProjectPayload(draft) });
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
      const { result, file: uploadFileObject } = await uploadMediaAsset(file, {
        type: 'public',
        onProgress: ({ stage, progress, fileName }) => setState((prev) => ({
          ...prev,
          uploadStage: stage,
          uploadProgress: Math.max(prev.uploadProgress, progress || 0),
          uploadStatus: stage === 'uploading-source' ? `Uploading source video ${fileName}...` : stage === 'uploading' ? `Uploading ${fileName}...` : stage === 'transcoding' ? `Transcoding ${fileName || file.name}...` : prev.uploadStatus,
        })),
        onStage: ({ stage, status, message, fileName }) => setState((prev) => ({
          ...prev,
          uploadStage: stage,
          uploadStatus: stage === 'transcoding' ? `Transcoding ${fileName || file.name} to MP4...` : stage === 'preparing' ? `Preparing ${fileName || file.name}...` : stage === 'writing-back' ? 'Writing uploaded media back to project...' : status === 'completed' ? 'Transcoding complete.' : message || prev.uploadStatus,
        })),
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
          kind: kind === 'video' ? 'video' : 'image',
          mediaType: kind === 'video' ? 'video' : 'image',
          displayOn: kind === 'video' ? ['home', 'videos'] : ['home', 'images'],
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
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'error', uploadFailureStage: 'transcoding', uploadProgress: 0, uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`, error: error.message || 'Failed to upload file.' }));
    }
  };

  const openNew = () => setState((prev) => ({ ...prev, isOpen: true, mode: 'create', draft: { ...blankDraft } }));
  const openEdit = (project) => setState((prev) => ({ ...prev, isOpen: true, mode: 'edit', draft: cloneDraft(project) }));
  const updateDraft = (patch) => setState((prev) => ({ ...prev, draft: upsertDraftMedia(prev.draft, patch) }));
  const toggleDisplayOn = (value, checked) => {
    setState((prev) => {
      const current = Array.isArray(prev.draft.displayOn) ? prev.draft.displayOn : [];
      const next = checked ? [...new Set([...current, value])] : current.filter((item) => item !== value);
      return { ...prev, draft: { ...prev.draft, displayOn: next } };
    });
  };

  const updateBtsMedia = (items) => setState((prev) => ({ ...prev, draft: { ...prev.draft, btsMedia: items } }));
  const addBtsItem = async (file, kind = 'image', meta = {}) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, uploadProgress: 0, uploadStage: 'preparing', uploadStatus: `Preparing ${file.name}...`, error: '', uploadFailureStage: '' }));
    try {
      const { result, file: uploadFileObject } = await uploadMediaAsset(file, {
        type: 'public',
        onProgress: ({ stage, progress, fileName }) => setState((prev) => ({ ...prev, uploadStage: stage, uploadProgress: Math.max(prev.uploadProgress, progress || 0), uploadStatus: stage === 'uploading-source' ? `Uploading source video ${fileName}...` : stage === 'uploading' ? `Uploading ${fileName}...` : stage === 'transcoding' ? `Transcoding ${fileName || file.name}...` : prev.uploadStatus })),
        onStage: ({ stage, status, message, fileName }) => setState((prev) => ({ ...prev, uploadStage: stage, uploadStatus: stage === 'transcoding' ? `Transcoding ${fileName || file.name} to MP4...` : stage === 'preparing' ? `Preparing ${fileName || file.name}...` : stage === 'writing-back' ? 'Writing uploaded media back to project...' : status === 'completed' ? 'Transcoding complete.' : message || prev.uploadStatus })),
      });
      const resolvedKind = meta.kind || kind || (uploadFileObject.type.startsWith('video/') ? 'video' : 'image');
      const nextItem = { id: crypto.randomUUID(), title: String(meta.title || uploadFileObject.name || '').trim(), label: String(meta.title || uploadFileObject.name || '').trim(), url: result?.url, kind: resolvedKind, mediaType: resolvedKind, displayOn: resolvedKind === 'video' ? ['home', 'videos'] : ['home', 'images'] };
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'done', uploadProgress: 100, uploadStatus: `Upload succeeded: ${result?.url || file.name}`, notice: 'BTS media uploaded successfully.', noticeTone: 'success', draft: { ...prev.draft, btsMedia: [...(Array.isArray(prev.draft.btsMedia) ? prev.draft.btsMedia : []), nextItem] } }));
    } catch (error) {
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'error', uploadFailureStage: 'transcoding', uploadProgress: 0, uploadStatus: `Upload failed: ${error.message || 'Unknown error'}`, error: error.message || 'Failed to upload BTS media.' }));
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
      const nextProject = {
        ...project,
        isFeatured: isEnabling,
        featuredOrder: nextFeaturedOrder,
      };

      await fetchJson(`/projects/${project.id}`, { method: 'PUT', data: serializeProjectPayload(nextProject) });

      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          String(item.id) === String(project.id)
            ? { ...item, isFeatured: isEnabling, featuredOrder: nextFeaturedOrder }
            : item,
        ),
      }));

      await load();
      setState((prev) => ({
        ...prev,
        saving: false,
        notice: isEnabling ? 'Added to featured videos.' : 'Removed from featured videos.',
        noticeTone: 'success',
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message || 'Failed to update featured status.' }));
    }
  };

  return { state, featuredVideos, liveCount, filtered, load, openNew, openEdit, updateDraft, toggleDisplayOn, updateFeaturedOrder, save, uploadAsset, addBtsItem, updateBtsMedia, remove, toggleFeatured, setState };
}
