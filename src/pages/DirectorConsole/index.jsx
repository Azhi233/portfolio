import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../context/ConfigContext.jsx';

const PROJECT_CATEGORIES = ['Toys', 'Industrial', 'Misc'];
const FILTER_CATEGORIES = ['All', ...PROJECT_CATEGORIES];
const STATUS_OPTIONS = ['Draft', 'Published'];
const FILTER_STATUS = ['All', ...STATUS_OPTIONS];
const ITEMS_PER_PAGE = 6;

const AUTH_SESSION_KEY = 'director_auth_session';
const DIRECTOR_CONSOLE_PASSWORD = 'zhizhi233';

const EMPTY_FORM = {
  title: '',
  category: 'Toys',
  coverUrl: '',
  videoUrl: '',
  isFeatured: false,
  isVisible: true,
  sortOrder: 0,
  description: '',
  credits: '',
  publishStatus: 'Draft',
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

function ProjectForm({ mode, formState, onChange, onSubmit, onCancel }) {
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
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Publish Status</p>
          <select
            value={formState.publishStatus}
            onChange={(event) => onChange('publishStatus', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

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

        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Cover URL</p>
          <input
            value={formState.coverUrl}
            onChange={(event) => onChange('coverUrl', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="https://images.unsplash.com/..."
          />
        </label>

        <label className="block md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video URL</p>
          <input
            value={formState.videoUrl}
            onChange={(event) => onChange('videoUrl', event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="https://vimeo.com/..."
          />
        </label>

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
  const { config, projects, updateConfig, resetConfig, addProject, updateProject, deleteProject } = useConfig();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('settings');
  const [formMode, setFormMode] = useState('create');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

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
      return matchCategory && matchStatus && matchKeyword;
    });
  }, [sortedProjects, categoryFilter, statusFilter, searchQuery]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, searchQuery, showSelectedOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredProjects.some((project) => project.id === id)));
  }, [filteredProjects]);

  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [displayProjects, currentPage]);

  const selectedOnPageCount = pagedProjects.filter((project) => selectedIds.includes(project.id)).length;
  const selectedInFilteredCount = filteredProjects.filter((project) => selectedIds.includes(project.id)).length;
  const allFilteredSelected =
    filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id));

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
      coverUrl: project.coverUrl,
      videoUrl: project.videoUrl,
      isFeatured: project.isFeatured,
      isVisible: project.isVisible,
      sortOrder: project.sortOrder,
      description: project.description,
      credits: project.credits,
      publishStatus: project.publishStatus || 'Draft',
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProjectId(null);
    setFormState(EMPTY_FORM);
  };

  const handleSubmitForm = (event) => {
    event.preventDefault();

    if (formMode === 'edit' && editingProjectId) {
      updateProject(editingProjectId, formState);
    } else {
      addProject(formState);
    }

    handleCancelForm();
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

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300 transition hover:border-zinc-400"
            >
              Log Out
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <PanelTab isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              Site Settings (网站特效)
            </PanelTab>
            <PanelTab isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>
              Projects (作品管理)
            </PanelTab>
          </div>
        </header>

        {activeTab === 'settings' ? (
          <>
            <section className="mt-6 grid gap-4 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Vignette Intensity" value={config.vignetteIntensity.toFixed(2)} />
                <input type="range" min="0" max="1" step="0.01" value={config.vignetteIntensity} onChange={(event) => updateConfig('vignetteIntensity', Number(event.target.value))} className="w-full accent-emerald-400" />
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Film Grain Opacity" value={config.filmGrainOpacity.toFixed(2)} />
                <input type="range" min="0" max="0.2" step="0.005" value={config.filmGrainOpacity} onChange={(event) => updateConfig('filmGrainOpacity', Number(event.target.value))} className="w-full accent-emerald-400" />
              </div>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Spotlight Radius" value={`${config.spotlightRadius}px`} />
                <input type="range" min="200" max="1200" step="10" value={config.spotlightRadius} onChange={(event) => updateConfig('spotlightRadius', Number(event.target.value))} className="w-full accent-emerald-400" />
              </div>

              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
                <FieldLabel title="Monitor HUD" value={config.showHUD ? 'ON' : 'OFF'} />
                <button
                  type="button"
                  onClick={() => updateConfig('showHUD', !config.showHUD)}
                  className={`rounded-md border px-4 py-2 text-sm tracking-[0.08em] transition ${
                    config.showHUD ? HUD_ON_CLASS : HUD_OFF_CLASS
                  }`}
                >
                  {config.showHUD ? 'Disable HUD' : 'Enable HUD'}
                </button>
              </div>
            </section>

            <div className="mt-5 flex items-center justify-end">
              <button type="button" onClick={resetConfig} className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400 hover:text-zinc-100">
                RESET DEFAULTS
              </button>
            </div>
          </>
        ) : (
          <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm tracking-[0.16em] text-zinc-100">PROJECTS CMS</h2>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                  TOTAL {totalProjects} · VISIBLE {visibleProjectsCount} · PUBLISHED {publishedProjectsCount}
                </p>
              </div>
              <button type="button" onClick={handleOpenAdd} className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20">
                + Add New Project
              </button>
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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pagedProjects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
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
                        {project.publishStatus === 'Draft' ? (
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
                      <button type="button" onClick={() => handleOpenEdit(project)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.1em] text-zinc-200 transition hover:border-zinc-400">Edit</button>
                      <button type="button" onClick={() => deleteProject(project.id)} className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs tracking-[0.1em] text-rose-200 transition hover:bg-rose-400/20">Delete</button>
                    </div>
                  </div>
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
              <ProjectForm
                mode={formMode}
                formState={formState}
                onChange={(key, value) => setFormState((prev) => ({ ...prev, [key]: value }))}
                onSubmit={handleSubmitForm}
                onCancel={handleCancelForm}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default DirectorConsole;
