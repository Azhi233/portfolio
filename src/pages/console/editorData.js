export const editorMediaSlots = [
  { id: 'hero-title', group: 'Hero', order: 0, label: 'Hero 主标题区', description: '首页首屏中间的标题与文案。', position: '首页 Hero 中间文案区', type: 'image', aspectRatio: '4 / 5' },
  { id: 'hero-background', group: 'Hero', order: 1, label: 'Hero 背景图', description: '首页首屏的淡背景大图。', position: '首页 Hero 背景层', type: 'image', aspectRatio: '16 / 9' },
  { id: 'hero-secondary', group: 'Hero', order: 2, label: 'Hero 右侧辅助图', description: '首页首屏右侧的小图。', position: '首页 Hero 右侧展示位', type: 'image', aspectRatio: '3 / 4' },
  { id: 'work-1', group: 'Work', order: 3, label: '作品图 1', description: '首页作品区第一张卡片。', position: '首页 Work 区第 1 张卡片', type: 'image', aspectRatio: '4 / 5' },
  { id: 'work-2', group: 'Work', order: 4, label: '作品图 2', description: '首页作品区第二张卡片。', position: '首页 Work 区第 2 张卡片', type: 'image', aspectRatio: '4 / 5' },
  { id: 'work-3', group: 'Work', order: 5, label: '作品视频 3', description: '首页作品区第三张卡片，适合视频。', position: '首页 Work 区第 3 张卡片', type: 'video', aspectRatio: '16 / 9' },
];

export function getDefaultSlotOrder() {
  return [...editorMediaSlots].sort((a, b) => (a.order || 0) - (b.order || 0)).map((slot) => slot.id);
}

export function getSlotsInOrder(order = []) {
  const byId = new Map(editorMediaSlots.map((slot) => [slot.id, slot]));
  return order.map((id, index) => ({ ...(byId.get(id) || {}), order: index })).filter((slot) => slot.id);
}

export function createInitialEditorState() {
  return editorMediaSlots.reduce((acc, slot) => {
    acc[slot.id] = {
      enabled: true,
      mediaId: '',
      mediaUrl: '',
      mediaType: slot.type,
      aspectRatio: slot.aspectRatio,
      cropX: 50,
      cropY: 50,
      scale: 1,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
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

export function buildEditorLayoutPayload(slots, order = getDefaultSlotOrder()) {
  return {
    order,
    slots: order.map((slotId) => {
      const slot = editorMediaSlots.find((item) => item.id === slotId);
      const value = slots?.[slotId] || {};
      if (!slot) return null;
      return {
        id: slot.id,
        group: slot.group,
        order: order.indexOf(slotId),
        label: slot.label,
        type: slot.type,
        aspectRatio: value.aspectRatio || slot.aspectRatio,
        enabled: value.enabled !== false,
        mediaId: value.mediaId || '',
        mediaUrl: value.mediaUrl || '',
        mediaType: value.mediaType || slot.type,
        cropX: Number.isFinite(Number(value.cropX)) ? Number(value.cropX) : 50,
        cropY: Number.isFinite(Number(value.cropY)) ? Number(value.cropY) : 50,
        scale: Number.isFinite(Number(value.scale)) ? Number(value.scale) : 1,
        width: Number.isFinite(Number(value.width)) ? Number(value.width) : 100,
        height: Number.isFinite(Number(value.height)) ? Number(value.height) : 100,
        x: Number.isFinite(Number(value.x)) ? Number(value.x) : 0,
        y: Number.isFinite(Number(value.y)) ? Number(value.y) : 0,
        title: String(value.title || slot.label),
        text: String(value.text || slot.label),
      };
    }).filter(Boolean),
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
