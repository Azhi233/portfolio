import {
  ASSETS_STORAGE_KEY,
  DELIVERY_UNLOCKS_STORAGE_KEY,
  EDIT_MODE_STORAGE_KEY,
  PROJECT_DATA_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  PROJECT_UNLOCKS_STORAGE_KEY,
  REVIEW_AUDIT_LOGS_STORAGE_KEY,
  REVIEWS_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  readLocalJson,
} from './configStorage.js';

export function isTokenPresent() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function readStoredConfig() {
  return readLocalJson('portfolio.cms.config', null);
}

export function readStoredProjects() {
  return readLocalJson(PROJECTS_STORAGE_KEY, []);
}

export function readStoredAssets() {
  return readLocalJson(ASSETS_STORAGE_KEY, {});
}

export function readStoredProjectData() {
  return readLocalJson(PROJECT_DATA_STORAGE_KEY, {});
}

export function readStoredProjectUnlocks() {
  return readLocalJson(PROJECT_UNLOCKS_STORAGE_KEY, {});
}

export function readStoredDeliveryUnlocks() {
  return readLocalJson(DELIVERY_UNLOCKS_STORAGE_KEY, {});
}

export function readStoredReviews() {
  return readLocalJson(REVIEWS_STORAGE_KEY, []);
}

export function readStoredReviewAuditLogs() {
  return readLocalJson(REVIEW_AUDIT_LOGS_STORAGE_KEY, []);
}

export function readStoredEditMode() {
  return readLocalJson(EDIT_MODE_STORAGE_KEY, false);
}
