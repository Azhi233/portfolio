import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Badge from '../components/Badge.jsx';
import { ImageCategorySection } from '../components/image-detail/index.js';
import { filterImageProjects, groupProjectsByCategory } from './projectListingUtils.js';

function ImagesPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', items: [], query: '', category: 'all', sortBy: 'newest', page: 1 });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const items = await fetchJson('/projects?kind=photos');
      setState((prev) => ({ ...prev, loading: false, error: '', items: Array.isArray(items) ? items : [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load images.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => ['all', ...new Set(state.items.map((item) => item.category || 'Uncategorized'))], [state.items]);

  const filtered = useMemo(() => {
    const items = filterImageProjects(state.items, state.query, state.category);
    return [...items].sort((a, b) => {
      if (state.sortBy === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''));
      if (state.sortBy === 'title-desc') return String(b.title || '').localeCompare(String(a.title || ''));
      const aDate = String(a.createdAt || a.releaseDate || '');
      const bDate = String(b.createdAt || b.releaseDate || '');
      return bDate.localeCompare(aDate);
    });
  }, [state.category, state.items, state.query, state.sortBy]);

  const groupedProjects = useMemo(() => groupProjectsByCategory(filtered).filter((group) => group.projects.length > 0), [filtered]);
  const [categoryPages, setCategoryPages] = useState({});

  useEffect(() => {
    setCategoryPages((prev) => {
      const next = {};
      for (const group of groupedProjects) {
        next[group.key] = prev[group.key] || 1;
      }
      return next;
    });
  }, [groupedProjects]);

  useEffect(() => {
    setState((prev) => ({ ...prev, page: 1 }));
  }, [state.query, state.category, state.sortBy]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('images.eyebrow', 'IMAGE ARCHIVE')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('images.title', '图片页')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('images.subtitle', '这里只展示图片文件，视频内容会被排除在外。')}</p>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr]">
            <Input value={state.query} onChange={(event) => setState((prev) => ({ ...prev, query: event.target.value }))} placeholder={t('images.search', 'Search images...')} />
            <Select value={state.category} onChange={(event) => setState((prev) => ({ ...prev, category: event.target.value }))}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? t('images.all', 'All') : category}
                </option>
              ))}
            </Select>
            <Select value={state.sortBy} onChange={(event) => setState((prev) => ({ ...prev, sortBy: event.target.value }))}>
              <option value="newest">{t('images.sortNewest', 'Newest first')}</option>
              <option value="title-asc">{t('images.sortTitleAsc', 'Title A-Z')}</option>
              <option value="title-desc">{t('images.sortTitleDesc', 'Title Z-A')}</option>
            </Select>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs tracking-[0.18em] text-zinc-500">{filtered.length} {t('images.countLabel', 'IMAGE(S)')}</p>
          <div className="flex gap-2">
            <Button type="button" variant="subtle" onClick={load}>{t('images.refresh', 'REFRESH')}</Button>
            <Link to="/projects"><Button type="button" variant="default">{t('images.goVideoPage', 'VIDEO PAGE')}</Button></Link>
          </div>
        </div>

        {state.loading ? <p className="text-sm text-zinc-400">{t('images.loading', 'Loading images...')}</p> : null}
        {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

        <div className="space-y-10">
          {groupedProjects.map((group) => (
            <ImageCategorySection
              key={group.key}
              title={group.name}
              coverUrl={group.coverProject?.coverUrl || group.coverProject?.thumbnailUrl || ''}
              items={group.projects}
              t={t}
              onOpen={(project) => window.location.assign(`/images/${project.id}`)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default ImagesPage;
