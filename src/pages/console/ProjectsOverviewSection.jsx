import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';

function getMosaicSpan(index) {
  const pattern = [
    'sm:col-span-2 sm:row-span-2',
    'sm:col-span-1 sm:row-span-1',
    'sm:col-span-1 sm:row-span-1',
    'sm:col-span-1 sm:row-span-1',
    'sm:col-span-2 sm:row-span-1',
    'sm:col-span-1 sm:row-span-1',
  ];

  return pattern[index % pattern.length];
}

function ProjectMosaicCard({ item, index, onEdit, onToggleFeatured, onDelete }) {
  const isCompact = index % 6 === 1 || index % 6 === 2 || index % 6 === 3 || index % 6 === 5;

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#f4efe4] text-zinc-900 shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.18)] ${getMosaicSpan(index)} min-h-[240px]`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className={`relative h-full ${isCompact ? 'grid grid-rows-[1fr_auto]' : 'grid grid-rows-[minmax(180px,1fr)_auto]'}`}>
        <div className="relative overflow-hidden bg-[#e8dfd0]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.55),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.32),transparent_22%)]" />
          {item.coverImage || item.image || item.thumbnail ? (
            <img
              src={item.coverImage || item.image || item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Portfolio</p>
                <h3 className="mt-3 text-2xl font-medium tracking-[0.02em] text-zinc-900">{item.title}</h3>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-black/5 bg-[#f4efe4] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{item.category || 'Uncategorized'}</p>
            <h3 className="mt-2 truncate text-lg font-medium tracking-[0.02em] text-zinc-900">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{item.description || 'No description yet.'}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge tone={item.isVisible === false ? 'danger' : 'success'}>{item.isVisible === false ? 'HIDDEN' : 'LIVE'}</Badge>
            {item.isFeatured ? <Badge tone="warning">FEATURED</Badge> : null}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex translate-y-4 items-center justify-between gap-2 border-t border-black/5 bg-[#f4efe4]/96 px-4 py-3 opacity-0 backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:px-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{String(index + 1).padStart(2, '0')}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="subtle" onClick={() => onEdit(item)}>VIEW</Button>
          <Button type="button" variant={item.isFeatured ? 'subtle' : 'primary'} onClick={() => onToggleFeatured(item)}>
            {item.isFeatured ? 'UNFEATURE' : 'FEATURE'}
          </Button>
          <Button type="button" variant="danger" onClick={() => onDelete(item.id)}>DEL</Button>
        </div>
      </div>
    </article>
  );
}

export default function ProjectsOverviewSection({
  liveCount,
  featuredVideos,
  onRefresh,
  onUpload,
  query,
  category,
  onQueryChange,
  onCategoryChange,
  loading,
  notice,
  noticeTone,
  error,
  deleting,
  deleteStatus,
  filtered,
  onEdit,
  onToggleFeatured,
  onDelete,
  onReorderFeatured,
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/10 bg-[#f4efe4] px-5 py-5 text-zinc-900 md:px-8 md:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.32em] text-zinc-500">Editorial Projects</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[0.08em] text-zinc-900 md:text-4xl">Projects</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">
              参考你给的那种杂志式 / 作品集式版式，主视觉大图 + 不规则网格，让项目更像精选作品展示。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="success">{liveCount} LIVE</Badge>
            <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
            <Button type="button" variant="primary" onClick={onUpload}>UPLOAD</Button>
          </div>
        </div>
      </div>

      <div className="bg-[#f4efe4] px-5 pb-5 md:px-8 md:pb-8">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.9rem] border border-black/5 bg-[#e6dccb] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Featured Videos</p>
                <h3 className="mt-2 text-lg font-medium tracking-[0.04em] text-zinc-900">精选视频模块</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600">
                  把视频内容放进这个编辑区，支持拖拽排序，页面会优先展示排在前面的内容。
                </p>
              </div>
              <Badge tone="warning">DRAG TO REORDER</Badge>
            </div>

            {featuredVideos.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {featuredVideos.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(item.id));
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = event.dataTransfer.getData('text/plain');
                      if (!sourceId || sourceId === String(item.id)) return;
                      const currentIds = featuredVideos.map((video) => String(video.id));
                      const sourceIndex = currentIds.indexOf(String(sourceId));
                      const targetIndex = currentIds.indexOf(String(item.id));
                      if (sourceIndex === -1 || targetIndex === -1) return;
                      const nextIds = [...currentIds];
                      const [moved] = nextIds.splice(sourceIndex, 1);
                      nextIds.splice(targetIndex, 0, moved);
                      onReorderFeatured(nextIds);
                    }}
                    className="flex cursor-grab items-center justify-between gap-3 rounded-[1.4rem] border border-black/5 bg-[#f7f2e7] px-4 py-3 active:cursor-grabbing"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">#{index + 1}</p>
                      <p className="mt-1 truncate text-sm tracking-[0.04em] text-zinc-900">{item.title}</p>
                    </div>
                    <Badge tone="warning">DRAG</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-600">No featured videos yet.</p>
            )}
          </div>

          <div className="space-y-4 rounded-[1.9rem] border border-black/5 bg-[#e6dccb] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <label className="block">
              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Search</p>
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f2e7] px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-black/25"
                placeholder="Search title, description, category..."
              />
            </label>
            <label className="block">
              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Category</p>
              <input
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f2e7] px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-black/25"
                placeholder="all"
              />
            </label>

            {loading ? <p className="text-sm text-zinc-600">Loading projects...</p> : null}
            {notice ? (
              <p className={`rounded-2xl border px-4 py-3 text-sm ${noticeTone === 'danger' ? 'border-rose-300/50 bg-rose-100 text-rose-900' : 'border-emerald-300/50 bg-emerald-100 text-emerald-900'}`}>
                {notice}
              </p>
            ) : null}
            {error ? <p className="rounded-2xl border border-rose-300/50 bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p> : null}
            {deleting ? <p className="text-sm text-zinc-600">{deleteStatus || 'Deleting project...'}</p> : null}
            {!deleting && deleteStatus ? <p className="text-sm text-emerald-800">{deleteStatus}</p> : null}
          </div>
        </div>
      </div>

      <div className="bg-[#f4efe4] px-5 pb-6 md:px-8 md:pb-8">
        {filtered.length === 0 ? <p className="mb-4 text-sm text-zinc-600">No matching projects.</p> : null}
        <div className="grid auto-rows-[180px] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, 12).map((item, index) => (
            <ProjectMosaicCard
              key={item.id}
              item={item}
              index={index}
              onEdit={onEdit}
              onToggleFeatured={onToggleFeatured}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
