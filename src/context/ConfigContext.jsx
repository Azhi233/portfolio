import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import seedReviews from '../data/reviews.json';

import { API_BASE_URL } from '../utils/api.js';

const API_BASE = API_BASE_URL;
const TOKEN_STORAGE_KEY = 'portfolio.auth.token';
const EDIT_MODE_STORAGE_KEY = 'portfolio.edit.mode';
const SYNC_CHANNEL_NAME = 'portfolio-config-sync';
const SYNC_EVENT_NAME = 'portfolio-config-updated';
const CONFIG_STORAGE_KEY = 'portfolio.cms.config';
const PROJECTS_STORAGE_KEY = 'portfolio.cms.projects';
const ASSETS_STORAGE_KEY = 'portfolio.cms.assets';
const PROJECT_DATA_STORAGE_KEY = 'portfolio.cms.projectData';
const PROJECT_UNLOCKS_STORAGE_KEY = 'portfolio.cms.projectUnlocks';
const DELIVERY_UNLOCKS_STORAGE_KEY = 'portfolio.cms.deliveryUnlocks';
const REVIEWS_STORAGE_KEY = 'portfolio.cms.reviews';
const REVIEW_AUDIT_LOGS_STORAGE_KEY = 'portfolio.cms.reviewAuditLogs';
const PENDING_CONFIG_PATCH_KEY = 'portfolio.cms.pendingConfigPatch';

function readLocalJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

function readPendingConfigPatch() {
  return readLocalJson(PENDING_CONFIG_PATCH_KEY, null);
}

