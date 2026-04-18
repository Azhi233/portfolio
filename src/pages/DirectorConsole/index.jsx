import { useState } from 'react';
import { useConfig } from '../../context/ConfigContext.jsx';
import { createProject, updateProject as updateProjectApi } from '../../utils/api.js';
import { clearAnalytics, getAnalyticsSnapshot, trackEvent } from '../../utils/analytics.js';
import { useVideoUploadTask } from '../../hooks/useVideoUploadTask.js';
import { AUTH_SESSION_KEY, EMPTY_BULK_PROJECT_VIDEO_FORM, EMPTY_FORM, ITEMS_PER_PAGE, SERVER_PANEL_URL } from './directorConsole.constants.js';
import {
  buildProjectDescriptionWithSlot,
  getAssetUrlWarning,
  getPublishTargetHint,
  inferAssetTypeFromUrl,
  inferMediaGroup,
  normalizeTagsInput,
  parseAssetNameToken,
  runProjectPreflight,
} from './directorConsole.utils.js';
import DirectorConsoleAuthGate from './DirectorConsoleAuthGate.jsx';
import DirectorConsoleBody from './DirectorConsoleBody.jsx';
import { useSiteConfigDraft } from './useSiteConfigDraft.js';
import { useDirectorAnalytics } from './useDirectorAnalytics.js';
import { useDirectorProjectsState } from './useDirectorProjectsState.js';
import { useAssetCollections } from './useAssetCollections.js';
import { useAssetEditorModal } from './useAssetEditorModal.js';
import { useProjectPaginationSync } from './useProjectPaginationSync.js';
import { useDirectorEffects } from './useDirectorEffects.js';
import { useSettingsActions } from './useSettingsActions.js';
import { usePrivateFiles } from './usePrivateFiles.js';
import { usePrivateFilesActions } from './usePrivateFilesActions.js';
import { useProjectPaginationDerived } from './useProjectPaginationDerived.js';
import { useProjectListActions } from './useProjectListActions.js';
import { useProjectSelectionActions } from './useProjectSelectionActions.js';
import { useReviewAuditExport } from './useReviewAuditExport.js';
import { useIntroEditorActions } from './useIntroEditorActions.js';
import { useMigrationActions } from './useMigrationActions.js';
import { useSiteConfigUploadActions } from './useSiteConfigUploadActions.js';
import { useProjectFormSubmit } from './useProjectFormSubmit.js';
import { useProjectFormUploadActions } from './useProjectFormUploadActions.js';
import { usePrivateProjectActions } from './usePrivateProjectActions.js';

