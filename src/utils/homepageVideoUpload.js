import { uploadMediaAsset } from './projectVideoUpload.js';

export async function uploadHomepageVideo(file, handlers = {}) {
  const displayName = String(handlers.displayName || handlers.title || file?.name || 'Homepage Video').trim() || 'Homepage Video';
  return uploadMediaAsset(file, { type: 'public', root: 'Homepage Video', assetSpace: 'Homepage Video', category: 'Homepage Video', ...handlers, displayName });
}
