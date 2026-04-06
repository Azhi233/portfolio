import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CONFIG_STORAGE_KEY = 'director.config.v1';
const PROJECTS_STORAGE_KEY = 'director.projects.v1';

const DEFAULT_CONFIG = {
  vignetteIntensity: 0.8,
  filmGrainOpacity: 0.03,
  spotlightRadius: 600,
  parallaxSpeed: 1.5,
  defaultRatio: '2.35:1',
  showHUD: true,
};

const VALID_CATEGORIES = ['Toys', 'Industrial', 'Misc'];
const VALID_PUBLISH_STATUS = ['Draft', 'Published'];

const DEFAULT_PROJECTS = [
  {
    id: 'proj-toys-1',
    title: 'Neon Toy Odyssey',
    category: 'Toys',
    coverUrl: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://vimeo.com/76979871',
    isFeatured: true,
    sortOrder: 0,
    description: '一支以微缩玩具为主角的夜色旅程，强调反射材质与低照度霓虹氛围。',
    credits: 'Client: Personal Work | Director: Director.Vision',
    isVisible: true,
    publishStatus: 'Published',
  },
  {
    id: 'proj-industrial-1',
    title: 'Forged in Motion',
    category: 'Industrial',
    coverUrl: 'https://images.unsplash.com/photo-1581091215367-59ab6b1b0c72?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    isFeatured: false,
    sortOrder: 1,
    description: '聚焦金属、蒸汽与机械臂运动节奏的工业品牌短片实验。',
    credits: 'Client: Demo Brand | DP: John Doe | Colorist: Jane Doe',
    isVisible: true,
    publishStatus: 'Published',
  },
  {
    id: 'proj-misc-1',
    title: 'Midnight City Fragments',
    category: 'Misc',
    coverUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://vimeo.com/22439234',
    isFeatured: true,
    sortOrder: 2,
    description: '午夜街区观察计划，记录城市碎片在冷暖色温中的情绪变化。',
    credits: 'Director: Director.Vision | Music: Archive',
    isVisible: true,
    publishStatus: 'Published',
  },
  {
    id: 'proj-toys-2',
    title: 'Plastic Hero Recut',
    category: 'Toys',
    coverUrl: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    isFeatured: false,
    sortOrder: 3,
    description: '更强调动作切分与镜头冲击感的玩具动作短片重剪版本。',
    credits: 'Client: Personal Work | Edit: Director.Vision',
    isVisible: true,
    publishStatus: 'Draft',
  },
];

const ConfigContext = createContext(null);

function normalizeSortOrder(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

function normalizeProject(project) {
  return {
    id: String(project?.id || ''),
    title: String(project?.title || 'Untitled Project'),
    category: VALID_CATEGORIES.includes(project?.category) ? project.category : 'Misc',
    coverUrl: String(project?.coverUrl || ''),
    videoUrl: String(project?.videoUrl || ''),
    isFeatured: Boolean(project?.isFeatured),
    sortOrder: normalizeSortOrder(project?.sortOrder),
    description: String(project?.description || ''),
    credits: String(project?.credits || ''),
    isVisible: project?.isVisible !== undefined ? Boolean(project.isVisible) : true,
    publishStatus: VALID_PUBLISH_STATUS.includes(project?.publishStatus) ? project.publishStatus : 'Published',
  };
}

function readStoredConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function readStoredProjects() {
  if (typeof window === 'undefined') return DEFAULT_PROJECTS;

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECTS;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PROJECTS;

    return parsed.map(normalizeProject);
  } catch {
    return DEFAULT_PROJECTS;
  }
}

function createProjectId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => readStoredConfig());
  const [projects, setProjects] = useState(() => readStoredProjects());

  useEffect(() => {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateMany = (partial) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const addProject = (projectInput) => {
    setProjects((prev) => [
      ...prev,
      normalizeProject({
        id: createProjectId(),
        title: projectInput.title?.trim() || 'Untitled Project',
        category: projectInput.category || 'Misc',
        coverUrl: projectInput.coverUrl?.trim() || '',
        videoUrl: projectInput.videoUrl?.trim() || '',
        isFeatured: Boolean(projectInput.isFeatured),
        sortOrder: projectInput.sortOrder,
        description: projectInput.description?.trim() || '',
        credits: projectInput.credits?.trim() || '',
        isVisible: projectInput.isVisible !== undefined ? projectInput.isVisible : true,
        publishStatus: projectInput.publishStatus || 'Draft',
      }),
    ]);
  };

  const updateProject = (projectId, updates) => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;

        return normalizeProject({
          ...project,
          ...updates,
          title: updates.title !== undefined ? updates.title.trim() || 'Untitled Project' : project.title,
          coverUrl: updates.coverUrl !== undefined ? updates.coverUrl.trim() : project.coverUrl,
          videoUrl: updates.videoUrl !== undefined ? updates.videoUrl.trim() : project.videoUrl,
          description: updates.description !== undefined ? updates.description.trim() : project.description,
          credits: updates.credits !== undefined ? updates.credits.trim() : project.credits,
          isFeatured: updates.isFeatured !== undefined ? Boolean(updates.isFeatured) : project.isFeatured,
          isVisible: updates.isVisible !== undefined ? Boolean(updates.isVisible) : project.isVisible,
          sortOrder: updates.sortOrder !== undefined ? normalizeSortOrder(updates.sortOrder) : project.sortOrder,
        });
      }),
    );
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const value = useMemo(
    () => ({
      config,
      projects,
      updateConfig,
      updateMany,
      resetConfig,
      addProject,
      updateProject,
      deleteProject,
      defaults: DEFAULT_CONFIG,
    }),
    [config, projects],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
