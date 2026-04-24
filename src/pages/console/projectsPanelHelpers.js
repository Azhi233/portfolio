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
