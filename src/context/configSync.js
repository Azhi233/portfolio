import { API_BASE_URL } from '../utils/api.js';
import {
  ASSETS_STORAGE_KEY,
  CONFIG_STORAGE_KEY,
  DELIVERY_UNLOCKS_STORAGE_KEY,
  PROJECT_DATA_STORAGE_KEY,
  PROJECT_UNLOCKS_STORAGE_KEY,
  REVIEW_AUDIT_LOGS_STORAGE_KEY,
  REVIEWS_STORAGE_KEY,
  SYNC_CHANNEL_NAME,
  SYNC_EVENT_NAME,
  writeLocalJson,
} from './configStorage.js';
import { normalizeAsset, normalizeConfig, normalizeProjectData, normalizeProject, normalizeReview } from './configNormalizers.js';
import { getStoredToken } from './configAuth.js';

const API_BASE = API_BASE_URL;
const DATA_SYNC_INTERVAL_MS = 15000;

function isSameJson(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
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

export function createConfigSyncService({
  getConfig,
  setConfig,
  setAssets,
  setProjectData,
  setProjects,
  setReviews,
  setReviewAuditLogs,
  setProjectUnlocks,
  setDeliveryUnlocks,
}) {
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

  const applyRemoteData = async () => {
    const { remoteConfig, remoteProjects, remoteReviews, remoteReviewAuditLogs, remoteProjectUnlocks, remoteDeliveryUnlocks } =
      await fetchAndSyncRemoteData();

    if (remoteConfig && typeof remoteConfig === 'object') {
      const nextConfig = normalizeConfig(remoteConfig, getConfig(), remoteConfig.caseStudies || {});
      setConfig((prev) => (isSameJson(prev, nextConfig) ? prev : nextConfig));
      writeLocalJson(CONFIG_STORAGE_KEY, nextConfig);

      if (Array.isArray(remoteConfig.assets)) {
        const nextAssets = remoteConfig.assets.map(normalizeAsset);
        setAssets((prev) => (isSameJson(prev, nextAssets) ? prev : nextAssets));
        writeLocalJson(ASSETS_STORAGE_KEY, nextAssets);
      }

      if (remoteConfig.projectData && typeof remoteConfig.projectData === 'object') {
        const nextProjectData = normalizeProjectData(remoteConfig.projectData, remoteConfig.projectData);
        setProjectData((prev) => (isSameJson(prev, nextProjectData) ? prev : nextProjectData));
        writeLocalJson(PROJECT_DATA_STORAGE_KEY, nextProjectData);
      }
    }

    if (Array.isArray(remoteProjects)) setProjects(remoteProjects.map(normalizeProject));
    if (Array.isArray(remoteReviews)) setReviews(remoteReviews.map((item, index) => normalizeReview(item, index)));
    if (Array.isArray(remoteReviewAuditLogs)) setReviewAuditLogs(remoteReviewAuditLogs);
    if (remoteProjectUnlocks && typeof remoteProjectUnlocks === 'object') setProjectUnlocks(remoteProjectUnlocks);
    if (remoteDeliveryUnlocks && typeof remoteDeliveryUnlocks === 'object') setDeliveryUnlocks(remoteDeliveryUnlocks);
  };

  const persistConfigSnapshot = async ({ nextConfig, nextAssets, nextProjectData } = {}) => {
    const payload = {
      ...(nextConfig || getConfig()),
      assets: nextAssets,
      projectData: nextProjectData,
    };
    const token = getStoredToken();
    const data = await fetchJson('/config', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(payload),
    });
    broadcastConfigUpdate();
    return data;
  };

  return { applyRemoteData, persistConfigSnapshot, broadcastConfigUpdate, DATA_SYNC_INTERVAL_MS };
}
