import { fetchJson } from '../utils/api.js';
import { createEditorLayoutFromPayload } from './console/editorData.js';

export async function loadPortfolioLayout() {
  try {
    const data = await fetchJson('/config/editor-layout');
    return createEditorLayoutFromPayload(data);
  } catch {
    return null;
  }
}

export function getSlotMedia(slot, fallback) {
  const value = slot || {};
  return {
    title: String(value.title || fallback?.title || '').trim(),
    text: String(value.text || fallback?.subtitle || '').trim(),
    mediaUrl: String(value.mediaUrl || fallback?.image || '').trim(),
    mediaType: String(value.mediaType || 'image').toLowerCase(),
    aspectRatio: value.aspectRatio || '4 / 3',
    cropX: Number.isFinite(Number(value.cropX)) ? Number(value.cropX) : 50,
    cropY: Number.isFinite(Number(value.cropY)) ? Number(value.cropY) : 50,
    scale: Number.isFinite(Number(value.scale)) ? Number(value.scale) : 1,
  };
}
