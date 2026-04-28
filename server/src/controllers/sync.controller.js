import { syncMediaAssetsFromMinio } from '../services/minioSync.service.js';

export function createSyncController() {
  async function syncMediaAssets(_req, res, next) {
    try {
      const result = await syncMediaAssetsFromMinio();
      return res.json({ ok: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  return { syncMediaAssets };
}