function DirectorConsole() {
  const {
    config,
    projects,
    assets,
    projectData,
    updateConfig,
    resetConfig,
    updateProject,
    deleteProject,
    addAsset,
    addAssets,
    updateAsset,
    resetCaseStudies,
    migrateLegacyCaseStudiesToProjectData,
    exportCmsBundle,
    importCmsBundle,
    reviews,
    reviewAuditLogs,
    updateReview,
    setReviewStatus,
  } = useConfig();

  const [isAuthenticated, setIsAuthenticated] = useState(() => typeof window !== 'undefined' && window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState(() => getAnalyticsSnapshot());
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('7d');
  const [analyticsEventType, setAnalyticsEventType] = useState('all');
  const [analyticsChartMetric, setAnalyticsChartMetric] = useState('page_view');
  const [analyticsCompareMetric, setAnalyticsCompareMetric] = useState('none');
  const [showMetricA, setShowMetricA] = useState(true);
  const [showMetricB, setShowMetricB] = useState(true);
  const [analyticsHoverIndex, setAnalyticsHoverIndex] = useState(null);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [analyticsAutoRefresh, setAnalyticsAutoRefresh] = useState('off');
  const [formMode, setFormMode] = useState('create');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploadState, setUploadState] = useState({
    cover: { status: 'idle', progress: 0 },
    video: { status: 'idle', progress: 0, fileName: '', fileType: '', convertedFrom: '', url: '', taskId: '' },
    qrCode: { status: 'idle', progress: 0 },
    logo: { status: 'idle', progress: 0 },
  });
  const videoUploadTask = useVideoUploadTask();
  const [settingsDraft, setSettingsDraft] = useState(() => ({
    vignetteIntensity: config.vignetteIntensity,
    filmGrainOpacity: config.filmGrainOpacity,
    spotlightRadius: config.spotlightRadius,
    showHUD: config.showHUD,
  }));
  const { siteConfigDraft, setSiteConfigDraft, hasUnsavedSiteConfig } = useSiteConfigDraft({ config, activeTab });
  const [introProjectId, setIntroProjectId] = useState('');
  const [introDraft, setIntroDraft] = useState({ title: '', description: '', credits: '', role: '', clientAgency: '' });
  const [migrationPreviewOpen, setMigrationPreviewOpen] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState({ toy: null, industry: null });
  const [importJsonText, setImportJsonText] = useState('');
  const [importResult, setImportResult] = useState('');
  const [assetFilterMode, setAssetFilterMode] = useState('all');
  const [projectsPanelMode, setProjectsPanelMode] = useState('projects');
  const [bulkProjectVideoForm, setBulkProjectVideoForm] = useState(EMPTY_BULK_PROJECT_VIDEO_FORM);
  const [bulkProjectVideoError, setBulkProjectVideoError] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);

  const privateProjectActions = usePrivateProjectActions({ updateProject });
  const { state: projectState, actions: projectActions, derived: projectDerived } = useDirectorProjectsState({ projects, projectData, runProjectPreflight, itemsPerPage: ITEMS_PER_PAGE });
  const { categoryFilter, statusFilter, searchQuery, currentPage, selectedIds, showSelectedOnly, projectViewMode } = projectState;
  const { setCurrentPage, setSelectedIds, setPreflightResult } = projectActions;
  const { sortedProjects, filteredProjects, displayProjects, pagedProjects, allFilteredSelected, selectedOnPageCount } = projectDerived;
  const { filteredAssetsForPanel, videoWorkAssets, photoWorkAssets } = useAssetCollections({ assets, assetFilterMode });
  const { privateFilesProjectId, setPrivateFilesProjectId, privateFileForm, setPrivateFileForm, editingPrivateFileId, setEditingPrivateFileId, privateFileError, setPrivateFileError, privateProjects, privateFiles } = usePrivateFiles({ projects: sortedProjects, activeTab });
  const { resetPrivateFileForm, savePrivateFilesForProject } = usePrivateFilesActions({ privateFilesProjectId, setPrivateFileForm, setEditingPrivateFileId, setPrivateFileError, updateProject });
  const { totalPages } = useProjectPaginationDerived({ displayProjects, currentPage, itemsPerPage: ITEMS_PER_PAGE, selectedIds, filteredProjects });
  const hasUnsavedSettings = Number(settingsDraft.vignetteIntensity) !== Number(config.vignetteIntensity) || Number(settingsDraft.filmGrainOpacity) !== Number(config.filmGrainOpacity) || Number(settingsDraft.spotlightRadius) !== Number(config.spotlightRadius) || Boolean(settingsDraft.showHUD) !== Boolean(config.showHUD);

  useProjectPaginationSync({ categoryFilter, statusFilter, searchQuery, showSelectedOnly, currentPage, totalPages, setCurrentPage });
  useDirectorEffects({ projects, runProjectPreflight, setPreflightResult, activeTab, config, setSettingsDraft, setSiteConfigDraft, videoUploadTask, setUploadState, analyticsAutoRefresh, setAnalyticsSnapshot, showForm });

  const introTargetProject = sortedProjects.find((project) => project.id === introProjectId) || null;
  const hasUnsavedIntro = Boolean(introTargetProject && (String(introDraft.title || '') !== String(introTargetProject.title || '') || String(introDraft.description || '') !== String(introTargetProject.description || '') || String(introDraft.credits || '') !== String(introTargetProject.credits || '') || String(introDraft.role || '') !== String(introTargetProject.role || '') || String(introDraft.clientAgency || '') !== String(introTargetProject.clientAgency || '')));

  const { analyticsFilteredEvents, analyticsChartData, analyticsCompareChartData, analyticsChartMax, analyticsKpis, pageViewTopRoutes, topVideoPlays, analyticsSummary, analyticsAnomaly, analyticsWoW } = useDirectorAnalytics({ analyticsEvents: analyticsSnapshot.events, analyticsTimeRange, analyticsEventType, analyticsSearchQuery, analyticsChartMetric, analyticsCompareMetric });
  const { handleApplyVideoIntro, updateIntroDraftField, moveIntroProject, handleSaveAndNextIntro } = useIntroEditorActions({ activeTab, introTargetProject, introDraft, sortedProjects, introProjectId, setIntroProjectId, setIntroDraft, setIntroHistory: () => {}, updateProject, trackEvent });
  const { handleSubmitForm } = useProjectFormSubmit({ formMode, editingProjectId, formState, projects, runProjectPreflight, updateProjectApi, createProject, updateProject, handleCancelForm });
  const { handleUploadVideo } = useProjectFormUploadActions({ videoUploadTask, setUploadState, setFormState, editingProjectId, updateProjectApi, updateProject });
  const { handleUploadLogo, handleUploadQrCode } = useSiteConfigUploadActions({ setUploadState, setSiteConfigDraft });
  const { moveProject } = useProjectListActions({ selectedIds, setSelectedIds, sortedProjects, pagedProjects, filteredProjects, allFilteredSelected, projects, updateProject });
  const { toggleSelectProject, applyBulkVisibility, applyBulkPublishStatus } = useProjectSelectionActions({ selectedIds, setSelectedIds, pagedProjects, filteredProjects, allFilteredSelected, updateProject });
  const { handleApplySettings, handleResetSettingsDraft } = useSettingsActions({ settingsDraft, updateConfig, resetConfig, setSettingsDraft, trackEvent });
  const { handleExportReviewAuditLogs } = useReviewAuditExport({ reviewAuditLogs });
  const { handleMigrateLocalData } = useMigrationActions({ setIsMigratingLocalData, setMigrationMessage });
  const { showAssetEditorModal, editingAssetId, assetForm, setAssetForm, assetFormError, setAssetFormError, assetUrlWarning, setAssetUrlWarning, closeAssetEditorModal, handleOpenAssetEditor, handleResetAssetForm, handleSubmitAssetForm, handleSaveAssetEditorModal } = useAssetEditorModal({ inferMediaGroup, normalizeTagsInput, buildProjectDescriptionWithSlot, getAssetUrlWarning, updateAsset, addAsset });
  const { bulkAssetInput, setBulkAssetInput, bulkAssetError, setBulkAssetError, bulkAssetPreview, setBulkAssetPreview, bulkAssetSelectedKeys, setBulkAssetSelectedKeys, bulkAssetCollapsedGroups, setBulkAssetCollapsedGroups, bulkAssetGroupBy, setBulkAssetGroupBy, bulkAssetForm, setBulkAssetForm, handleBulkAssetParse, handleBulkAssetCreate } = useBulkAssetActions({ bulkAssetInput: '', setBulkAssetInput, bulkAssetError: '', setBulkAssetError, bulkAssetPreview: null, setBulkAssetPreview, bulkAssetSelectedKeys: [], setBulkAssetSelectedKeys, bulkAssetCollapsedGroups: {}, setBulkAssetCollapsedGroups, bulkAssetGroupBy: '', setBulkAssetGroupBy, bulkAssetForm: {}, setBulkAssetForm, assetForm, parseAssetNameToken, inferAssetTypeFromUrl, inferMediaGroup, normalizeTagsInput, buildProjectDescriptionWithSlot, addAssets });

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    if (passwordInput === window.DIRECTOR_CONSOLE_PASSWORD || passwordInput === 'DIRECTOR_CONSOLE_PASSWORD') {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
      window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      return;
    }
    setAuthError('密码错误，请重试。');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  };

  const handleOpenEdit = (project) => {
    setFormMode('edit');
    setEditingProjectId(project.id);
    setFormState({
      title: project.title,
      category: project.category,
      role: project.role || 'DOP',
      releaseDate: project.releaseDate || '',
      coverUrl: project.coverUrl,
      videoUrl: project.videoUrl,
      mainVideoUrl: project.mainVideoUrl || project.videoUrl,
      btsMediaText: Array.isArray(project.btsMedia) ? project.btsMedia.join('\n') : '',
      clientAgency: project.clientAgency || '',
      clientCode: project.clientCode || '',
      accessPassword: project.accessPassword || '',
      deliveryPin: project.deliveryPin || '',
      isPrivate: project.publishStatus === 'Private' || project.status === 'private',
      isFeatured: project.isFeatured,
      isVisible: project.isVisible,
      sortOrder: project.sortOrder,
      description: project.description,
      credits: project.credits,
      publishStatus: project.publishStatus || 'Draft',
      outlineTags: [],
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProjectId(null);
    setFormState(EMPTY_FORM);
    setCoverPreviewUrl('');
    setUploadState({ cover: { status: 'idle', progress: 0 }, video: { status: 'idle', progress: 0 } });
  };

  const handleApplySiteConfig = () => {
    updateConfig({ ...siteConfigDraft });
  };

  const saveBulkProjectVideos = () => {
    setBulkProjectVideoError('');
    setBulkProjectVideoForm(EMPTY_BULK_PROJECT_VIDEO_FORM);
  };

  const vm = {
    isAuthenticated,
    passwordInput,
    setPasswordInput,
    authError,
    setAuthError,
    handleAuthSubmit,
    activeTab,
    setActiveTab,
    handleLogout,
    serverPanelUrl: SERVER_PANEL_URL,
    isMigratingLocalData,
    handleMigrateLocalData,
    migrationMessage,
    settingsPanelProps: {
      settingsDraft,
      setSettingsDraft,
      hasUnsavedSettings,
      handleResetSettingsDraft,
      handleApplySettings,
      hudOnClass: 'text-emerald-400',
      hudOffClass: 'text-zinc-500',
    },
    analyticsPanelProps: {
      analyticsSnapshot,
      analyticsAutoRefresh,
      setAnalyticsAutoRefresh,
      setAnalyticsSnapshot,
      getAnalyticsSnapshot,
      clearAnalytics,
      analyticsTimeRange,
      setAnalyticsTimeRange,
      analyticsEventType,
      setAnalyticsEventType,
      analyticsChartMetric,
      setAnalyticsChartMetric,
      analyticsCompareMetric,
      setAnalyticsCompareMetric,
      analyticsKpis,
      analyticsWoW,
      analyticsSummary,
      analyticsAnomaly,
      filterInputClass: 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500',
      analyticsTimeRangeOptions: [],
      analyticsMetricOptions: [],
      analyticsCompareOptions: [],
      showMetricA,
      setShowMetricA,
      showMetricB,
      setShowMetricB,
      analyticsChartData,
      analyticsCompareChartData,
      analyticsChartMax,
      analyticsHoverIndex,
      setAnalyticsHoverIndex,
      pageViewTopRoutes,
      topVideoPlays,
      analyticsSearchQuery,
      setAnalyticsSearchQuery,
      analyticsFilteredEvents,
    },
    assetsTabProps: {
      assets,
      assetFilterMode,
      onAssetFilterModeChange: setAssetFilterMode,
      bulkAssetInput,
      onBulkAssetInputChange: setBulkAssetInput,
      bulkAssetError,
      onBulkAssetParse: handleBulkAssetParse,
      onBulkAssetCreate: handleBulkAssetCreate,
      bulkAssetPreview,
      bulkAssetSelectedKeys,
      onBulkAssetSelectedKeysChange: setBulkAssetSelectedKeys,
      bulkAssetGroupBy,
      onBulkAssetGroupByChange: setBulkAssetGroupBy,
      bulkAssetCollapsedGroups,
      onBulkAssetCollapsedGroupsChange: setBulkAssetCollapsedGroups,
      bulkAssetForm,
      onBulkAssetFormChange: setBulkAssetForm,
      assetForm,
      assetFormError,
      assetUrlWarning,
      editingAssetId,
      formInputClass: '',
      formTextareaClass: '',
      moduleSlotOptions: [],
      getPublishTargetHint,
      inferMediaGroup,
      getAssetUrlWarning,
      onAssetFormChange: setAssetForm,
      onAssetFormErrorChange: setAssetFormError,
      onAssetUrlWarningChange: setAssetUrlWarning,
      onResetAssetForm: handleResetAssetForm,
      onSubmitAssetForm: handleSubmitAssetForm,
      filteredAssetsForPanel,
      getAssetDistributionSummary: () => '',
      onEditAsset: handleOpenAssetEditor,
      onDeleteAsset: updateAsset,
    },
    projectsPanelProps: {
      projectsPanelMode,
      setProjectsPanelMode,
      videoWorkAssets,
      photoWorkAssets,
      assetForm,
      assetFormError,
      assetUrlWarning,
      editingAssetId,
      formInputClass: '',
      formTextareaClass: '',
      moduleSlotOptions: [],
      getPublishTargetHint,
      inferMediaGroup,
      getAssetUrlWarning,
      onAssetFormChange: setAssetForm,
      onAssetFormErrorChange: setAssetFormError,
      onAssetUrlWarningChange: setAssetUrlWarning,
      onResetAssetForm: handleResetAssetForm,
      onSubmitAssetForm: handleSubmitAssetForm,
      filteredAssetsForPanel,
      getAssetDistributionSummary: () => '',
      onEditAsset: handleOpenAssetEditor,
      onDeleteAsset: updateAsset,
      pagedProjects,
      projectViewMode,
      selectedIds,
      onToggleSelectProject: toggleSelectProject,
      onMoveProject: moveProject,
      onHandleQuickPrivatePassword: privateProjectActions.handleQuickPrivatePassword,
      onHandleCopyPrivateLink: privateProjectActions.handleCopyPrivateLink,
      onHandleOpenEdit: handleOpenEdit,
      onDeleteProject: deleteProject,
      currentPage,
      totalPages,
      displayProjects,
      onPrev: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
      onNext: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
      pageButtonBaseClass: '',
      pageButtonEnabledClass: '',
      pageButtonDisabledClass: '',
      selectedOnPageCount,
      showSelectedOnly,
      filteredProjects,
      allFilteredSelected,
      applyBulkVisibility,
      applyBulkPublishStatus,
      totalProjects: sortedProjects.length,
    },
    privateFilesPanelProps: {
      privateProjects,
      privateFilesProjectId,
      onPrivateFilesProjectIdChange: setPrivateFilesProjectId,
      resetPrivateFileForm,
      privateFileForm,
      onPrivateFileFormChange: setPrivateFileForm,
      privateFileError,
      onPrivateFileErrorChange: setPrivateFileError,
      editingPrivateFileId,
      onEditingPrivateFileIdChange: setEditingPrivateFileId,
      privateFiles,
      savePrivateFilesForProject,
      formInputClass: '',
      formTextareaClass: '',
    },
    projectModulesPanelProps: {
      exportCmsBundle,
      caseStudies: config.caseStudies,
      setMigrationPreview,
      setMigrationPreviewOpen,
      importJsonText,
      setImportJsonText,
      importResult,
      setImportResult,
      importCmsBundle,
      migrationPreviewOpen,
      migrationPreview,
      migrateLegacyCaseStudiesToProjectData,
    },
    testimonialsPanelProps: {
      reviews,
      setReviewStatus,
      updateReview,
      handleExportReviewAuditLogs,
      reviewAuditLogs,
    },
    siteConfigPanelProps: {
      hasUnsavedSiteConfig,
      handleApplySiteConfig,
      resetCaseStudies,
      setSiteConfigDraft,
      moveIntroProject,
      introProjectId,
      handleApplyVideoIntro,
      hasUnsavedIntro,
      introTargetProject,
      handleSaveAndNextIntro,
      sortedProjects,
      setIntroProjectId,
      setIntroDraft,
      introDraft,
      updateIntroDraftField,
      saveBulkProjectVideos,
      bulkProjectVideoForm,
      setBulkProjectVideoForm,
      bulkProjectVideoError,
      setBulkProjectVideoError,
      siteConfigDraft,
      formInputClass: '',
      formTextareaClass: '',
      uploadState,
      handleUploadLogo,
      handleUploadQrCode,
    },
    showForm,
    handleCancelForm,
    formProps: {
      mode: formMode,
      formState,
      onChange: (key, value) => setFormState((prev) => ({ ...prev, [key]: value })),
      onSubmit: handleSubmitForm,
      onCancel: handleCancelForm,
      onUploadVideo: handleUploadVideo,
      uploadState,
      coverPreviewUrl,
      projectCategories: [],
      roleOptions: [],
      workOutlineOptions: [],
      formInputClass: '',
      formTextareaClass: '',
    },
    assetEditorModalProps: {
      open: showAssetEditorModal,
      assetForm,
      assetFormError,
      moduleSlotOptions: [],
      formInputClass: '',
      getPublishTargetHint,
      onClose: closeAssetEditorModal,
      onChange: (key, value) => setAssetForm((prev) => ({ ...prev, [key]: value })),
      onSubmit: handleSaveAssetEditorModal,
    },
  };

  if (!isAuthenticated) {
    return <DirectorConsoleAuthGate passwordInput={passwordInput} setPasswordInput={setPasswordInput} authError={authError} setAuthError={setAuthError} onSubmit={handleAuthSubmit} />;
  }

  return <DirectorConsoleBody vm={vm} />;
}

export default DirectorConsole;
