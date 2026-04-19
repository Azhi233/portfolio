const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

export function getMediaKind(src = '', fallback = '') {
  const value = String(src || '').toLowerCase();
  if (!value) return fallback || 'unknown';
  if (VIDEO_EXT_RE.test(value) || value.includes('video')) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(value) || value.includes('image')) return 'image';
  return fallback || 'media';
}

export function getVideoSrcList(project) {
  const candidates = [project?.mainVideoUrl, project?.videoUrl, ...(Array.isArray(project?.btsMedia) ? project.btsMedia.map((item) => item?.url) : [])]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  return candidates;
}

function normalizeAspectRatio(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'square' || raw === '1:1') return 'aspect-square';
  if (raw === 'portrait' || raw === '3:4') return 'aspect-[3/4]';
  if (raw === 'landscape' || raw === '16:9') return 'aspect-video';
  if (raw === '4:3') return 'aspect-[4/3]';
  if (raw === '9:16') return 'aspect-[9/16]';
  if (raw === '21:9') return 'aspect-[21/9]';
  return '';
}

export function getMediaAspectRatioClass(project, src = '') {
  const explicit = [project?.videoAspectRatio, project?.aspectRatio, project?.mediaAspectRatio, project?.ratio]
    .map(normalizeAspectRatio)
    .find(Boolean);
  if (explicit) return explicit;

  const value = String(src || '').toLowerCase();
  if (value.includes('9x16') || value.includes('vertical') || value.includes('portrait')) return 'aspect-[9/16]';
  if (value.includes('4x3')) return 'aspect-[4/3]';
  if (value.includes('1x1') || value.includes('square')) return 'aspect-square';
  return 'aspect-video';
}
