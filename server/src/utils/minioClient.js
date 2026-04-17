import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const enabled = String(process.env.MINIO_ENABLED || '').toLowerCase() === 'true';
const endpoint = process.env.MINIO_ENDPOINT || '';
const port = Number(process.env.MINIO_PORT || '9000');
const useSSL = String(process.env.MINIO_USE_SSL || '').toLowerCase() === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || '';
const secretKey = process.env.MINIO_SECRET_KEY || '';

export const minioBucket = process.env.MINIO_BUCKET || '';
export const minioUploadPrefix = process.env.MINIO_UPLOAD_PREFIX || 'portfolio';
const MAX_MINIO_PRESIGN_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
const requestedMinioPresignExpiresSeconds = Number(process.env.MINIO_PRESIGN_EXPIRES_SECONDS || '86400');

export const minioPresignExpiresSeconds = Math.min(
  Number.isFinite(requestedMinioPresignExpiresSeconds) && requestedMinioPresignExpiresSeconds > 0
    ? requestedMinioPresignExpiresSeconds
    : 86400,
  MAX_MINIO_PRESIGN_EXPIRES_SECONDS,
);

export const minioClient = enabled && endpoint && accessKey && secretKey
  ? new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    })
  : null;
