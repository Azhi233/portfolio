import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import seedReviews from '../data/reviews.json';

import { API_BASE_URL } from '../utils/api.js';
import {
  ASSETS_STORAGE_KEY,
  CONFIG_STORAGE_KEY,
  DELIVERY_UNLOCKS_STORAGE_KEY,
  EDIT_MODE_STORAGE_KEY,
  PENDING_CONFIG_PATCH_KEY,
  PROJECT_DATA_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  PROJECT_UNLOCKS_STORAGE_KEY,
  REVIEW_AUDIT_LOGS_STORAGE_KEY,
  REVIEWS_STORAGE_KEY,
  SYNC_CHANNEL_NAME,
  SYNC_EVENT_NAME,
  TOKEN_STORAGE_KEY,
  readLocalJson,
  writeLocalJson,
} from './configStorage.js';
import {
  normalizeAsset,
  normalizeCaseStudies,
  normalizeConfig,
  normalizeProject,
  normalizeProjectData,
} from './configNormalizers.js';
import { DEFAULT_CASE_STUDIES, DEFAULT_PROJECT_DATA, DEFAULT_CONFIG } from './configDefaults.js';

const API_BASE = API_BASE_URL;

function readPendingConfigPatch() {
  return readLocalJson(PENDING_CONFIG_PATCH_KEY, null);
}

function writePendingConfigPatch(value) {
  writeLocalJson(PENDING_CONFIG_PATCH_KEY, value);
}

function isSameJson(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}



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
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
          const nextConfig = normalizeConfig({
            ...config,
            ...remoteConfig,
          });
          setConfig((prev) => (isSameJson(prev, nextConfig) ? prev : nextConfig));
          writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);

          if (Array.isArray(remoteConfig.assets)) {
            const nextAssets = remoteConfig.assets.map(normalizeAsset);
            setAssets((prev) => (isSameJson(prev, nextAssets) ? prev : nextAssets));
            writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
          }

          if (remoteConfig.projectData && typeof remoteConfig.projectData === 'object') {
            const nextProjectData = normalizeProjectData(remoteConfig.projectData);
            setProjectData((prev) => (isSameJson(prev, nextProjectData) ? prev : nextProjectData));
            writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
          }
        }

        if (Array.isArray(remoteProjects)) {
          const nextProjects = remoteProjects.map(normalizeProject);
          setProjects((prev) => (isSameJson(prev, nextProjects) ? prev : nextProjects));
        }

        if (Array.isArray(remoteReviews)) {
          const nextReviews = remoteReviews.map((item, index) => normalizeReview(item, index));
          setReviews((prev) => (isSameJson(prev, nextReviews) ? prev : nextReviews));
        }

        if (Array.isArray(remoteReviewAuditLogs)) {
          setReviewAuditLogs((prev) => (isSameJson(prev, remoteReviewAuditLogs) ? prev : remoteReviewAuditLogs));
        }

        if (remoteProjectUnlocks && typeof remoteProjectUnlocks === 'object') {
          setProjectUnlocks((prev) => (isSameJson(prev, remoteProjectUnlocks) ? prev : remoteProjectUnlocks));
        }

        if (remoteDeliveryUnlocks && typeof remoteDeliveryUnlocks === 'object') {
          setDeliveryUnlocks((prev) => (isSameJson(prev, remoteDeliveryUnlocks) ? prev : remoteDeliveryUnlocks));
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
