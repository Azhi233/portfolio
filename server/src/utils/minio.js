import path from 'node:path';
import { minioClient, minioPresignExpiresSeconds } from './minioClient.js';

export const PUBLIC_BUCKET = process.env.MINIO_PUBLIC_BUCKET || 'public-assets';
export const PRIVATE_BUCKET = process.env.MINIO_PRIVATE_BUCKET || 'private-docs';
export const MINIO_UPLOAD_PREFIX = process.env.MINIO_UPLOAD_PREFIX || 'portfolio';

function ensureClient() {
  if (!minioClient) {
    throw new Error('MinIO is not enabled.');
  }
}

function safeExt(fileName = '') {
  const ext = String(fileName).split('.').pop() || 'bin';
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

function safePathSegment(value = '', fallback = 'untitled') {
  const segment = String(value)
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[<>:"|?*]/g, '')
    // eslint-disable-next-line no-control-regex -- 需移除文件名字符串中的控制字符
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return segment || fallback;
}

function buildObjectName(fileName = '', options = {}) {
  const sections = Array.isArray(options.sections) ? options.sections : [];
  const normalizedSections = sections.map((segment) => safePathSegment(segment)).filter(Boolean);
  const displayName = String(options.displayName || path.parse(fileName).name || 'file').trim();
  const baseName = safePathSegment(displayName, 'file');
  const ext = safeExt(fileName);
  return path.posix.join(...normalizedSections, `${baseName}.${ext}`);
}

async function ensureBucket(bucketName) {
  ensureClient();
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, process.env.MINIO_REGION || '');
  }
}

function buildPublicReadPolicy(bucketName) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };
}

export async function initMinio() {
  ensureClient();
  await ensureBucket(PUBLIC_BUCKET);
  await ensureBucket(PRIVATE_BUCKET);
  await minioClient.setBucketPolicy(PUBLIC_BUCKET, JSON.stringify(buildPublicReadPolicy(PUBLIC_BUCKET)));
  await minioClient.setBucketPolicy(PRIVATE_BUCKET, JSON.stringify(buildPublicReadPolicy(PRIVATE_BUCKET)));
}

function normalizeBaseUrl(baseUrl = '') {
  const value = String(baseUrl || '').trim().replace(/\/+$/, '');
  return value;
}

function getPublicBaseUrl(options = {}) {
  return normalizeBaseUrl(
    options?.baseUrl ||
      process.env.MINIO_PUBLIC_BASE_URL ||
      process.env.PUBLIC_FILE_BASE_URL ||
      '',
  );
}

function buildPublicUrl(baseUrl, bucketName, objectName) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) return '';

  const bucketPrefix = `/${bucketName}`;
  const hasBucketPrefix = normalizedBaseUrl.endsWith(bucketPrefix) || normalizedBaseUrl.endsWith(`/${bucketName}/`);

  if (hasBucketPrefix) {
    return `${normalizedBaseUrl.replace(/\/+$/, '')}/${objectName}`;
  }

  return `${normalizedBaseUrl}/${bucketName}/${objectName}`;
}

export async function uploadFile(fileStream, fileName, isPrivate = false, contentType = 'application/octet-stream', options = {}) {
  ensureClient();
  const bucketName = isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const objectName = buildObjectName(fileName, options);
  await ensureBucket(bucketName);
  await minioClient.putObject(bucketName, objectName, fileStream, undefined, { 'Content-Type': contentType });

  const explicitBaseUrl = getPublicBaseUrl(options);
  if (explicitBaseUrl) {
    return { url: buildPublicUrl(explicitBaseUrl, bucketName, objectName), objectName, isPrivate };
  }

  const endpoint = process.env.MINIO_ENDPOINT || '';
  const port = process.env.MINIO_PORT || '9000';
  const useSSL = String(process.env.MINIO_USE_SSL || '').toLowerCase() === 'true';
  const protocol = useSSL ? 'https' : 'http';
  const host = port && !['80', '443'].includes(String(port)) ? `${endpoint}:${port}` : endpoint;
  return { url: `${protocol}://${host}/${bucketName}/${objectName}`, objectName, isPrivate };
}

export async function deleteObject(bucketName, objectName) {
  ensureClient();
  if (!bucketName || !objectName) {
    throw new Error('bucketName and objectName are required.');
  }
  await minioClient.removeObject(bucketName, objectName);
}

export async function getPresignedUrl(objectName) {
  ensureClient();
  await ensureBucket(PRIVATE_BUCKET);
  return minioClient.presignedGetObject(PRIVATE_BUCKET, objectName, minioPresignExpiresSeconds);
}
