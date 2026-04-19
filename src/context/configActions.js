import { createAssetActions } from './configAssets.js';
import { createBundleActions } from './configBundle.js';
import { createProjectActions } from './configProjects.js';
import { createReviewActions } from './configReviews.js';

export function createConfigActions({
  getConfig,
  getProjects,
  getProjectData,
  getAssets,
  getReviewAuditLogs,
  getProjectUnlocks,
  getDeliveryUnlocks,
  setConfig,
  setProjects,
  setProjectData,
  setAssets,
  setProjectUnlocks,
  setDeliveryUnlocks,
  setReviews,
  setReviewAuditLogs,
  fetchJson,
  persistConfigSnapshot,
  createId,
  writePendingConfigPatch,
}) {
  const projectActions = createProjectActions({
    getProjects,
    setProjects,
    fetchJson,
    persistConfigSnapshot,
    createId,
    getProjectUnlocks,
    setProjectUnlocks,
  });

  const reviewActions = createReviewActions({
    getConfig,
    getReviewAuditLogs,
    setReviews,
    setReviewAuditLogs,
    fetchJson,
  });

  const assetActions = createAssetActions({
    setAssets,
    persistConfigSnapshot,
    createId,
  });

  const bundleActions = createBundleActions({
    getConfig,
    getAssets,
    getProjectData,
    setConfig,
    setAssets,
    setProjectData,
    persistConfigSnapshot,
    writePendingConfigPatch,
  });

  return {
    ...projectActions,
    ...reviewActions,
    ...assetActions,
    ...bundleActions,
  };
}
