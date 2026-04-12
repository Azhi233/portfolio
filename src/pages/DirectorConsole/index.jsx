import { Server } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import OssUploadField from '../../components/OssUploadField.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';
import { uploadFileToOSS } from '../../services/ossUpload.js';
import { clearAnalytics, getAnalyticsSnapshot, trackEvent } from '../../utils/analytics.js';

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
};

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
};

const EMPTY_PRIVATE_FILE_FORM = {
  projectId: '',
  name: '',
  url: '',
  actionType: 'download',
  note: '',
  enabled: true,
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

function getAssetUrlWarning(url, type) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) return '建议使用 http(s) OSS 链接，当前可能无法在前台稳定访问。';
  if (/localhost|127\.0\.0\.1|192\.168\./i.test(value)) return '检测到本地/内网地址，线上访问时可能失效。';
  if (type === 'image' && /\.(mp4|webm|mov)(\?.*)?$/i.test(value)) return '当前类型是 Image，但 URL 更像视频资源。';
  if (type === 'video' && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(value)) return '当前类型是 Video，但 URL 更像图片资源。';
  return '';
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

function ToggleField({ label, value, onToggle }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3">
      <span className="text-xs tracking-[0.12em] text-zinc-300">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full border px-3 py-1 text-xs tracking-[0.12em] transition ${
          value
            ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-200'
            : 'border-zinc-600 bg-zinc-800 text-zinc-300'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </label>
  );
}

