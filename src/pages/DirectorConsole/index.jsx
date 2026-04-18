import { Server } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import LocalUploadField from '../../components/LocalUploadField.jsx';
import CoverUploader from '../../components/CoverUploader.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';
import { createProject, updateProject as updateProjectApi } from '../../utils/api.js';
import { clearAnalytics, getAnalyticsSnapshot, trackEvent } from '../../utils/analytics.js';
import { migrateLocalToDB } from '../../utils/migrateLocalToDB.js';
import { useVideoUploadTask } from '../../hooks/useVideoUploadTask.js';
import ProjectForm from './ProjectForm.jsx';
import AssetEditorModal from './AssetEditorModal.jsx';
import AssetsTab from './AssetsTab.jsx';
import ProjectGrid from './ProjectGrid.jsx';
import ProjectPaginationBar from './ProjectPaginationBar.jsx';
import PrivateFilesPanel from './PrivateFilesPanel.jsx';
import ProjectModulesPanel from './ProjectModulesPanel.jsx';
import TestimonialsPanel from './TestimonialsPanel.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import SiteConfigPanel from './SiteConfigPanel.jsx';
import { useDirectorAnalytics } from './useDirectorAnalytics.js';
import { useDirectorProjectsState } from './useDirectorProjectsState.js';
import { normalizePrivateFilesOrder } from './usePrivateFilesActions.js';
import { parseBulkAssetInput, createBulkAssets } from './useBulkAssetActions.js';
import {
  saveBulkProjectVideoUrls,
  applyVideoIntroChanges,
  moveIntroProjectSelection,
  saveAndGoToNextIntro,
} from './useSiteConfigActions.js';
import { applySiteConfigChanges } from './useApplySiteConfig.js';
import {
  moveProjectByDirection,
  toggleProjectSelection,
  applyBulkVisibilityChange,
  applyBulkPublishStatusChange,
} from './useProjectBulkActions.js';

const PROJECT_CATEGORIES = ['TVC', '纪录片', 'MV', '实验短片', 'Toys', 'Industrial', 'Misc'];
const FILTER_CATEGORIES = ['All', ...PROJECT_CATEGORIES];
const STATUS_OPTIONS = ['Draft', 'Published', 'Private'];
const FILTER_STATUS = ['All', ...STATUS_OPTIONS];
const ROLE_OPTIONS = ['DOP', '导演', '调色师', '摄影指导', '剪辑'];
const ITEMS_PER_PAGE = 6;
const ANALYTICS_TIME_RANGE_OPTIONS = ['today', '7d', '30d', 'all'];
const ANALYTICS_METRIC_OPTIONS = ['page_view', 'video_play_clicked', 'video_watch_duration', 'layout_changed', 'theme_or_settings_changed'];
const ANALYTICS_COMPARE_OPTIONS = ['none', ...ANALYTICS_METRIC_OPTIONS];

const AUTH_SESSION_KEY = 'director_auth_session';
const DIRECTOR_CONSOLE_PASSWORD = 'zhizhi233';
const SERVER_PANEL_URL = import.meta.env.VITE_SERVER_URL || '';

const EMPTY_FORM = {
  title: '',
  category: 'TVC',
  role: 'DOP',
  releaseDate: '',
  coverUrl: '',
  videoUrl: '',
  mainVideoUrl: '',
  btsMediaText: '',
  clientAgency: '',
  clientCode: '',
  accessPassword: '',
  deliveryPin: '',
  isPrivate: false,
  isFeatured: false,
  isVisible: true,
  sortOrder: 0,
  description: '',
  credits: '',
  publishStatus: 'Draft',
  outlineTags: [],
};

const EMPTY_MEDIA_FORM = {
  kind: 'image',
  url: '',
  title: 'WeChat QR Code',
};

const MODULE_SLOT_OPTIONS = [
  { value: '', label: 'Auto · 自动分配' },
  { value: 'brand-video', label: 'Brand Video · 品牌主视频位' },
  { value: 'hero-left', label: 'Toy · Hero Left 左主视觉' },
  { value: 'hero-right', label: 'Toy · Hero Right 右主视觉' },
  { value: 'hero-merged', label: 'Toy · Hero Merged 合成主视觉' },
  { value: 'social', label: 'Toy · Social Grid 社交流位' },
  { value: 'industry-hero-video', label: 'Industry · Hero Video 主视频位' },
  { value: 'industry-asset-grid', label: 'Industry · Asset Grid 素材位' },
];

const MEDIA_GROUP_OPTIONS = [
  { value: 'photo', label: '摄影作品' },
  { value: 'video', label: '视频作品' },
];

const WORK_OUTLINE_OPTIONS = [
  { id: 'all', label: 'ALL WORKS' },
  { id: 'home-projects', label: 'HOME · PROJECT SHOWCASE' },
  { id: 'home-expertise-toys', label: 'HOME · EXPERTISE / TOYS' },
  { id: 'home-expertise-industrial', label: 'HOME · EXPERTISE / INDUSTRIAL' },
  { id: 'home-expertise-misc', label: 'HOME · EXPERTISE / MISC' },
  { id: 'business-toy', label: 'BUSINESS SWITCH · TOY' },
  { id: 'business-industry', label: 'BUSINESS SWITCH · INDUSTRY' },
  { id: 'page-toys', label: 'PAGINATION · TOYS PAGE' },
  { id: 'page-industrial', label: 'PAGINATION · INDUSTRIAL PAGE' },
  { id: 'page-misc', label: 'PAGINATION · MISC PAGE' },
];

const EMPTY_ASSET_FORM = {
  title: '',
  url: '',
  type: 'image',
  rawUrl: '',
  gradedUrl: '',
  styledUrl: '',
  publishTarget: 'expertise',
  expertiseCategory: 'commercial',
  projectId: 'toy_project',
  expertiseDescription: '',
  projectDescription: '',
  moduleSlot: '',
  videoCategory: 'COMMERCIAL',
  mediaGroup: 'photo',
};

const EMPTY_BULK_ASSET_FORM = {
  urlsText: '',
  publishTarget: 'project',
  expertiseCategory: 'commercial',
  projectId: 'toy_project',
  expertiseDescription: '',
  projectDescription: '',
  manualTagsText: '',
};

const EMPTY_BULK_VIDEO_FORM = {
  urlsText: '',
  projectId: '',
};

const EMPTY_PRIVATE_FILE_FORM = {
  projectId: '',
  name: '',
  url: '',
  actionType: 'download',
  note: '',
  enabled: true,
};

const EMPTY_BULK_PROJECT_VIDEO_FORM = {
  projectId: '',
  urlsText: '',
};

const FORM_INPUT_CLASS =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2';
const FILTER_INPUT_CLASS =
  'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2';
const FORM_TEXTAREA_CLASS =
  'min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2';

const PAGE_BUTTON_BASE_CLASS = 'rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition';
const PAGE_BUTTON_ENABLED_CLASS = 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400';
const PAGE_BUTTON_DISABLED_CLASS = 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500';

const BULK_BUTTON_BASE_CLASS = 'rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition';
const BULK_BUTTON_DISABLED_CLASS = 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500';
const BULK_SHOW_CLASS = 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20';
const BULK_HIDE_CLASS = 'border-amber-300/70 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20';
const BULK_PUBLISH_CLASS = 'border-sky-300/70 bg-sky-300/10 text-sky-200 hover:bg-sky-300/20';
const BULK_DRAFT_CLASS = 'border-purple-300/70 bg-purple-300/10 text-purple-200 hover:bg-purple-300/20';

const SELECT_BUTTON_BASE_CLASS = 'rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition';
const SELECT_BUTTON_DEFAULT_CLASS = 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400';
const SELECT_BUTTON_MUTED_CLASS = 'border-zinc-500 bg-zinc-800 text-zinc-100';
const SELECT_BUTTON_DISABLED_CLASS = 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500';
const SELECT_TOGGLE_ACTIVE_CLASS = 'border-sky-300/70 bg-sky-300/20 text-sky-100';
const SELECT_TOGGLE_INACTIVE_CLASS = 'border-sky-300/70 bg-sky-300/10 text-sky-200 hover:bg-sky-300/20';

const ACTIVE_ACTION_CLASS = 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20';
const DISABLED_ACTION_CLASS = 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500';
const HUD_ON_CLASS = 'border-emerald-300/70 bg-emerald-300/15 text-emerald-200';
const HUD_OFF_CLASS = 'border-zinc-600 bg-zinc-800 text-zinc-300';

const getActionButtonClass = (isEnabled) =>
  `rounded-md border px-3 py-2 text-xs tracking-[0.12em] transition ${
    isEnabled ? ACTIVE_ACTION_CLASS : DISABLED_ACTION_CLASS
  }`;

const UPLOAD_POLL_INTERVAL_MS = 1500;
const UPLOAD_POLL_TIMEOUT_MS = 180000;

function normalizeAssetPublishTarget(asset) {
  if (asset?.views?.video?.isActive) return 'both';
  if (asset?.views?.expertise?.isActive && asset?.views?.project?.isActive) return 'both';
  if (asset?.views?.project?.isActive) return 'project';
  return 'expertise';
}

function getAssetDistributionSummary(asset) {
  const parts = [];
  if (asset?.views?.expertise?.isActive) parts.push('后台');
  if (asset?.views?.project?.isActive) parts.push('项目页');
  if (asset?.views?.video?.isActive) parts.push('视频页');
  const group = asset?.mediaGroup === 'video' ? '视频作品' : asset?.mediaGroup === 'photo' ? '摄影作品' : '';
  if (group) parts.push(group);
  return parts.length > 0 ? parts.join(' · ') : '未分配';
}

function getProjectIdByModuleSlot(projectId, moduleSlot) {
  return String(projectId || '').trim() || 'toy_project';
}

function parseAssetNameToken(fileName) {
  const base = String(fileName || '').trim();
  if (!base) return null;

  const clean = base.replace(/\.[^.]+$/, '');
  const parts = clean.split('-').map((x) => x.trim()).filter(Boolean);
  if (parts.length < 8) return null;

  const [ym, product, theme, orientation, resolution, stage, seq, codec] = parts;
  const yy = ym.slice(0, 2);
  const mm = ym.slice(2, 4);
  const year = Number(`20${yy}`);
  const month = Number(mm);

  return {
    year: Number.isFinite(year) ? year : null,
    month: Number.isFinite(month) ? month : null,
    product,
    theme,
    orientation,
    resolution,
    stage,
    seq,
    codec,
    title: `${product?.toUpperCase() || 'ASSET'} · ${theme?.toUpperCase() || 'N/A'} · ${resolution || ''} ${orientation || ''}`.trim(),
  };
}

function inferAssetTypeFromUrl(url) {
  const value = String(url || '').trim().toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/.test(value)) return 'video';
  return 'image';
}

