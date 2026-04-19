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

export {
  TOKEN_STORAGE_KEY,
  EDIT_MODE_STORAGE_KEY,
  SYNC_CHANNEL_NAME,
  SYNC_EVENT_NAME,
  CONFIG_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  ASSETS_STORAGE_KEY,
  PROJECT_DATA_STORAGE_KEY,
  PROJECT_UNLOCKS_STORAGE_KEY,
  DELIVERY_UNLOCKS_STORAGE_KEY,
  REVIEWS_STORAGE_KEY,
  REVIEW_AUDIT_LOGS_STORAGE_KEY,
  PENDING_CONFIG_PATCH_KEY,
  readLocalJson,
  writeLocalJson,
};
