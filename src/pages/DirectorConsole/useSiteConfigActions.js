export function saveBulkProjectVideoUrls({
  bulkProjectVideoForm,
  setBulkProjectVideoError,
  updateProject,
  setBulkProjectVideoForm,
  emptyBulkProjectVideoForm,
}) {
  const projectId = String(bulkProjectVideoForm.projectId || '').trim();
  const urls = String(bulkProjectVideoForm.urlsText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!projectId) {
    setBulkProjectVideoError('请先选择目标项目。');
    return;
  }

  if (urls.length === 0) {
    setBulkProjectVideoError('请先粘贴至少一条视频 URL。');
    return;
  }

  const validUrls = urls.filter((url) => /^https?:\/\//i.test(url));
  if (validUrls.length === 0) {
    setBulkProjectVideoError('视频 URL 必须以 http(s) 开头。');
    return;
  }

  const uniqueUrls = [...new Set(validUrls)];
  updateProject(projectId, {
    videoUrl: uniqueUrls[0],
    mainVideoUrl: uniqueUrls[0],
    btsMedia: uniqueUrls,
  });

  setBulkProjectVideoError('');
  setBulkProjectVideoForm(emptyBulkProjectVideoForm);
}

export function syncProjectVideoUrl({ projectId, nextUrl, updateProject }) {
  if (!projectId) return;
  updateProject(projectId, {
    videoUrl: nextUrl,
    mainVideoUrl: nextUrl,
  });
}

export function applyVideoIntroChanges({ introTargetProject, introDraft, updateProject, trackEvent }) {
  if (!introTargetProject) return;

  const payload = {
    title: String(introDraft.title || '').trim(),
    description: String(introDraft.description || '').trim(),
    credits: String(introDraft.credits || '').trim(),
    role: String(introDraft.role || '').trim(),
    clientAgency: String(introDraft.clientAgency || '').trim(),
  };

  updateProject(introTargetProject.id, payload);
  trackEvent('video_intro_updated', {
    projectId: introTargetProject.id,
    title: payload.title,
  });
}

export function moveIntroProjectSelection({
  direction,
  sortedProjects,
  introProjectId,
  setIntroProjectId,
  setIntroDraft,
}) {
  const currentIndex = sortedProjects.findIndex((project) => project.id === introProjectId);
  if (currentIndex === -1) return;

  const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= sortedProjects.length) return;

  const target = sortedProjects[nextIndex];
  setIntroProjectId(target.id);
  setIntroDraft({
    title: target.title || '',
    description: target.description || '',
    credits: target.credits || '',
    role: target.role || '',
    clientAgency: target.clientAgency || '',
  });
}

export function saveAndGoToNextIntro({
  introTargetProject,
  applyVideoIntro,
  sortedProjects,
  introProjectId,
  setIntroProjectId,
  setIntroDraft,
}) {
  if (!introTargetProject) return;

  applyVideoIntro();

  const currentIndex = sortedProjects.findIndex((project) => project.id === introProjectId);
  const nextIndex = currentIndex + 1;
  if (nextIndex >= sortedProjects.length) return;

  const target = sortedProjects[nextIndex];
  setIntroProjectId(target.id);
  setIntroDraft({
    title: target.title || '',
    description: target.description || '',
    credits: target.credits || '',
    role: target.role || '',
    clientAgency: target.clientAgency || '',
  });
}
