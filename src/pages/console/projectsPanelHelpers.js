export const blankDraft = {
  id: '',
  title: '',
  description: '',
  category: '',
  clientAgency: '',
  clientCode: '',
  accessPassword: '',
  releaseDate: '',
  role: '',
  credits: '',
  deliveryPin: '',
  status: 'draft',
  outlineTags: [],
  isVisible: true,
  isFeatured: false,
  featuredOrder: '',
  visibility: 'public',
  kind: 'image',
  mediaType: 'image',
  displayOn: ['home', 'images'],
  mainVideoUrl: '',
  videoUrl: '',
  btsMedia: [],
  privateFiles: [],
};

export function cloneDraft(project) {
  return JSON.parse(JSON.stringify(project || blankDraft));
}

export function serializeProjectPayload(project, featuredOrderOverride) {
  const payload = new FormData();
  Object.entries(project || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'btsMedia' || key === 'privateFiles' || key === 'outlineTags' || key === 'displayOn') {
      const normalized = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
      payload.append(key, JSON.stringify(normalized));
      return;
    }
    if (typeof value === 'object') return;
    payload.append(key, String(key === 'featuredOrder' && featuredOrderOverride !== undefined ? featuredOrderOverride : value));
  });
  return payload;
}

export function upsertDraftMedia(draft, patch) {
  return { ...draft, ...patch };
}

export function applyDraftMediaSync(draft, patch) {
  return upsertDraftMedia(draft, patch);
}

export function swapBtsItems(items, from, to) {
  const next = Array.isArray(items) ? [...items] : [];
  if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function createNoticePatch(message, tone = 'success') {
  return (prev) => ({ ...prev, notice: message, noticeTone: tone, noticeId: prev.noticeId + 1 });
}

export function buildUploadedDraft(prevDraft, { kind, result, uploadFileObject, meta = {} }) {
  return {
    ...prevDraft,
    title: meta.title ? String(meta.title).trim() || prevDraft.title : prevDraft.title,
    kind: kind === 'video' ? 'video' : 'image',
    mediaType: kind === 'video' ? 'video' : 'image',
    displayOn: kind === 'video' ? ['home', 'videos'] : ['home', 'images'],
    coverUrl: kind === 'image' ? result?.url : prevDraft.coverUrl,
    coverAssetUrl: kind === 'image' ? result?.url : prevDraft.coverAssetUrl,
    coverAssetObjectName: result?.objectName || prevDraft.coverAssetObjectName,
    coverAssetFileType: uploadFileObject?.type || prevDraft.coverAssetFileType || 'application/octet-stream',
    thumbnailUrl: kind === 'image' ? result?.url : prevDraft.thumbnailUrl,
    videoUrl: kind === 'video' ? result?.url : prevDraft.videoUrl,
    mainVideoUrl: kind === 'video' ? result?.url : prevDraft.mainVideoUrl,
  };
}

export function patchFeaturedProject(items, projectId, isFeatured, featuredOrder) {
  return (Array.isArray(items) ? items : []).map((item) =>
    String(item.id) === String(projectId)
      ? { ...item, isFeatured, featuredOrder }
      : item,
  );
}

export function applyProjectDeletionNotice(success) {
  return createNoticePatch(success ? 'Project deleted successfully.' : 'Project deletion failed.', success ? 'success' : 'danger');
}

export function applyProjectSaveNotice() {
  return createNoticePatch('Saved.');
}

export function applyProjectUploadNotice(kind = 'image') {
  return createNoticePatch(kind === 'bts' ? 'BTS uploaded.' : 'Uploaded.');
}

export function applyFeaturedNotice(enabled) {
  return createNoticePatch(enabled ? 'Added to featured projects.' : 'Removed from featured projects.');
}

export function updateProjectListFeatured(items, projectId, isFeatured, featuredOrder) {
  return patchFeaturedProject(items, projectId, isFeatured, featuredOrder);
}
