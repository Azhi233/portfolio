import { createConfigActions } from './configActions.js';
import { createConfigState } from './configState.js';
import { createConfigSyncService } from './configSync.js';

export function createConfigStore({
  fetchJson,
  persistConfigSnapshot,
  createId,
  writePendingConfigPatch,
}) {
  const state = createConfigState();

  const syncService = createConfigSyncService({
    getConfig: () => state.config,
    setConfig: state.setConfig,
    setAssets: state.setAssets,
    setProjectData: state.setProjectData,
    setProjects: state.setProjects,
    setReviews: state.setReviews,
    setReviewAuditLogs: state.setReviewAuditLogs,
    setProjectUnlocks: state.setProjectUnlocks,
    setDeliveryUnlocks: state.setDeliveryUnlocks,
  });

  const actions = createConfigActions({
    getConfig: () => state.config,
    getProjects: () => state.projects,
    getProjectData: () => state.projectData,
    getAssets: () => state.assets,
    getReviewAuditLogs: () => state.reviewAuditLogs,
    getProjectUnlocks: () => state.projectUnlocks,
    getDeliveryUnlocks: () => state.deliveryUnlocks,
    setConfig: state.setConfig,
    setProjects: state.setProjects,
    setProjectData: state.setProjectData,
    setAssets: state.setAssets,
    setProjectUnlocks: state.setProjectUnlocks,
    setDeliveryUnlocks: state.setDeliveryUnlocks,
    setReviews: state.setReviews,
    setReviewAuditLogs: state.setReviewAuditLogs,
    fetchJson,
    persistConfigSnapshot,
    createId,
    writePendingConfigPatch,
  });

  return {
    state,
    actions,
    syncService,
  };
}
