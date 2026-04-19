import express from 'express';
import { deleteObject } from '../utils/minio.js';

const SAFE_PREFIX = 'portfolio/healthcheck';

function isSafeHealthcheckObject(objectName = '') {
  const value = String(objectName || '').trim();
  return value.startsWith(`${SAFE_PREFIX}/`) || value.startsWith(`${SAFE_PREFIX}-`);
}

export function createHealthcheckRouter() {
  const router = express.Router();

  router.delete('/minio-object', async (req, res) => {
    const { bucketName, objectName } = req.body || {};
    if (!bucketName || !objectName) {
      return res.status(400).json({ ok: false, message: 'bucketName and objectName are required.' });
    }
    if (!isSafeHealthcheckObject(objectName)) {
      return res.status(403).json({ ok: false, message: 'Refusing to delete non-healthcheck object.' });
    }

    await deleteObject(bucketName, objectName);
    return res.json({ ok: true, data: { bucketName, objectName } });
  });

  return router;
}
