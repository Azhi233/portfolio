import { uploadMediaAsset } from './projectVideoUpload.js';

export async function uploadHomepageVideo(file, handlers = {}) {
  return uploadMediaAsset(file, { type: 'public', ...handlers });
}
