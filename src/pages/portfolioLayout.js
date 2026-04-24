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

export function subscribePortfolioLayoutUpdates(onUpdate) {
  let eventSource = null;
  try {
    eventSource = new EventSource('/api/events');
  } catch {
    return () => {};
  }

  const handleLayoutUpdate = async () => {
    try {
      const next = await loadPortfolioLayout();
      onUpdate?.(next);
    } catch {
      // ignore refresh failures
    }
  };

  const handleMessage = (event) => {
    if (!event?.data) return;
    try {
      const payload = JSON.parse(event.data);
      const eventName = String(payload?.event || payload?.type || '').toLowerCase();
      if (eventName.includes('config') || eventName.includes('editor') || eventName.includes('layout')) {
        void handleLayoutUpdate();
      }
    } catch {
      // ignore malformed events
    }
  };

  eventSource.addEventListener('message', handleMessage);
  eventSource.addEventListener('config', handleLayoutUpdate);
  eventSource.addEventListener('editorLayout', handleLayoutUpdate);
  eventSource.addEventListener('layout', handleLayoutUpdate);

  return () => {
    eventSource?.removeEventListener('message', handleMessage);
    eventSource?.removeEventListener('config', handleLayoutUpdate);
    eventSource?.removeEventListener('editorLayout', handleLayoutUpdate);
    eventSource?.removeEventListener('layout', handleLayoutUpdate);
    eventSource?.close?.();
  };
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
