import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Badge from '../components/Badge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

const PAGE_SIZE = 6;

function filterProjects(items, query, category, kind) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesKind = kind === 'all' || (kind === 'photos' ? item.mainVideoUrl ? false : true : Boolean(item.mainVideoUrl || item.videoUrl));
    const matchesCategory = category === 'all' || (item.category || 'Uncategorized') === category;
    const matchesQuery = !normalizedQuery || `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(normalizedQuery);
    return matchesKind && matchesCategory && matchesQuery;
  });
}

function paginate(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { totalPages, page: safePage, items: items.slice(start, start + PAGE_SIZE) };
}

function ProjectsPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', items: [], query: '', category: 'all', sortBy: 'newest', page: 1, kind: 'photos' });

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

  const categories = useMemo(() => ['all', ...new Set(state.items.map((item) => item.category || 'Uncategorized'))], [state.items]);

  const filtered = useMemo(() => {
    const items = filterProjects(state.items, state.query, state.category, state.kind);
    return [...items].sort((a, b) => {
      if (state.sortBy === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''));
      if (state.sortBy === 'title-desc') return String(b.title || '').localeCompare(String(a.title || ''));
      const aDate = String(a.createdAt || a.releaseDate || '');
      const bDate = String(b.createdAt || b.releaseDate || '');
      return bDate.localeCompare(aDate);
    });
  }, [state.category, state.items, state.kind, state.query, state.sortBy]);

  const pageData = useMemo(() => paginate(filtered, state.page), [filtered, state.page]);
  const visibleCount = filtered.length;

  useEffect(() => {
    setState((prev) => ({ ...prev, page: 1 }));
  }, [state.query, state.category, state.kind, state.sortBy]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projects.eyebrow', 'PROJECT ARCHIVE')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('projects.title', '项目集')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('projects.subtitle', '按照片和视频分开展示，支持搜索、分类和分页浏览。')}</p>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr]">
            <Input value={state.query} onChange={(event) => setState((prev) => ({ ...prev, query: event.target.value }))} placeholder={t('projects.search', 'Search projects...')} />
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant={state.kind === 'photos' ? 'primary' : 'subtle'} onClick={() => setState((prev) => ({ ...prev, kind: 'photos', page: 1 }))}>照片页</Button>
            <Button type="button" variant={state.kind === 'videos' ? 'primary' : 'subtle'} onClick={() => setState((prev) => ({ ...prev, kind: 'videos', page: 1 }))}>视频页</Button>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs tracking-[0.18em] text-zinc-500">{visibleCount} {t('projects.countLabel', 'PROJECT(S)')}</p>
          <Button type="button" variant="subtle" onClick={load}>{t('projects.refresh', 'REFRESH')}</Button>
        </div>

        {state.loading ? <p className="text-sm text-zinc-400">{t('projects.loading', 'Loading projects...')}</p> : null}
        {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

        {!state.loading && !state.error && pageData.items.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-zinc-400">{t('projects.empty', 'No projects matched your filter.')}</p>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageData.items.map((project) => (
            <Card key={project.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-zinc-500">{project.category || t('projects.uncategorized', 'Uncategorized')}</p>
                  <h2 className="mt-2 text-lg tracking-[0.08em] text-white">{project.title}</h2>
                </div>
                <Badge tone={project.isVisible === false ? 'danger' : 'success'}>{project.isVisible === false ? t('projects.hidden', 'HIDDEN') : t('projects.live', 'LIVE')}</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{project.description || t('projects.noDescription', 'No description yet.')}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.isFeatured ? <Badge tone="warning">{t('projects.featured', 'FEATURED')}</Badge> : null}
                {project.clientCode ? <Badge>{project.clientCode}</Badge> : null}
              </div>
              <div className="mt-5">
                <Link to={`/project/${project.id}`}>
                  <Button type="button" variant="primary">{t('projects.openProject', 'OPEN PROJECT')}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <PaginationBar
          label={state.kind === 'photos' ? 'PHOTO PAGE' : 'VIDEO PAGE'}
          page={pageData.page}
          totalPages={pageData.totalPages}
          onPrev={() => setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          onNext={() => setState((prev) => ({ ...prev, page: Math.min(pageData.totalPages, prev.page + 1) }))}
        />

        <div>
          <Link to="/">
            <Button type="button" variant="default">{t('projects.backHome', 'BACK HOME')}</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProjectsPage;
