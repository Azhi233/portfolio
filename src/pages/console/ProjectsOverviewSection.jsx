import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import MediaFrame from '../../components/MediaFrame.jsx';

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

function StarIcon({ filled = false }) {
  return filled ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current text-[#8a6a2b]">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2 text-zinc-400">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function ProjectTableRow({ item, index, onEdit, onToggleFeatured, onDelete }) {
  return (
    <tr className="border-b border-white/10 text-sm text-white last:border-b-0">
      <td className="w-14 py-3 pr-3 text-[11px] text-white/60">{String(index + 1).padStart(2, '0')}</td>
      <td className="py-3 pr-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-[0.02em] text-white">{item.title}</p>
          <p className="mt-1 truncate text-[11px] text-white/60">{item.category || 'Uncategorized'}</p>
        </div>
      </td>
      <td className="w-28 py-3 pr-3 text-white/75">{item.isVisible === false ? 'Hidden' : 'Live'}</td>
      <td className="w-24 py-3 pr-3">
        <button type="button" onClick={() => onToggleFeatured(item)} className="inline-flex items-center justify-center text-white transition hover:opacity-70" aria-label={item.isFeatured ? 'Unfeature project' : 'Feature project'}>
          <StarIcon filled={Boolean(item.isFeatured)} />
        </button>
      </td>
      <td className="w-24 py-3 pr-3">
        <button type="button" onClick={() => onEdit(item)} className="inline-flex items-center justify-center text-white transition hover:opacity-70" aria-label="Edit project">
          <EditIcon />
        </button>
      </td>
      <td className="w-24 py-3 text-right">
        <button type="button" onClick={() => onDelete(item.id)} className="inline-flex items-center justify-center text-white transition hover:opacity-70" aria-label="Delete project">
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}

function FeaturedQueuePanel({ featuredVideos, onReorderFeatured }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Featured Queue</p>
          <h3 className="mt-2 text-lg font-medium tracking-[0.04em] text-white">首页精选顺序</h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/75">拖拽调整精选顺序。</p>
        </div>
        <Badge tone="warning">DRAG TO REORDER</Badge>
      </div>

      {featuredVideos.length > 0 ? (
        <div className="grid gap-2">
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
              className="flex cursor-grab items-center justify-between gap-3 border-b border-white/10 py-3 pr-2 last:border-b-0 active:cursor-grabbing"
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">#{index + 1}</p>
                <p className="mt-1 truncate text-sm tracking-[0.04em] text-zinc-900">{item.title}</p>
              </div>
              <Badge tone="warning">FEATURED</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No featured projects yet.</p>
      )}
    </div>
  );
}

function ProjectFilterPanel({ query, category, onQueryChange, onCategoryChange, loading, notice, noticeTone, error, deleting, deleteStatus }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Search</p>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="Search title, description, category..." />
        </label>
        <label className="block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Category</p>
          <input value={category} onChange={(event) => onCategoryChange(event.target.value)} className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="all" />
        </label>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        {loading ? <p className="text-white/70">Loading projects...</p> : null}
        {notice ? <p className={noticeTone === 'danger' ? 'text-rose-300' : 'text-emerald-300'}>{notice}</p> : null}
        {error ? <p className="text-rose-300">{error}</p> : null}
        {deleting ? <p className="text-white/70">{deleteStatus || 'Deleting project...'}</p> : null}
        {!deleting && deleteStatus ? <p className="text-emerald-300">{deleteStatus}</p> : null}
      </div>
    </div>
  );
}

function ProjectTable({ filtered, onEdit, onToggleFeatured, onDelete }) {
  return (
    <div className="overflow-hidden border-b border-white/10">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            <th className="w-16 py-3 pr-3 font-normal">#</th>
            <th className="py-3 pr-4 font-normal">Project</th>
            <th className="w-32 py-3 pr-3 font-normal">Status</th>
            <th className="w-28 py-3 pr-3 font-normal">Featured</th>
            <th className="w-28 py-3 pr-3 font-normal">Edit</th>
            <th className="w-28 py-3 text-right font-normal">Delete</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-6 text-sm text-zinc-600">No matching projects.</td>
            </tr>
          ) : filtered.slice(0, 12).map((item, index) => (
            <ProjectTableRow key={item.id} item={item} index={index} onEdit={onEdit} onToggleFeatured={onToggleFeatured} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProjectsOverviewSection({ liveCount, featuredVideos, onRefresh, onUpload, query, category, onQueryChange, onCategoryChange, loading, notice, noticeTone, error, deleting, deleteStatus, filtered, onEdit, onToggleFeatured, onDelete, onReorderFeatured }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.32em] text-zinc-500">Editorial Projects</p>
          <h2 className="mt-3 text-3xl font-medium tracking-[0.08em] text-zinc-900 md:text-4xl">Projects</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">这里集中管理项目、精选状态和首页展示顺序。精选项目会出现在首页作品区。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="success">{liveCount} LIVE</Badge>
          <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
          <Button type="button" variant="primary" onClick={onUpload}>UPLOAD</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <FeaturedQueuePanel featuredVideos={featuredVideos} onReorderFeatured={onReorderFeatured} />
        <ProjectFilterPanel query={query} category={category} onQueryChange={onQueryChange} onCategoryChange={onCategoryChange} loading={loading} notice={notice} noticeTone={noticeTone} error={error} deleting={deleting} deleteStatus={deleteStatus} />
      </div>

      <ProjectTable filtered={filtered} onEdit={onEdit} onToggleFeatured={onToggleFeatured} onDelete={onDelete} />
    </section>
  );
}