function inferMediaGroup(type, url) {
  if (String(type || '').toLowerCase() === 'video') return 'video';
  return inferAssetTypeFromUrl(url) === 'video' ? 'video' : 'photo';
}

function extractModuleSlot(description = '') {
  const text = String(description || '');
  const match = text.match(/#module:([a-z0-9_-]+)/i);
  return match?.[1] || '';
}

function stripModuleSlotTag(description = '') {
  return String(description || '')
    .replace(/\s*#module:[a-z0-9_-]+\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildProjectDescriptionWithSlot(description = '', moduleSlot = '') {
  const clean = stripModuleSlotTag(description);
  const slot = String(moduleSlot || '').trim();
  if (!slot) return clean;
  return clean ? `${clean} #module:${slot}` : `#module:${slot}`;
}

function getPublishTargetHint(publishTarget) {
  if (publishTarget === 'both') return '同步进入项目页与视频页';
  if (publishTarget === 'project') return '仅进入项目页';
  return '仅进入后台可见区';
}

function ProjectVideoPresence({ project }) {
  const hasMainVideo = Boolean(String(project?.mainVideoUrl || project?.videoUrl || '').trim());
  const btsCount = Array.isArray(project?.btsMedia) ? project.btsMedia.filter(Boolean).length : 0;

  return (
    <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs tracking-[0.1em] text-zinc-400">
      <p>
        主视频：{hasMainVideo ? '已设置' : '未设置'} · BTS：{btsCount} 条
      </p>
      {hasMainVideo ? (
        <p className="mt-1 break-all text-cyan-200">{project?.mainVideoUrl || project?.videoUrl}</p>
      ) : null}
    </div>
  );
}

function getAssetUrlWarning(url, type) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) return '建议使用 http(s) 链接，当前可能无法在前台稳定访问。';
  if (/localhost|127\.0\.0\.1|192\.168\./i.test(value)) return '检测到本地/内网地址，线上访问时可能失效。';
  if (type === 'image' && /\.(mp4|webm|mov)(\?.*)?$/i.test(value)) return '当前类型是 Image，但 URL 更像视频资源。';
  if (type === 'video' && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(value)) return '当前类型是 Video，但 URL 更像图片资源。';
  return '';
}

function normalizeTagsInput(value) {
  return String(value || '')
    .split(/[\r\n,，;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildLegacyMigrationPreview(caseStudies = {}) {
  const parseLines = (text) =>
    String(text || '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

  const mapOne = (legacy, headline) => {
    const targetLines = parseLines(legacy?.target);
    const actionLines = parseLines(legacy?.action);
    const assetLines = parseLines(legacy?.assets);
    const reviewLines = parseLines(legacy?.review);

    return {
      targetHeadline: headline,
      targetSummary: targetLines[0] || '',
      targetTags: targetLines.map((x) => (x.startsWith('#') ? x : `#${x}`)).slice(0, 6),
      actionBullets: actionLines.slice(0, 8),
      assetUrls: assetLines.filter((x) => /^https?:\/\//i.test(x)),
      reviewCards: reviewLines.slice(0, 3).map((line, idx) => ({
        title: idx === 0 ? '产出规模' : idx === 1 ? '痛点解决' : '资产沉淀',
        value: line,
      })),
    };
  };

  return {
    toy: mapOne(caseStudies?.toy, 'CHALLENGE'),
    industry: mapOne(caseStudies?.industry, 'INDUSTRY CHALLENGE'),
  };
}

function runProjectPreflight(projects = []) {
  const issues = [];

  projects.forEach((project) => {
    const title = String(project?.title || '').trim();
    const coverUrl = String(project?.coverUrl || '').trim();
    const videoUrl = String(project?.videoUrl || '').trim();
    const publishStatus = String(project?.publishStatus || 'Draft');
    const password = String(project?.accessPassword || '').trim();

    if (!title) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: 'error',
        code: 'TITLE_REQUIRED',
        message: 'Project title is required.',
      });
    }

    if (!coverUrl) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: publishStatus === 'Published' ? 'error' : 'warning',
        code: 'COVER_REQUIRED',
        message: 'Cover URL is empty.',
      });
    } else if (!/^https?:\/\//i.test(coverUrl)) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: publishStatus === 'Published' ? 'error' : 'warning',
        code: 'COVER_URL_INVALID',
        message: 'Cover URL should be http(s).',
      });
    }

    if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
      issues.push({
        projectId: project?.id,
        projectTitle: project?.title || '(untitled)',
        severity: 'warning',
        code: 'VIDEO_URL_INVALID',
        message: 'Video URL should be http(s).',
      });
    }

    if (publishStatus === 'Private') {
      if (!password) {
        issues.push({
          projectId: project?.id,
          projectTitle: project?.title || '(untitled)',
          severity: 'error',
          code: 'PRIVATE_PASSWORD_REQUIRED',
          message: 'Private project requires access password.',
        });
      } else if (password.length < 4) {
        issues.push({
          projectId: project?.id,
          projectTitle: project?.title || '(untitled)',
          severity: 'warning',
          code: 'PRIVATE_PASSWORD_WEAK',
          message: 'Private password is too short (< 4 chars).',
        });
      }
    }
  });

  return {
    checkedAt: new Date().toISOString(),
    totalProjects: projects.length,
    errorCount: issues.filter((x) => x.severity === 'error').length,
    warningCount: issues.filter((x) => x.severity === 'warning').length,
    issues,
  };
}

function FieldLabel({ title, value }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-xs tracking-[0.15em] text-zinc-400">{title}</p>
      <p className="text-xs tracking-[0.08em] text-emerald-300">{value}</p>
    </div>
  );
}

