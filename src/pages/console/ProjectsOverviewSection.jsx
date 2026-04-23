import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';

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
    <Card className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">MODULE</p>
          <h2 className="mt-2 text-xl tracking-[0.08em] text-white">Projects</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-400">项目列表、公开状态与基础统计。</p>
        </div>
        <Badge tone="success">{liveCount} LIVE</Badge>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-zinc-500">FEATURED VIDEOS</p>
            <h3 className="mt-2 text-lg tracking-[0.08em] text-white">精选视频模块</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-400">在这里把视频单独加入精选区，视频页会优先展示这些条目。</p>
          </div>
          <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
        </div>

        {featuredVideos.length > 1 ? (
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
                className="flex cursor-grab items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 active:cursor-grabbing"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">#{index + 1}</p>
                  <p className="mt-1 text-sm tracking-[0.08em] text-white">{item.title}</p>
                </div>
                <Badge tone="warning">DRAG</Badge>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={onUpload}>UPLOAD</Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Search</p>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-white/25"
            placeholder="Search title, description, category..."
          />
        </label>
        <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
          <input
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-white/25"
            placeholder="all"
          />
        </label>
      </div>

      {loading ? <p className="mt-4 text-sm text-zinc-400">Loading projects...</p> : null}
      {notice ? (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${noticeTone === 'danger' ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'}`}>
          {notice}
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      {deleting ? <p className="mt-4 text-sm text-zinc-400">{deleteStatus || 'Deleting project...'}</p> : null}
      {!deleting && deleteStatus ? <p className="mt-4 text-sm text-emerald-300">{deleteStatus}</p> : null}

      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? <p className="text-sm text-zinc-500">No matching projects.</p> : null}
        {filtered.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-zinc-500">{item.category || 'Uncategorized'}</p>
                <p className="mt-2 text-sm tracking-[0.08em] text-white">{item.title}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone={item.isVisible === false ? 'danger' : 'success'}>{item.isVisible === false ? 'HIDDEN' : 'LIVE'}</Badge>
                {item.isFeatured ? <Badge tone="warning">FEATURED</Badge> : null}
              </div>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description || 'No description yet.'}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="subtle" onClick={() => onEdit(item)}>EDIT</Button>
              <Button type="button" variant={item.isFeatured ? 'subtle' : 'primary'} onClick={() => onToggleFeatured(item)}>
                {item.isFeatured ? 'REMOVE FROM FEATURED' : 'ADD TO FEATURED'}
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(item.id)}>DELETE</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
