export const editorMediaSlots = [
  { id: 'hero-left', label: 'Hero Left', type: 'image', aspectRatio: '4 / 5' },
  { id: 'hero-right', label: 'Hero Right', type: 'image', aspectRatio: '3 / 4' },
  { id: 'feature-video', label: 'Featured Video', type: 'video', aspectRatio: '16 / 9' },
  { id: 'gallery-1', label: 'Gallery 01', type: 'image', aspectRatio: '1 / 1' },
  { id: 'gallery-2', label: 'Gallery 02', type: 'image', aspectRatio: '4 / 3' },
  { id: 'gallery-3', label: 'Gallery 03', type: 'video', aspectRatio: '9 / 16' },
];

export function createInitialEditorState() {
  return editorMediaSlots.reduce((acc, slot) => {
    acc[slot.id] = {
      mediaId: '',
      mediaUrl: '',
      mediaType: slot.type,
      aspectRatio: slot.aspectRatio,
      cropX: 50,
      cropY: 50,
      scale: 1,
      title: slot.label,
      text: slot.label,
    };
    return acc;
  }, {});
}

export function normalizeMediaItem(item) {
  return {
    id: String(item?.id || item?.objectName || item?.url || crypto.randomUUID()),
    title: String(item?.title || item?.name || 'Untitled').trim(),
    url: String(item?.url || '').trim(),
    type: String(item?.type || item?.mediaType || item?.kind || (String(item?.url || '').match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image')).toLowerCase(),
    thumbnailUrl: String(item?.thumbnailUrl || item?.url || '').trim(),
  };
}

export function applySlotPatch(current, patch) {
  return { ...current, ...patch };
}

export function buildEditorLayoutPayload(slots) {
  return {
    slots: editorMediaSlots.map((slot) => {
      const value = slots?.[slot.id] || {};
      return {
        id: slot.id,
        label: slot.label,
        type: slot.type,
        aspectRatio: value.aspectRatio || slot.aspectRatio,
        mediaId: value.mediaId || '',
        mediaUrl: value.mediaUrl || '',
        mediaType: value.mediaType || slot.type,
        cropX: Number.isFinite(Number(value.cropX)) ? Number(value.cropX) : 50,
        cropY: Number.isFinite(Number(value.cropY)) ? Number(value.cropY) : 50,
        scale: Number.isFinite(Number(value.scale)) ? Number(value.scale) : 1,
        title: String(value.title || slot.label),
        text: String(value.text || slot.label),
      };
    }),
  };
}

export function createEditorLayoutFromPayload(payload) {
  const next = createInitialEditorState();
  const slots = Array.isArray(payload?.slots) ? payload.slots : [];
  for (const item of slots) {
    if (!item?.id || !next[item.id]) continue;
    next[item.id] = {
      ...next[item.id],
      ...item,
    };
  }
  return next;
}
