export const blankDraft = {
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
      payload.append(key, JSON.stringify(Array.isArray(value) ? value : []));
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
