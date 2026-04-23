import { PUBLIC_BUCKET, PRIVATE_BUCKET } from '../utils/minio.js';

export function parseJsonField(value, fallback = []) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function parseDisplayOn(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeKind(project = {}) {
  return String(project.kind || project.mediaType || (project.mainVideoUrl || project.videoUrl ? 'video' : 'image')).toLowerCase();
}

export function normalizeMediaType(project = {}) {
  return String(project.mediaType || project.kind || (project.mainVideoUrl || project.videoUrl ? 'video' : 'image')).toLowerCase();
}

export function inferVideoAspectRatio(value = '') {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  if (text.includes('9x16') || text.includes('vertical') || text.includes('portrait')) return '9:16';
  if (text.includes('21x9') || text.includes('ultrawide')) return '21:9';
  if (text.includes('4x3')) return '4:3';
  if (text.includes('1x1') || text.includes('square')) return '1:1';
  return '16:9';
}

export function attachVideoAspectRatio(project) {
  const ratio = project?.videoAspectRatio || inferVideoAspectRatio(project?.mainVideoUrl || project?.videoUrl || project?.coverUrl || project?.thumbnailUrl || '');
  return { ...project, videoAspectRatio: ratio };
}

export function extractObjectRef(url) {
  const value = String(url || '').trim();
  if (!value || !value.includes('/')) return null;
  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    const publicPrefix = `${PUBLIC_BUCKET}/`;
    const privatePrefix = `${PRIVATE_BUCKET}/`;
    if (pathname.startsWith(publicPrefix)) return { bucketName: PUBLIC_BUCKET, objectName: pathname.slice(publicPrefix.length) };
    if (pathname.startsWith(privatePrefix)) return { bucketName: PRIVATE_BUCKET, objectName: pathname.slice(privatePrefix.length) };
  } catch {
    return null;
  }
  return null;
}

export function normalizeRefs(items = []) {
  const refs = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (typeof item === 'string') {
      const ref = extractObjectRef(item);
      if (ref) refs.push(ref);
      continue;
    }
    [item?.url, item?.coverUrl, ...(item?.variants && typeof item.variants === 'object' ? Object.values(item.variants) : [])].forEach((value) => {
      const ref = extractObjectRef(value);
      if (ref) refs.push(ref);
    });
  }
  return refs;
}

export function buildProjectPayload(project, reqFile) {
  let coverUrl = String(project.coverUrl || project.thumbnailUrl || '').trim();
  let coverAssetUrl = String(project.coverAssetUrl || '').trim();
  let coverAssetObjectName = String(project.coverAssetObjectName || '').trim();
  let coverAssetFileType = String(project.coverAssetFileType || '').trim();
  let coverAssetIsPrivate = project.coverAssetIsPrivate === 'true' || project.coverAssetIsPrivate === true;

  if (reqFile) {
    return {
      coverUrl,
      coverAssetUrl,
      coverAssetObjectName,
      coverAssetFileType,
      coverAssetIsPrivate,
    };
  }

  return {
    coverUrl,
    coverAssetUrl,
    coverAssetObjectName,
    coverAssetFileType,
    coverAssetIsPrivate,
  };
}
