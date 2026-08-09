import express from 'express';
import { PUBLIC_BUCKET, PRIVATE_BUCKET, deleteObject } from '../utils/minio.js';

const SAFE_PREFIX = 'portfolio/healthcheck';
const ALLOWED_BUCKETS = new Set([String(PUBLIC_BUCKET), String(PRIVATE_BUCKET)]);

function isSafeHealthcheckObject(objectName = '') {
  const value = String(objectName || '').trim();
  return value.startsWith(`${SAFE_PREFIX}/`) || value.startsWith(`${SAFE_PREFIX}-`);
}

export function createHealthcheckRouter(writeAuth) {
  const router = express.Router();

  // 挂写鉴权:匿名者不得删除对象;bucket 限制为站点自有桶
  router.delete('/minio-object', writeAuth, async (req, res) => {
    const { bucketName, objectName } = req.body || {};
    if (!bucketName || !objectName) {
      return res.status(400).json({ ok: false, message: 'bucketName and objectName are required.' });
    }
    const bucket = String(bucketName || '').trim();
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return res.status(403).json({ ok: false, message: `Refusing to delete object in bucket "${bucket}".` });
    }
    if (!isSafeHealthcheckObject(objectName)) {
      return res.status(403).json({ ok: false, message: 'Refusing to delete non-healthcheck object.' });
    }

    await deleteObject(bucket, objectName);
    return res.json({ ok: true, data: { bucketName: bucket, objectName } });
  });

  return router;
}
