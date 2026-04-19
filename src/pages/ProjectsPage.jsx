import { useEffect, useMemo, useState } from 'react';

import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';

import PaginationBar from '../components/PaginationBar.jsx';
import { VideoGalleryGrid } from '../components/video-detail/index.js';
import { filterVideoProjects, groupProjectsByCategory, paginate } from './projectListingUtils.js';

function ProjectsPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', items: [], query: '', category: 'all', sortBy: 'newest', page: 1 });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson('/projects');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load projects.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const items = filterVideoProjects(state.items, state.query, state.category);
    return [...items].sort((a, b) => {
      if (state.sortBy === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''));
      if (state.sortBy === 'title-desc') return String(b.title || '').localeCompare(String(a.title || ''));
      const aDate = String(a.createdAt || a.releaseDate || '');
      const bDate = String(b.createdAt || b.releaseDate || '');
      return bDate.localeCompare(aDate);
    });
  }, [state.category, state.items, state.query, state.sortBy]);

  const groups = useMemo(() => groupProjectsByCategory(filtered), [filtered]);
  const categories = useMemo(() => ['all', ...groups.map((group) => group.name)], [groups]);
  const pageData = useMemo(() => paginate(filtered, state.page), [filtered, state.page]);
  const pageGroups = useMemo(() => groupProjectsByCategory(pageData.items), [pageData.items]);
  const visibleCount = filtered.length;

  useEffect(() => {
    setState((prev) => ({ ...prev, page: 1 }));
  }, [state.query, state.category, state.sortBy]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projects.eyebrow', 'VIDEO ARCHIVE')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('projects.title', '视频页')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('projects.subtitle', '这里仅展示视频内容，支持搜索、分类和排序。每个作品卡片会自动适配画幅比例，专注呈现视频本身。')}</p>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr]">
            <Input value={state.query} onChange={(event) => setState((prev) => ({ ...prev, query: event.target.value }))} placeholder={t('projects.search', 'Search videos...')} />
            <Select value={state.category} onChange={(event) => setState((prev) => ({ ...prev, category: event.target.value }))}>
              {categories.map((category) => (
                <option key={category} value={category}>{category === 'all' ? t('projects.all', 'All') : category}</option>
              ))}
            </Select>
            <Select value={state.sortBy} onChange={(event) => setState((prev) => ({ ...prev, sortBy: event.target.value }))}>
              <option value="newest">{t('projects.sortNewest', 'Newest first')}</option>
              <option value="title-asc">{t('projects.sortTitleAsc', 'Title A-Z')}</option>
              <option value="title-desc">{t('projects.sortTitleDesc', 'Title Z-A')}</option>
            </Select>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs tracking-[0.18em] text-zinc-500">{visibleCount} {t('projects.countLabel', 'VIDEO(S)')}</p>
          <Button type="button" variant="subtle" onClick={load}>{t('projects.refresh', 'REFRESH')}</Button>
        </div>

        {state.loading ? <p className="text-sm text-zinc-400">{t('projects.loading', 'Loading projects...')}</p> : null}
        {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

        {!state.loading && !state.error && pageData.items.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-zinc-400">{t('projects.empty', 'No projects matched your filter.')}</p>
          </Card>
        ) : null}

        <div className="space-y-10">
          {pageGroups.map((group) => (
            <VideoGalleryGrid
              key={group.key}
              title={group.name}
              items={group.projects}
              t={t}
              onSelect={(item) => window.location.assign(`/videos/${item.id}`)}
            />
          ))}
        </div>

        <PaginationBar
          label="VIDEO PAGE"
          page={pageData.page}
          totalPages={pageData.totalPages}
          onPrev={() => setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          onNext={() => setState((prev) => ({ ...prev, page: Math.min(pageData.totalPages, prev.page + 1) }))}
        />
      </section>
    </main>
  );
}

export default ProjectsPage;
