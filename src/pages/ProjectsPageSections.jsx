import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';

export function ProjectsPageHeader({ t }) {
  return (
    <Card className="p-8 md:p-10">
      <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('projects.eyebrow', 'VIDEO ARCHIVE')}</p>
      <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('projects.title', '视频页')}</h1>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('projects.subtitle', '这里仅展示视频内容，支持搜索、分类和排序。每个作品卡片会自动适配画幅比例，专注呈现视频本身。')}</p>
    </Card>
  );
}

export function ProjectsPageFilters({ state, categories, setState, t }) {
  return (
    <Card className="p-6 md:p-8">
      <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr]">
        <Input value={state.query} onChange={(event) => setState((prev) => ({ ...prev, query: event.target.value }))} placeholder={t('projects.search', 'Search videos...')} />
        <Select value={state.category} onChange={(event) => setState((prev) => ({ ...prev, category: event.target.value }))}>
          {categories.map((category) => <option key={category} value={category}>{category === 'all' ? t('projects.all', 'All') : category}</option>)}
        </Select>
        <Select value={state.sortBy} onChange={(event) => setState((prev) => ({ ...prev, sortBy: event.target.value }))}>
          <option value="newest">{t('projects.sortNewest', 'Newest first')}</option>
          <option value="title-asc">{t('projects.sortTitleAsc', 'Title A-Z')}</option>
          <option value="title-desc">{t('projects.sortTitleDesc', 'Title Z-A')}</option>
        </Select>
      </div>
    </Card>
  );
}

export function ProjectsPageToolbar({ visibleCount, onRefresh, t }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs tracking-[0.18em] text-zinc-500">{visibleCount} {t('projects.countLabel', 'VIDEO(S)')}</p>
      <Button type="button" variant="subtle" onClick={onRefresh}>{t('projects.refresh', 'REFRESH')}</Button>
    </div>
  );
}
