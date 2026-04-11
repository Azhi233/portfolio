import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CONFIG_STORAGE_KEY = 'director.config.v2';
const PROJECTS_STORAGE_KEY = 'director.projects.v1';
const ASSETS_STORAGE_KEY = 'director.assets.v1';
const PROJECT_DATA_STORAGE_KEY = 'director.projectData.v1';

const DEFAULT_CASE_STUDIES = {
  toy: {
    target: '占位：品牌定位、用户画像、传播核心信息、视觉风格基准。',
    action: '占位：电商主图/详情页、短视频脚本、素材矩阵、投放组合。',
    assets: '占位：主KV、产品白底图、组装过程短视频、店铺详情页切片。',
    review: '占位：复购内容、社媒栏目化输出、UGC 激励机制、视觉资产复用策略。',
  },
  industry: {
    target: '占位：展会主KV、传播节奏、媒体包与新闻素材、统一叙事框架。',
    action: '占位：销售手册视频、工艺亮点模块化表达、客户场景案例包装。',
    assets: '占位：生产线工艺图集、展会采访片段、企业标准化视觉模板。',
    review: '占位：客户见证内容、标准化工厂纪录资产、年度视觉策略迭代。',
  },
};

const DEFAULT_PROJECT_DATA = {
  toy_project: {
    id: 'toy_project',
    title: '《构建消费级拼装玩具数字资产》',
    subtitle: '从0到1搭建全渠道电商与社媒营销视觉库',
    coverUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1800&q=80',
    modules: {
      target: {
        headline: 'CHALLENGE',
        summary: '围绕拼装玩具从兴趣内容走向可转化内容，建立可复用视觉资产体系。',
        tags: ['#视觉溢价感低', '#用户理解门槛高', '#素材复用率不足'],
      },
      action: {
        title: '视觉策略',
        bullets: ['素材矩阵规划', '布光策略制定', '镜头语言统一', '后期调色规范'],
        supportImageUrl:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80',
      },
      assets: {
        intro: '核心素材用于电商、社媒和复盘页多场景分发。',
        assetUrls: [],
      },
      review: {
        cards: [
          { title: '产出规模', value: '0到1主导 · 100+ 素材' },
          { title: '痛点解决', value: '引入 GIF / 动图，显著降低理解门槛' },
          { title: '资产沉淀', value: '多渠道复用，跨部门协作效率提升' },
        ],
      },
    },
  },
  industry_project: {
    id: 'industry_project',
    title: '《ToB制造业的视觉公关与营销统筹》',
    subtitle: '大型展会纪实与工业化生产线视觉塑造',
    coverUrl: 'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?auto=format&fit=crop&w=1800&q=80',
    modules: {
      target: {
        headline: 'INDUSTRY CHALLENGE',
        summary: '将复杂工艺转化为可被市场理解与销售复用的视觉叙事。',
        tags: ['#工艺理解门槛高', '#素材分散', '#跨部门协作成本高'],
      },
      action: {
        title: '统筹策略',
        bullets: ['展会传播主线', '工艺亮点脚本化', '客户案例可视化', '销售素材模块化'],
        supportImageUrl:
          'https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1400&q=80',
      },
      assets: {
        intro: '以工业质感为核心，沉淀可跨年度复用的品牌资产。',
        assetUrls: [],
      },
      review: {
        cards: [
          { title: '产出规模', value: '展会+线上双线联动' },
          { title: '痛点解决', value: '复杂工艺表达标准化，客户理解效率提升' },
          { title: '资产沉淀', value: '形成可复制素材包，支撑销售长期转化' },
        ],
      },
    },
  },
};

const DEFAULT_CONFIG = {
  vignetteIntensity: 0.8,
  filmGrainOpacity: 0.03,
  spotlightRadius: 600,
  showHUD: true,
  siteTitle: 'DIRECTOR.VISION',
  siteDescription: 'Cinematic portfolio showcasing toys, industrial, and experimental visual storytelling.',
  ogImage: '',
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
  resumeAwardsText: '',
  resumeExperienceText: '',
  resumeGearText: '',
  testimonialsText:
    '“团队协作顺畅，内容在投放后转化显著提升。”|市场负责人|消费品牌\n“把复杂工艺讲清楚了，销售团队复用效率很高。”|销售总监|制造业企业\n“从策略到交付都很专业，节奏和质量都可控。”|品牌经理|新消费项目',
  brandNamesText: 'TOYVERSE\nINDUSTRIAL PRO\nMOTIONLAB\nNOVA BRAND\nEXPO TECH\nVISION MAKERS',
  servicesText:
    '商业视觉项目统筹|前期策略,拍摄执行,后期交付|2-6周|品牌新品发布/Campaign\n制造业内容营销体系|工艺可视化脚本,展会素材包,销售内容包|4-8周|ToB制造业企业\n长期内容资产服务|月度选题,拍摄排期,素材库维护|按月合作|需要持续内容输出的团队',
  caseStudies: DEFAULT_CASE_STUDIES,
};

