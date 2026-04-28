import { uploadMediaAsset } from './projectVideoUpload.js';

export async function uploadHomepageVideo(file, handlers = {}) {
  return uploadMediaAsset(file, { type: 'public', root: 'Homepage Video', assetSpace: 'Homepage Video', category: 'Homepage Video', ...handlers });
}
