function stripModuleSlotTag(description = '') {
  return String(description || '')
    .replace(/\s*#module:[a-z0-9_-]+\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildProjectDescriptionWithSlot(description = '', moduleSlot = '') {
  const clean = stripModuleSlotTag(description);
  const slot = String(moduleSlot || '').trim();
  if (!slot) return clean;
  return clean ? `${clean} #module:${slot}` : `#module:${slot}`;
}

export function getAssetUrlWarning(url, type) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) return '建议使用 http(s) 链接，当前可能无法在前台稳定访问。';
  if (/localhost|127\.0\.0\.1|192\.168\./i.test(value)) return '检测到本地/内网地址，线上访问时可能失效。';
  if (type === 'image' && /\.(mp4|webm|mov)(\?.*)?$/i.test(value)) return '当前类型是 Image，但 URL 更像视频资源。';
  if (type === 'video' && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(value)) return '当前类型是 Video，但 URL 更像图片资源。';
  return '';
}

export function getPublishTargetHint(publishTarget) {
  if (publishTarget === 'both') return '同步进入项目页与视频页';
  if (publishTarget === 'project') return '仅进入项目页';
  return '仅进入后台可见区';
}

export function inferAssetTypeFromUrl(url) {
  const value = String(url || '').trim().toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/.test(value)) return 'video';
  return 'image';
}

export function inferMediaGroup(type, url) {
  if (String(type || '').toLowerCase() === 'video') return 'video';
  return inferAssetTypeFromUrl(url) === 'video' ? 'video' : 'photo';
}

export function normalizeTagsInput(value) {
  return String(value || '')
    .split(/[\r\n,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseAssetNameToken(fileName) {
  const base = String(fileName || '').trim();
  if (!base) return null;

  const clean = base.replace(/\.[^.]+$/, '');
  const parts = clean.split('-').map((x) => x.trim()).filter(Boolean);
  if (parts.length < 8) return null;

  const [ym, product, theme, orientation, resolution, stage, seq, codec] = parts;
  const yy = ym.slice(0, 2);
  const mm = ym.slice(2, 4);
  const year = Number(`20${yy}`);
  const month = Number(mm);

  return {
    year: Number.isFinite(year) ? year : null,
    month: Number.isFinite(month) ? month : null,
    product,
    theme,
    orientation,
    resolution,
    stage,
    seq,
    codec,
    title: `${product?.toUpperCase() || 'ASSET'} · ${theme?.toUpperCase() || 'N/A'} · ${resolution || ''} ${orientation || ''}`.trim(),
  };
}

export function runProjectPreflight(projects = []) {
  const issues = [];

  projects.forEach((project) => {
    const title = String(project?.title || '').trim();
    const coverUrl = String(project?.coverUrl || '').trim();
    const videoUrl = String(project?.videoUrl || '').trim();
    const publishStatus = String(project?.publishStatus || 'Draft');
    const password = String(project?.accessPassword || '').trim();

    if (!title) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: 'error',
        code: 'TITLE_REQUIRED',
        message: 'Project title is required.',
      });
    }

    if (!coverUrl) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: publishStatus === 'Published' ? 'error' : 'warning',
        code: 'COVER_REQUIRED',
        message: 'Cover URL is empty.',
      });
    } else if (!/^https?:\/\//i.test(coverUrl)) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: publishStatus === 'Published' ? 'error' : 'warning',
        code: 'COVER_URL_INVALID',
        message: 'Cover URL should be http(s).',
      });
    }

    if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: 'warning',
        code: 'VIDEO_URL_INVALID',
        message: 'Video URL should be http(s).',
      });
    }

    if (publishStatus === 'Private') {
      if (!password) {
        issues.push({
          projectId: project?.id,
          projectTitle: project?.title || '(untitled)',
          severity: 'error',
          code: 'PRIVATE_PASSWORD_REQUIRED',
          message: 'Private project requires access password.',
        });
      } else if (password.length < 4) {
        issues.push({
          projectId: project?.id,
          projectTitle: project?.title || '(untitled)',
          severity: 'warning',
          code: 'PRIVATE_PASSWORD_WEAK',
          message: 'Private password is too short (< 4 chars).',
        });
      }
    }
  });

  return {
    checkedAt: new Date().toISOString(),
    totalProjects: projects.length,
    errorCount: issues.filter((x) => x.severity === 'error').length,
    warningCount: issues.filter((x) => x.severity === 'warning').length,
    issues,
  };
}