const DEFAULT_ASSETS = [
  {
    id: 'asset-toy-1',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    title: 'Toy Campaign Reel',
    views: {
      expertise: {
        isActive: true,
        category: 'commercial',
        description: '侧重布光、机位运动与后期合成流程。',
      },
      project: {
        isActive: true,
        projectId: 'toy_project',
        description: '作为玩具项目主叙事视频，承接转化漏斗。',
      },
    },
  },
  {
    id: 'asset-industry-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1581091215367-59ab6b1b0c72?auto=format&fit=crop&w=1400&q=80',
    title: 'Industry Main Visual',
    views: {
      expertise: {
        isActive: true,
        category: 'industrial',
        description: '工业材质与空间层级的灯光控制示例。',
      },
      project: {
        isActive: true,
        projectId: 'industry_project',
        description: '用于工业项目复盘中的主视觉模块。',
      },
    },
  },
];

const VALID_CATEGORIES = ['Toys', 'Industrial', 'Misc'];
const VALID_PUBLISH_STATUS = ['Draft', 'Published', 'Private'];

const DEFAULT_PROJECTS = [
  {
    id: 'proj-toys-1',
    title: 'Neon Toy Odyssey',
    category: 'Toys',
    coverUrl: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://vimeo.com/76979871',
    isFeatured: true,
    sortOrder: 0,
    description: '一支以微缩玩具为主角的夜色旅程。',
    credits: 'Client: Personal Work | Director: Director.Vision',
    isVisible: true,
    publishStatus: 'Published',
  },
];

const ConfigContext = createContext(null);

function normalizeSortOrder(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

function normalizeProject(project) {
  const normalizedPublishStatus = VALID_PUBLISH_STATUS.includes(project?.publishStatus)
    ? project.publishStatus
    : project?.isVisible === false
      ? 'Draft'
      : 'Published';

  const visibility = VALID_PUBLISH_STATUS.includes(project?.visibility)
    ? project.visibility
    : normalizedPublishStatus;

  return {
    id: String(project?.id || ''),
    title: String(project?.title || 'Untitled Project'),
    category: VALID_CATEGORIES.includes(project?.category) ? project.category : 'Misc',
    role: String(project?.role || ''),
    releaseDate: String(project?.releaseDate || ''),
    coverUrl: String(project?.coverUrl || ''),
    thumbnailUrl: String(project?.thumbnailUrl || project?.coverUrl || ''),
    videoUrl: String(project?.videoUrl || project?.mainVideoUrl || ''),
    mainVideoUrl: String(project?.mainVideoUrl || project?.videoUrl || ''),
    btsMedia: Array.isArray(project?.btsMedia) ? project.btsMedia.map((item) => String(item || '')) : [],
    clientAgency: String(project?.clientAgency || ''),
    isFeatured: Boolean(project?.isFeatured),
    sortOrder: normalizeSortOrder(project?.sortOrder),
    description: String(project?.description || ''),
    credits: String(project?.credits || ''),
    isVisible: visibility !== 'Draft',
    publishStatus: normalizedPublishStatus,
    visibility,
    accessPassword: String(project?.accessPassword || ''),
  };
}

function normalizeAsset(asset) {
  return {
    id: String(asset?.id || `asset-${Date.now()}-${Math.round(Math.random() * 9999)}`),
    type: asset?.type === 'video' ? 'video' : 'image',
    url: String(asset?.url || ''),
    title: String(asset?.title || 'Untitled Asset'),
    views: {
      expertise: {
        isActive: Boolean(asset?.views?.expertise?.isActive),
        category: ['commercial', 'industrial', 'events'].includes(asset?.views?.expertise?.category)
          ? asset.views.expertise.category
          : 'commercial',
        description: String(asset?.views?.expertise?.description || ''),
      },
      project: {
        isActive: Boolean(asset?.views?.project?.isActive),
        projectId: ['toy_project', 'industry_project'].includes(asset?.views?.project?.projectId)
          ? asset.views.project.projectId
          : 'toy_project',
        description: String(asset?.views?.project?.description || ''),
      },
    },
  };
}

function normalizeProjectData(input) {
  const base = input || {};
  return {
    toy_project: {
      ...DEFAULT_PROJECT_DATA.toy_project,
      ...(base.toy_project || {}),
      modules: {
        ...DEFAULT_PROJECT_DATA.toy_project.modules,
        ...(base.toy_project?.modules || {}),
        target: {
          ...DEFAULT_PROJECT_DATA.toy_project.modules.target,
          ...(base.toy_project?.modules?.target || {}),
        },
        action: {
          ...DEFAULT_PROJECT_DATA.toy_project.modules.action,
          ...(base.toy_project?.modules?.action || {}),
        },
        assets: {
          ...DEFAULT_PROJECT_DATA.toy_project.modules.assets,
          ...(base.toy_project?.modules?.assets || {}),
        },
        review: {
          ...DEFAULT_PROJECT_DATA.toy_project.modules.review,
          ...(base.toy_project?.modules?.review || {}),
        },
      },
    },
    industry_project: {
      ...DEFAULT_PROJECT_DATA.industry_project,
      ...(base.industry_project || {}),
      modules: {
        ...DEFAULT_PROJECT_DATA.industry_project.modules,
        ...(base.industry_project?.modules || {}),
        target: {
          ...DEFAULT_PROJECT_DATA.industry_project.modules.target,
          ...(base.industry_project?.modules?.target || {}),
        },
        action: {
          ...DEFAULT_PROJECT_DATA.industry_project.modules.action,
          ...(base.industry_project?.modules?.action || {}),
        },
        assets: {
          ...DEFAULT_PROJECT_DATA.industry_project.modules.assets,
          ...(base.industry_project?.modules?.assets || {}),
        },
        review: {
          ...DEFAULT_PROJECT_DATA.industry_project.modules.review,
          ...(base.industry_project?.modules?.review || {}),
        },
      },
    },
  };
}

function normalizeCaseStudies(caseStudies) {
  return {
    toy: {
      ...DEFAULT_CASE_STUDIES.toy,
      ...(caseStudies?.toy || {}),
    },
    industry: {
      ...DEFAULT_CASE_STUDIES.industry,
      ...(caseStudies?.industry || {}),
    },
  };
}

function readStoredConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      caseStudies: normalizeCaseStudies(parsed?.caseStudies),
    };
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

