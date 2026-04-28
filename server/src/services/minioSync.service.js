import path from 'node:path';
import { PUBLIC_BUCKET, PRIVATE_BUCKET } from '../utils/minio.js';
import { minioClient } from '../utils/minioClient.js';
import { upsertMediaAsset } from '../db/media.repository.js';

function normalizeSegment(value = '') {
  return String(value || '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function detectKind(fileName = '', contentType = '') {
  const lowerName = String(fileName).toLowerCase();
  const lowerType = String(contentType).toLowerCase();
  if (lowerType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(lowerName)) return 'image';
  return 'video';
}

function parseObjectName(objectName = '') {
  const parts = normalizeSegment(objectName).split('/').filter(Boolean);
  return {
    rootFolder: parts[0] || '',
    assetSpace: parts[1] || '',
    mediaTypeFolder: parts[2] || '',
    category: parts[3] || '',
    fileName: parts.at(-1) || '',
  };
}

async function collectObjects(bucketName) {
  return new Promise((resolve, reject) => {
    const items = [];
    const stream = minioClient.listObjectsV2(bucketName, '', true);
    stream.on('data', (obj) => items.push(obj));
    stream.on('error', reject);
    stream.on('end', () => resolve(items));
  });
}

export async function syncMediaAssetsFromMinio() {
  if (!minioClient) throw new Error('MinIO is not enabled.');

  const buckets = [PUBLIC_BUCKET, PRIVATE_BUCKET];
  const results = { scanned: 0, upserted: 0, buckets: [] };

  for (const bucketName of buckets) {
    const objects = await collectObjects(bucketName);
    results.buckets.push({ bucketName, count: objects.length });

    for (const object of objects) {
      if (!object?.name) continue;
      if (object.name.endsWith('/')) continue;
      results.scanned += 1;

      const parsed = parseObjectName(object.name);
      const kind = detectKind(object.name, object.metaData?.['content-type'] || '');
      const isPrivate = bucketName === PRIVATE_BUCKET || parsed.rootFolder === 'Private Files';
      const url = isPrivate ? '' : `${bucketName}/${object.name}`;

      await upsertMediaAsset({
        id: `${bucketName}:${object.name}`,
        kind,
        url,
        createdAt: object.lastModified || new Date(),
        meta: {
          bucketName,
          objectName: object.name,
          rootFolder: parsed.rootFolder,
          assetSpace: parsed.assetSpace,
          category: parsed.category,
          mediaType: kind,
          source: 'sync',
          syncedAt: new Date().toISOString(),
          size: object.size || 0,
          contentType: object.metaData?.['content-type'] || '',
          isPrivate,
          fileName: parsed.fileName,
        },
      });
      results.upserted += 1;
    }
  }

  return results;
}
