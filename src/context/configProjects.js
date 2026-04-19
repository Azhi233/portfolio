import { PROJECT_UNLOCKS_STORAGE_KEY, writeLocalJson } from './configStorage.js';
import { normalizeProject } from './configNormalizers.js';

export function createProjectActions({
  getProjects,
  setProjects,
  fetchJson,
  persistConfigSnapshot,
  createId,
  getProjectUnlocks,
  setProjectUnlocks,
}) {
  const isUnlocked = (projectId) => Boolean(getProjectUnlocks()?.[String(projectId || '')]);

  const syncProjectUnlock = async (projectId, unlocked) => {
    const key = String(projectId || '').trim();
    if (!key) return;
    setProjectUnlocks((prev) => {
      const next = { ...prev, [key]: Boolean(unlocked) };
      writeLocalJson(PROJECT_UNLOCKS_STORAGE_KEY, next);
      return next;
    });
    await fetchJson('/project-unlocks', {
      method: 'POST',
      body: JSON.stringify({ projectId: key, unlocked: Boolean(unlocked) }),
    });
  };

  const saveProjectToServer = async (projectInput) => {
    const normalized = normalizeProject({ id: projectInput?.id || createId('proj'), ...projectInput });
    const exists = getProjects().some((item) => item.id === normalized.id);
    const data = await fetchJson(exists ? `/projects/${normalized.id}` : '/projects', {
      method: exists ? 'PUT' : 'POST',
      body: JSON.stringify(normalized),
    });
    const saved = normalizeProject(data || normalized);
    setProjects((prev) => {
      const found = prev.some((item) => item.id === saved.id);
      return found ? prev.map((item) => (item.id === saved.id ? saved : item)) : [...prev, saved];
    });
    return saved;
  };

  const addProject = (projectInput) => {
    const created = normalizeProject({
      id: createId('proj'),
      title: projectInput.title?.trim() || 'Untitled Project',
      category: projectInput.category || 'Misc',
      role: projectInput.role?.trim() || '',
      releaseDate: projectInput.releaseDate || '',
      coverUrl: projectInput.coverUrl?.trim() || '',
      thumbnailUrl: projectInput.thumbnailUrl?.trim() || projectInput.coverUrl?.trim() || '',
      videoUrl: projectInput.videoUrl?.trim() || '',
      mainVideoUrl: projectInput.mainVideoUrl?.trim() || projectInput.videoUrl?.trim() || '',
      btsMedia: Array.isArray(projectInput.btsMedia) ? projectInput.btsMedia : [],
      clientAgency: projectInput.clientAgency?.trim() || '',
      clientCode: projectInput.clientCode?.trim() || '',
      isFeatured: Boolean(projectInput.isFeatured),
      sortOrder: projectInput.sortOrder,
      description: projectInput.description?.trim() || '',
      credits: projectInput.credits?.trim() || '',
      isVisible: projectInput.isVisible !== undefined ? projectInput.isVisible : true,
      publishStatus: projectInput.publishStatus || 'Draft',
      visibility: projectInput.visibility || projectInput.publishStatus || 'Draft',
      accessPassword: projectInput.accessPassword?.trim() || projectInput.password?.trim() || '',
      deliveryPin: projectInput.deliveryPin?.trim() || '',
      status: projectInput.status,
      password: projectInput.password?.trim() || projectInput.accessPassword?.trim() || '',
    });
    setProjects((prev) => [...prev, created]);
    saveProjectToServer(created).catch((error) => console.error('Failed to persist new project:', error));
  };

  const updateProject = (projectId, updates) => {
    setProjects((prev) => {
      const nextProjects = prev.map((project) => (project.id !== projectId ? project : normalizeProject({ ...project, ...updates })));
      const target = nextProjects.find((project) => project.id === projectId);
      if (target) saveProjectToServer(target).catch((error) => console.error('Failed to persist project update:', error));
      return nextProjects;
    });
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    fetchJson(`/projects/${projectId}`, { method: 'DELETE' }).catch((error) => console.error('Failed to delete project on server:', error));
  };

  return {
    isUnlocked,
    syncProjectUnlock,
    saveProjectToServer,
    addProject,
    updateProject,
    deleteProject,
  };
}
