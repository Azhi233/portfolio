import crypto from 'node:crypto';
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

function buildObjectName(fileName = '', isPrivate = false) {
  const bucketPrefix = isPrivate ? 'private' : 'public';
  const datePrefix = new Date().toISOString().slice(0, 10);
  const ext = safeExt(fileName);
  return path.posix.join(MINIO_UPLOAD_PREFIX, bucketPrefix, datePrefix, `${crypto.randomUUID()}.${ext}`);
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

export async function uploadFile(fileStream, fileName, isPrivate = false, contentType = 'application/octet-stream', options = {}) {
  ensureClient();
  const bucketName = isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const objectName = buildObjectName(fileName, isPrivate);
  await ensureBucket(bucketName);
  await minioClient.putObject(bucketName, objectName, fileStream, undefined, { 'Content-Type': contentType });

  if (!isPrivate) {
    const explicitBaseUrl = getPublicBaseUrl(options);
    if (explicitBaseUrl) {
      return { url: `${explicitBaseUrl}/${bucketName}/${objectName}`, objectName, isPrivate: false };
    }

    const endpoint = process.env.MINIO_ENDPOINT || '';
    const port = process.env.MINIO_PORT || '9000';
    const useSSL = String(process.env.MINIO_USE_SSL || '').toLowerCase() === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const host = port && !['80', '443'].includes(String(port)) ? `${endpoint}:${port}` : endpoint;
    return { url: `${protocol}://${host}/${bucketName}/${objectName}`, objectName, isPrivate: false };
  }

  const url = await minioClient.presignedGetObject(bucketName, objectName, minioPresignExpiresSeconds);
  return { url, objectName, isPrivate: true };
}

export async function getPresignedUrl(objectName) {
  ensureClient();
  await ensureBucket(PRIVATE_BUCKET);
  return minioClient.presignedGetObject(PRIVATE_BUCKET, objectName, minioPresignExpiresSeconds);
}
