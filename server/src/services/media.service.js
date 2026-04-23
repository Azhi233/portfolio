import { readMediaAssets, upsertMediaAsset } from '../db/media.repository.js';

export async function listMediaAssets() {
  return readMediaAssets();
}

export async function createMediaAsset(payload) {
  return upsertMediaAsset(payload);
}
