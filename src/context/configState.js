import { DEFAULT_CONFIG } from './configDefaults.js';
import {
  isTokenPresent,
  readStoredAssets,
  readStoredConfig,
  readStoredDeliveryUnlocks,
  readStoredEditMode,
  readStoredProjectData,
  readStoredProjectUnlocks,
  readStoredProjects,
  readStoredReviewAuditLogs,
  readStoredReviews,
} from './configHelpers.js';

export function createInitialConfigState() {
  return {
    config: readStoredConfig(),
    projects: readStoredProjects(),
    assets: readStoredAssets(),
    projectData: readStoredProjectData(),
    projectUnlocks: readStoredProjectUnlocks(),
    deliveryUnlocks: readStoredDeliveryUnlocks(),
    reviews: readStoredReviews(),
    reviewAuditLogs: readStoredReviewAuditLogs(),
    isAdmin: isTokenPresent(),
    isEditMode: readStoredEditMode(),
  };
}

export function getDefaultConfigState() {
  return {
    config: DEFAULT_CONFIG,
  };
}
