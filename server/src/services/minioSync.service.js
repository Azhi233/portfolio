import path from 'node:path';
import { PUBLIC_BUCKET, PRIVATE_BUCKET } from '../utils/minio.js';
import { minioClient } from '../utils/minioClient.js';
import { upsertMediaAsset } from '../db/media.repository.js';
import { getConfig, saveConfig } from './config.service.js';

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
    assetSpace: parts[0] || '',
    mediaTypeFolder: '',
    category: parts.length > 2 ? parts[parts.length - 2] : parts[1] || '',
    fileName: parts.at(-1) || '',
  };
}

function normalizeFolderName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '-');
}

function isHomepageVideoObject(parsed, objectName = '', kind = '') {
  if (kind !== 'video') return false;
  const normalizedRoot = normalizeFolderName(parsed.rootFolder);
  const normalizedPath = normalizeSegment(objectName).split('/').map(normalizeFolderName);
  return normalizedRoot === 'homepage-video' || normalizedPath.includes('homepage-video');
}

function getDisplayName(fileName = '') {
  return path.basename(String(fileName || ''), path.extname(String(fileName || ''))) || 'Homepage Video';
}

function buildPublicUrl(bucketName, objectName) {
  const explicitBaseUrl = String(process.env.MINIO_PUBLIC_BASE_URL || process.env.PUBLIC_FILE_BASE_URL || '').trim().replace(/\/+$/, '');
  if (explicitBaseUrl) return `${explicitBaseUrl}/${bucketName}/${objectName}`;
  const endpoint = process.env.MINIO_ENDPOINT || '';
  const port = process.env.MINIO_PORT || '9000';
  const useSSL = String(process.env.MINIO_USE_SSL || '').toLowerCase() === 'true';
  const protocol = useSSL ? 'https' : 'http';
  const host = port && !['80', '443'].includes(String(port)) ? `${endpoint}:${port}` : endpoint;
  return `${protocol}://${host}/${bucketName}/${objectName}`;
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
  const results = { scanned: 0, upserted: 0, homepageVideoUpdated: false, homepageVideo: null, buckets: [] };
  let latestHomepageVideo = null;

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
      const url = isPrivate ? '' : buildPublicUrl(bucketName, object.name);

      const syncedAt = new Date().toISOString();
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
          syncedAt,
          size: object.size || 0,
          contentType: object.metaData?.['content-type'] || '',
          isPrivate,
          fileName: parsed.fileName,
        },
      });
      results.upserted += 1;

      if (!isPrivate && url && isHomepageVideoObject(parsed, object.name, kind)) {
        const candidate = {
          title: getDisplayName(parsed.fileName),
          url,
          objectName: object.name,
          lastModified: object.lastModified || new Date(0),
        };
        if (!latestHomepageVideo || new Date(candidate.lastModified).getTime() > new Date(latestHomepageVideo.lastModified).getTime()) {
          latestHomepageVideo = candidate;
        }
      }
    }
  }

  if (latestHomepageVideo) {
    const currentConfig = await getConfig();
    const currentHomepageVideo = currentConfig?.['homepage-video'] && typeof currentConfig['homepage-video'] === 'object' ? currentConfig['homepage-video'] : {};
    const nextHomepageVideo = {
      ...currentHomepageVideo,
      homeVideoTitle: latestHomepageVideo.title,
      homeVideoUrl: latestHomepageVideo.url,
    };
    await saveConfig({ 'homepage-video': nextHomepageVideo });
    results.homepageVideoUpdated = true;
    results.homepageVideo = {
      title: latestHomepageVideo.title,
      url: latestHomepageVideo.url,
      objectName: latestHomepageVideo.objectName,
    };
  }

  return results;
}