function PanelTab({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-2 text-xs tracking-[0.14em] transition ${
        isActive
          ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-200'
          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
      }`}
    >
      {children}
    </button>
  );
}

function DirectorConsole() {
  const {
    config,
    projects,
    assets,
    projectData,
    updateConfig,
    resetConfig,
    addProject,
    updateProject,
    deleteProject,
    addAsset,
    addAssets,
    updateAsset,
    deleteAsset,
    updateProjectModule,
    updateCaseStudy,
    resetCaseStudies,
    migrateLegacyCaseStudiesToProjectData,
    exportCmsBundle,
    importCmsBundle,
    reviews,
    reviewAuditLogs,
    updateReview,
    setReviewStatus,
  } = useConfig();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
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
  const [siteConfigDraft, setSiteConfigDraft] = useState(() => ({
    siteTitle: config.siteTitle || 'DIRECTOR.VISION',
    siteDescription: config.siteDescription || '',
    ogImage: config.ogImage || '',
    logoImageUrl: config.logoImageUrl || '',
    logoAltText: config.logoAltText || '',
    qrCodeImageUrl: config.qrCodeImageUrl || '',
    contactEmail: config.contactEmail || '',
    contactPhone: config.contactPhone || '',
    contactLocation: config.contactLocation || '',
    projectPrivateTitle: config.projectPrivateTitle || 'PRIVATE PROJECT',
    projectPrivateDescription: config.projectPrivateDescription || '该项目为私密访问，请输入密码后查看。',
    projectPrivateEmptyText: config.projectPrivateEmptyText || '暂无私密说明。',
    projectPrivatePasswordPlaceholder: config.projectPrivatePasswordPlaceholder || '请输入项目访问密码',
    projectPrivateUnlockButtonText: config.projectPrivateUnlockButtonText || 'UNSEAL PROJECT',
    projectPrivateErrorText: config.projectPrivateErrorText || '密码错误，请重试。',
    projectDownloadTitle: config.projectDownloadTitle || 'PRIVATE DELIVERY FILES',
    projectDownloadEmptyText: config.projectDownloadEmptyText || '暂无可下载文件。',
    projectDownloadAllButtonText: config.projectDownloadAllButtonText || '一键下载全部',
    projectDownloadSelectedButtonText: config.projectDownloadSelectedButtonText || '打包下载已选 (ZIP)',
    projectGalleryTitle: config.projectGalleryTitle || 'ALBUM',
    projectGalleryEmptyText: config.projectGalleryEmptyText || '暂无画廊内容。',
    projectGalleryActionBarText: config.projectGalleryActionBarText || 'ALBUM ACTION BAR',
    projectGallerySelectionText: config.projectGallerySelectionText || '已选择 X 张',
    projectButtonText: config.projectButtonText || 'BUTTON TEXT',
    privateTitle: config.privateTitle || '',
    privateDescription: config.privateDescription || '',
    privateAccessLabel: config.privateAccessLabel || '',
    privateAccessHint: config.privateAccessHint || '',
    privateAccessButtonText: config.privateAccessButtonText || '',
    privateErrorText: config.privateErrorText || '',
    deliveryTitle: config.deliveryTitle || '',
    deliverySuccessText: config.deliverySuccessText || '',
    deliveryPinPlaceholder: config.deliveryPinPlaceholder || '',
    deliveryErrorText: config.deliveryErrorText || '',
    deliveryButtonText: config.deliveryButtonText || '',
    downloadTitle: config.downloadTitle || '',
    downloadAllButtonText: config.downloadAllButtonText || '',
    downloadSelectedButtonText: config.downloadSelectedButtonText || '',
    galleryTitle: config.galleryTitle || '',
    galleryActionBarText: config.galleryActionBarText || '',
    gallerySelectionText: config.gallerySelectionText || '',
    buttonText: config.buttonText || '',
    contactPhone: config.contactPhone || '',
    contactLocation: config.contactLocation || '',
    resumeAwardsText: config.resumeAwardsText || '',
    resumeExperienceText: config.resumeExperienceText || '',
    resumeGearText: config.resumeGearText || '',
    testimonialsText: config.testimonialsText || '',
    brandNamesText: config.brandNamesText || '',
    servicesText: config.servicesText || '',
    caseToyTarget: config.caseStudies?.toy?.target || '',
    caseToyAction: config.caseStudies?.toy?.action || '',
    caseToyAssets: config.caseStudies?.toy?.assets || '',
    caseToyReview: config.caseStudies?.toy?.review || '',
    caseIndustryTarget: config.caseStudies?.industry?.target || '',
    caseIndustryAction: config.caseStudies?.industry?.action || '',
    caseIndustryAssets: config.caseStudies?.industry?.assets || '',
    caseIndustryReview: config.caseStudies?.industry?.review || '',
  }));
  const [introProjectId, setIntroProjectId] = useState('');
  const [introDraft, setIntroDraft] = useState({
    title: '',
    description: '',
    credits: '',
    role: '',
    clientAgency: '',
  });
  const [introHistory, setIntroHistory] = useState([]);
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET_FORM);
  const [assetFormError, setAssetFormError] = useState('');
  const [assetUrlWarning, setAssetUrlWarning] = useState('');
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [showAssetEditorModal, setShowAssetEditorModal] = useState(false);
  const [bulkAssetInput, setBulkAssetInput] = useState('');
  const [bulkAssetError, setBulkAssetError] = useState('');
  const [bulkAssetPreview, setBulkAssetPreview] = useState([]);
  const [bulkAssetSelectedKeys, setBulkAssetSelectedKeys] = useState([]);
  const [bulkAssetCollapsedGroups, setBulkAssetCollapsedGroups] = useState([]);
  const [bulkAssetGroupBy, setBulkAssetGroupBy] = useState('ym');
  const [bulkAssetForm, setBulkAssetForm] = useState(EMPTY_BULK_ASSET_FORM);
  const [projectModuleDraft, setProjectModuleDraft] = useState(() => ({
    projectId: 'toy_project',
    targetHeadline: projectData?.toy_project?.modules?.target?.headline || '',
    targetSummary: projectData?.toy_project?.modules?.target?.summary || '',
    targetTagsText: (projectData?.toy_project?.modules?.target?.tags || []).join('\n'),
    actionTitle: projectData?.toy_project?.modules?.action?.title || '',
    actionBulletsText: (projectData?.toy_project?.modules?.action?.bullets || []).join('\n'),
    actionSupportImageUrl: projectData?.toy_project?.modules?.action?.supportImageUrl || '',
    assetsIntro: projectData?.toy_project?.modules?.assets?.intro || '',
    assetsUrlsText: (projectData?.toy_project?.modules?.assets?.assetUrls || []).join('\n'),
    reviewCardsText: (projectData?.toy_project?.modules?.review?.cards || [])
      .map((card) => `${card.title}: ${card.value}`)
      .join('\n'),
    showcaseHeroKicker: projectData?.toy_project?.modules?.showcase?.heroKicker || '',
    showcaseHeroTitle: projectData?.toy_project?.modules?.showcase?.heroTitle || '',
    showcaseBrandCaptionTitle: projectData?.toy_project?.modules?.showcase?.brandCaptionTitle || '',
    showcaseBrandCaptionSubtitle: projectData?.toy_project?.modules?.showcase?.brandCaptionSubtitle || '',
    showcaseSocialHeading: projectData?.toy_project?.modules?.showcase?.socialHeading || '',
    showcaseSocialSubheading: projectData?.toy_project?.modules?.showcase?.socialSubheading || '',
    showcaseAssetPhaseRaw: projectData?.toy_project?.modules?.showcase?.assetPhaseRaw || '',
    showcaseAssetPhaseWeb: projectData?.toy_project?.modules?.showcase?.assetPhaseWeb || '',
    showcaseAssetPhasePrint: projectData?.toy_project?.modules?.showcase?.assetPhasePrint || '',
    showcaseBentoHeading: projectData?.toy_project?.modules?.showcase?.bentoHeading || '',
    showcaseBentoSubheading: projectData?.toy_project?.modules?.showcase?.bentoSubheading || '',
  }));
  const [migrationPreviewOpen, setMigrationPreviewOpen] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState({ toy: null, industry: null });
  const [importJsonText, setImportJsonText] = useState('');
  const [importResult, setImportResult] = useState('');
  const [assetFilterMode, setAssetFilterMode] = useState('all');
  const [projectsPanelMode, setProjectsPanelMode] = useState('projects');
  const [privateFilesProjectId, setPrivateFilesProjectId] = useState('');
  const [privateFileForm, setPrivateFileForm] = useState(EMPTY_PRIVATE_FILE_FORM);
  const [editingPrivateFileId, setEditingPrivateFileId] = useState(null);
  const [privateFileError, setPrivateFileError] = useState('');
  const [bulkProjectVideoForm, setBulkProjectVideoForm] = useState(EMPTY_BULK_PROJECT_VIDEO_FORM);
  const [bulkProjectVideoError, setBulkProjectVideoError] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);

  const {
    state: projectState,
    actions: projectActions,
    derived: projectDerived,
  } = useDirectorProjectsState({
    projects,
    projectData,
    runProjectPreflight,
  });

  const {
    categoryFilter,
    statusFilter,
    searchQuery,
    currentPage,
    selectedIds,
    showSelectedOnly,
    projectViewMode,
    privateFilterMode,
    workOutlineFilter,
    preflightResult,
  } = projectState;

  const {
    setCategoryFilter,
    setStatusFilter,
    setSearchQuery,
    setCurrentPage,
    setSelectedIds,
    setShowSelectedOnly,
    setProjectViewMode,
    setPrivateFilterMode,
    setWorkOutlineFilter,
    setPreflightResult,
  } = projectActions;

  const {
    sortedProjects,
    baseProjectsForList,
    filteredProjects,
    displayProjects,
    outlinedProjectsForList,
    groupedOutlinedProjects,
    pagedProjects,
    allFilteredSelected,
    selectedOnPageCount,
  } = projectDerived;

  const getWorkOutlineTags = (project) => {
    const saved = Array.isArray(project?.outlineTags)
      ? project.outlineTags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : [];

    if (saved.length > 0) {
      return saved.includes('all') ? saved : ['all', ...saved];
    }

    const tags = ['all'];
    const category = String(project?.category || '').toLowerCase();

    if (project?.publishStatus === 'Published') {
      tags.push('home-projects');
      if (category === 'toys') {
        tags.push('home-expertise-toys', 'page-toys');
      } else if (category === 'industrial') {
        tags.push('home-expertise-industrial', 'page-industrial');
      } else {
        tags.push('home-expertise-misc', 'page-misc');
      }
    }

    const id = String(project?.id || '');
    if (id === 'toy_project' || id === 'proj-toys-1') tags.push('business-toy');
    if (id === 'industry_project' || id === 'proj-industry-1') tags.push('business-industry');

    return tags;
  };

  const filteredAssetsForPanel = useMemo(() => {
    return (assets || []).filter((asset) => {
      const inExpertise = Boolean(asset.views?.expertise?.isActive);
      const inProject = Boolean(asset.views?.project?.isActive);
      if (assetFilterMode === 'all') return true;
      if (assetFilterMode === 'expertise_only') return inExpertise && !inProject;
      if (assetFilterMode === 'project_only') return !inExpertise && inProject;
      if (assetFilterMode === 'both') return inExpertise && inProject;
      return true;
    });
  }, [assets, assetFilterMode]);

  const totalProjects = sortedProjects.length;
  const visibleProjectsCount = sortedProjects.filter((project) => project.isVisible !== false).length;
  const publishedProjectsCount = sortedProjects.filter((project) => project.publishStatus === 'Published').length;
  const hasActiveFilters =
    categoryFilter !== 'All' || statusFilter !== 'All' || searchQuery.trim().length > 0 || showSelectedOnly;

  const totalPages = Math.max(1, Math.ceil(displayProjects.length / ITEMS_PER_PAGE));

  const hasUnsavedSettings =
    Number(settingsDraft.vignetteIntensity) !== Number(config.vignetteIntensity) ||
    Number(settingsDraft.filmGrainOpacity) !== Number(config.filmGrainOpacity) ||
    Number(settingsDraft.spotlightRadius) !== Number(config.spotlightRadius) ||
    Boolean(settingsDraft.showHUD) !== Boolean(config.showHUD);

  const hasUnsavedSiteConfig =
    String(siteConfigDraft.siteTitle || '') !== String(config.siteTitle || '') ||
    String(siteConfigDraft.siteDescription || '') !== String(config.siteDescription || '') ||
    String(siteConfigDraft.ogImage || '') !== String(config.ogImage || '') ||
    String(siteConfigDraft.logoImageUrl || '') !== String(config.logoImageUrl || '') ||
    String(siteConfigDraft.logoAltText || '') !== String(config.logoAltText || '') ||
    String(siteConfigDraft.qrCodeImageUrl || '') !== String(config.qrCodeImageUrl || '') ||
    String(siteConfigDraft.contactEmail || '') !== String(config.contactEmail || '') ||
    String(siteConfigDraft.projectPrivateTitle || '') !== String(config.projectPrivateTitle || '') ||
    String(siteConfigDraft.projectPrivateDescription || '') !== String(config.projectPrivateDescription || '') ||
    String(siteConfigDraft.projectPrivateEmptyText || '') !== String(config.projectPrivateEmptyText || '') ||
    String(siteConfigDraft.projectPrivatePasswordPlaceholder || '') !== String(config.projectPrivatePasswordPlaceholder || '') ||
    String(siteConfigDraft.projectPrivateUnlockButtonText || '') !== String(config.projectPrivateUnlockButtonText || '') ||
    String(siteConfigDraft.projectPrivateErrorText || '') !== String(config.projectPrivateErrorText || '') ||
    String(siteConfigDraft.projectDownloadTitle || '') !== String(config.projectDownloadTitle || '') ||
    String(siteConfigDraft.projectDownloadEmptyText || '') !== String(config.projectDownloadEmptyText || '') ||
    String(siteConfigDraft.projectDownloadAllButtonText || '') !== String(config.projectDownloadAllButtonText || '') ||
    String(siteConfigDraft.projectDownloadSelectedButtonText || '') !== String(config.projectDownloadSelectedButtonText || '') ||
    String(siteConfigDraft.projectGalleryTitle || '') !== String(config.projectGalleryTitle || '') ||
    String(siteConfigDraft.projectGalleryEmptyText || '') !== String(config.projectGalleryEmptyText || '') ||
    String(siteConfigDraft.projectGalleryActionBarText || '') !== String(config.projectGalleryActionBarText || '') ||
    String(siteConfigDraft.projectGallerySelectionText || '') !== String(config.projectGallerySelectionText || '') ||
    String(siteConfigDraft.projectButtonText || '') !== String(config.projectButtonText || '') ||
    String(siteConfigDraft.privateTitle || '') !== String(config.privateTitle || '') ||
    String(siteConfigDraft.privateDescription || '') !== String(config.privateDescription || '') ||
    String(siteConfigDraft.privateAccessLabel || '') !== String(config.privateAccessLabel || '') ||
    String(siteConfigDraft.privateAccessHint || '') !== String(config.privateAccessHint || '') ||
    String(siteConfigDraft.privateAccessButtonText || '') !== String(config.privateAccessButtonText || '') ||
    String(siteConfigDraft.privateErrorText || '') !== String(config.privateErrorText || '') ||
    String(siteConfigDraft.deliveryTitle || '') !== String(config.deliveryTitle || '') ||
    String(siteConfigDraft.deliverySuccessText || '') !== String(config.deliverySuccessText || '') ||
    String(siteConfigDraft.deliveryPinPlaceholder || '') !== String(config.deliveryPinPlaceholder || '') ||
    String(siteConfigDraft.deliveryErrorText || '') !== String(config.deliveryErrorText || '') ||
    String(siteConfigDraft.deliveryButtonText || '') !== String(config.deliveryButtonText || '') ||
    String(siteConfigDraft.downloadTitle || '') !== String(config.downloadTitle || '') ||
    String(siteConfigDraft.downloadAllButtonText || '') !== String(config.downloadAllButtonText || '') ||
    String(siteConfigDraft.downloadSelectedButtonText || '') !== String(config.downloadSelectedButtonText || '') ||
    String(siteConfigDraft.galleryTitle || '') !== String(config.galleryTitle || '') ||
    String(siteConfigDraft.galleryActionBarText || '') !== String(config.galleryActionBarText || '') ||
    String(siteConfigDraft.gallerySelectionText || '') !== String(config.gallerySelectionText || '') ||
    String(siteConfigDraft.buttonText || '') !== String(config.buttonText || '') ||
    String(siteConfigDraft.contactPhone || '') !== String(config.contactPhone || '') ||
    String(siteConfigDraft.contactLocation || '') !== String(config.contactLocation || '') ||
    String(siteConfigDraft.resumeAwardsText || '') !== String(config.resumeAwardsText || '') ||
    String(siteConfigDraft.resumeExperienceText || '') !== String(config.resumeExperienceText || '') ||
    String(siteConfigDraft.resumeGearText || '') !== String(config.resumeGearText || '') ||
    String(siteConfigDraft.testimonialsText || '') !== String(config.testimonialsText || '') ||
    String(siteConfigDraft.brandNamesText || '') !== String(config.brandNamesText || '') ||
    String(siteConfigDraft.servicesText || '') !== String(config.servicesText || '') ||
    String(siteConfigDraft.caseToyTarget || '') !== String(config.caseStudies?.toy?.target || '') ||
    String(siteConfigDraft.caseToyAction || '') !== String(config.caseStudies?.toy?.action || '') ||
    String(siteConfigDraft.caseToyAssets || '') !== String(config.caseStudies?.toy?.assets || '') ||
    String(siteConfigDraft.caseToyReview || '') !== String(config.caseStudies?.toy?.review || '') ||
    String(siteConfigDraft.caseIndustryTarget || '') !== String(config.caseStudies?.industry?.target || '') ||
    String(siteConfigDraft.caseIndustryAction || '') !== String(config.caseStudies?.industry?.action || '') ||
    String(siteConfigDraft.caseIndustryAssets || '') !== String(config.caseStudies?.industry?.assets || '') ||
    String(siteConfigDraft.caseIndustryReview || '') !== String(config.caseStudies?.industry?.review || '');

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, searchQuery, showSelectedOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setPreflightResult(runProjectPreflight(projects));
  }, [projects]);

  useEffect(() => {
    if (activeTab !== 'settings') return;

    setSettingsDraft({
      vignetteIntensity: config.vignetteIntensity,
      filmGrainOpacity: config.filmGrainOpacity,
      spotlightRadius: config.spotlightRadius,
      showHUD: config.showHUD,
    });
  }, [activeTab, config.vignetteIntensity, config.filmGrainOpacity, config.spotlightRadius, config.showHUD]);

  useEffect(() => {
    if (activeTab !== 'siteConfig') return;

    setSiteConfigDraft({
      siteTitle: config.siteTitle || 'DIRECTOR.VISION',
      siteDescription: config.siteDescription || '',
      ogImage: config.ogImage || '',
      logoImageUrl: config.logoImageUrl || '',
      logoAltText: config.logoAltText || '',
      contactEmail: config.contactEmail || '',
      projectPrivateTitle: config.projectPrivateTitle || 'PRIVATE PROJECT',
      projectPrivateDescription: config.projectPrivateDescription || '该项目为私密访问，请输入密码后查看。',
      projectPrivateEmptyText: config.projectPrivateEmptyText || '暂无私密说明。',
      projectPrivatePasswordPlaceholder: config.projectPrivatePasswordPlaceholder || '请输入项目访问密码',
      projectPrivateUnlockButtonText: config.projectPrivateUnlockButtonText || 'UNSEAL PROJECT',
      projectPrivateErrorText: config.projectPrivateErrorText || '密码错误，请重试。',
      projectDownloadTitle: config.projectDownloadTitle || 'PRIVATE DELIVERY FILES',
      projectDownloadEmptyText: config.projectDownloadEmptyText || '暂无可下载文件。',
      projectDownloadAllButtonText: config.projectDownloadAllButtonText || '一键下载全部',
      projectDownloadSelectedButtonText: config.projectDownloadSelectedButtonText || '打包下载已选 (ZIP)',
      projectGalleryTitle: config.projectGalleryTitle || 'ALBUM',
      projectGalleryEmptyText: config.projectGalleryEmptyText || '暂无画廊内容。',
      projectGalleryActionBarText: config.projectGalleryActionBarText || 'ALBUM ACTION BAR',
      projectGallerySelectionText: config.projectGallerySelectionText || '已选择 X 张',
      projectButtonText: config.projectButtonText || 'BUTTON TEXT',
      privateTitle: config.privateTitle || '',
      privateDescription: config.privateDescription || '',
      privateAccessLabel: config.privateAccessLabel || '',
      privateAccessHint: config.privateAccessHint || '',
      privateAccessButtonText: config.privateAccessButtonText || '',
      privateErrorText: config.privateErrorText || '',
      deliveryTitle: config.deliveryTitle || '',
      deliverySuccessText: config.deliverySuccessText || '',
      deliveryPinPlaceholder: config.deliveryPinPlaceholder || '',
      deliveryErrorText: config.deliveryErrorText || '',
      deliveryButtonText: config.deliveryButtonText || '',
      downloadTitle: config.downloadTitle || '',
      downloadAllButtonText: config.downloadAllButtonText || '',
      downloadSelectedButtonText: config.downloadSelectedButtonText || '',
      galleryTitle: config.galleryTitle || '',
      galleryActionBarText: config.galleryActionBarText || '',
      gallerySelectionText: config.gallerySelectionText || '',
      buttonText: config.buttonText || '',
      contactPhone: config.contactPhone || '',
      contactLocation: config.contactLocation || '',
      resumeAwardsText: config.resumeAwardsText || '',
      resumeExperienceText: config.resumeExperienceText || '',
      resumeGearText: config.resumeGearText || '',
      testimonialsText: config.testimonialsText || '',
      brandNamesText: config.brandNamesText || '',
      servicesText: config.servicesText || '',
      caseToyTarget: config.caseStudies?.toy?.target || '',
      caseToyAction: config.caseStudies?.toy?.action || '',
      caseToyAssets: config.caseStudies?.toy?.assets || '',
      caseToyReview: config.caseStudies?.toy?.review || '',
      caseIndustryTarget: config.caseStudies?.industry?.target || '',
      caseIndustryAction: config.caseStudies?.industry?.action || '',
      caseIndustryAssets: config.caseStudies?.industry?.assets || '',
      caseIndustryReview: config.caseStudies?.industry?.review || '',
    });
  }, [
    activeTab,
    config.siteTitle,
    config.siteDescription,
    config.ogImage,
    config.contactEmail,
    config.contactPhone,
    config.contactLocation,
    config.resumeAwardsText,
    config.resumeExperienceText,
    config.resumeGearText,
  ]);

  const privateProjects = useMemo(
    () => sortedProjects.filter((project) => project.publishStatus === 'Private'),
    [sortedProjects],
  );

  const privateFilesProject = useMemo(
    () => privateProjects.find((project) => project.id === privateFilesProjectId) || null,
    [privateProjects, privateFilesProjectId],
  );

  const privateFiles = useMemo(
    () => [...(privateFilesProject?.privateFiles || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [privateFilesProject],
  );

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredProjects.some((project) => project.id === id)));
  }, [filteredProjects]);

  useEffect(() => {
    if (activeTab !== 'privateFiles') return;
    if (privateProjects.length === 0) {
      setPrivateFilesProjectId('');
      return;
    }

    setPrivateFilesProjectId((prev) => {
      if (prev && privateProjects.some((project) => project.id === prev)) return prev;
      return privateProjects[0].id;
    });
  }, [activeTab, privateProjects]);

  useEffect(() => {
    if (activeTab !== 'privateFiles') return;
    setPrivateFileForm((prev) => ({
      ...prev,
      projectId: privateFilesProjectId,
    }));
  }, [activeTab, privateFilesProjectId]);

  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [displayProjects, currentPage]);

  const selectedOnPageCount = pagedProjects.filter((project) => selectedIds.includes(project.id)).length;
  const selectedInFilteredCount = filteredProjects.filter((project) => selectedIds.includes(project.id)).length;
  const allFilteredSelected =
    filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id));

  const introTargetProject = useMemo(
    () => sortedProjects.find((project) => project.id === introProjectId) || null,
    [sortedProjects, introProjectId],
  );

  const hasUnsavedIntro = Boolean(
    introTargetProject &&
      (String(introDraft.title || '') !== String(introTargetProject.title || '') ||
        String(introDraft.description || '') !== String(introTargetProject.description || '') ||
        String(introDraft.credits || '') !== String(introTargetProject.credits || '') ||
        String(introDraft.role || '') !== String(introTargetProject.role || '') ||
        String(introDraft.clientAgency || '') !== String(introTargetProject.clientAgency || '')),
  );

  const {
    analyticsFilteredEvents,
    analyticsChartData,
    analyticsCompareChartData,
    analyticsChartMax,
    analyticsKpis,
    pageViewTopRoutes,
    topVideoPlays,
    analyticsSummary,
    analyticsAnomaly,
    analyticsWoW,
  } = useDirectorAnalytics({
    analyticsEvents: analyticsSnapshot.events,
    analyticsTimeRange,
    analyticsEventType,
    analyticsSearchQuery,
    analyticsChartMetric,
    analyticsCompareMetric,
  });

  useEffect(() => {
    if (activeTab !== 'analytics') return undefined;
    if (analyticsAutoRefresh === 'off') return undefined;

    const intervalMs = analyticsAutoRefresh === '10s' ? 10000 : 30000;
    const timer = window.setInterval(() => {
      setAnalyticsSnapshot(getAnalyticsSnapshot());
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeTab, analyticsAutoRefresh]);

  useEffect(() => {
    if (!videoUploadTask?.activeTask) return undefined;
    setUploadState((prev) => {
      const current = prev.video || {};
      if (current.taskId && current.taskId !== videoUploadTask.activeTask.taskId) return prev;
      return {
        ...prev,
        video: {
          ...current,
          status: videoUploadTask.activeTask.status === 'completed' ? 'success' : videoUploadTask.activeTask.status === 'failed' ? 'error' : 'uploading',
          url: videoUploadTask.activeTask.targetUrl || current.url || '',
          taskId: videoUploadTask.activeTask.taskId,
          progress: videoUploadTask.activeTask.status === 'completed' ? 100 : current.progress || 0,
        },
      };
    });
  }, [videoUploadTask.activeTask]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isCtrlLike = event.ctrlKey || event.metaKey;
      if (!isCtrlLike) return;
      if (activeTab !== 'siteConfig') return;
      if (!introProjectId) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        undoIntroDraftChange();
        return;
      }

      if (key === 's') {
        event.preventDefault();
        handleApplyVideoIntro();
      }

      if (key === 'enter') {
        event.preventDefault();
        handleSaveAndNextIntro();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, introProjectId, introDraft]);

  const handleOpenAdd = () => {
    setFormMode('create');
    setEditingProjectId(null);
    setFormState(EMPTY_FORM);
    setCoverPreviewUrl('');
    setShowForm(true);
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
      outlineTags: getWorkOutlineTags(project).filter((tag) => tag !== 'all'),
    });
    setShowForm(true);
  };

  const handleQuickPrivatePassword = (project) => {
    const isPrivate = project.publishStatus === 'Private';

    if (isPrivate) {
      const shouldUnlock = window.confirm('是否取消私密并改为 Published？');
      if (!shouldUnlock) return;

      updateProject(project.id, {
        publishStatus: 'Published',
        visibility: 'Published',
        accessPassword: '',
        isVisible: true,
      });
      return;
    }

    const current = project.accessPassword || '';
    const input = window.prompt('设置私密项目密码（留空取消）', current);
    if (input === null) return;

    const nextPassword = String(input).trim();
    if (!nextPassword) return;

    updateProject(project.id, {
      publishStatus: 'Private',
      visibility: 'Private',
      accessPassword: nextPassword,
      isVisible: true,
    });
  };

  const handleCopyPrivateLink = async (project) => {
    if (!project?.id) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const privateLink = `${origin}/project/${project.id}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(privateLink);
      } else {
        const input = document.createElement('input');
        input.value = privateLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      window.alert(`私密链接已复制：\n${privateLink}`);
    } catch {
      window.alert(`复制失败，请手动复制：\n${privateLink}`);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProjectId(null);
    setFormState(EMPTY_FORM);
    setCoverPreviewUrl('');
    setUploadState({
      cover: { status: 'idle', progress: 0 },
      video: { status: 'idle', progress: 0 },
    });
  };

  const resetPrivateFileForm = () => {
    setPrivateFileForm({
      ...EMPTY_PRIVATE_FILE_FORM,
      projectId: privateFilesProjectId,
    });
    setEditingPrivateFileId(null);
    setPrivateFileError('');
  };

  const savePrivateFilesForProject = (projectId, nextFiles) => {
    if (!projectId) return;
    const normalized = normalizePrivateFilesOrder(nextFiles);
    updateProject(projectId, { privateFiles: normalized });
  };

  useEffect(() => {
    if (!showForm) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  const handleSubmitForm = async (event) => {
    event.preventDefault();

    const nextVisibility = formState.isPrivate
      ? 'Private'
      : formState.publishStatus === 'Draft'
        ? 'Draft'
        : 'Published';

    const payload = {
      ...formState,
      videoUrl: String(formState.videoUrl || formState.mainVideoUrl || '').trim(),
      mainVideoUrl: String(formState.mainVideoUrl || formState.videoUrl || '').trim(),
      publishStatus: nextVisibility,
      btsMedia: formState.btsMediaText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      visibility: nextVisibility,
      isVisible: nextVisibility !== 'Draft',
      accessPassword: nextVisibility === 'Private' ? formState.accessPassword : '',
      deliveryPin: nextVisibility === 'Private' ? String(formState.deliveryPin || '').trim() : '',
      clientCode: String(formState.clientCode || '').trim(),
      outlineTags: Array.isArray(formState.outlineTags)
        ? formState.outlineTags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : [],
    };

    if (payload.publishStatus === 'Private' && String(payload.accessPassword || '').trim().length < 4) {
      window.alert('私密项目密码至少需要 4 位字符。');
      return;
    }

    const normalizedClientCode = String(payload.clientCode || '').trim().toLowerCase();
    if (normalizedClientCode) {
      const duplicated = projects.some(
        (item) =>
          item.id !== (editingProjectId || '') &&
          String(item.clientCode || '').trim().toLowerCase() === normalizedClientCode,
      );
      if (duplicated) {
        window.alert('Client Code 已存在，请使用唯一代码。');
        return;
      }
    }

    if (payload.publishStatus === 'Published') {
      const check = runProjectPreflight([{ ...payload, id: editingProjectId || 'new' }]);
      if (check.errorCount > 0 || check.warningCount > 0) {
        const preview = check.issues
          .slice(0, 5)
          .map((x) => `- [${x.severity.toUpperCase()}] ${x.message}`)
          .join('\n');
        const continueSubmit = window.confirm(
          `Preflight found ${check.errorCount} error(s), ${check.warningCount} warning(s).\n\n${preview}\n\nContinue saving?`,
        );
        if (!continueSubmit) return;
      }
    }

    try {
      if (formMode === 'edit' && editingProjectId) {
        const saved = await updateProjectApi(editingProjectId, {
          ...payload,
        });
        if (saved) {
          updateProject(saved.id, saved);
        }
      } else {
        const saved = await createProject({
          ...payload,
        });
        if (saved) {
          updateProject(saved.id, saved);
        }
      }
      handleCancelForm();
    } catch (error) {
      console.error('Failed to save project:', error);
      window.alert(error?.response?.data?.message || error?.message || '保存作品失败');
    }
  };


  const handleUploadVideo = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      video: { status: 'uploading', progress: 0, taskId: '', fileName: '', fileType: '', convertedFrom: '', url: '' },
    }));

    try {
      const completedTask = await videoUploadTask.uploadVideo(file);
      const finalUrl = String(completedTask.url || '').trim();

      setFormState((prev) => ({
        ...prev,
        videoUrl: finalUrl,
        mainVideoUrl: finalUrl,
      }));

      if (editingProjectId) {
        const saved = await updateProjectApi(editingProjectId, {
          videoUrl: finalUrl,
          mainVideoUrl: finalUrl,
        });
        if (saved) updateProject(saved.id, saved);
      }

      setUploadState((prev) => ({
        ...prev,
        video: {
          ...prev.video,
          status: 'success',
          progress: 100,
          taskId: completedTask.taskId,
          fileName: completedTask.fileName || file.name || '',
          fileType: completedTask.fileType || 'video/mp4',
          convertedFrom: completedTask.convertedFrom || file.name || '',
          url: finalUrl,
        },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        video: {
          status: 'error',
          progress: 0,
          taskId: prev.video?.taskId || '',
          fileName: prev.video?.fileName || '',
          fileType: prev.video?.fileType || '',
          convertedFrom: prev.video?.convertedFrom || '',
          url: '',
        },
      }));
    }
  };

  const saveBulkProjectVideos = () => {
    saveBulkProjectVideoUrls({
      bulkProjectVideoForm,
      setBulkProjectVideoError,
      updateProject,
      setBulkProjectVideoForm,
      emptyBulkProjectVideoForm: EMPTY_BULK_PROJECT_VIDEO_FORM,
    });
  };

  const handleUploadLogo = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      logo: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'images/logo',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            logo: { status: 'uploading', progress },
          }));
        },
      });

      setSiteConfigDraft((prev) => ({ ...prev, logoImageUrl: result.url }));
      await saveConfigToServer({
        logoImageUrl: result.url,
      });
      setUploadState((prev) => ({
        ...prev,
        logo: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        logo: { status: 'error', progress: 0 },
      }));
    }
  };

  const handleUploadQrCode = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      qrCode: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'images/wechat-qr',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            qrCode: { status: 'uploading', progress },
          }));
        },
      });

      setSiteConfigDraft((prev) => ({ ...prev, qrCodeImageUrl: result.url }));
      await saveConfigToServer({
        qrCodeImageUrl: result.url,
      });
      setUploadState((prev) => ({
        ...prev,
        qrCode: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        qrCode: { status: 'error', progress: 0 },
      }));
    }
  };

  const moveProject = (projectId, direction) => {
    moveProjectByDirection({
      projectId,
      direction,
      sortedProjects,
      updateProject,
    });
  };

  const toggleSelectProject = (projectId) => {
    toggleProjectSelection({
      projectId,
      selectedProjectIds: selectedIds,
      setSelectedProjectIds: setSelectedIds,
    });
  };

  const toggleSelectCurrentPage = () => {
    toggleCurrentPageSelection({
      pagedProjects,
      selectedProjectIds: selectedIds,
      setSelectedProjectIds: setSelectedIds,
    });
  };

  const toggleSelectAllFiltered = () => {
    toggleAllFilteredSelection({
      filteredProjects,
      allFilteredSelected,
      setSelectedProjectIds: setSelectedIds,
    });
  };

  const applyBulkVisibility = (isVisible) => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      isVisible
        ? `Confirm show ${selectedIds.length} selected project(s)?`
        : `Confirm hide ${selectedIds.length} selected project(s)?`,
    );
    if (!confirmed) return;

    applyBulkVisibilityChange({
      selectedProjectIds: selectedIds,
      updateProject,
      isVisible,
      setSelectedProjectIds: setSelectedIds,
    });
  };

  const applyBulkPublishStatus = (publishStatus) => {
    if (selectedIds.length === 0) return;

    if (publishStatus === 'Published') {
      const selectedProjects = projects.filter((project) => selectedIds.includes(project.id));
      const check = runProjectPreflight(selectedProjects);
      if (check.errorCount > 0) {
        const preview = check.issues
          .filter((x) => x.severity === 'error')
          .slice(0, 5)
          .map((x) => `- [${x.projectTitle}] ${x.message}`)
          .join('\n');

        const forcePublish = window.confirm(
          `Preflight found ${check.errorCount} error(s).\n\n${preview}\n\nStill continue publishing selected items?`,
        );
        if (!forcePublish) return;
      }
    }

    const label = publishStatus === 'Published' ? 'publish' : 'move to draft';
    const confirmed = window.confirm(`Confirm ${label} ${selectedIds.length} selected project(s)?`);
    if (!confirmed) return;

    applyBulkPublishStatusChange({
      selectedProjectIds: selectedIds,
      updateProject: (id, payload) => updateProject(id, { publishStatus: payload.publishStatus }),
      publishStatus,
      setSelectedProjectIds: setSelectedIds,
    });
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();

    if (passwordInput === DIRECTOR_CONSOLE_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
      window.sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      return;
    }

    setAuthError('密码错误，请重试。');
  };

  const handleApplySettings = () => {
    updateConfig('vignetteIntensity', Number(settingsDraft.vignetteIntensity));
    updateConfig('filmGrainOpacity', Number(settingsDraft.filmGrainOpacity));
    updateConfig('spotlightRadius', Number(settingsDraft.spotlightRadius));
    updateConfig('showHUD', Boolean(settingsDraft.showHUD));

    trackEvent('theme_or_settings_changed', {
      vignetteIntensity: Number(settingsDraft.vignetteIntensity),
      filmGrainOpacity: Number(settingsDraft.filmGrainOpacity),
      spotlightRadius: Number(settingsDraft.spotlightRadius),
      showHUD: Boolean(settingsDraft.showHUD),
    });
  };

  const handleResetSettingsDraft = () => {
    resetConfig();
    setSettingsDraft({
      vignetteIntensity: 0.68,
      filmGrainOpacity: 0.06,
      spotlightRadius: 680,
      showHUD: true,
    });

    trackEvent('theme_or_settings_changed', {
      action: 'reset_defaults',
    });
  };

  const handleApplySiteConfig = () => {
    applySiteConfigChanges({
      siteConfigDraft,
      updateConfig,
      updateCaseStudy,
      trackEvent,
    });
  };

  const handleExportReviewAuditLogs = () => {
    const logs = Array.isArray(reviewAuditLogs) ? reviewAuditLogs : [];
    if (logs.length === 0) {
      window.alert('暂无可导出的审核日志。');
      return;
    }

    const headers = ['time', 'operator', 'projectName', 'clientName', 'fromStatus', 'toStatus', 'reviewId'];
    const escapeCsv = (value) => {
      const text = String(value ?? '');
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    const rows = logs.map((log) => [
      new Date(log.at).toISOString(),
      log.operator || '',
      log.projectName || '',
      log.clientName || '',
      String(log.from || ''),
      String(log.to || ''),
      log.reviewId || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fileName = `review-audit-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApplyVideoIntro = () => {
    applyVideoIntroChanges({
      introTargetProject,
      introDraft,
      updateProject,
      trackEvent,
    });
  };

  const updateIntroDraftField = (key, value) => {
    setIntroDraft((prev) => {
      setIntroHistory((history) => [...history.slice(-40), prev]);
      return { ...prev, [key]: value };
    });
  };

  const undoIntroDraftChange = () => {
    setIntroHistory((history) => {
      if (history.length === 0) return history;
      const previous = history[history.length - 1];
      setIntroDraft(previous);
      return history.slice(0, -1);
    });
  };

  const moveIntroProject = (direction) => {
    moveIntroProjectSelection({
      direction,
      sortedProjects,
      introProjectId,
      setIntroProjectId,
      setIntroDraft,
    });
  };

  const handleSaveAndNextIntro = () => {
    saveAndGoToNextIntro({
      introTargetProject,
      applyVideoIntro: handleApplyVideoIntro,
      sortedProjects,
      introProjectId,
      setIntroProjectId,
      setIntroDraft,
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  };

  const handleMigrateLocalData = async () => {
    setIsMigratingLocalData(true);
    setMigrationMessage('');

    try {
      const result = await migrateLocalToDB();
      setMigrationMessage(
        `迁移完成：配置键 ${result?.migratedConfigKeys?.length || 0} 项，项目 ${result?.migratedProjectCount || 0} 条。请刷新页面查看最新数据库数据。`,
      );
    } catch (error) {
      setMigrationMessage(`迁移失败：${error?.message || 'unknown error'}`);
    } finally {
      setIsMigratingLocalData(false);
    }
  };

  const closeAssetEditorModal = () => {
    setShowAssetEditorModal(false);
    setEditingAssetId(null);
    setAssetForm(EMPTY_ASSET_FORM);
    setAssetFormError('');
    setAssetUrlWarning('');
  };

  const handleOpenAssetEditor = (asset, nextWarning) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      title: asset.title,
      url: asset.url,
      type: asset.type,
      rawUrl: asset.variants?.raw || '',
      gradedUrl: asset.variants?.graded || '',
      styledUrl: asset.variants?.styled || '',
      publishTarget:
        asset.views.expertise.isActive && asset.views.project.isActive
          ? 'both'
          : asset.views.project.isActive
            ? 'project'
            : 'expertise',
      expertiseCategory: asset.views.expertise.category,
      expertiseDescription: asset.views.expertise.description,
      projectId: asset.views.project.projectId,
      projectDescription: stripModuleSlotTag(asset.views.project.description),
      moduleSlot: extractModuleSlot(asset.views.project.description),
    });
    setAssetUrlWarning(nextWarning);
    setShowAssetEditorModal(true);
  };

  const handleResetAssetForm = () => {
    setAssetForm(EMPTY_ASSET_FORM);
    setAssetFormError('');
    setAssetUrlWarning('');
    setEditingAssetId(null);
  };

  const buildAssetPayload = ({ includeVariants = false, includeVideoView = false } = {}) => {
    const variants = {
      raw: String(assetForm.rawUrl || '').trim(),
      graded: String(assetForm.gradedUrl || '').trim(),
      styled: String(assetForm.styledUrl || '').trim(),
    };

    return {
      title: String(assetForm.title || '').trim(),
      url: String(assetForm.url || '').trim(),
      type: assetForm.type,
      publishTarget: assetForm.publishTarget,
      tags: normalizeTagsInput(assetForm.tagsText),
      mediaGroup: inferMediaGroup(assetForm.type, assetForm.url),
      variants: includeVariants && assetForm.type === 'image-comparison' ? variants : undefined,
      views: {
        expertise: {
          isActive: assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both',
          category: assetForm.expertiseCategory,
          description: String(assetForm.expertiseDescription || '').trim(),
        },
        project: {
          isActive: assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both',
          projectId: assetForm.projectId,
          moduleSlot: assetForm.moduleSlot,
          description: buildProjectDescriptionWithSlot(
            String(assetForm.projectDescription || '').trim(),
            assetForm.moduleSlot,
          ),
        },
        video: includeVideoView
          ? {
              isActive: assetForm.publishTarget === 'both' && assetForm.type === 'video',
              category: assetForm.videoCategory,
              description: String(assetForm.projectDescription || '').trim(),
            }
          : undefined,
      },
    };
  };

  const validateAssetPayload = ({ payload, requireVariants = false } = {}) => {
    if (!payload.title) {
      setAssetFormError('请填写 Asset Title。');
      return false;
    }

    if (requireVariants && assetForm.type === 'image-comparison') {
      const variantValues = Object.values(payload.variants || {}).filter((value) => value);
      if (variantValues.length === 0) {
        setAssetFormError('请至少填写一条 variants URL。');
        return false;
      }
      if (variantValues.some((value) => !/^https?:\/\//i.test(value))) {
        setAssetFormError('Variants URL 必须是 http(s) 链接。');
        return false;
      }
      return true;
    }

    if (!payload.url) {
      setAssetFormError('请填写 Asset URL。');
      return false;
    }

    if (!/^https?:\/\//i.test(payload.url)) {
      setAssetFormError('Asset URL 必须是 http(s) 链接。');
      return false;
    }

    return true;
  };

  const handleSubmitAssetForm = () => {
    const payload = buildAssetPayload({ includeVariants: true });
    if (!validateAssetPayload({ payload, requireVariants: true })) {
      return;
    }

    setAssetFormError('');
    if (assetForm.type !== 'image-comparison') {
      setAssetUrlWarning(getAssetUrlWarning(payload.url, payload.type));
    } else {
      setAssetUrlWarning('');
    }

    if (editingAssetId) {
      updateAsset(editingAssetId, payload);
    } else {
      addAsset(payload);
    }

    handleResetAssetForm();
    setShowAssetEditorModal(false);
  };

  const handleSaveAssetEditorModal = () => {
    if (!editingAssetId) {
      setAssetFormError('未选择编辑素材。');
      return;
    }

    const payload = buildAssetPayload({ includeVideoView: true });
    if (!validateAssetPayload({ payload })) {
      return;
    }

    setAssetFormError('');
    updateAsset(editingAssetId, payload);
    closeAssetEditorModal();
  };

  const handleBulkAssetParse = () => {
    parseBulkAssetInput({
      bulkAssetInput,
      parseAssetNameToken,
      inferAssetTypeFromUrl,
      inferMediaGroup,
      setBulkAssetError,
      setBulkAssetPreview,
      setBulkAssetSelectedKeys,
      setBulkAssetCollapsedGroups,
      setBulkAssetForm,
    });
  };

  const handleBulkAssetCreate = () => {
    createBulkAssets({
      bulkAssetPreview,
      bulkAssetSelectedKeys,
      bulkAssetForm,
      assetForm,
      normalizeTagsInput,
      inferMediaGroup,
      buildProjectDescriptionWithSlot,
      addAssets,
      setBulkAssetError,
      setBulkAssetInput,
      setBulkAssetPreview,
      setBulkAssetSelectedKeys,
    });
  };

  const videoWorkAssets = useMemo(
    () => assets.filter((asset) => asset?.mediaGroup === 'video' || asset?.type === 'video'),
    [assets],
  );

  const photoWorkAssets = useMemo(
    () => assets.filter((asset) => asset?.mediaGroup === 'photo' || (asset?.mediaGroup !== 'video' && asset?.type !== 'video')),
    [assets],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 py-10 text-zinc-100">
        <form
          onSubmit={handleAuthSubmit}
          className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          <p className="text-xs tracking-[0.24em] text-zinc-500">SYSTEM LOCKED</p>
          <h1 className="mt-3 text-xl tracking-[0.08em] text-zinc-100">RESTRICTED ACCESS</h1>
          <p className="mt-2 text-xs tracking-[0.12em] text-zinc-500">DIRECTOR CONSOLE AUTHENTICATION REQUIRED</p>

          <label className="mt-6 block">
            <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">PASSWORD</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => {
                setPasswordInput(event.target.value);
                if (authError) setAuthError('');
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/60 transition focus:border-emerald-400 focus:ring-2"
              placeholder="Enter passcode"
              autoFocus
            />
          </label>

          {authError && <p className="mt-3 text-xs tracking-[0.08em] text-rose-400">{authError}</p>}

          <button
            type="submit"
            className="mt-5 w-full rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-300/20"
          >
            UNLOCK
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 pb-16 pt-24 text-zinc-100 md:px-10">
      <div className="mx-auto w-full max-w-5xl font-mono">
        <header className="rounded-2xl border border-zinc-700/60 bg-zinc-900/75 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-zinc-500">SYSTEM PANEL</p>
              <h1 className="mt-2 text-2xl tracking-[0.06em] text-zinc-100 md:text-3xl">Director Console</h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                在这里管理网站特效配置与作品内容，所有改动会自动写入 localStorage。
              </p>
            </div>

            <div className="flex items-center gap-2">
              {SERVER_PANEL_URL ? (
                <a
                  href={SERVER_PANEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-500 transition hover:bg-emerald-600/20"
                >
                  <Server className="h-4 w-4" />
                  服务器面板
                </a>
              ) : null}

              <button
                type="button"
                onClick={handleMigrateLocalData}
                disabled={isMigratingLocalData}
                className={`rounded-md border px-3 py-2 text-xs tracking-[0.12em] transition ${
                  isMigratingLocalData
                    ? 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                    : 'border-cyan-300/70 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20'
                }`}
              >
                {isMigratingLocalData ? '迁移中...' : '迁移 localStorage → DB'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300 transition hover:border-zinc-400"
              >
                Log Out
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <PanelTab isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>
              Projects (作品管理)
            </PanelTab>
            <PanelTab isActive={activeTab === 'assets'} onClick={() => setActiveTab('assets')}>
              Assets CMS (双视角分发)
            </PanelTab>
            <PanelTab isActive={activeTab === 'projectModules'} onClick={() => setActiveTab('projectModules')}>
              Project Modules (复盘模块)
            </PanelTab>
            <PanelTab isActive={activeTab === 'privateFiles'} onClick={() => setActiveTab('privateFiles')}>
              Private Files (私密文件管理)
            </PanelTab>
            <PanelTab isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              Site Settings (网站特效)
            </PanelTab>
            <PanelTab
              isActive={activeTab === 'analytics'}
              onClick={() => {
                setAnalyticsSnapshot(getAnalyticsSnapshot());
                setActiveTab('analytics');
              }}
            >
              Analytics (数据分析)
            </PanelTab>
            <PanelTab isActive={activeTab === 'siteConfig'} onClick={() => setActiveTab('siteConfig')}>
              Site Config & About
            </PanelTab>
            <PanelTab isActive={activeTab === 'testimonials'} onClick={() => setActiveTab('testimonials')}>
              Testimonials Moderation
            </PanelTab>
          </div>

          {migrationMessage ? (
            <p className="mt-4 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-xs tracking-[0.08em] text-cyan-100">
              {migrationMessage}
            </p>
          ) : null}
        </header>

        {activeTab === 'settings' ? (
          <SettingsPanel
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            hasUnsavedSettings={hasUnsavedSettings}
            handleResetSettingsDraft={handleResetSettingsDraft}
            handleApplySettings={handleApplySettings}
            FieldLabel={FieldLabel}
            hudOnClass={HUD_ON_CLASS}
            hudOffClass={HUD_OFF_CLASS}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPanel
            analyticsSnapshot={analyticsSnapshot}
            analyticsAutoRefresh={analyticsAutoRefresh}
            setAnalyticsAutoRefresh={setAnalyticsAutoRefresh}
            setAnalyticsSnapshot={setAnalyticsSnapshot}
            getAnalyticsSnapshot={getAnalyticsSnapshot}
            clearAnalytics={clearAnalytics}
            analyticsTimeRange={analyticsTimeRange}
            setAnalyticsTimeRange={setAnalyticsTimeRange}
            analyticsEventType={analyticsEventType}
            setAnalyticsEventType={setAnalyticsEventType}
            analyticsChartMetric={analyticsChartMetric}
            setAnalyticsChartMetric={setAnalyticsChartMetric}
            analyticsCompareMetric={analyticsCompareMetric}
            setAnalyticsCompareMetric={setAnalyticsCompareMetric}
            analyticsKpis={analyticsKpis}
            analyticsWoW={analyticsWoW}
            analyticsSummary={analyticsSummary}
            analyticsAnomaly={analyticsAnomaly}
            filterInputClass={FILTER_INPUT_CLASS}
            analyticsTimeRangeOptions={ANALYTICS_TIME_RANGE_OPTIONS}
            analyticsMetricOptions={ANALYTICS_METRIC_OPTIONS}
            analyticsCompareOptions={ANALYTICS_COMPARE_OPTIONS}
            showMetricA={showMetricA}
            setShowMetricA={setShowMetricA}
            showMetricB={showMetricB}
            setShowMetricB={setShowMetricB}
            analyticsChartData={analyticsChartData}
            analyticsCompareChartData={analyticsCompareChartData}
            analyticsChartMax={analyticsChartMax}
            analyticsHoverIndex={analyticsHoverIndex}
            setAnalyticsHoverIndex={setAnalyticsHoverIndex}
            pageViewTopRoutes={pageViewTopRoutes}
            topVideoPlays={topVideoPlays}
            analyticsSearchQuery={analyticsSearchQuery}
            setAnalyticsSearchQuery={setAnalyticsSearchQuery}
            analyticsFilteredEvents={analyticsFilteredEvents}
          />
        ) : activeTab === 'assets' ? (
          <AssetsTab
            assets={assets}
            assetFilterMode={assetFilterMode}
            onAssetFilterModeChange={setAssetFilterMode}
            bulkAssetInput={bulkAssetInput}
            onBulkAssetInputChange={(nextValue) => {
              setBulkAssetInput(nextValue);
              if (bulkAssetError) setBulkAssetError('');
            }}
            bulkAssetError={bulkAssetError}
            onBulkAssetParse={handleBulkAssetParse}
            onBulkAssetCreate={handleBulkAssetCreate}
            bulkAssetPreview={bulkAssetPreview}
            bulkAssetSelectedKeys={bulkAssetSelectedKeys}
            onBulkAssetSelectedKeysChange={setBulkAssetSelectedKeys}
            bulkAssetGroupBy={bulkAssetGroupBy}
            onBulkAssetGroupByChange={setBulkAssetGroupBy}
            bulkAssetCollapsedGroups={bulkAssetCollapsedGroups}
            onBulkAssetCollapsedGroupsChange={setBulkAssetCollapsedGroups}
            bulkAssetForm={bulkAssetForm}
            onBulkAssetFormChange={setBulkAssetForm}
            assetForm={assetForm}
            assetFormError={assetFormError}
            assetUrlWarning={assetUrlWarning}
            editingAssetId={editingAssetId}
            formInputClass={FORM_INPUT_CLASS}
            formTextareaClass={FORM_TEXTAREA_CLASS}
            moduleSlotOptions={MODULE_SLOT_OPTIONS}
            getPublishTargetHint={getPublishTargetHint}
            inferMediaGroup={inferMediaGroup}
            getAssetUrlWarning={getAssetUrlWarning}
            onAssetFormChange={setAssetForm}
            onAssetFormErrorChange={setAssetFormError}
            onAssetUrlWarningChange={setAssetUrlWarning}
            onResetAssetForm={handleResetAssetForm}
            onSubmitAssetForm={handleSubmitAssetForm}
            filteredAssetsForPanel={filteredAssetsForPanel}
            getAssetDistributionSummary={getAssetDistributionSummary}
            onEditAsset={handleOpenAssetEditor}
            onDeleteAsset={deleteAsset}
          />
        ) : activeTab === 'projects' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[
                { id: 'projects', label: 'PROJECT LIST' },
                { id: 'distribution', label: 'DUAL VIEW DISTRIBUTION' },
                { id: 'videos', label: 'VIDEO WORKS' },
                { id: 'photos', label: 'PHOTO WORKS' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setProjectsPanelMode(mode.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs tracking-[0.12em] transition ${
                    projectsPanelMode === mode.id
                      ? 'border-zinc-300/80 bg-zinc-100/10 text-zinc-100'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {projectsPanelMode === 'videos' ? (
              <MediaWorksPanel
                title="VIDEO WORKS"
                description="只展示媒体分组为视频的素材"
                items={videoWorkAssets}
                emptyText="NO VIDEO WORKS."
                gridClassName="mt-4 grid gap-3"
                getAssetDistributionSummary={getAssetDistributionSummary}
              />
            ) : projectsPanelMode === 'photos' ? (
              <MediaWorksPanel
                title="PHOTO WORKS"
                description="只展示媒体分组为摄影的素材"
                items={photoWorkAssets}
                emptyText="NO PHOTO WORKS."
                gridClassName="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                getAssetDistributionSummary={getAssetDistributionSummary}
              />
            ) : projectsPanelMode === 'distribution' ? (
              <DistributionPanel
                assetForm={assetForm}
                assetFormError={assetFormError}
                assetUrlWarning={assetUrlWarning}
                editingAssetId={editingAssetId}
                formInputClass={FORM_INPUT_CLASS}
                formTextareaClass={FORM_TEXTAREA_CLASS}
                moduleSlotOptions={MODULE_SLOT_OPTIONS}
                getPublishTargetHint={getPublishTargetHint}
                inferMediaGroup={inferMediaGroup}
                getAssetUrlWarning={getAssetUrlWarning}
                onAssetFormChange={setAssetForm}
                onAssetFormErrorChange={setAssetFormError}
                onAssetUrlWarningChange={setAssetUrlWarning}
                onResetAssetForm={handleResetAssetForm}
                onSubmitAssetForm={handleSubmitAssetForm}
                filteredAssetsForPanel={filteredAssetsForPanel}
                getAssetDistributionSummary={getAssetDistributionSummary}
                onEditAsset={handleOpenAssetEditor}
                onDeleteAsset={deleteAsset}
              />
            ) : (
              <ProjectGrid
                pagedProjects={pagedProjects}
                projectViewMode={projectViewMode}
                selectedIds={selectedIds}
                onToggleSelectProject={toggleSelectProject}
                onMoveProject={moveProject}
                onHandleQuickPrivatePassword={handleQuickPrivatePassword}
                onHandleCopyPrivateLink={handleCopyPrivateLink}
                onHandleOpenEdit={handleOpenEdit}
                onDeleteProject={deleteProject}
              />
            )}
          </section>
        ) : activeTab === 'privateFiles' ? (
          <PrivateFilesPanel
            privateProjects={privateProjects}
            privateFilesProjectId={privateFilesProjectId}
            onPrivateFilesProjectIdChange={setPrivateFilesProjectId}
            resetPrivateFileForm={resetPrivateFileForm}
            privateFileForm={privateFileForm}
            onPrivateFileFormChange={setPrivateFileForm}
            privateFileError={privateFileError}
            onPrivateFileErrorChange={setPrivateFileError}
            editingPrivateFileId={editingPrivateFileId}
            onEditingPrivateFileIdChange={setEditingPrivateFileId}
            privateFiles={privateFiles}
            savePrivateFilesForProject={savePrivateFilesForProject}
            formInputClass={FORM_INPUT_CLASS}
            formTextareaClass={FORM_TEXTAREA_CLASS}
          />
        ) : activeTab === 'projectModules' ? (
          <ProjectModulesPanel
            exportCmsBundle={exportCmsBundle}
            buildLegacyMigrationPreview={buildLegacyMigrationPreview}
            caseStudies={config.caseStudies}
            setMigrationPreview={setMigrationPreview}
            setMigrationPreviewOpen={setMigrationPreviewOpen}
            importJsonText={importJsonText}
            setImportJsonText={setImportJsonText}
            importResult={importResult}
            setImportResult={setImportResult}
            importCmsBundle={importCmsBundle}
            migrationPreviewOpen={migrationPreviewOpen}
            migrationPreview={migrationPreview}
            migrateLegacyCaseStudiesToProjectData={migrateLegacyCaseStudiesToProjectData}
          />
        ) : activeTab === 'testimonials' ? (
          <TestimonialsPanel
            reviews={reviews}
            setReviewStatus={setReviewStatus}
            updateReview={updateReview}
            handleExportReviewAuditLogs={handleExportReviewAuditLogs}
            reviewAuditLogs={reviewAuditLogs}
          />
        ) : activeTab === 'siteConfig' ? (
          <SiteConfigPanel
            hasUnsavedSiteConfig={hasUnsavedSiteConfig}
            handleApplySiteConfig={handleApplySiteConfig}
            resetCaseStudies={resetCaseStudies}
            setSiteConfigDraft={setSiteConfigDraft}
            moveIntroProject={moveIntroProject}
            introProjectId={introProjectId}
            handleApplyVideoIntro={handleApplyVideoIntro}
            hasUnsavedIntro={hasUnsavedIntro}
            introTargetProject={introTargetProject}
            handleSaveAndNextIntro={handleSaveAndNextIntro}
            sortedProjects={sortedProjects}
            setIntroProjectId={setIntroProjectId}
            setIntroDraft={setIntroDraft}
            introDraft={introDraft}
            updateIntroDraftField={updateIntroDraftField}
            saveBulkProjectVideos={saveBulkProjectVideos}
            bulkProjectVideoForm={bulkProjectVideoForm}
            setBulkProjectVideoForm={setBulkProjectVideoForm}
            bulkProjectVideoError={bulkProjectVideoError}
            setBulkProjectVideoError={setBulkProjectVideoError}
            siteConfigDraft={siteConfigDraft}
            formInputClass={FORM_INPUT_CLASS}
            formTextareaClass={FORM_TEXTAREA_CLASS}
            LocalUploadField={LocalUploadField}
            uploadState={uploadState}
            handleUploadLogo={handleUploadLogo}
            handleUploadQrCode={handleUploadQrCode}
          />
        ) : (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">PROJECTS CMS</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                  TOTAL {totalProjects} · VISIBLE {visibleProjectsCount} · PUBLISHED {publishedProjectsCount}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrivateFilterMode((prev) => (prev === 'all' ? 'private_only' : prev === 'private_only' ? 'hide_private' : 'all'))}
                  className="rounded-md border border-amber-300/70 bg-amber-300/10 px-3 py-2 text-xs tracking-[0.14em] text-amber-200 transition hover:bg-amber-300/20"
                >
                  {privateFilterMode === 'all'
                    ? 'PRIVATE: ALL'
                    : privateFilterMode === 'private_only'
                      ? 'PRIVATE: ONLY'
                      : 'PRIVATE: HIDE'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = projectViewMode === 'card' ? 'list' : 'card';
                    setProjectViewMode(nextMode);
                    trackEvent('layout_changed', { mode: nextMode });
                  }}
                  className="rounded-md border border-sky-300/70 bg-sky-300/10 px-3 py-2 text-xs tracking-[0.14em] text-sky-200 transition hover:bg-sky-300/20"
                >
                  {projectViewMode === 'card' ? 'TEXT MODE' : 'CARD MODE'}
                </button>

                <button type="button" onClick={handleOpenAdd} className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20">
                  + Add New Project
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs tracking-[0.12em] text-zinc-400">
                  PREFLIGHT · ERRORS {preflightResult.errorCount} · WARNINGS {preflightResult.warningCount} · CHECKED {preflightResult.totalProjects}
                </p>
                <button
                  type="button"
                  onClick={() => setPreflightResult(runProjectPreflight(projects))}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200"
                >
                  RUN PREFLIGHT
                </button>
              </div>

              {preflightResult.issues.length > 0 ? (
                <div className="mt-2 max-h-36 overflow-auto rounded-md border border-zinc-800 bg-zinc-900/50 p-2 text-[11px] text-zinc-300">
                  {preflightResult.issues.slice(0, 8).map((issue) => (
                    <p key={`${issue.projectId}-${issue.code}`} className={issue.severity === 'error' ? 'text-rose-300' : 'text-amber-300'}>
                      [{issue.severity.toUpperCase()}] {issue.projectTitle}: {issue.message}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-emerald-300">No preflight issues found.</p>
              )}
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3 md:grid-cols-[200px_200px_1fr_auto] md:items-end">
              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">FILTER BY CATEGORY</p>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  {FILTER_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">FILTER BY STATUS</p>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  {FILTER_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">SEARCH TITLE</p>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                  placeholder="Search project title..."
                />
              </label>

              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setSearchQuery('');
                  setShowSelectedOnly(false);
                }}
                className={getActionButtonClass(hasActiveFilters)}
              >
                RESET FILTERS
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/50 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectCurrentPage}
                  className={`${SELECT_BUTTON_BASE_CLASS} ${SELECT_BUTTON_DEFAULT_CLASS}`}
                >
                  {selectedOnPageCount === pagedProjects.length && pagedProjects.length > 0 ? 'UNSELECT PAGE' : 'SELECT PAGE'}
                </button>
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  disabled={filteredProjects.length === 0}
                  className={`${SELECT_BUTTON_BASE_CLASS} ${
                    filteredProjects.length > 0
                      ? allFilteredSelected
                        ? SELECT_BUTTON_MUTED_CLASS
                        : SELECT_BUTTON_DEFAULT_CLASS
                      : SELECT_BUTTON_DISABLED_CLASS
                  }`}
                >
                  {allFilteredSelected ? 'UNSELECT FILTERED' : 'SELECT FILTERED'}
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => setShowSelectedOnly((prev) => !prev)}
                  className={`${SELECT_BUTTON_BASE_CLASS} ${
                    selectedIds.length > 0
                      ? showSelectedOnly
                        ? SELECT_TOGGLE_ACTIVE_CLASS
                        : SELECT_TOGGLE_INACTIVE_CLASS
                      : SELECT_BUTTON_DISABLED_CLASS
                  }`}
                >
                  {showSelectedOnly ? 'SHOW ALL' : 'SHOW SELECTED'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyBulkVisibility(true)}
                  className={`${BULK_BUTTON_BASE_CLASS} ${
                    selectedIds.length > 0 ? BULK_SHOW_CLASS : BULK_BUTTON_DISABLED_CLASS
                  }`}
                >
                  BULK SHOW
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyBulkVisibility(false)}
                  className={`${BULK_BUTTON_BASE_CLASS} ${
                    selectedIds.length > 0 ? BULK_HIDE_CLASS : BULK_BUTTON_DISABLED_CLASS
                  }`}
                >
                  BULK HIDE
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyBulkPublishStatus('Published')}
                  className={`${BULK_BUTTON_BASE_CLASS} ${
                    selectedIds.length > 0 ? BULK_PUBLISH_CLASS : BULK_BUTTON_DISABLED_CLASS
                  }`}
                >
                  BULK PUBLISH
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyBulkPublishStatus('Draft')}
                  className={`${BULK_BUTTON_BASE_CLASS} ${
                    selectedIds.length > 0 ? BULK_DRAFT_CLASS : BULK_BUTTON_DISABLED_CLASS
                  }`}
                >
                  BULK DRAFT
                </button>
              </div>
            </div>

            <ProjectGrid
              pagedProjects={pagedProjects}
              projectViewMode={projectViewMode}
              selectedIds={selectedIds}
              onToggleSelectProject={toggleSelectProject}
              onMoveProject={moveProject}
              onHandleQuickPrivatePassword={handleQuickPrivatePassword}
              onHandleCopyPrivateLink={handleCopyPrivateLink}
              onHandleOpenEdit={handleOpenEdit}
              onDeleteProject={deleteProject}
            />
                              ? 'border-amber-300/70 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25'
                              : 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {project.publishStatus === 'Private' ? '🔒' : '🔓'}
                        </button>
                        <button type="button" onClick={() => handleOpenEdit(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.1em] text-zinc-200 transition hover:border-zinc-400">Edit</button>
                        <button type="button" onClick={() => deleteProject(project.id)} className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs tracking-[0.1em] text-rose-200 transition hover:bg-rose-400/20">Delete</button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <ProjectPaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              displayProjects={displayProjects}
              selectedInFilteredCount={selectedInFilteredCount}
              onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              pageButtonBaseClass={PAGE_BUTTON_BASE_CLASS}
              pageButtonEnabledClass={PAGE_BUTTON_ENABLED_CLASS}
              pageButtonDisabledClass={PAGE_BUTTON_DISABLED_CLASS}
            />

            {totalProjects === 0 && <div className="mt-5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center text-xs tracking-[0.14em] text-zinc-500">NO PROJECTS YET. START BY ADDING A NEW ENTRY.</div>}

            {totalProjects > 0 && displayProjects.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center text-xs tracking-[0.14em] text-zinc-500">
                {showSelectedOnly
                  ? 'NO SELECTED PROJECTS IN CURRENT FILTER RESULT.'
                  : 'NO MATCHING PROJECTS FOR CURRENT FILTER / SEARCH.'}
              </div>
            )}

          </section>
        )}

        {showForm ? (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-700/70 bg-zinc-900/95 p-1 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
              <button
                type="button"
                onClick={handleCancelForm}
                aria-label="关闭弹窗"
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-100"
              >
                ×
              </button>

              <ProjectForm
                mode={formMode}
                formState={formState}
                onChange={(key, value) => setFormState((prev) => ({ ...prev, [key]: value }))}
                onSubmit={handleSubmitForm}
                onCancel={handleCancelForm}
                onUploadVideo={handleUploadVideo}
                uploadState={uploadState}
                coverPreviewUrl={coverPreviewUrl}
                projectCategories={PROJECT_CATEGORIES}
                roleOptions={ROLE_OPTIONS}
                workOutlineOptions={WORK_OUTLINE_OPTIONS}
                formInputClass={FORM_INPUT_CLASS}
                formTextareaClass={FORM_TEXTAREA_CLASS}
              />
            </div>
          </div>
        ) : null}

        <AssetEditorModal
          open={showAssetEditorModal}
          assetForm={assetForm}
          assetFormError={assetFormError}
          moduleSlotOptions={MODULE_SLOT_OPTIONS}
          formInputClass={FORM_INPUT_CLASS}
          getPublishTargetHint={getPublishTargetHint}
          onClose={closeAssetEditorModal}
          onChange={(key, value) => setAssetForm((prev) => ({ ...prev, [key]: value }))}
          onSubmit={handleSaveAssetEditorModal}
        />
      </div>
    </div>
  );
}

export default DirectorConsole;