function readStoredAssets() {
  if (typeof window === 'undefined') return DEFAULT_ASSETS;
  try {
    const raw = window.localStorage.getItem(ASSETS_STORAGE_KEY);
    if (!raw) return DEFAULT_ASSETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ASSETS;
    return parsed.map(normalizeAsset);
  } catch {
    return DEFAULT_ASSETS;
  }
}

function readStoredProjectData() {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_DATA;
  try {
    const raw = window.localStorage.getItem(PROJECT_DATA_STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECT_DATA;
    const parsed = JSON.parse(raw);
    return normalizeProjectData(parsed);
  } catch {
    return DEFAULT_PROJECT_DATA;
  }
}

function createProjectId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `proj-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function createAssetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => readStoredConfig());
  const [projects, setProjects] = useState(() => readStoredProjects());
  const [assets, setAssets] = useState(() => readStoredAssets());
  const [projectData, setProjectData] = useState(() => readStoredProjectData());

  useEffect(() => {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_DATA_STORAGE_KEY, JSON.stringify(projectData));
  }, [projectData]);

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const resetConfig = () => setConfig(DEFAULT_CONFIG);

  const updateCaseStudy = (projectType, key, value) => {
    if (!['toy', 'industry'].includes(projectType)) return;
    if (!['target', 'action', 'assets', 'review'].includes(key)) return;

    setConfig((prev) => ({
      ...prev,
      caseStudies: {
        ...normalizeCaseStudies(prev.caseStudies),
        [projectType]: {
          ...normalizeCaseStudies(prev.caseStudies)[projectType],
          [key]: String(value || ''),
        },
      },
    }));
  };

  const addProject = (projectInput) => {
    setProjects((prev) => [
      ...prev,
      normalizeProject({
        id: createProjectId(),
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
        isFeatured: Boolean(projectInput.isFeatured),
        sortOrder: projectInput.sortOrder,
        description: projectInput.description?.trim() || '',
        credits: projectInput.credits?.trim() || '',
        isVisible: projectInput.isVisible !== undefined ? projectInput.isVisible : true,
        publishStatus: projectInput.publishStatus || 'Draft',
        visibility: projectInput.visibility || projectInput.publishStatus || 'Draft',
        accessPassword: projectInput.accessPassword?.trim() || '',
      }),
    ]);
  };

  const updateProject = (projectId, updates) => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        return normalizeProject({ ...project, ...updates });
      }),
    );
  };

  const deleteProject = (projectId) => setProjects((prev) => prev.filter((project) => project.id !== projectId));

  const addAsset = (assetInput) => {
    setAssets((prev) => [...prev, normalizeAsset({ ...assetInput, id: createAssetId() })]);
  };

  const updateAsset = (assetId, updates) => {
    setAssets((prev) => prev.map((asset) => (asset.id === assetId ? normalizeAsset({ ...asset, ...updates }) : asset)));
  };

  const deleteAsset = (assetId) => setAssets((prev) => prev.filter((asset) => asset.id !== assetId));

  const updateProjectModule = (projectId, moduleKey, value) => {
    setProjectData((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        modules: {
          ...prev[projectId].modules,
          [moduleKey]: {
            ...prev[projectId].modules[moduleKey],
            ...value,
          },
        },
      },
    }));
  };

  const resetCaseStudies = () => {
    setProjectData(DEFAULT_PROJECT_DATA);
    setConfig((prev) => ({ ...prev, caseStudies: DEFAULT_CASE_STUDIES }));
  };

  const migrateLegacyCaseStudiesToProjectData = () => {
    const toyLegacy = config.caseStudies?.toy || {};
    const industryLegacy = config.caseStudies?.industry || {};

    const normalizeTags = (text) =>
      String(text || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => (x.startsWith('#') ? x : `#${x}`));

    const normalizeLines = (text) =>
      String(text || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);

    const normalizeUrls = (text) => normalizeLines(text).filter((x) => /^https?:\/\//i.test(x));

    setProjectData((prev) => ({
      ...prev,
      toy_project: {
        ...prev.toy_project,
        modules: {
          ...prev.toy_project.modules,
          target: {
            ...prev.toy_project.modules.target,
            headline: 'CHALLENGE',
            summary: normalizeLines(toyLegacy.target)[0] || prev.toy_project.modules.target.summary,
            tags: normalizeTags(toyLegacy.target),
          },
          action: {
            ...prev.toy_project.modules.action,
            bullets: normalizeLines(toyLegacy.action),
          },
          assets: {
            ...prev.toy_project.modules.assets,
            intro: normalizeLines(toyLegacy.assets)[0] || prev.toy_project.modules.assets.intro,
            assetUrls: normalizeUrls(toyLegacy.assets),
          },
          review: {
            ...prev.toy_project.modules.review,
            cards: normalizeLines(toyLegacy.review).slice(0, 3).map((line, idx) => ({
              title: idx === 0 ? '产出规模' : idx === 1 ? '痛点解决' : '资产沉淀',
              value: line,
            })),
          },
        },
      },
      industry_project: {
        ...prev.industry_project,
        modules: {
          ...prev.industry_project.modules,
          target: {
            ...prev.industry_project.modules.target,
            headline: 'INDUSTRY CHALLENGE',
            summary: normalizeLines(industryLegacy.target)[0] || prev.industry_project.modules.target.summary,
            tags: normalizeTags(industryLegacy.target),
          },
          action: {
            ...prev.industry_project.modules.action,
            bullets: normalizeLines(industryLegacy.action),
          },
          assets: {
            ...prev.industry_project.modules.assets,
            intro: normalizeLines(industryLegacy.assets)[0] || prev.industry_project.modules.assets.intro,
            assetUrls: normalizeUrls(industryLegacy.assets),
          },
          review: {
            ...prev.industry_project.modules.review,
            cards: normalizeLines(industryLegacy.review).slice(0, 3).map((line, idx) => ({
              title: idx === 0 ? '产出规模' : idx === 1 ? '痛点解决' : '资产沉淀',
              value: line,
            })),
          },
        },
      },
    }));
  };

  const exportCmsBundle = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    payload: {
      config,
      assets,
      projectData,
    },
  });

  const importCmsBundle = (bundle) => {
    const incoming = bundle?.payload || {};
    if (!incoming || typeof incoming !== 'object') {
      return { ok: false, message: 'Invalid bundle payload.' };
    }

    if (incoming.config && typeof incoming.config === 'object') {
      setConfig((prev) => ({
        ...prev,
        ...incoming.config,
        caseStudies: normalizeCaseStudies(incoming.config.caseStudies || prev.caseStudies),
      }));
    }

    if (Array.isArray(incoming.assets)) {
      setAssets(incoming.assets.map(normalizeAsset));
    }

    if (incoming.projectData && typeof incoming.projectData === 'object') {
      setProjectData(normalizeProjectData(incoming.projectData));
    }

    return { ok: true, message: 'CMS bundle imported.' };
  };

  const value = useMemo(
    () => ({
      config,
      projects,
      assets,
      projectData,
      updateConfig,
      resetConfig,
      updateCaseStudy,
      addProject,
      updateProject,
      deleteProject,
      addAsset,
      updateAsset,
      deleteAsset,
      updateProjectModule,
      resetCaseStudies,
      migrateLegacyCaseStudiesToProjectData,
      exportCmsBundle,
      importCmsBundle,
      defaults: DEFAULT_CONFIG,
      projectDefaults: DEFAULT_PROJECT_DATA,
    }),
    [config, projects, assets, projectData],
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