function ProjectForm({
  mode,
  formState,
  onChange,
  onSubmit,
  onCancel,
  onUploadCover,
  onUploadVideo,
  uploadState,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
    >
      <h3 className="text-sm tracking-[0.15em] text-zinc-200">{mode === 'edit' ? 'EDIT PROJECT' : 'NEW PROJECT'}</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
          <input
            required
            value={formState.title}
            onChange={(event) => onChange('title', event.target.value)}
            className={FORM_INPUT_CLASS}
            placeholder="Project title"
          />
        </label>

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
          <select
            value={formState.category}
            onChange={(event) => onChange('category', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Role</p>
          <select
            value={formState.role}
            onChange={(event) => onChange('role', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Release Date</p>
          <input
            type="date"
            value={formState.releaseDate}
            onChange={(event) => onChange('releaseDate', event.target.value)}
            className={FORM_INPUT_CLASS}
          />
        </label>

        <div className="block rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.12em] text-zinc-300">Private Access</p>
            <button
              type="button"
              onClick={() => {
                const nextPrivate = !formState.isPrivate;
                onChange('isPrivate', nextPrivate);
                onChange(
                  'publishStatus',
                  nextPrivate ? 'Private' : formState.publishStatus === 'Draft' ? 'Draft' : 'Published',
                );
              }}
              className={`rounded-full border px-3 py-1 text-xs tracking-[0.12em] transition ${
                formState.isPrivate
                  ? 'border-amber-300/70 bg-amber-300/15 text-amber-200'
                  : 'border-zinc-600 bg-zinc-800 text-zinc-300'
              }`}
            >
              {formState.isPrivate ? 'PRIVATE' : 'PUBLIC'}
            </button>
          </div>
          <p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">
            开启后此项目需要密码访问。
          </p>

          <label className="mt-3 block">
            <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">Public Status</p>
            <select
              value={formState.isPrivate ? 'Private' : formState.publishStatus === 'Draft' ? 'Draft' : 'Published'}
              disabled={formState.isPrivate}
              onChange={(event) => onChange('publishStatus', event.target.value)}
              className={`w-full rounded-md border bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring-2 ${
                formState.isPrivate
                  ? 'cursor-not-allowed border-zinc-700 text-zinc-500'
                  : 'border-zinc-700 text-zinc-100'
              }`}
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </label>
        </div>

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Sort Order</p>
          <input
            type="number"
            value={formState.sortOrder}
            onChange={(event) => onChange('sortOrder', Number(event.target.value))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="0"
          />
        </label>

        <OssUploadField
          label="Cover URL"
          value={formState.coverUrl}
          placeholder="https://images.unsplash.com/..."
          accept="image/*"
          buttonText="上传图片到 OSS"
          uploadState={uploadState.cover}
          onChange={(nextValue) => onChange('coverUrl', nextValue)}
          onUpload={onUploadCover}
        />

        <OssUploadField
          label="Main Video URL"
          value={formState.videoUrl}
          placeholder="https://vimeo.com/..."
          accept="video/*"
          buttonText="上传视频到 OSS"
          uploadState={uploadState.video}
          onChange={(nextValue) => onChange('videoUrl', nextValue)}
          onUpload={onUploadVideo}
        />

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client / Agency</p>
          <input
            value={formState.clientAgency}
            onChange={(event) => onChange('clientAgency', event.target.value)}
            className={FORM_INPUT_CLASS}
            placeholder="Client / Agency name"
          />
        </label>

        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Code</p>
          <input
            value={formState.clientCode}
            onChange={(event) => onChange('clientCode', event.target.value)}
            className={FORM_INPUT_CLASS}
            placeholder="e.g. ACME-0426"
          />
          <p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">客户可通过统一入口页输入此代码直达私密项目。</p>
        </label>

        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">BTS Media (one URL per line)</p>
          <textarea
            value={formState.btsMediaText}
            onChange={(event) => onChange('btsMediaText', event.target.value)}
            className={FORM_TEXTAREA_CLASS}
            placeholder="https://.../bts-1.jpg&#10;https://.../bts-2.mp4"
          />
        </label>

        {formState.isPrivate ? (
          <>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Access Password</p>
              <input
                value={formState.accessPassword}
                onChange={(event) => onChange('accessPassword', event.target.value)}
                className={FORM_INPUT_CLASS}
                placeholder="Set password for private access"
              />
              <p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">建议至少 4 位字符。</p>
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Delivery PIN（提货码）</p>
              <input
                value={formState.deliveryPin}
                onChange={(event) => onChange('deliveryPin', event.target.value)}
                className={FORM_INPUT_CLASS}
                placeholder="Set delivery pin for ZIP download unlock"
              />
              <p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">客户仅在验证提货码后可进行批量高清下载。</p>
            </label>
          </>
        ) : null}

        <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <ToggleField
            label="Featured Project"
            value={formState.isFeatured}
            onToggle={() => onChange('isFeatured', !formState.isFeatured)}
          />
          <ToggleField
            label="Visible On Frontend"
            value={formState.isVisible}
            onToggle={() => onChange('isVisible', !formState.isVisible)}
          />
        </div>

        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p>
          <textarea
            value={formState.description}
            onChange={(event) => onChange('description', event.target.value)}
            className={FORM_TEXTAREA_CLASS}
            placeholder="Short synopsis..."
          />
        </label>

        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Credits</p>
          <input
            value={formState.credits}
            onChange={(event) => onChange('credits', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="DIRECTOR: DIRECTOR.VISION"
          />
        </label>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs tracking-[0.12em] text-zinc-300 transition hover:border-zinc-400"
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200 transition hover:bg-emerald-300/20"
        >
          SAVE
        </button>
      </div>
    </form>
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
    updateAsset,
    deleteAsset,
    updateProjectModule,
    updateCaseStudy,
    resetCaseStudies,
    migrateLegacyCaseStudiesToProjectData,
    exportCmsBundle,
    importCmsBundle,
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
  const [showForm, setShowForm] = useState(false);
  const [uploadState, setUploadState] = useState({
    cover: { status: 'idle', progress: 0 },
    video: { status: 'idle', progress: 0 },
  });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [projectViewMode, setProjectViewMode] = useState('card');
  const [privateFilterMode, setPrivateFilterMode] = useState('all');
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
    contactEmail: config.contactEmail || '',
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
  const [preflightResult, setPreflightResult] = useState(() => runProjectPreflight(projects));

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return sortedProjects.filter((project) => {
      const matchCategory = categoryFilter === 'All' || project.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || project.publishStatus === statusFilter;
      const matchKeyword = !keyword || project.title.toLowerCase().includes(keyword);
      const isPrivate = project.publishStatus === 'Private';
      const matchPrivateMode =
        privateFilterMode === 'all'
          ? true
          : privateFilterMode === 'private_only'
            ? isPrivate
            : !isPrivate;
      return matchCategory && matchStatus && matchKeyword && matchPrivateMode;
    });
  }, [sortedProjects, categoryFilter, statusFilter, searchQuery, privateFilterMode]);

  const displayProjects = useMemo(() => {
    if (!showSelectedOnly) return filteredProjects;
    return filteredProjects.filter((project) => selectedIds.includes(project.id));
  }, [filteredProjects, showSelectedOnly, selectedIds]);

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
    String(siteConfigDraft.contactEmail || '') !== String(config.contactEmail || '') ||
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
      contactEmail: config.contactEmail || '',
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

  const analyticsRangeStart = useMemo(() => {
    const now = Date.now();
    if (analyticsTimeRange === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (analyticsTimeRange === '7d') return now - 7 * 24 * 60 * 60 * 1000;
    if (analyticsTimeRange === '30d') return now - 30 * 24 * 60 * 60 * 1000;
    return 0;
  }, [analyticsTimeRange]);

  const analyticsFilteredEvents = useMemo(() => {
    const keyword = analyticsSearchQuery.trim().toLowerCase();

    return analyticsSnapshot.events.filter((event) => {
      const ts = new Date(event.timestamp).getTime();
      const inRange = analyticsRangeStart === 0 ? true : ts >= analyticsRangeStart;
      const typeMatch = analyticsEventType === 'all' ? true : event.type === analyticsEventType;
      const searchable = `${event.type} ${event.path || ''} ${JSON.stringify(event.payload || {})}`.toLowerCase();
      const searchMatch = !keyword || searchable.includes(keyword);
      return inRange && typeMatch && searchMatch;
    });
  }, [analyticsSnapshot.events, analyticsRangeStart, analyticsEventType, analyticsSearchQuery]);

  const buildAnalyticsBuckets = (metricType) => {
    const now = new Date();
    const useHourly = analyticsTimeRange === 'today';
    const bucketCount = useHourly ? 24 : analyticsTimeRange === '7d' ? 7 : analyticsTimeRange === '30d' ? 30 : 14;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      if (useHourly) {
        return {
          label: `${i}:00`,
          key: i,
          value: 0,
        };
      }

      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (bucketCount - 1 - i));
      return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        key: date.toDateString(),
        value: 0,
      };
    });

    analyticsSnapshot.events.forEach((event) => {
      if (metricType !== 'all' && event.type !== metricType) return;

      const ts = new Date(event.timestamp);
      if (useHourly) {
        const sameDay =
          ts.getFullYear() === now.getFullYear() &&
          ts.getMonth() === now.getMonth() &&
          ts.getDate() === now.getDate();
        if (!sameDay) return;

        const hour = ts.getHours();
        if (buckets[hour]) buckets[hour].value += 1;
        return;
      }

      const dayKey = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).toDateString();
      const target = buckets.find((bucket) => bucket.key === dayKey);
      if (target) target.value += 1;
    });

    return buckets;
  };

  const analyticsChartData = useMemo(
    () => buildAnalyticsBuckets(analyticsChartMetric),
    [analyticsSnapshot.events, analyticsTimeRange, analyticsChartMetric],
  );

  const analyticsCompareChartData = useMemo(
    () => (analyticsCompareMetric === 'none' ? [] : buildAnalyticsBuckets(analyticsCompareMetric)),
    [analyticsSnapshot.events, analyticsTimeRange, analyticsCompareMetric],
  );

  const analyticsChartMax = Math.max(
    1,
    ...analyticsChartData.map((item) => item.value),
    ...analyticsCompareChartData.map((item) => item.value),
  );

  const analyticsKpis = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEvents = analyticsSnapshot.events.filter((event) => new Date(event.timestamp).getTime() >= todayStart.getTime());
    const sevenDayEvents = analyticsSnapshot.events.filter((event) => new Date(event.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000);

    const todayPV = todayEvents.filter((event) => event.type === 'page_view').length;
    const sevenDayUV = new Set(
      sevenDayEvents.map((event) => event.sessionId).filter(Boolean),
    ).size;
    const videoPlayCount = analyticsFilteredEvents.filter((event) => event.type === 'video_play_clicked').length;
    const watchDurations = analyticsFilteredEvents
      .filter((event) => event.type === 'video_watch_duration')
      .map((event) => Number(event.payload?.seconds || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const avgWatchDuration =
      watchDurations.length > 0
        ? Math.round(watchDurations.reduce((sum, v) => sum + v, 0) / watchDurations.length)
        : 0;

    const filteredPageViews = analyticsFilteredEvents.filter((event) => event.type === 'page_view').length;
    const ctaEvents = analyticsFilteredEvents.filter((event) => event.type === 'cta_click');
    const ctaConsultCount = ctaEvents.filter((event) => event.payload?.action === 'consult').length;
    const ctaProposalCount = ctaEvents.filter((event) => event.payload?.action === 'proposal').length;
    const ctaCopyEmailCount = ctaEvents.filter((event) => event.payload?.action === 'copy_email').length;
    const ctaTotal = ctaConsultCount + ctaProposalCount + ctaCopyEmailCount;
    const ctaConversionRate = filteredPageViews > 0 ? Number(((ctaTotal / filteredPageViews) * 100).toFixed(1)) : 0;

    return {
      todayPV,
      sevenDayUV,
      videoPlayCount,
      avgWatchDuration,
      ctaConsultCount,
      ctaProposalCount,
      ctaCopyEmailCount,
      ctaTotal,
      filteredPageViews,
      ctaConversionRate,
    };
  }, [analyticsSnapshot.events, analyticsFilteredEvents]);

  const pageViewTopRoutes = useMemo(() => {
    return Object.entries(analyticsSnapshot.pageViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [analyticsSnapshot.pageViews]);

  const topVideoPlays = useMemo(() => {
    const map = {};
    analyticsSnapshot.events.forEach((event) => {
      if (event.type !== 'video_play_clicked') return;
      const key = event.payload?.projectId || event.payload?.title || 'unknown';
      if (!map[key]) {
        map[key] = { key, title: event.payload?.title || key, count: 0 };
      }
      map[key].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analyticsSnapshot.events]);

  const analyticsSummary = useMemo(() => {
    return `在当前筛选窗口中，视频播放 ${analyticsKpis.videoPlayCount} 次，平均观看时长 ${analyticsKpis.avgWatchDuration}s；今日 PV ${analyticsKpis.todayPV}，近7天 UV ${analyticsKpis.sevenDayUV}。`;
  }, [analyticsKpis]);

  const analyticsAnomaly = useMemo(() => {
    if (analyticsKpis.videoPlayCount >= 10 && analyticsKpis.avgWatchDuration < 8) {
      return '异常提示：播放次数较高但平均观看时长偏低，建议优化开场节奏或封面与内容一致性。';
    }
    if (analyticsKpis.todayPV > 80 && analyticsKpis.videoPlayCount === 0) {
      return '异常提示：页面访问较高但视频点击为 0，建议检查视频入口可见性与 CTA。';
    }
    return '';
  }, [analyticsKpis]);

  const analyticsWoW = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart.getTime() - dayMs;

    const todayPv = analyticsSnapshot.events.filter(
      (event) => event.type === 'page_view' && new Date(event.timestamp).getTime() >= todayStart.getTime(),
    ).length;

    const yesterdayPv = analyticsSnapshot.events.filter((event) => {
      if (event.type !== 'page_view') return false;
      const ts = new Date(event.timestamp).getTime();
      return ts >= yesterdayStart && ts < todayStart.getTime();
    }).length;

    const this7dStart = now - 7 * dayMs;
    const prev7dStart = now - 14 * dayMs;

    const this7dPlays = analyticsSnapshot.events.filter(
      (event) => event.type === 'video_play_clicked' && new Date(event.timestamp).getTime() >= this7dStart,
    ).length;

    const prev7dPlays = analyticsSnapshot.events.filter((event) => {
      if (event.type !== 'video_play_clicked') return false;
      const ts = new Date(event.timestamp).getTime();
      return ts >= prev7dStart && ts < this7dStart;
    }).length;

    const calcDelta = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      todayPv,
      yesterdayPv,
      todayVsYesterdayDelta: calcDelta(todayPv, yesterdayPv),
      this7dPlays,
      prev7dPlays,
      playWoWDelta: calcDelta(this7dPlays, prev7dPlays),
    };
  }, [analyticsSnapshot.events]);

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
    const onKeyDown = (event) => {
      const isCtrlLike = event.ctrlKey || event.metaKey;
      if (!isCtrlLike) return;
      if (activeTab !== 'siteConfig') return;
      if (!introProjectId) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        handleUndoIntro();
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
    const normalized = nextFiles.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
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

  const handleSubmitForm = (event) => {
    event.preventDefault();

    const nextVisibility = formState.isPrivate
      ? 'Private'
      : formState.publishStatus === 'Draft'
        ? 'Draft'
        : 'Published';

    const payload = {
      ...formState,
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

    if (formMode === 'edit' && editingProjectId) {
      updateProject(editingProjectId, payload);
    } else {
      addProject(payload);
    }

    handleCancelForm();
  };

  const handleUploadCover = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      cover: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'images/cover',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            cover: { status: 'uploading', progress },
          }));
        },
      });

      setFormState((prev) => ({ ...prev, coverUrl: result.url }));
      setUploadState((prev) => ({
        ...prev,
        cover: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        cover: { status: 'error', progress: 0 },
      }));
    }
  };

  const handleUploadVideo = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      video: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'videos/main',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            video: { status: 'uploading', progress },
          }));
        },
      });

      setFormState((prev) => ({ ...prev, videoUrl: result.url }));
      setUploadState((prev) => ({
        ...prev,
        video: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        video: { status: 'error', progress: 0 },
      }));
    }
  };

  const moveProject = (projectId, direction) => {
    const currentIndex = sortedProjects.findIndex((project) => project.id === projectId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedProjects.length) return;

    const reordered = [...sortedProjects];
    const [picked] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, picked);

    reordered.forEach((project, index) => {
      if (project.sortOrder !== index) {
        updateProject(project.id, { sortOrder: index });
      }
    });
  };

  const toggleSelectProject = (projectId) => {
    setSelectedIds((prev) => (prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]));
  };

  const toggleSelectCurrentPage = () => {
    const pageIds = pagedProjects.map((project) => project.id);
    if (pageIds.length === 0) return;

    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      return [...new Set([...prev, ...pageIds])];
    });
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProjects.map((project) => project.id);
    if (filteredIds.length === 0) return;

    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...prev, ...filteredIds])];
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

    selectedIds.forEach((id) => updateProject(id, { isVisible }));
    setSelectedIds([]);
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

    selectedIds.forEach((id) => updateProject(id, { publishStatus }));
    setSelectedIds([]);
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
    updateConfig('siteTitle', String(siteConfigDraft.siteTitle || '').trim());
    updateConfig('siteDescription', String(siteConfigDraft.siteDescription || '').trim());
    updateConfig('ogImage', String(siteConfigDraft.ogImage || '').trim());
    updateConfig('contactEmail', String(siteConfigDraft.contactEmail || '').trim());
    updateConfig('contactPhone', String(siteConfigDraft.contactPhone || '').trim());
    updateConfig('contactLocation', String(siteConfigDraft.contactLocation || '').trim());
    updateConfig('resumeAwardsText', String(siteConfigDraft.resumeAwardsText || '').trim());
    updateConfig('resumeExperienceText', String(siteConfigDraft.resumeExperienceText || '').trim());
    updateConfig('resumeGearText', String(siteConfigDraft.resumeGearText || '').trim());
    updateConfig('testimonialsText', String(siteConfigDraft.testimonialsText || '').trim());
    updateConfig('brandNamesText', String(siteConfigDraft.brandNamesText || '').trim());
    updateConfig('servicesText', String(siteConfigDraft.servicesText || '').trim());

    updateCaseStudy('toy', 'target', String(siteConfigDraft.caseToyTarget || '').trim());
    updateCaseStudy('toy', 'action', String(siteConfigDraft.caseToyAction || '').trim());
    updateCaseStudy('toy', 'assets', String(siteConfigDraft.caseToyAssets || '').trim());
    updateCaseStudy('toy', 'review', String(siteConfigDraft.caseToyReview || '').trim());

    updateCaseStudy('industry', 'target', String(siteConfigDraft.caseIndustryTarget || '').trim());
    updateCaseStudy('industry', 'action', String(siteConfigDraft.caseIndustryAction || '').trim());
    updateCaseStudy('industry', 'assets', String(siteConfigDraft.caseIndustryAssets || '').trim());
    updateCaseStudy('industry', 'review', String(siteConfigDraft.caseIndustryReview || '').trim());

    trackEvent('site_config_updated', {
      siteTitle: String(siteConfigDraft.siteTitle || '').trim(),
    });
  };

  const handleApplyVideoIntro = () => {
    if (!introTargetProject) return;

    updateProject(introTargetProject.id, {
      title: String(introDraft.title || '').trim(),
      description: String(introDraft.description || '').trim(),
      credits: String(introDraft.credits || '').trim(),
      role: String(introDraft.role || '').trim(),
      clientAgency: String(introDraft.clientAgency || '').trim(),
    });

    trackEvent('video_intro_updated', {
      projectId: introTargetProject.id,
      title: String(introDraft.title || '').trim(),
    });
  };

  const updateIntroDraftField = (key, value) => {
    setIntroDraft((prev) => {
      setIntroHistory((history) => [...history.slice(-40), prev]);
      return { ...prev, [key]: value };
    });
  };

  const handleUndoIntro = () => {
    setIntroHistory((history) => {
      if (history.length === 0) return history;
      const previous = history[history.length - 1];
      setIntroDraft(previous);
      return history.slice(0, -1);
    });
  };

  const moveIntroProject = (direction) => {
    const currentIndex = sortedProjects.findIndex((project) => project.id === introProjectId);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= sortedProjects.length) return;

    const target = sortedProjects[nextIndex];
    setIntroProjectId(target.id);
    setIntroDraft({
      title: target.title || '',
      description: target.description || '',
      credits: target.credits || '',
      role: target.role || '',
      clientAgency: target.clientAgency || '',
    });
  };

  const handleSaveAndNextIntro = () => {
    if (!introTargetProject) return;

    handleApplyVideoIntro();

    const currentIndex = sortedProjects.findIndex((project) => project.id === introProjectId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < sortedProjects.length) {
      const target = sortedProjects[nextIndex];
      setIntroProjectId(target.id);
      setIntroDraft({
        title: target.title || '',
        description: target.description || '',
        credits: target.credits || '',
        role: target.role || '',
        clientAgency: target.clientAgency || '',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  };

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
          </div>
        </header>

        {activeTab === 'settings' ? (
          <>
            <section className="mt-6 grid gap-4 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Vignette Intensity" value={Number(settingsDraft.vignetteIntensity).toFixed(2)} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settingsDraft.vignetteIntensity}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, vignetteIntensity: Number(event.target.value) }))
                  }
                  className="w-full accent-emerald-400"
                />
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Film Grain Opacity" value={Number(settingsDraft.filmGrainOpacity).toFixed(2)} />
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.005"
                  value={settingsDraft.filmGrainOpacity}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, filmGrainOpacity: Number(event.target.value) }))
                  }
                  className="w-full accent-emerald-400"
                />
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Spotlight Radius" value={`${Number(settingsDraft.spotlightRadius)}px`} />
                <input
                  type="range"
                  min="200"
                  max="1200"
                  step="10"
                  value={settingsDraft.spotlightRadius}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, spotlightRadius: Number(event.target.value) }))
                  }
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Monitor HUD" value={settingsDraft.showHUD ? 'ON' : 'OFF'} />
                <button
                  type="button"
                  onClick={() => setSettingsDraft((prev) => ({ ...prev, showHUD: !prev.showHUD }))}
                  className={`rounded-md border px-4 py-2 text-sm tracking-[0.08em] transition ${
                    settingsDraft.showHUD ? HUD_ON_CLASS : HUD_OFF_CLASS
                  }`}
                >
                  {settingsDraft.showHUD ? 'Disable HUD' : 'Enable HUD'}
                </button>
              </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {hasUnsavedSettings ? (
                <p className="rounded-md border border-amber-300/60 bg-amber-300/10 px-3 py-2 text-xs tracking-[0.12em] text-amber-200">
                  UNSAVED CHANGES
                </p>
              ) : (
                <p className="rounded-md border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-xs tracking-[0.12em] text-emerald-200">
                  ALL CHANGES SAVED
                </p>
              )}

              <button
                type="button"
                onClick={handleResetSettingsDraft}
                className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400 hover:text-zinc-100"
              >
                RESET DEFAULTS
              </button>
              <button
                type="button"
                onClick={handleApplySettings}
                disabled={!hasUnsavedSettings}
                className={`rounded-md border px-4 py-2 text-xs tracking-[0.14em] transition ${
                  hasUnsavedSettings
                    ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                SAVE SETTINGS
              </button>
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">ANALYTICS OVERVIEW</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                  PV {analyticsSnapshot.totalPV} · UV {analyticsSnapshot.totalUV}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={analyticsAutoRefresh}
                  onChange={(event) => setAnalyticsAutoRefresh(event.target.value)}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-200"
                >
                  <option value="off">AUTO: OFF</option>
                  <option value="10s">AUTO: 10S</option>
                  <option value="30s">AUTO: 30S</option>
                </select>

                <button
                  type="button"
                  onClick={() => setAnalyticsSnapshot(getAnalyticsSnapshot())}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
                >
                  REFRESH
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAnalytics();
                    setAnalyticsSnapshot(getAnalyticsSnapshot());
                  }}
                  className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.12em] text-rose-200 transition hover:bg-rose-400/20"
                >
                  CLEAR DATA
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3 md:grid-cols-4">
              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">TIME RANGE</p>
                <select
                  value={analyticsTimeRange}
                  onChange={(event) => setAnalyticsTimeRange(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  {ANALYTICS_TIME_RANGE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">EVENT TYPE FILTER</p>
                <select
                  value={analyticsEventType}
                  onChange={(event) => setAnalyticsEventType(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  <option value="all">ALL</option>
                  {ANALYTICS_METRIC_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">CHART METRIC A</p>
                <select
                  value={analyticsChartMetric}
                  onChange={(event) => setAnalyticsChartMetric(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  {ANALYTICS_METRIC_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">CHART METRIC B</p>
                <select
                  value={analyticsCompareMetric}
                  onChange={(event) => setAnalyticsCompareMetric(event.target.value)}
                  className={FILTER_INPUT_CLASS}
                >
                  {ANALYTICS_COMPARE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item === 'none' ? 'NONE' : item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-cyan-200">TODAY PV</p>
                <p className="mt-1 text-lg text-cyan-100">{analyticsKpis.todayPV}</p>
              </div>
              <div className="rounded-xl border border-sky-300/25 bg-sky-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-sky-200">7D UV</p>
                <p className="mt-1 text-lg text-sky-100">{analyticsKpis.sevenDayUV}</p>
              </div>
              <div className="rounded-xl border border-violet-300/25 bg-violet-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-violet-200">VIDEO PLAYS</p>
                <p className="mt-1 text-lg text-violet-100">{analyticsKpis.videoPlayCount}</p>
              </div>
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-emerald-200">AVG WATCH (S)</p>
                <p className="mt-1 text-lg text-emerald-100">{analyticsKpis.avgWatchDuration}</p>
              </div>
              <div className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-amber-200">CTA CONSULT</p>
                <p className="mt-1 text-lg text-amber-100">{analyticsKpis.ctaConsultCount}</p>
              </div>
              <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-fuchsia-200">CTA PROPOSAL</p>
                <p className="mt-1 text-lg text-fuchsia-100">{analyticsKpis.ctaProposalCount}</p>
              </div>
              <div className="rounded-xl border border-lime-300/25 bg-lime-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-lime-200">CTA COPY EMAIL</p>
                <p className="mt-1 text-lg text-lime-100">{analyticsKpis.ctaCopyEmailCount}</p>
              </div>
              <div className="rounded-xl border border-rose-300/25 bg-rose-300/5 p-3">
                <p className="text-[10px] tracking-[0.14em] text-rose-200">CTA TOTAL</p>
                <p className="mt-1 text-lg text-rose-100">{analyticsKpis.ctaTotal}</p>
                <p className="mt-1 text-[11px] text-rose-200/80">
                  CVR {analyticsKpis.ctaConversionRate}% · PV {analyticsKpis.filteredPageViews}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                <p className="text-[10px] tracking-[0.14em] text-zinc-400">TODAY VS YESTERDAY (PV)</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {analyticsWoW.todayPv} vs {analyticsWoW.yesterdayPv}
                  <span className={`ml-2 ${analyticsWoW.todayVsYesterdayDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {analyticsWoW.todayVsYesterdayDelta >= 0 ? '+' : ''}{analyticsWoW.todayVsYesterdayDelta}%
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                <p className="text-[10px] tracking-[0.14em] text-zinc-400">LAST 7D VS PREV 7D (VIDEO PLAYS)</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {analyticsWoW.this7dPlays} vs {analyticsWoW.prev7dPlays}
                  <span className={`ml-2 ${analyticsWoW.playWoWDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {analyticsWoW.playWoWDelta >= 0 ? '+' : ''}{analyticsWoW.playWoWDelta}%
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
              <p className="text-[10px] tracking-[0.14em] text-zinc-400">AUTO SUMMARY</p>
              <p className="mt-1 text-xs text-zinc-300">{analyticsSummary}</p>
              {analyticsAnomaly ? <p className="mt-2 text-xs text-amber-300">{analyticsAnomaly}</p> : null}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs tracking-[0.16em] text-zinc-400">TREND LINE (COMPARISON)</p>
                <div className="flex items-center gap-3 text-[11px] tracking-[0.12em]">
                  <button
                    type="button"
                    onClick={() => setShowMetricA((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 ${showMetricA ? 'text-cyan-300' : 'text-zinc-500'}`}
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />
                    {analyticsChartMetric}
                  </button>
                  {analyticsCompareMetric !== 'none' ? (
                    <button
                      type="button"
                      onClick={() => setShowMetricB((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 ${showMetricB ? 'text-violet-300' : 'text-zinc-500'}`}
                    >
                      <span className="inline-block h-2 w-2 rounded-full bg-violet-300" />
                      {analyticsCompareMetric}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="relative h-52 w-full overflow-hidden rounded-lg border border-zinc-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.35)_0%,rgba(10,15,24,0.4)_100%)]">
                <svg viewBox="0 0 100 40" className="h-full w-full transition-all duration-300">
                  {[0, 1, 2, 3, 4].map((n) => {
                    const y = 8 + n * 7;
                    return <line key={n} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.18)" strokeWidth="0.3" />;
                  })}

                  {showMetricA ? (
                    <polyline
                      fill="none"
                      stroke="rgba(56,189,248,0.95)"
                      strokeWidth="1.3"
                      points={analyticsChartData
                        .map((point, index) => {
                          const x = (index / Math.max(1, analyticsChartData.length - 1)) * 100;
                          const y = 36 - (point.value / analyticsChartMax) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  ) : null}

                  {analyticsCompareMetric !== 'none' && showMetricB ? (
                    <polyline
                      fill="none"
                      stroke="rgba(167,139,250,0.95)"
                      strokeWidth="1.3"
                      points={analyticsCompareChartData
                        .map((point, index) => {
                          const x = (index / Math.max(1, analyticsCompareChartData.length - 1)) * 100;
                          const y = 36 - (point.value / analyticsChartMax) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  ) : null}
                </svg>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] tracking-[0.08em] text-zinc-500 md:grid-cols-6">
                {analyticsChartData.map((point, index) => (
                  <button
                    key={point.label}
                    type="button"
                    onMouseEnter={() => setAnalyticsHoverIndex(index)}
                    onMouseLeave={() => setAnalyticsHoverIndex(null)}
                    className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-left"
                  >
                    <p>{point.label}</p>
                    <p className="text-cyan-300">A {point.value}</p>
                    {analyticsCompareMetric !== 'none' ? (
                      <p className="text-violet-300">B {analyticsCompareChartData[index]?.value || 0}</p>
                    ) : null}
                  </button>
                ))}
              </div>

              {analyticsHoverIndex !== null ? (
                <div className="mt-2 rounded-md border border-zinc-700 bg-black/50 px-3 py-2 text-xs text-zinc-300">
                  <p>Bucket: {analyticsChartData[analyticsHoverIndex]?.label}</p>
                  <p>A ({analyticsChartMetric}): {analyticsChartData[analyticsHoverIndex]?.value || 0}</p>
                  {analyticsCompareMetric !== 'none' ? (
                    <p>B ({analyticsCompareMetric}): {analyticsCompareChartData[analyticsHoverIndex]?.value || 0}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {migrationPreviewOpen ? (
              <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-300/5 p-4">
                <p className="text-xs tracking-[0.16em] text-amber-200">LEGACY MIGRATION PREVIEW</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="text-[11px] tracking-[0.14em] text-zinc-400">TOY_PREVIEW</p>
                    <p className="mt-1 text-xs text-zinc-300">Tags: {migrationPreview?.toy?.targetTags?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Action bullets: {migrationPreview?.toy?.actionBullets?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Asset URLs: {migrationPreview?.toy?.assetUrls?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Review cards: {migrationPreview?.toy?.reviewCards?.length || 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="text-[11px] tracking-[0.14em] text-zinc-400">INDUSTRY_PREVIEW</p>
                    <p className="mt-1 text-xs text-zinc-300">Tags: {migrationPreview?.industry?.targetTags?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Action bullets: {migrationPreview?.industry?.actionBullets?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Asset URLs: {migrationPreview?.industry?.assetUrls?.length || 0}</p>
                    <p className="text-xs text-zinc-300">Review cards: {migrationPreview?.industry?.reviewCards?.length || 0}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMigrationPreviewOpen(false)}
                    className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300"
                  >
                    CLOSE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      migrateLegacyCaseStudiesToProjectData();
                      const pid = projectModuleDraft.projectId;
                      const modules = projectData?.[pid]?.modules;
                      if (modules) {
                        setProjectModuleDraft((prev) => ({
                          ...prev,
                          targetHeadline: modules?.target?.headline || '',
                          targetSummary: modules?.target?.summary || '',
                          targetTagsText: (modules?.target?.tags || []).join('\n'),
                          actionTitle: modules?.action?.title || '',
                          actionBulletsText: (modules?.action?.bullets || []).join('\n'),
                          actionSupportImageUrl: modules?.action?.supportImageUrl || '',
                          assetsIntro: modules?.assets?.intro || '',
                          assetsUrlsText: (modules?.assets?.assetUrls || []).join('\n'),
                          reviewCardsText: (modules?.review?.cards || []).map((c) => `${c.title}: ${c.value}`).join('\n'),
                        }));
                      }
                      setMigrationPreviewOpen(false);
                    }}
                    className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200"
                  >
                    CONFIRM MIGRATION
                  </button>
                </div>
              </div>
            ) : null}

            {migrationPreviewOpen ? (
              <div className="mt-4 rounded-xl border border-amber-300/50 bg-amber-300/10 p-4">
                <p className="text-xs tracking-[0.16em] text-amber-200">LEGACY MIGRATION PREVIEW</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-amber-200/20 bg-black/20 p-3 text-xs text-zinc-200">
                    <p className="mb-2 tracking-[0.12em] text-amber-100">TOY</p>
                    <p>TAGS: {migrationPreview?.toy?.targetTags?.length || 0}</p>
                    <p>ACTION BULLETS: {migrationPreview?.toy?.actionBullets?.length || 0}</p>
                    <p>ASSET URLS: {migrationPreview?.toy?.assetUrls?.length || 0}</p>
                    <p>REVIEW CARDS: {migrationPreview?.toy?.reviewCards?.length || 0}</p>
                  </div>

                  <div className="rounded-lg border border-amber-200/20 bg-black/20 p-3 text-xs text-zinc-200">
                    <p className="mb-2 tracking-[0.12em] text-amber-100">INDUSTRY</p>
                    <p>TAGS: {migrationPreview?.industry?.targetTags?.length || 0}</p>
                    <p>ACTION BULLETS: {migrationPreview?.industry?.actionBullets?.length || 0}</p>
                    <p>ASSET URLS: {migrationPreview?.industry?.assetUrls?.length || 0}</p>
                    <p>REVIEW CARDS: {migrationPreview?.industry?.reviewCards?.length || 0}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMigrationPreviewOpen(false)}
                    className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                  >
                    CLOSE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      migrateLegacyCaseStudiesToProjectData();
                      setMigrationPreviewOpen(false);
                    }}
                    className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
                  >
                    CONFIRM MIGRATION
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
              <p className="text-xs tracking-[0.16em] text-zinc-400">IMPORT CMS JSON</p>
              <textarea
                value={importJsonText}
                onChange={(event) => {
                  setImportJsonText(event.target.value);
                  if (importResult) setImportResult('');
                }}
                className="mt-3 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
                placeholder="Paste exported cms-bundle JSON here..."
              />
              {importResult ? <p className="mt-2 text-xs text-zinc-300">{importResult}</p> : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportJsonText('');
                    setImportResult('');
                  }}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(importJsonText || '{}');
                      const result = importCmsBundle(parsed);
                      setImportResult(result?.message || 'Import finished.');
                    } catch {
                      setImportResult('Invalid JSON format.');
                    }
                  }}
                  className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
                >
                  IMPORT JSON
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
                <p className="text-xs tracking-[0.16em] text-zinc-400">TOP ROUTES</p>
                <div className="mt-3 space-y-2">
                  {pageViewTopRoutes.length > 0 ? (
                    pageViewTopRoutes.map(([path, count], idx) => (
                      <div key={path} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs">
                        <span className="tracking-[0.12em] text-zinc-300">#{idx + 1} {path}</span>
                        <span className="text-emerald-300">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs tracking-[0.12em] text-zinc-500">No data yet.</p>
                  )}
                </div>

                <p className="mt-4 text-xs tracking-[0.16em] text-zinc-400">TOP VIDEO PLAYS</p>
                <div className="mt-3 space-y-2">
                  {topVideoPlays.length > 0 ? (
                    topVideoPlays.map((item, idx) => (
                      <div key={item.key} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs">
                        <span className="tracking-[0.12em] text-zinc-300">#{idx + 1} {item.title}</span>
                        <span className="text-violet-300">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs tracking-[0.12em] text-zinc-500">No video play data yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs tracking-[0.16em] text-zinc-400">RECENT EVENTS (FILTERED)</p>
                  <input
                    value={analyticsSearchQuery}
                    onChange={(event) => setAnalyticsSearchQuery(event.target.value)}
                    placeholder="search event/path/payload"
                    className="w-44 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200"
                  />
                </div>

                <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {analyticsFilteredEvents.length > 0 ? (
                    analyticsFilteredEvents.slice(0, 40).map((event) => (
                      <div key={event.id} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                        <p className={`text-[11px] tracking-[0.14em] ${
                          event.type === 'page_view'
                            ? 'text-cyan-300'
                            : event.type === 'video_play_clicked'
                              ? 'text-violet-300'
                              : event.type === 'video_watch_duration'
                                ? 'text-emerald-300'
                                : event.type === 'layout_changed'
                                  ? 'text-amber-300'
                                  : 'text-sky-300'
                        }`}>{event.type}</p>
                        <p className="mt-1 text-[10px] tracking-[0.08em] text-zinc-500">{new Date(event.timestamp).toLocaleString()}</p>
                        {event.path ? <p className="mt-1 text-[11px] text-zinc-300">path: {event.path}</p> : null}
                        {event.payload ? (
                          <p className="mt-1 text-[11px] text-zinc-400">{JSON.stringify(event.payload)}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs tracking-[0.12em] text-zinc-500">No events in current filter.</p>
                  )}
                </div>

                <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <p className="text-[11px] tracking-[0.12em] text-zinc-300">{analyticsSummary}</p>
                  {analyticsAnomaly ? <p className="mt-2 text-[11px] text-amber-300">{analyticsAnomaly}</p> : null}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const header = 'id,type,timestamp,path,payload';
                      const rows = analyticsFilteredEvents.map((event) =>
                        [
                          event.id,
                          event.type,
                          event.timestamp,
                          event.path || '',
                          JSON.stringify(event.payload || {}).replaceAll('"', '""'),
                        ]
                          .map((value) => `"${String(value)}"`)
                          .join(','),
                      );
                      const csv = [header, ...rows].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `analytics-${Date.now()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
                  >
                    EXPORT CSV
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === 'assets' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">ASSETS CMS · VIEW DISTRIBUTION</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                  仅保存 URL 字符串，按双视角分发到 Expertise / Project 页面
                </p>
                <p className="mt-2 text-[11px] tracking-[0.12em] text-zinc-500">
                  TOTAL {assets.length} · EXPERTISE {assets.filter((a) => a.views?.expertise?.isActive).length} · PROJECT {assets.filter((a) => a.views?.project?.isActive).length}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `ALL (${assets.length})` },
                  {
                    id: 'expertise_only',
                    label: `EXPERTISE ONLY (${assets.filter((a) => a.views?.expertise?.isActive && !a.views?.project?.isActive).length})`,
                  },
                  {
                    id: 'project_only',
                    label: `PROJECT ONLY (${assets.filter((a) => !a.views?.expertise?.isActive && a.views?.project?.isActive).length})`,
                  },
                  {
                    id: 'both',
                    label: `BOTH (${assets.filter((a) => a.views?.expertise?.isActive && a.views?.project?.isActive).length})`,
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={assetFilterMode === m.id}
                    onClick={() => setAssetFilterMode(m.id)}
                    className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.14em] transition ${
                      assetFilterMode === m.id
                        ? 'border-zinc-300/80 bg-zinc-100/15 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
                        : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 md:grid-cols-2">
              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Title</p>
                <input
                  value={assetForm.title}
                  onChange={(event) => {
                    setAssetForm((prev) => ({ ...prev, title: event.target.value }));
                    if (assetFormError) setAssetFormError('');
                  }}
                  className={FORM_INPUT_CLASS}
                  placeholder="Asset title"
                />
              </label>

              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Type</p>
                <select
                  value={assetForm.type}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setAssetForm((prev) => ({ ...prev, type: nextType }));
                    setAssetUrlWarning(nextType === 'video' || nextType === 'image' ? getAssetUrlWarning(assetForm.url, nextType) : '');
                  }}
                  className={FORM_INPUT_CLASS}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="image-comparison">Image Comparison</option>
                </select>
              </label>

              {assetForm.type !== 'image-comparison' ? (
                <label className="block md:col-span-2">
                  <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset URL (OSS Link)</p>
                  <input
                    value={assetForm.url}
                    onChange={(event) => {
                      const nextUrl = event.target.value;
                      setAssetForm((prev) => ({ ...prev, url: nextUrl }));
                      setAssetUrlWarning(getAssetUrlWarning(nextUrl, assetForm.type));
                      if (assetFormError) setAssetFormError('');
                    }}
                    className={FORM_INPUT_CLASS}
                    placeholder="https://..."
                  />
                </label>
              ) : (
                <div className="block md:col-span-2 rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3">
                  <p className="mb-3 text-xs tracking-[0.12em] text-zinc-400">Variants URLs (for comparison)</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">RAW URL</p>
                      <input
                        value={assetForm.rawUrl}
                        onChange={(event) => setAssetForm((prev) => ({ ...prev, rawUrl: event.target.value }))}
                        className={FORM_INPUT_CLASS}
                        placeholder="https://..."
                      />
                    </label>
                    <label className="block">
                      <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">GRADED URL</p>
                      <input
                        value={assetForm.gradedUrl}
                        onChange={(event) => setAssetForm((prev) => ({ ...prev, gradedUrl: event.target.value }))}
                        className={FORM_INPUT_CLASS}
                        placeholder="https://..."
                      />
                    </label>
                    <label className="block">
                      <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">STYLED URL</p>
                      <input
                        value={assetForm.styledUrl}
                        onChange={(event) => setAssetForm((prev) => ({ ...prev, styledUrl: event.target.value }))}
                        className={FORM_INPUT_CLASS}
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                </div>
              )}

              <label className="block">
                <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Publish Target</p>
                <select
                  value={assetForm.publishTarget}
                  onChange={(event) => setAssetForm((prev) => ({ ...prev, publishTarget: event.target.value }))}
                  className={FORM_INPUT_CLASS}
                >
                  <option value="expertise">Expertise Only</option>
                  <option value="project">Project Only</option>
                  <option value="both">Both</option>
                </select>
              </label>

              {(assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both') ? (
                <>
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Expertise Category</p>
                    <select
                      value={assetForm.expertiseCategory}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, expertiseCategory: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="commercial">commercial</option>
                      <option value="industrial">industrial</option>
                      <option value="events">events</option>
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">技术向说明</p>
                    <textarea
                      value={assetForm.expertiseDescription}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, expertiseDescription: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                    />
                  </label>
                </>
              ) : null}

              {(assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both') ? (
                <>
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Project</p>
                    <select
                      value={assetForm.projectId}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, projectId: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="toy_project">toy_project</option>
                      <option value="industry_project">industry_project</option>
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">商业向说明</p>
                    <textarea
                      value={assetForm.projectDescription}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, projectDescription: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                    />
                  </label>
                </>
              ) : null}

              <div className="md:col-span-2">
                {assetFormError ? (
                  <p className="mb-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">
                    {assetFormError}
                  </p>
                ) : null}
                {assetUrlWarning ? (
                  <p className="mb-2 rounded-md border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-xs tracking-[0.1em] text-amber-200">
                    URL Warning: {assetUrlWarning}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssetForm(EMPTY_ASSET_FORM);
                      setAssetFormError('');
                      setAssetUrlWarning('');
                      setEditingAssetId(null);
                    }}
                    className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300"
                  >
                    RESET
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const variants = {
                        raw: String(assetForm.rawUrl || '').trim(),
                        graded: String(assetForm.gradedUrl || '').trim(),
                        styled: String(assetForm.styledUrl || '').trim(),
                      };
                      const variantValues = Object.values(variants).filter((value) => value);

                      const payload = {
                        title: String(assetForm.title || '').trim(),
                        url: String(assetForm.url || '').trim(),
                        type: assetForm.type,
                        variants: assetForm.type === 'image-comparison' ? variants : undefined,
                        views: {
                          expertise: {
                            isActive: assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both',
                            category: assetForm.expertiseCategory,
                            description: String(assetForm.expertiseDescription || '').trim(),
                          },
                          project: {
                            isActive: assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both',
                            projectId: assetForm.projectId,
                            description: String(assetForm.projectDescription || '').trim(),
                          },
                        },
                      };

                      if (!payload.title) {
                        setAssetFormError('请填写 Asset Title。');
                        return;
                      }

                      if (assetForm.type === 'image-comparison') {
                        if (variantValues.length === 0) {
                          setAssetFormError('请至少填写一条 variants URL。');
                          return;
                        }
                        if (variantValues.some((value) => !/^https?:\/\//i.test(value))) {
                          setAssetFormError('Variants URL 必须是 http(s) 链接。');
                          return;
                        }
                      } else {
                        if (!payload.url) {
                          setAssetFormError('请填写 Asset URL。');
                          return;
                        }
                        if (!/^https?:\/\//i.test(payload.url)) {
                          setAssetFormError('Asset URL 必须是 http(s) 链接。');
                          return;
                        }
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
                      setAssetForm(EMPTY_ASSET_FORM);
                      setEditingAssetId(null);
                    }}
                    className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
                  >
                    {editingAssetId ? 'UPDATE ASSET' : 'ADD ASSET'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {assets
                .filter((asset) => {
                  const inExpertise = Boolean(asset.views?.expertise?.isActive);
                  const inProject = Boolean(asset.views?.project?.isActive);
                  if (assetFilterMode === 'all') return true;
                  if (assetFilterMode === 'expertise_only') return inExpertise && !inProject;
                  if (assetFilterMode === 'project_only') return !inExpertise && inProject;
                  if (assetFilterMode === 'both') return inExpertise && inProject;
                  return true;
                })
                .map((asset) => (
                  <article key={asset.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-zinc-100">{asset.title}</p>
                        <p className="text-[11px] text-zinc-500">{asset.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
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
                              projectDescription: asset.views.project.description,
                            });
                            setAssetUrlWarning(getAssetUrlWarning(asset.url, asset.type));
                          }}
                          className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200"
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAsset(asset.id)}
                          className="rounded-md border border-rose-400/60 px-3 py-1.5 text-xs text-rose-200"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

              {assets.filter((asset) => {
                const inExpertise = Boolean(asset.views?.expertise?.isActive);
                const inProject = Boolean(asset.views?.project?.isActive);
                if (assetFilterMode === 'all') return true;
                if (assetFilterMode === 'expertise_only') return inExpertise && !inProject;
                if (assetFilterMode === 'project_only') return !inExpertise && inProject;
                if (assetFilterMode === 'both') return inExpertise && inProject;
                return true;
              }).length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                  NO ASSETS IN THIS FILTER MODE.
                </div>
              ) : null}
            </div>
          </section>
        ) : activeTab === 'projects' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[
                { id: 'projects', label: 'PROJECT LIST' },
                { id: 'distribution', label: 'DUAL VIEW DISTRIBUTION' },
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

            {projectsPanelMode === 'distribution' ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm tracking-[0.16em] text-zinc-100">DUAL VIEW DISTRIBUTION</h2>
                    <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">在作品管理页配置作品投放到专业技能页/商业项目页的归属</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 md:grid-cols-2">
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Title</p>
                    <input
                      value={assetForm.title}
                      onChange={(event) => {
                        setAssetForm((prev) => ({ ...prev, title: event.target.value }));
                        if (assetFormError) setAssetFormError('');
                      }}
                      className={FORM_INPUT_CLASS}
                      placeholder="Asset title"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset Type</p>
                    <select
                      value={assetForm.type}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        setAssetForm((prev) => ({ ...prev, type: nextType }));
                        setAssetUrlWarning(getAssetUrlWarning(assetForm.url, nextType));
                      }}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Asset URL (OSS Link)</p>
                    <input
                      value={assetForm.url}
                      onChange={(event) => {
                        const nextUrl = event.target.value;
                        setAssetForm((prev) => ({ ...prev, url: nextUrl }));
                        setAssetUrlWarning(getAssetUrlWarning(nextUrl, assetForm.type));
                        if (assetFormError) setAssetFormError('');
                      }}
                      className={FORM_INPUT_CLASS}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Publish Target</p>
                    <select
                      value={assetForm.publishTarget}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, publishTarget: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="expertise">Expertise Only</option>
                      <option value="project">Project Only</option>
                      <option value="both">Both</option>
                    </select>
                  </label>

                  {(assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both') ? (
                    <>
                      <label className="block">
                        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Expertise Category</p>
                        <select
                          value={assetForm.expertiseCategory}
                          onChange={(event) => setAssetForm((prev) => ({ ...prev, expertiseCategory: event.target.value }))}
                          className={FORM_INPUT_CLASS}
                        >
                          <option value="commercial">commercial</option>
                          <option value="industrial">industrial</option>
                          <option value="events">events</option>
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">技术向说明</p>
                        <textarea
                          value={assetForm.expertiseDescription}
                          onChange={(event) => setAssetForm((prev) => ({ ...prev, expertiseDescription: event.target.value }))}
                          className={FORM_TEXTAREA_CLASS}
                        />
                      </label>
                    </>
                  ) : null}

                  {(assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both') ? (
                    <>
                      <label className="block">
                        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Project</p>
                        <select
                          value={assetForm.projectId}
                          onChange={(event) => setAssetForm((prev) => ({ ...prev, projectId: event.target.value }))}
                          className={FORM_INPUT_CLASS}
                        >
                          <option value="toy_project">toy_project</option>
                          <option value="industry_project">industry_project</option>
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">商业向说明</p>
                        <textarea
                          value={assetForm.projectDescription}
                          onChange={(event) => setAssetForm((prev) => ({ ...prev, projectDescription: event.target.value }))}
                          className={FORM_TEXTAREA_CLASS}
                        />
                      </label>
                    </>
                  ) : null}

                  <div className="md:col-span-2">
                    {assetFormError ? (
                      <p className="mb-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">{assetFormError}</p>
                    ) : null}
                    {assetUrlWarning ? (
                      <p className="mb-2 rounded-md border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-xs tracking-[0.1em] text-amber-200">URL Warning: {assetUrlWarning}</p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAssetForm(EMPTY_ASSET_FORM);
                          setAssetFormError('');
                          setAssetUrlWarning('');
                          setEditingAssetId(null);
                        }}
                        className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300"
                      >
                        RESET
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const payload = {
                            title: String(assetForm.title || '').trim(),
                            url: String(assetForm.url || '').trim(),
                            type: assetForm.type,
                            views: {
                              expertise: {
                                isActive: assetForm.publishTarget === 'expertise' || assetForm.publishTarget === 'both',
                                category: assetForm.expertiseCategory,
                                description: String(assetForm.expertiseDescription || '').trim(),
                              },
                              project: {
                                isActive: assetForm.publishTarget === 'project' || assetForm.publishTarget === 'both',
                                projectId: assetForm.projectId,
                                description: String(assetForm.projectDescription || '').trim(),
                              },
                            },
                          };

                          if (!payload.title || !payload.url) {
                            setAssetFormError('请填写 Asset Title 和 Asset URL。');
                            return;
                          }

                          if (!/^https?:\/\//i.test(payload.url)) {
                            setAssetFormError('Asset URL 必须是 http(s) 链接。');
                            return;
                          }

                          setAssetFormError('');
                          setAssetUrlWarning(getAssetUrlWarning(payload.url, payload.type));

                          if (editingAssetId) {
                            updateAsset(editingAssetId, payload);
                          } else {
                            addAsset(payload);
                          }
                          setAssetForm(EMPTY_ASSET_FORM);
                          setEditingAssetId(null);
                        }}
                        className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
                      >
                        {editingAssetId ? 'UPDATE ASSET' : 'ADD ASSET'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {assets
                    .filter((asset) =>
                      assetFilterMode === 'all'
                        ? true
                        : assetFilterMode === 'expertise_only'
                          ? asset.views?.expertise?.isActive && !asset.views?.project?.isActive
                          : assetFilterMode === 'project_only'
                            ? !asset.views?.expertise?.isActive && asset.views?.project?.isActive
                            : asset.views?.expertise?.isActive && asset.views?.project?.isActive,
                    )
                    .map((asset) => (
                      <article key={asset.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-zinc-100">{asset.title}</p>
                            <p className="text-[11px] text-zinc-500">{asset.url}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAssetId(asset.id);
                                setAssetForm({
                                  title: asset.title,
                                  url: asset.url,
                                  type: asset.type,
                                  publishTarget:
                                    asset.views.expertise.isActive && asset.views.project.isActive
                                      ? 'both'
                                      : asset.views.project.isActive
                                        ? 'project'
                                        : 'expertise',
                                  expertiseCategory: asset.views.expertise.category,
                                  expertiseDescription: asset.views.expertise.description,
                                  projectId: asset.views.project.projectId,
                                  projectDescription: asset.views.project.description,
                                });
                                setAssetUrlWarning(getAssetUrlWarning(asset.url, asset.type));
                              }}
                              className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200"
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAsset(asset.id)}
                              className="rounded-md border border-rose-400/60 px-3 py-1.5 text-xs text-rose-200"
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}

                  {assets.filter((asset) =>
                    assetFilterMode === 'all'
                      ? true
                      : assetFilterMode === 'expertise_only'
                        ? asset.views?.expertise?.isActive && !asset.views?.project?.isActive
                        : assetFilterMode === 'project_only'
                          ? !asset.views?.expertise?.isActive && asset.views?.project?.isActive
                          : asset.views?.expertise?.isActive && asset.views?.project?.isActive,
                  ).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                      NO ASSETS IN THIS FILTER MODE.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : activeTab === 'privateFiles' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">PRIVATE PROJECT FILE CONTROL</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">单独管理私密项目的上传/下载文件信息、顺序和启用状态。</p>
              </div>
            </div>

            {privateProjects.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                NO PRIVATE PROJECTS. PLEASE MARK A PROJECT AS PRIVATE FIRST.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Target Private Project</p>
                    <select
                      value={privateFilesProjectId}
                      onChange={(event) => {
                        setPrivateFilesProjectId(event.target.value);
                        resetPrivateFileForm();
                      }}
                      className={FORM_INPUT_CLASS}
                    >
                      {privateProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title} {project.clientCode ? `· CODE ${project.clientCode}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">File Name</p>
                    <input
                      value={privateFileForm.name}
                      onChange={(event) => {
                        setPrivateFileForm((prev) => ({ ...prev, name: event.target.value }));
                        if (privateFileError) setPrivateFileError('');
                      }}
                      className={FORM_INPUT_CLASS}
                      placeholder="e.g. Final Delivery Pack"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Action Type</p>
                    <select
                      value={privateFileForm.actionType}
                      onChange={(event) => setPrivateFileForm((prev) => ({ ...prev, actionType: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="download">download</option>
                      <option value="upload">upload</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">File URL</p>
                    <input
                      value={privateFileForm.url}
                      onChange={(event) => {
                        setPrivateFileForm((prev) => ({ ...prev, url: event.target.value }));
                        if (privateFileError) setPrivateFileError('');
                      }}
                      className={FORM_INPUT_CLASS}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Note</p>
                    <textarea
                      value={privateFileForm.note}
                      onChange={(event) => setPrivateFileForm((prev) => ({ ...prev, note: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="Optional note shown to client"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={Boolean(privateFileForm.enabled)}
                        onChange={(event) => setPrivateFileForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                      />
                      Enabled
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={resetPrivateFileForm}
                        className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300"
                      >
                        RESET
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!privateFilesProjectId) {
                            setPrivateFileError('请选择私密项目。');
                            return;
                          }

                          const name = String(privateFileForm.name || '').trim();
                          const url = String(privateFileForm.url || '').trim();
                          if (!name || !url) {
                            setPrivateFileError('请填写 File Name 和 File URL。');
                            return;
                          }
                          if (!/^https?:\/\//i.test(url)) {
                            setPrivateFileError('File URL 必须是 http(s) 链接。');
                            return;
                          }

                          const nextItem = {
                            id: editingPrivateFileId || `pf-${Date.now()}`,
                            name,
                            url,
                            actionType: privateFileForm.actionType === 'upload' ? 'upload' : 'download',
                            note: String(privateFileForm.note || '').trim(),
                            enabled: Boolean(privateFileForm.enabled),
                          };

                          if (editingPrivateFileId) {
                            const nextFiles = privateFiles.map((item, index) =>
                              item.id === editingPrivateFileId ? { ...item, ...nextItem, sortOrder: index } : item,
                            );
                            savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                          } else {
                            const nextFiles = [...privateFiles, { ...nextItem, sortOrder: privateFiles.length }];
                            savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                          }

                          resetPrivateFileForm();
                        }}
                        className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
                      >
                        {editingPrivateFileId ? 'UPDATE FILE ITEM' : 'ADD FILE ITEM'}
                      </button>
                    </div>
                  </div>

                  {privateFileError ? (
                    <p className="md:col-span-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">{privateFileError}</p>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                  {privateFiles.map((item, index) => (
                    <article key={item.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-zinc-100">{item.name}</p>
                          <p className="text-[11px] text-zinc-500">{item.url}</p>
                          <p className="mt-1 text-[11px] text-zinc-400">TYPE: {String(item.actionType || 'download').toUpperCase()} · ORDER #{index}</p>
                          {item.note ? <p className="mt-1 text-[11px] text-zinc-400">NOTE: {item.note}</p> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!item.enabled ? <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">DISABLED</span> : null}
                          <button
                            type="button"
                            onClick={() => {
                              if (index === 0) return;
                              const nextFiles = [...privateFiles];
                              const [picked] = nextFiles.splice(index, 1);
                              nextFiles.splice(index - 1, 0, picked);
                              savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                            }}
                            className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (index === privateFiles.length - 1) return;
                              const nextFiles = [...privateFiles];
                              const [picked] = nextFiles.splice(index, 1);
                              nextFiles.splice(index + 1, 0, picked);
                              savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                            }}
                            className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPrivateFileId(item.id);
                              setPrivateFileForm({
                                projectId: privateFilesProjectId,
                                name: item.name,
                                url: item.url,
                                actionType: item.actionType || 'download',
                                note: item.note || '',
                                enabled: item.enabled !== false,
                              });
                              setPrivateFileError('');
                            }}
                            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextFiles = privateFiles.filter((x) => x.id !== item.id);
                              savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                              if (editingPrivateFileId === item.id) {
                                resetPrivateFileForm();
                              }
                            }}
                            className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200"
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {privateFiles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                      NO FILE ITEMS IN THIS PRIVATE PROJECT.
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : activeTab === 'projectModules' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">PROJECT MODULES CMS</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">编辑 Toy / Industry 复盘页四模块数据</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const bundle = exportCmsBundle();
                    const json = JSON.stringify(bundle, null, 2);
                    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cms-bundle-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.12em] text-cyan-200"
                >
                  EXPORT CMS JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMigrationPreview(buildLegacyMigrationPreview(config.caseStudies));
                    setMigrationPreviewOpen(true);
                  }}
                  className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.12em] text-amber-200"
                >
                  PREVIEW & MIGRATE LEGACY DATA
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
              <p className="text-xs tracking-[0.16em] text-zinc-400">IMPORT CMS JSON</p>
              <textarea
                value={importJsonText}
                onChange={(event) => {
                  setImportJsonText(event.target.value);
                  if (importResult) setImportResult('');
                }}
                className="mt-3 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
                placeholder="Paste exported cms-bundle JSON here..."
              />
              {importResult ? <p className="mt-2 text-xs text-zinc-300">{importResult}</p> : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportJsonText('');
                    setImportResult('');
                  }}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(importJsonText || '{}');
                      const result = importCmsBundle(parsed);
                      setImportResult(result?.message || 'Import finished.');
                    } catch {
                      setImportResult('Invalid JSON format.');
                    }
                  }}
                  className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
                >
                  IMPORT JSON
                </button>
              </div>
            </div>

            {migrationPreviewOpen ? (
              <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-300/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-[0.16em] text-amber-200">MIGRATION PREVIEW</p>
                  <button type="button" onClick={() => setMigrationPreviewOpen(false)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">CLOSE</button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs text-zinc-300">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    TOY · TAGS {(migrationPreview?.toy?.targetTags || []).length} · ACTIONS {(migrationPreview?.toy?.actionBullets || []).length}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    INDUSTRY · TAGS {(migrationPreview?.industry?.targetTags || []).length} · ACTIONS {(migrationPreview?.industry?.actionBullets || []).length}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      migrateLegacyCaseStudiesToProjectData();
                      setMigrationPreviewOpen(false);
                    }}
                    className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.12em] text-amber-200"
                  >
                    CONFIRM MIGRATION
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : activeTab === 'siteConfig' ? (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">SITE CONFIG & ABOUT</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                  管理联系方式、简历数据与全局 SEO 配置
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm('恢复 Case Study 模块默认文案？此操作仅重置目标/动作/素材/复盘字段。');
                    if (!confirmed) return;

                    resetCaseStudies();
                    setSiteConfigDraft((prev) => ({
                      ...prev,
                      caseToyTarget: '占位：品牌定位、用户画像、传播核心信息、视觉风格基准。',
                      caseToyAction: '占位：电商主图/详情页、短视频脚本、素材矩阵、投放组合。',
                      caseToyAssets: '占位：主KV、产品白底图、组装过程短视频、店铺详情页切片。',
                      caseToyReview: '占位：复购内容、社媒栏目化输出、UGC 激励机制、视觉资产复用策略。',
                      caseIndustryTarget: '占位：展会主KV、传播节奏、媒体包与新闻素材、统一叙事框架。',
                      caseIndustryAction: '占位：销售手册视频、工艺亮点模块化表达、客户场景案例包装。',
                      caseIndustryAssets: '占位：生产线工艺图集、展会采访片段、企业标准化视觉模板。',
                      caseIndustryReview: '占位：客户见证内容、标准化工厂纪录资产、年度视觉策略迭代。',
                    }));
                  }}
                  className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.14em] text-amber-200 transition hover:bg-amber-300/20"
                >
                  RESET CASE STUDIES
                </button>

                <button
                  type="button"
                  onClick={handleApplySiteConfig}
                  disabled={!hasUnsavedSiteConfig}
                  className={`rounded-md border px-4 py-2 text-xs tracking-[0.14em] transition ${
                    hasUnsavedSiteConfig
                      ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
                      : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  SAVE SITE CONFIG
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.18em] text-zinc-400">VIDEO INTRO EDITOR (EXISTING PROJECTS)</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveIntroProject('prev')}
                      disabled={!introProjectId}
                      className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                        introProjectId
                          ? 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                          : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      PREV
                    </button>

                    <button
                      type="button"
                      onClick={() => moveIntroProject('next')}
                      disabled={!introProjectId}
                      className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                        introProjectId
                          ? 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                          : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      NEXT
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyVideoIntro}
                      disabled={!hasUnsavedIntro || !introTargetProject}
                      className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                        hasUnsavedIntro && introTargetProject
                          ? 'border-cyan-300/70 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20'
                          : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      SAVE VIDEO INTRO
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndNextIntro}
                      disabled={!introTargetProject}
                      className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                        introTargetProject
                          ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
                          : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      SAVE & NEXT
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Select Uploaded Project</p>
                    <select
                      value={introProjectId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setIntroProjectId(nextId);
                        const target = sortedProjects.find((project) => project.id === nextId);
                        setIntroDraft({
                          title: target?.title || '',
                          description: target?.description || '',
                          credits: target?.credits || '',
                          role: target?.role || '',
                          clientAgency: target?.clientAgency || '',
                        });
                      }}
                      className={FORM_INPUT_CLASS}
                    >
                      <option value="">-- Select one project --</option>
                      {sortedProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Title</p>
                    <input
                      value={introDraft.title}
                      onChange={(event) => updateIntroDraftField('title', event.target.value)}
                      className={FORM_INPUT_CLASS}
                      placeholder="Video title"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Role</p>
                    <input
                      value={introDraft.role}
                      onChange={(event) => updateIntroDraftField('role', event.target.value)}
                      className={FORM_INPUT_CLASS}
                      placeholder="DOP / Director / Colorist"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Description</p>
                    <textarea
                      value={introDraft.description}
                      onChange={(event) => updateIntroDraftField('description', event.target.value)}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="Video intro / synopsis"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Copy / Credits</p>
                    <input
                      value={introDraft.credits}
                      onChange={(event) => updateIntroDraftField('credits', event.target.value)}
                      className={FORM_INPUT_CLASS}
                      placeholder="Credits / copy"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client / Agency</p>
                    <input
                      value={introDraft.clientAgency}
                      onChange={(event) => updateIntroDraftField('clientAgency', event.target.value)}
                      className={FORM_INPUT_CLASS}
                      placeholder="Client / agency"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">GLOBAL SEO</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Site Title</p>
                    <input
                      value={siteConfigDraft.siteTitle}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, siteTitle: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                      placeholder="DIRECTOR.VISION"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Site Description</p>
                    <textarea
                      value={siteConfigDraft.siteDescription}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, siteDescription: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="Portfolio description for SEO"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Open Graph Image URL</p>
                    <input
                      value={siteConfigDraft.ogImage}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, ogImage: event.target.value }))}
                      className={FORM_INPUT_CLASS}
                      placeholder="https://.../og-cover.jpg"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">CONTACT</p>
                <div className="space-y-3">
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Email</p>
                    <input
                      value={siteConfigDraft.contactEmail}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, contactEmail: event.target.value }))
                      }
                      className={FORM_INPUT_CLASS}
                      placeholder="you@email.com"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Phone</p>
                    <input
                      value={siteConfigDraft.contactPhone}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, contactPhone: event.target.value }))
                      }
                      className={FORM_INPUT_CLASS}
                      placeholder="+86 ..."
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Location</p>
                    <input
                      value={siteConfigDraft.contactLocation}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, contactLocation: event.target.value }))
                      }
                      className={FORM_INPUT_CLASS}
                      placeholder="Shanghai / Beijing / Remote"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">RESUME / CV</p>
                <div className="space-y-3">
                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Awards (one per line)</p>
                    <textarea
                      value={siteConfigDraft.resumeAwardsText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, resumeAwardsText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="Award A&#10;Award B"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Experience (one per line)</p>
                    <textarea
                      value={siteConfigDraft.resumeExperienceText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, resumeExperienceText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="Company / Role / Year"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Gear List (one per line)</p>
                    <textarea
                      value={siteConfigDraft.resumeGearText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, resumeGearText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="ARRI / SONY / LENS ..."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">SOCIAL PROOF & SERVICES</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Testimonials (quote|role|company per line)</p>
                    <textarea
                      value={siteConfigDraft.testimonialsText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, testimonialsText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder='"团队协作顺畅..."|市场负责人|消费品牌'
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Brand Names (one per line)</p>
                    <textarea
                      value={siteConfigDraft.brandNamesText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, brandNamesText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="TOYVERSE&#10;INDUSTRIAL PRO"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Services (title|deliverables|timeline|bestFor per line)</p>
                    <textarea
                      value={siteConfigDraft.servicesText}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, servicesText: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="商业视觉项目统筹|前期策略,拍摄执行,后期交付|2-6周|品牌新品发布"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">CASE STUDY · TOY PROJECT</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">目标 TARGET</p>
                    <textarea
                      value={siteConfigDraft.caseToyTarget}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyTarget: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 toy 项目目标"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">动作 ACTION</p>
                    <textarea
                      value={siteConfigDraft.caseToyAction}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyAction: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 toy 项目动作"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">素材 ASSETS</p>
                    <textarea
                      value={siteConfigDraft.caseToyAssets}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyAssets: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 toy 项目素材"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">复盘 REVIEW</p>
                    <textarea
                      value={siteConfigDraft.caseToyReview}
                      onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyReview: event.target.value }))}
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 toy 项目复盘结论"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
                <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">CASE STUDY · INDUSTRY PROJECT</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">目标 TARGET</p>
                    <textarea
                      value={siteConfigDraft.caseIndustryTarget}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, caseIndustryTarget: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 industry 项目目标"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">动作 ACTION</p>
                    <textarea
                      value={siteConfigDraft.caseIndustryAction}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, caseIndustryAction: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 industry 项目动作"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">素材 ASSETS</p>
                    <textarea
                      value={siteConfigDraft.caseIndustryAssets}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, caseIndustryAssets: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 industry 项目素材"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">复盘 REVIEW</p>
                    <textarea
                      value={siteConfigDraft.caseIndustryReview}
                      onChange={(event) =>
                        setSiteConfigDraft((prev) => ({ ...prev, caseIndustryReview: event.target.value }))
                      }
                      className={FORM_TEXTAREA_CLASS}
                      placeholder="填写 industry 项目复盘结论"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
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

            <div className={`mt-5 grid gap-4 ${projectViewMode === 'card' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {pagedProjects.map((project) => (
                <article
                  key={project.id}
                  className={`overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
                    projectViewMode === 'list' ? 'p-4' : ''
                  }`}
                >
                  {projectViewMode === 'card' ? (
                    <>
                      <div className="h-36 w-full bg-zinc-900">
                        {project.coverUrl ? (
                          <img src={project.coverUrl} alt={project.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-zinc-500">NO COVER IMAGE</div>
                        )}
                      </div>

                      <div className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(project.id)}
                              onChange={() => toggleSelectProject(project.id)}
                              className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                            />
                            <h3 className="text-sm tracking-[0.08em] text-zinc-100">{project.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            {project.publishStatus === 'Private' ? (
                              <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">PRIVATE</span>
                            ) : project.publishStatus === 'Draft' ? (
                              <span className="rounded-full border border-purple-300/70 bg-purple-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-purple-200">DRAFT</span>
                            ) : (
                              <span className="rounded-full border border-sky-300/70 bg-sky-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-sky-200">PUBLISHED</span>
                            )}
                            {project.isFeatured && <span className="rounded-full border border-emerald-300/70 bg-emerald-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-emerald-200">FEATURED</span>}
                            {!project.isVisible && <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">HIDDEN</span>}
                          </div>
                        </div>

                        <p className="text-xs tracking-[0.12em] text-zinc-400">{project.category}</p>
                        <p className="text-[11px] tracking-[0.12em] text-zinc-500">ORDER #{project.sortOrder}</p>
                        {project.clientCode ? <p className="text-[11px] tracking-[0.12em] text-cyan-300">CODE: {project.clientCode}</p> : null}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => moveProject(project.id, 'up')}
                            className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProject(project.id, 'down')}
                            className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickPrivatePassword(project)}
                            title={project.publishStatus === 'Private' ? '取消私密（改为 Published）' : '设为私密并设置密码'}
                            className={`rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition ${
                              project.publishStatus === 'Private'
                                ? 'border-amber-300/70 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25'
                                : 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            {project.publishStatus === 'Private' ? '🔒' : '🔓'}
                          </button>
                          {project.publishStatus === 'Private' ? (
                            <button
                              type="button"
                              onClick={() => handleCopyPrivateLink(project)}
                              className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/20"
                            >
                              Copy Private Link
                            </button>
                          ) : null}
                          {project.publishStatus === 'Private' ? (
                          <button
                            type="button"
                            onClick={() => handleCopyPrivateLink(project)}
                            className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-3 py-1.5 text-xs tracking-[0.1em] text-cyan-200 transition hover:bg-cyan-300/20"
                          >
                            Copy Private Link
                          </button>
                        ) : null}
                        <button type="button" onClick={() => handleOpenEdit(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.1em] text-zinc-200 transition hover:border-zinc-400">Edit</button>
                          <button type="button" onClick={() => deleteProject(project.id)} className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs tracking-[0.1em] text-rose-200 transition hover:bg-rose-400/20">Delete</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-[220px] items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => toggleSelectProject(project.id)}
                          className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                        />
                        <div>
                          <h3 className="text-sm tracking-[0.08em] text-zinc-100">{project.title}</h3>
                          <p className="mt-1 text-xs tracking-[0.12em] text-zinc-400">{project.category} · ORDER #{project.sortOrder}</p>
                          {project.clientCode ? <p className="mt-1 text-[11px] tracking-[0.12em] text-cyan-300">CODE: {project.clientCode}</p> : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {project.publishStatus === 'Private' ? (
                          <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">PRIVATE</span>
                        ) : project.publishStatus === 'Draft' ? (
                          <span className="rounded-full border border-purple-300/70 bg-purple-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-purple-200">DRAFT</span>
                        ) : (
                          <span className="rounded-full border border-sky-300/70 bg-sky-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-sky-200">PUBLISHED</span>
                        )}
                        {project.isFeatured && <span className="rounded-full border border-emerald-300/70 bg-emerald-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-emerald-200">FEATURED</span>}
                        {!project.isVisible && <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">HIDDEN</span>}

                        <button
                          type="button"
                          onClick={() => moveProject(project.id, 'up')}
                          className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProject(project.id, 'down')}
                          className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs tracking-[0.08em] text-zinc-200 transition hover:border-zinc-400"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPrivatePassword(project)}
                          title={project.publishStatus === 'Private' ? '取消私密（改为 Published）' : '设为私密并设置密码'}
                          className={`rounded-md border px-3 py-1.5 text-xs tracking-[0.1em] transition ${
                            project.publishStatus === 'Private'
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

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs tracking-[0.12em] text-zinc-500">
                PAGE {currentPage} / {totalPages} · MATCHES {displayProjects.length} · SELECTED {selectedInFilteredCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={`${PAGE_BUTTON_BASE_CLASS} ${
                    currentPage > 1 ? PAGE_BUTTON_ENABLED_CLASS : PAGE_BUTTON_DISABLED_CLASS
                  }`}
                >
                  PREV
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={`${PAGE_BUTTON_BASE_CLASS} ${
                    currentPage < totalPages ? PAGE_BUTTON_ENABLED_CLASS : PAGE_BUTTON_DISABLED_CLASS
                  }`}
                >
                  NEXT
                </button>
              </div>
            </div>

            {totalProjects === 0 && <div className="mt-5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center text-xs tracking-[0.14em] text-zinc-500">NO PROJECTS YET. START BY ADDING A NEW ENTRY.</div>}

            {totalProjects > 0 && displayProjects.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center text-xs tracking-[0.14em] text-zinc-500">
                {showSelectedOnly
                  ? 'NO SELECTED PROJECTS IN CURRENT FILTER RESULT.'
                  : 'NO MATCHING PROJECTS FOR CURRENT FILTER / SEARCH.'}
              </div>
            )}

            {showForm && (
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
                    onUploadCover={handleUploadCover}
                    onUploadVideo={handleUploadVideo}
                    uploadState={uploadState}
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default DirectorConsole;