function writePendingConfigPatch(value) {
  writeLocalJson(PENDING_CONFIG_PATCH_KEY, value);
}

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
      showcase: {
        heroKicker: '从0到1搭建全渠道电商与社媒营销视觉库',
        heroTitle: '《构建消费级拼装玩具数字资产》',
        brandCaptionTitle: 'BRAND SCREENING ROOM',
        brandCaptionSubtitle: '核心素材用于电商、社媒和复盘页多场景分发。',
        socialHeading: '视觉策略',
        socialSubheading: '镜头语言统一，打造可复用的社媒矩阵内容。',
        assetPhaseRaw: '围绕拼装玩具从兴趣内容走向可转化内容，建立可复用视觉资产体系。',
        assetPhaseWeb: '素材矩阵规划',
        assetPhasePrint: '多渠道复用，跨部门协作效率提升',
        bentoHeading: '全生态作品库',
        bentoSubheading: '探索更多跨渠道、跨触点的商业视觉资产。',
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
      showcase: {
        heroKicker: '大型展会纪实与工业化生产线视觉塑造',
        heroTitle: '《ToB制造业的视觉公关与营销统筹》',
        brandCaptionTitle: 'INDUSTRY SCREENING ROOM',
        brandCaptionSubtitle: '以工业质感为核心，沉淀可跨年度复用的品牌资产。',
        socialHeading: '统筹策略',
        socialSubheading: '工艺亮点脚本化，形成销售可复用的短视频矩阵。',
        assetPhaseRaw: '将复杂工艺转化为可被市场理解与销售复用的视觉叙事。',
        assetPhaseWeb: '展会传播主线',
        assetPhasePrint: '形成可复制素材包，支撑销售长期转化',
        bentoHeading: '全生态作品库',
        bentoSubheading: '查看更多工业与品牌传播的系统化案例。',
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
  logoImageUrl: '',
  logoAltText: 'DIRECTOR.VISION',
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
  loginEntryLabel: 'ADMIN',
  loginModalTitle: '进入编辑后台',
  loginRegisterLabel: '没有账号？去注册',
  loginBackLabel: '返回登录',
  loginButtonText: '登录',
  registerButtonText: '注册并登录',
  loginCloseLabel: '关闭',
  loginUsernamePlaceholder: '用户名',
  loginPasswordPlaceholder: '密码',
  loginConfirmPasswordPlaceholder: '确认密码',
  resumeAwardsText: '',
  resumeExperienceText: '',
  resumeGearText: '',
  testimonialsText:
    '“团队协作顺畅，内容在投放后转化显著提升。”|市场负责人|消费品牌\n“把复杂工艺讲清楚了，销售团队复用效率很高。”|销售总监|制造业企业\n“从策略到交付都很专业，节奏和质量都可控。”|品牌经理|新消费项目',
  brandNamesText: 'TOYVERSE\nINDUSTRIAL PRO\nMOTIONLAB\nNOVA BRAND\nEXPO TECH\nVISION MAKERS',
  qrCodeImageUrl: '',
  servicesText:
    '商业视觉项目统筹|前期策略,拍摄执行,后期交付|2-6周|品牌新品发布/Campaign\n制造业内容营销体系|工艺可视化脚本,展会素材包,销售内容包|4-8周|ToB制造业企业\n长期内容资产服务|月度选题,拍摄排期,素材库维护|按月合作|需要持续内容输出的团队',
  caseStudies: DEFAULT_CASE_STUDIES,
  homeSelectedWorksTitle: 'SELECTED WORKS',
  homeSelectedWorksSubtitle: 'EXPERTISE VIEW · TECHNICAL EXECUTION',
  homeProfileImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  homeAboutKicker: 'ABOUT THE DIRECTOR',
  homeAboutHeadline: 'Silence, Frame, Emotion.',
  homeAwardsLabel: 'AWARDS',
  homeExperienceLabel: 'EXPERIENCE',
  homeGearLabel: 'GEAR LIST',
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
const VALID_ASSET_TYPES = ['image', 'video', 'image-comparison'];
const VALID_VARIANT_KEYS = ['raw', 'graded', 'styled'];

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

function normalizePrivateFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .map((item, index) => ({
      id: String(item?.id || `pf-${Date.now()}-${index}`),
      name: String(item?.name || `File ${index + 1}`),
      url: String(item?.url || ''),
      actionType: item?.actionType === 'upload' ? 'upload' : 'download',
      note: String(item?.note || ''),
      sortOrder: normalizeSortOrder(item?.sortOrder ?? index),
      enabled: item?.enabled !== false,
    }))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function normalizeProject(project) {
  const normalizedPublishStatus = VALID_PUBLISH_STATUS.includes(project?.publishStatus)
    ? project.publishStatus
    : project?.status === 'private'
      ? 'Private'
      : project?.isVisible === false
        ? 'Draft'
        : 'Published';

  const visibility = VALID_PUBLISH_STATUS.includes(project?.visibility)
    ? project.visibility
    : normalizedPublishStatus;

  const status =
    project?.status === 'private' || normalizedPublishStatus === 'Private'
      ? 'private'
      : normalizedPublishStatus === 'Draft'
        ? 'draft'
        : 'published';

  const password = String(project?.password || project?.accessPassword || '');
  const deliveryPin = String(project?.deliveryPin || '');

  const outlineTags = Array.isArray(project?.outlineTags)
    ? project.outlineTags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];

  const normalizedVideoUrl = String(project?.mainVideoUrl || project?.videoUrl || '');

  return {
    id: String(project?.id || ''),
    title: String(project?.title || 'Untitled Project'),
    category: VALID_CATEGORIES.includes(project?.category) ? project.category : 'Misc',
    role: String(project?.role || ''),
    releaseDate: String(project?.releaseDate || ''),
    coverUrl: String(project?.coverUrl || ''),
    thumbnailUrl: String(project?.thumbnailUrl || project?.coverUrl || ''),
    logoImageUrl: String(project?.logoImageUrl || ''),
    videoUrl: normalizedVideoUrl,
    mainVideoUrl: normalizedVideoUrl,
    btsMedia: Array.isArray(project?.btsMedia) ? project.btsMedia.map((item) => String(item || '')) : [],
    clientAgency: String(project?.clientAgency || ''),
    clientCode: String(project?.clientCode || ''),
    isFeatured: Boolean(project?.isFeatured),
    sortOrder: normalizeSortOrder(project?.sortOrder),
    description: String(project?.description || ''),
    credits: String(project?.credits || ''),
    privateTitle: String(project?.privateTitle || ''),
    privateDescription: String(project?.privateDescription || ''),
    privateAccessLabel: String(project?.privateAccessLabel || ''),
    privateAccessHint: String(project?.privateAccessHint || ''),
    privateAccessButtonText: String(project?.privateAccessButtonText || ''),
    privateErrorText: String(project?.privateErrorText || ''),
    deliveryTitle: String(project?.deliveryTitle || ''),
    deliverySuccessText: String(project?.deliverySuccessText || ''),
    deliveryPinPlaceholder: String(project?.deliveryPinPlaceholder || ''),
    deliveryErrorText: String(project?.deliveryErrorText || ''),
    deliveryButtonText: String(project?.deliveryButtonText || ''),
    downloadTitle: String(project?.downloadTitle || ''),
    downloadAllButtonText: String(project?.downloadAllButtonText || ''),
    downloadSelectedButtonText: String(project?.downloadSelectedButtonText || ''),
    galleryTitle: String(project?.galleryTitle || ''),
    galleryActionBarText: String(project?.galleryActionBarText || ''),
    gallerySelectionText: String(project?.gallerySelectionText || ''),
    buttonText: String(project?.buttonText || ''),
    isVisible: visibility !== 'Draft',
    publishStatus: normalizedPublishStatus,
    visibility,
    accessPassword: password,
    deliveryPin,
    status,
    password,
    privateFiles: normalizePrivateFiles(project?.privateFiles),
    outlineTags,
  };
}

function inferMediaGroupFromAsset(asset = {}, resolvedType = 'image') {
  const type = String(asset?.type || '').toLowerCase();
  const url = String(asset?.url || asset?.coverUrl || asset?.videoUrl || '').toLowerCase();
  if (asset?.mediaGroup === 'video' || type === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/.test(url)) return 'video';
  if (asset?.mediaGroup === 'photo') return 'photo';
  return resolvedType === 'video' ? 'video' : 'photo';
}

function normalizeAsset(asset) {
  const type = VALID_ASSET_TYPES.includes(asset?.type) ? asset.type : asset?.type === 'video' ? 'video' : 'image';
  const rawVariants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};
  const variants = VALID_VARIANT_KEYS.reduce((acc, key) => {
    const value = String(rawVariants?.[key] || '').trim();
    if (value) acc[key] = value;
    return acc;
  }, {});

  const variantCount = Object.keys(variants).length;
  const resolvedType = type === 'image-comparison' || variantCount > 1 ? 'image-comparison' : type;
  const baseUrl = String(asset?.url || asset?.coverUrl || variants.graded || variants.raw || variants.styled || '');
  const normalizedProjectId = String(asset?.views?.project?.projectId || '').trim() || 'toy_project';
  const normalizedModuleSlot = String(asset?.views?.project?.moduleSlot || asset?.moduleSlot || '').trim();
  const normalizedPublishTarget = ['expertise', 'project', 'both'].includes(asset?.publishTarget)
    ? asset.publishTarget
    : asset?.views?.video?.isActive
      ? 'both'
      : asset?.views?.expertise?.isActive && asset?.views?.project?.isActive
        ? 'both'
        : asset?.views?.project?.isActive
          ? 'project'
          : 'expertise';

  const mediaGroup = inferMediaGroupFromAsset(asset, resolvedType);
  const isExpertiseActive = normalizedPublishTarget === 'expertise' || normalizedPublishTarget === 'both';
  const isProjectActive = normalizedPublishTarget === 'project' || normalizedPublishTarget === 'both';
  const isVideoActive =
    mediaGroup === 'video' || Boolean(asset?.views?.video?.isActive) || (resolvedType === 'video' && (normalizedPublishTarget === 'both' || normalizedPublishTarget === 'video'));

  return {
    id: String(asset?.id || `asset-${Date.now()}-${Math.round(Math.random() * 9999)}`),
    type: resolvedType,
    url: baseUrl,
    mediaGroup,
    variants,
    title: String(asset?.title || 'Untitled Asset'),
    publishTarget: isVideoActive && !isExpertiseActive && !isProjectActive ? 'video' : normalizedPublishTarget,
    moduleSlot: normalizedModuleSlot,
    autoTags: Array.isArray(asset?.autoTags)
      ? asset.autoTags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : String(asset?.autoTags || '')
          .split(/[\r\n,，;]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    tags: Array.isArray(asset?.tags)
      ? asset.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : String(asset?.tags || '')
          .split(/[\r\n,，;]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    views: {
      expertise: {
        isActive: isExpertiseActive,
        category: ['commercial', 'industrial', 'events'].includes(asset?.views?.expertise?.category)
          ? asset.views.expertise.category
          : 'commercial',
        description: String(asset?.views?.expertise?.description || ''),
      },
      project: {
        isActive: isProjectActive,
        projectId: normalizedProjectId,
        moduleSlot: normalizedModuleSlot,
        description: String(asset?.views?.project?.description || ''),
      },
      video: {
        isActive: isVideoActive,
        category: ['COMMERCIAL', 'ENGINEERING', 'CULTURE'].includes(asset?.views?.video?.category)
          ? asset.views.video.category
          : 'COMMERCIAL',
        description: String(asset?.views?.video?.description || ''),
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
        showcase: {
          ...DEFAULT_PROJECT_DATA.toy_project.modules.showcase,
          ...(base.toy_project?.modules?.showcase || {}),
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
        showcase: {
          ...DEFAULT_PROJECT_DATA.industry_project.modules.showcase,
          ...(base.industry_project?.modules?.showcase || {}),
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

function normalizeConfig(input) {
  const stored = input && typeof input === 'object' ? input : {};
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    vignetteIntensity: Number(stored.vignetteIntensity ?? DEFAULT_CONFIG.vignetteIntensity),
    filmGrainOpacity: Number(stored.filmGrainOpacity ?? DEFAULT_CONFIG.filmGrainOpacity),
    spotlightRadius: Number(stored.spotlightRadius ?? DEFAULT_CONFIG.spotlightRadius),
    showHUD: stored.showHUD !== undefined ? Boolean(stored.showHUD) : DEFAULT_CONFIG.showHUD,
    caseStudies: normalizeCaseStudies(stored.caseStudies || DEFAULT_CONFIG.caseStudies),
  };
}

function readStoredConfig() {
  return normalizeConfig(readLocalJson(CONFIG_STORAGE_KEY, DEFAULT_CONFIG));
}

function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
}

function readStoredProjects() {
  return readLocalJson(PROJECTS_STORAGE_KEY, DEFAULT_PROJECTS);
}

function readStoredAssets() {
  return readLocalJson(ASSETS_STORAGE_KEY, DEFAULT_ASSETS);
}

function readStoredProjectData() {
  return readLocalJson(PROJECT_DATA_STORAGE_KEY, DEFAULT_PROJECT_DATA);
}

function isTokenPresent() {
  return Boolean(getStoredToken());
}

function readStoredDeliveryUnlocks() {
  return readLocalJson(DELIVERY_UNLOCKS_STORAGE_KEY, {});
}

function createProjectId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `proj-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function createAssetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function normalizeReview(item, index = 0) {
  const type = item?.authorType === 'company' ? 'company' : 'personal';
  const status = ['pending', 'approved', 'rejected'].includes(item?.status) ? item.status : 'approved';

  return {
    id: String(item?.id || `review-${Date.now()}-${index}`),
    projectId: String(item?.projectId || ''),
    projectName: String(item?.projectName || 'Untitled Project'),
    clientName: String(item?.clientName || '匿名用户'),
    companyName: type === 'company' ? String(item?.companyName || '') : '',
    position: type === 'company' ? String(item?.position || '') : '',
    content: String(item?.content || ''),
    coverUrl: String(item?.coverUrl || ''),
    isFeatured: Boolean(item?.isFeatured),
    authorType: type,
    isAnonymous: Boolean(item?.isAnonymous),
    status,
    createdAt: String(item?.createdAt || new Date().toISOString()),
  };
}

function readStoredReviews() {
  const stored = readLocalJson(REVIEWS_STORAGE_KEY, null);
  if (Array.isArray(stored)) return stored.map(normalizeReview);
  return (Array.isArray(seedReviews) ? seedReviews : []).map(normalizeReview);
}

function readStoredReviewAuditLogs() {
  return readLocalJson(REVIEW_AUDIT_LOGS_STORAGE_KEY, []);
}

function readStoredProjectUnlocks() {
  return readLocalJson(PROJECT_UNLOCKS_STORAGE_KEY, {});
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload?.data;
}

const DATA_SYNC_INTERVAL_MS = 15000;

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => readStoredConfig());
  const [projects, setProjects] = useState(() => readStoredProjects());
  const [isAdmin, setIsAdmin] = useState(() => isTokenPresent());
  const [isEditMode, setIsEditMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(EDIT_MODE_STORAGE_KEY) === 'true';
  });
  const [assets, setAssets] = useState(() => readStoredAssets());
  const [projectData, setProjectData] = useState(() => readStoredProjectData());
  const [projectUnlocks, setProjectUnlocks] = useState(() => readStoredProjectUnlocks());
  const [deliveryUnlocks, setDeliveryUnlocks] = useState(() => readStoredDeliveryUnlocks());
  const [reviews, setReviews] = useState(() => readStoredReviews());
  const [reviewAuditLogs, setReviewAuditLogs] = useState(() => readStoredReviewAuditLogs());

  const broadcastConfigUpdate = () => {
    const payload = { type: SYNC_EVENT_NAME, at: Date.now() };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: payload }));
      writeLocalJson(SYNC_EVENT_NAME, payload);

      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
          channel.postMessage(payload);
          channel.close();
        }
      } catch {
        // ignore broadcast failures
      }
    }
  };

  const fetchAndSyncRemoteData = async () => {
    const [remoteConfig, remoteProjects, remoteReviews, remoteReviewAuditLogs, remoteProjectUnlocks, remoteDeliveryUnlocks] = await Promise.all([
      fetchJson('/config'),
      fetchJson('/projects'),
      fetchJson('/reviews').catch(() => []),
      fetchJson('/review-audit-logs').catch(() => []),
      fetchJson('/project-unlocks').catch(() => ({})),
      fetchJson('/delivery-unlocks').catch(() => ({})),
    ]);

    return { remoteConfig, remoteProjects, remoteReviews, remoteReviewAuditLogs, remoteProjectUnlocks, remoteDeliveryUnlocks };
  };

  useEffect(() => {
    setIsAdmin(isTokenPresent());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let eventSource = null;

    const applyRemoteData = async () => {
      try {
        const { remoteConfig, remoteProjects, remoteReviews, remoteReviewAuditLogs, remoteProjectUnlocks, remoteDeliveryUnlocks } =
          await fetchAndSyncRemoteData();

        if (cancelled) return;

        if (remoteConfig && typeof remoteConfig === 'object') {
          setConfig((prev) => {
            const nextConfig = normalizeConfig({
              ...prev,
              ...remoteConfig,
            });
            writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);
            return nextConfig;
          });

          if (Array.isArray(remoteConfig.assets)) {
            const nextAssets = remoteConfig.assets.map(normalizeAsset);
            setAssets(nextAssets);
            writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
          }

          if (remoteConfig.projectData && typeof remoteConfig.projectData === 'object') {
            const nextProjectData = normalizeProjectData(remoteConfig.projectData);
            setProjectData(nextProjectData);
            writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
          }
        }

        if (Array.isArray(remoteProjects)) {
          setProjects(remoteProjects.map(normalizeProject));
        }

        if (Array.isArray(remoteReviews)) {
          setReviews(remoteReviews.map((item, index) => normalizeReview(item, index)));
        }

        if (Array.isArray(remoteReviewAuditLogs)) {
          setReviewAuditLogs(remoteReviewAuditLogs);
        }

        if (remoteProjectUnlocks && typeof remoteProjectUnlocks === 'object') {
          setProjectUnlocks(remoteProjectUnlocks);
        }

        if (remoteDeliveryUnlocks && typeof remoteDeliveryUnlocks === 'object') {
          setDeliveryUnlocks(remoteDeliveryUnlocks);
        }
      } catch (error) {
        console.error('Failed to load CMS data from server:', error);
      }
    };

    const onRemoteChange = () => {
      applyRemoteData();
    };

    const onStorage = (event) => {
      if (event.key === SYNC_EVENT_NAME && event.newValue) {
        onRemoteChange();
      }
    };

    applyRemoteData();

    if (typeof window !== 'undefined') {
      window.addEventListener(SYNC_EVENT_NAME, onRemoteChange);
      window.addEventListener('storage', onStorage);

      if ('BroadcastChannel' in window) {
        eventSource = new BroadcastChannel(SYNC_CHANNEL_NAME);
        eventSource.onmessage = onRemoteChange;
      }
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(SYNC_EVENT_NAME, onRemoteChange);
        window.removeEventListener('storage', onStorage);
      }
      if (eventSource) eventSource.close();
    };
  }, []);

  const persistConfigSnapshot = async ({
    nextConfig = config,
    nextAssets = assets,
    nextProjectData = projectData,
  } = {}) => {
    const payload = {
      ...nextConfig,
      assets: nextAssets,
      projectData: nextProjectData,
    };

    writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);
    writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
    writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);

    const token = getStoredToken();
    const data = await fetchJson('/config', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(payload),
    });

    broadcastConfigUpdate();
    return data;
  };

  const updateConfig = (key, value) =>
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      const pendingPatch = { ...(readPendingConfigPatch() || {}), [key]: value };
      writeLocalJson(CONFIG_STORAGE_KEY, next);
      writePendingConfigPatch(pendingPatch);
      persistConfigSnapshot({ nextConfig: next })
        .then(() => {
          writePendingConfigPatch(null);
        })
        .catch((error) => {
          console.error('Failed to persist config update:', error);
          writePendingConfigPatch(next);
        });
      return next;
    });

  const saveConfigToServer = async (nextConfig) => {
    const mergedConfig = normalizeConfig({
      ...config,
      ...(nextConfig || {}),
    });

    try {
      const data = await persistConfigSnapshot({ nextConfig: mergedConfig });

      const next = normalizeConfig({
        ...mergedConfig,
        ...(data || {}),
      });
      setConfig(next);
      writeLocalJson(CONFIG_STORAGE_KEY, next);
      writePendingConfigPatch(null);

      return data;
    } catch (error) {
      writeLocalJson(CONFIG_STORAGE_KEY, mergedConfig);
      writePendingConfigPatch(mergedConfig);
      throw error;
    }
  };

  const login = async (username, password) => {
    const data = await fetchJson('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const token = data?.token || '';
    if (!token) throw new Error('Login failed.');

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(EDIT_MODE_STORAGE_KEY, 'true');
    setIsAdmin(true);
    setIsEditMode(true);
    return data;
  };

  const register = async (username, password) => {
    const data = await fetchJson('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    return data;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(EDIT_MODE_STORAGE_KEY);
    }
    setIsAdmin(false);
    setIsEditMode(false);
  };

  const resetConfig = () => setConfig(DEFAULT_CONFIG);

  const isUnlocked = (projectId) => Boolean(projectUnlocks?.[String(projectId || '')]);

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

  const unlockProjectAccess = (projectId) => {
    syncProjectUnlock(projectId, true).catch((error) => {
      console.error('Failed to persist project unlock:', error);
    });
  };

  const lockProjectAccess = (projectId) => {
    syncProjectUnlock(projectId, false).catch((error) => {
      console.error('Failed to persist project lock:', error);
    });
  };

  const isDeliveryUnlocked = (projectId) => Boolean(deliveryUnlocks?.[String(projectId || '')]);

  const syncDeliveryUnlock = async (projectId, unlocked) => {
    const key = String(projectId || '').trim();
    if (!key) return;
    setDeliveryUnlocks((prev) => {
      const next = { ...prev, [key]: Boolean(unlocked) };
      writeLocalJson(DELIVERY_UNLOCKS_STORAGE_KEY, next);
      return next;
    });
    await fetchJson('/delivery-unlocks', {
      method: 'POST',
      body: JSON.stringify({ projectId: key, unlocked: Boolean(unlocked) }),
    });
  };

  const unlockDeliveryAccess = (projectId) => {
    syncDeliveryUnlock(projectId, true).catch((error) => {
      console.error('Failed to persist delivery unlock:', error);
    });
  };

  const lockDeliveryAccess = (projectId) => {
    syncDeliveryUnlock(projectId, false).catch((error) => {
      console.error('Failed to persist delivery lock:', error);
    });
  };

  const submitReview = (input) => {
    const next = normalizeReview(
      {
        ...input,
        status: 'pending',
        isFeatured: false,
      },
      0,
    );
    setReviews((prev) => {
      const nextReviews = [next, ...prev];
      writeLocalJson(REVIEWS_STORAGE_KEY, nextReviews);
      return nextReviews;
    });
    fetchJson('/reviews', {
      method: 'POST',
      body: JSON.stringify(next),
    }).catch((error) => {
      console.error('Failed to persist review:', error);
    });
    return next;
  };

  const updateReview = (reviewId, updates) => {
    setReviews((prev) => {
      const next = prev.map((item) => (item.id === reviewId ? normalizeReview({ ...item, ...updates }) : item));
      writeLocalJson(REVIEWS_STORAGE_KEY, next);
      return next;
    });
  };

  const appendReviewAuditLog = (entry) => {
    const next = {
      id: `audit-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      at: new Date().toISOString(),
      ...entry,
    };
    setReviewAuditLogs((prev) => {
      const nextLogs = [next, ...prev];
      writeLocalJson(REVIEW_AUDIT_LOGS_STORAGE_KEY, nextLogs);
      return nextLogs;
    });
    fetchJson('/config', {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        reviewAuditLogs: [next, ...reviewAuditLogs],
      }),
    }).catch((error) => {
      console.error('Failed to persist review audit log:', error);
    });
  };

  const setReviewStatus = (reviewId, status, operator = 'console-admin') => {
    if (!['pending', 'approved', 'rejected'].includes(status)) return;

    setReviews((prev) => {
      const target = prev.find((item) => item.id === reviewId);
      if (!target) return prev;

      const previousStatus = target.status || 'pending';
      if (previousStatus !== status) {
        appendReviewAuditLog({
          type: 'status_changed',
          reviewId,
          operator,
          from: previousStatus,
          to: status,
          projectId: target.projectId,
          projectName: target.projectName,
          clientName: target.clientName,
        });
      }

      return prev.map((item) => (item.id === reviewId ? normalizeReview({ ...item, status }) : item));
    });
  };

  const updateCaseStudy = (projectType, key, value) => {
    if (!['toy', 'industry'].includes(projectType)) return;
    if (!['target', 'action', 'assets', 'review'].includes(key)) return;

    setConfig((prev) => {
      const next = {
        ...prev,
        caseStudies: {
          ...normalizeCaseStudies(prev.caseStudies),
          [projectType]: {
            ...normalizeCaseStudies(prev.caseStudies)[projectType],
            [key]: String(value || ''),
          },
        },
      };

      writeLocalJson(CONFIG_STORAGE_KEY, next);
      persistConfigSnapshot({ nextConfig: next }).catch((error) => {
        console.error('Failed to persist case study update:', error);
      });

      return next;
    });
  };

  const addProject = (projectInput) => {
    const created = normalizeProject({
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
    saveProjectToServer(created).catch((error) => {
      console.error('Failed to persist new project:', error);
    });
  };

  const saveProjectToServer = async (projectInput) => {
    const normalized = normalizeProject({
      id: projectInput?.id || createProjectId(),
      ...projectInput,
    });

    const exists = projects.some((item) => item.id === normalized.id);
    const data = await fetchJson(exists ? `/projects/${normalized.id}` : '/projects', {
      method: exists ? 'PUT' : 'POST',
      body: JSON.stringify(normalized),
    });

    const saved = normalizeProject(data || normalized);
    setProjects((prev) => {
      const found = prev.some((item) => item.id === saved.id);
      if (found) {
        return prev.map((item) => (item.id === saved.id ? saved : item));
      }
      return [...prev, saved];
    });

    return saved;
  };

  const updateProject = (projectId, updates) => {
    setProjects((prev) => {
      const nextProjects = prev.map((project) => {
        if (project.id !== projectId) return project;
        return normalizeProject({ ...project, ...updates });
      });

      const target = nextProjects.find((project) => project.id === projectId);
      if (target) {
        saveProjectToServer(target).catch((error) => {
          console.error('Failed to persist project update:', error);
        });
      }

      return nextProjects;
    });
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    fetchJson(`/projects/${projectId}`, { method: 'DELETE' }).catch((error) => {
      console.error('Failed to delete project on server:', error);
    });
  };

  const saveAssetsToServer = (nextAssets) => {
    writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
    persistConfigSnapshot({ nextAssets }).catch((error) => {
      console.error('Failed to persist assets:', error);
    });
  };

  const addAsset = (assetInput) => {
    setAssets((prev) => {
      const nextAssets = [...prev, normalizeAsset({ ...assetInput, id: createAssetId() })];
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  const addAssets = (assetInputs) => {
    setAssets((prev) => {
      const createdAssets = Array.isArray(assetInputs)
        ? assetInputs.map((assetInput) => normalizeAsset({ ...assetInput, id: createAssetId() }))
        : [];
      const nextAssets = [...prev, ...createdAssets];
      saveAssetsToServer(nextAssets);
      return nextAssets;
    });
  };

  const updateAsset = (assetId, updates) => {
    setAssets((prev) => {
      const nextAssets = prev.map((asset) => (asset.id === assetId ? normalizeAsset({ ...asset, ...updates }) : asset));
      persistConfigSnapshot({ nextAssets }).catch((error) => {
        console.error('Failed to persist assets after update:', error);
      });
      return nextAssets;
    });
  };

  const deleteAsset = (assetId) => {
    setAssets((prev) => {
      const nextAssets = prev.filter((asset) => asset.id !== assetId);
      persistConfigSnapshot({ nextAssets }).catch((error) => {
        console.error('Failed to persist assets after delete:', error);
      });
      return nextAssets;
    });
  };

  const updateProjectModule = (projectId, moduleKey, value) => {
    setProjectData((prev) => {
      const nextProjectData = {
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
      };

      writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
      persistConfigSnapshot({ nextProjectData }).catch((error) => {
        console.error('Failed to persist project modules:', error);
      });

      return nextProjectData;
    });
  };

  const resetCaseStudies = () => {
    setProjectData(DEFAULT_PROJECT_DATA);
    setConfig((prev) => {
      const nextConfig = { ...prev, caseStudies: DEFAULT_CASE_STUDIES };
      writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);
      writeLocalJson(PROJECT_DATA_STORAGE_KEY, DEFAULT_PROJECT_DATA);
      persistConfigSnapshot({ nextConfig, nextProjectData: DEFAULT_PROJECT_DATA }).catch((error) => {
        console.error('Failed to persist reset case studies:', error);
      });
      return nextConfig;
    });
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

    setProjectData((prev) => {
      const nextProjectData = {
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
      };

      persistConfigSnapshot({ nextProjectData }).catch((error) => {
        console.error('Failed to persist migrated project data:', error);
      });

      return nextProjectData;
    });
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

    const nextConfig = incoming.config && typeof incoming.config === 'object'
      ? {
          ...config,
          ...incoming.config,
          caseStudies: normalizeCaseStudies(incoming.config.caseStudies || config.caseStudies),
        }
      : config;

    const nextAssets = Array.isArray(incoming.assets) ? incoming.assets.map(normalizeAsset) : assets;
    const nextProjectData = incoming.projectData && typeof incoming.projectData === 'object'
      ? normalizeProjectData(incoming.projectData)
      : projectData;

    setConfig(nextConfig);
    setAssets(nextAssets);
    setProjectData(nextProjectData);
    writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);
    writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
    writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
    writePendingConfigPatch(null);

    persistConfigSnapshot({ nextConfig, nextAssets, nextProjectData }).catch((error) => {
      console.error('Failed to persist imported CMS bundle:', error);
    });

    return { ok: true, message: 'CMS bundle imported.' };
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(EDIT_MODE_STORAGE_KEY, String(isEditMode));
  }, [isEditMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const patch = readPendingConfigPatch();
    if (!patch || typeof patch !== 'object') return;
    setConfig((prev) => normalizeConfig({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      config,
      projects,
      assets,
      projectData,
      reviews,
      reviewAuditLogs,
      updateConfig,
      saveConfigToServer,
      login,
      register,
      logout,
      isAdmin,
      isEditMode,
      setIsEditMode,
      resetConfig,
      isUnlocked,
      unlockProjectAccess,
      lockProjectAccess,
      isDeliveryUnlocked,
      unlockDeliveryAccess,
      lockDeliveryAccess,
      submitReview,
      updateReview,
      setReviewStatus,
      updateCaseStudy,
      addProject,
      saveProjectToServer,
      updateProject,
      deleteProject,
      addAsset,
      addAssets,
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
    [config, projects, assets, projectData, projectUnlocks, deliveryUnlocks, reviews, reviewAuditLogs, isAdmin, isEditMode],
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
