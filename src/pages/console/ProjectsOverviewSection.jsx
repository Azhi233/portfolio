import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
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
        <button type="button" onClick={() => onToggleFeatured(item)} className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/5 hover:opacity-80" aria-label={item.isFeatured ? 'Unfeature project' : 'Feature project'}>
          <StarIcon filled={Boolean(item.isFeatured)} />
        </button>
      </td>
      <td className="w-24 py-3 pr-3">
        <button type="button" onClick={() => onEdit(item)} className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/5 hover:opacity-80" aria-label="Edit project">
          <EditIcon />
        </button>
      </td>
      <td className="w-24 py-3 text-right">
        <button type="button" onClick={() => onDelete(item.id)} className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/5 hover:opacity-80" aria-label="Delete project">
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}

function ArrowIcon({ direction }) {
  return direction === 'up' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  ) : direction === 'down' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 5v14" />
      <path d="M7 10l5-5 5 5" />
      <path d="M7 19h10" />
    </svg>
  );
}

function FeaturedQueuePanel({ featuredVideos, selectedIds, onToggleSelect, onMoveSelectionUp, onMoveSelectionDown, onMoveSelectionTop }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Featured Queue</p>
          <h3 className="mt-2 text-lg font-medium tracking-[0.04em] text-white">首页精选顺序</h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/75">点击项目进行单选或多选，随后使用上方按钮调整顺序。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="subtle" onClick={onMoveSelectionUp}><ArrowIcon direction="up" /></Button>
          <Button type="button" variant="subtle" onClick={onMoveSelectionDown}><ArrowIcon direction="down" /></Button>
          <Button type="button" variant="subtle" onClick={onMoveSelectionTop}><ArrowIcon direction="top" /></Button>
        </div>
      </div>

      {featuredVideos.length > 0 ? (
        <div className="grid gap-2">
          {featuredVideos.map((item, index) => {
            const selected = selectedIds.includes(String(item.id));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleSelect(item.id)}
                className={`flex items-center justify-between gap-3 border-b border-white/10 py-3 pr-2 text-left last:border-b-0 transition ${selected ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">#{index + 1}</p>
                  <p className="mt-1 truncate text-sm tracking-[0.04em] text-white">{item.title}</p>
                </div>
                <Badge tone={selected ? 'success' : 'warning'}>{selected ? 'SELECTED' : 'FEATURED'}</Badge>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No featured projects yet.</p>
      )}
    </div>
  );
}

function ProjectFilterPanel({ query, category, typeFilter, onQueryChange, onCategoryChange, onTypeFilterChange, loading, notice, noticeTone, error, deleting, deleteStatus }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Search</p>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="Search title, description, category..." />
        </label>
        <div className="block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Type</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {[
              ['all', '全部'],
              ['video', '视频'],
              ['image', '图片'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => onTypeFilterChange(value)} className={`rounded-xl px-3 py-2 text-xs tracking-[0.12em] transition ${typeFilter === value ? 'bg-white text-black' : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">Category</p>
          <input value={category} onChange={(event) => onCategoryChange(event.target.value)} className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="all" />
        </label>
        <div className="flex items-end">
          <p className="text-xs tracking-[0.16em] text-zinc-500">Filter projects by name, category and media type.</p>
        </div>
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

function FeaturedQueueModal({ open, featuredVideos, onClose, onReorderFeatured }) {
  return (
    <Modal open={open} title="Featured Queue" onClose={onClose}>
      <div className="overflow-hidden border-b border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              <th className="w-16 py-3 pr-3 font-normal">#</th>
              <th className="py-3 pr-4 font-normal">Project</th>
              <th className="w-28 py-3 pr-3 font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {featuredVideos.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-6 text-sm text-zinc-600">No featured projects yet.</td>
              </tr>
            ) : featuredVideos.map((item, index) => (
              <tr key={item.id} className="border-b border-white/10 text-sm text-white last:border-b-0">
                <td className="w-14 py-3 pr-3 text-[11px] text-white/60">{String(index + 1).padStart(2, '0')}</td>
                <td className="py-3 pr-4">
                  <p className="truncate text-sm font-medium tracking-[0.02em] text-white">{item.title}</p>
                </td>
                <td className="w-28 py-3 pr-3">
                  <button type="button" className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/5 hover:opacity-80" aria-label="Drag to reorder">
                    <span className="text-[10px] tracking-[0.18em] text-zinc-400">DRAG</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function ProjectListModal({ open, items, onClose, onEdit, onToggleFeatured, onDelete, query, category, typeFilter, onQueryChange, onCategoryChange, onTypeFilterChange }) {
  return (
    <Modal open={open} title="Project List" onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
          {[
            ['all', '全部'],
            ['video', '视频'],
            ['image', '图片'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => onTypeFilterChange(value)} className={`rounded-xl px-3 py-2 text-xs tracking-[0.12em] transition ${typeFilter === value ? 'bg-white text-black' : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="min-w-[220px] flex-1 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="Search title, description, category..." />
        <input value={category} onChange={(event) => onCategoryChange(event.target.value)} className="min-w-[180px] border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40" placeholder="all" />
      </div>
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
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-sm text-zinc-600">No matching projects.</td>
              </tr>
            ) : items.map((item, index) => (
              <ProjectTableRow key={item.id} item={item} index={index} onEdit={onEdit} onToggleFeatured={onToggleFeatured} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function ProjectsOverviewSection({ liveCount, featuredVideos, onRefresh, onUpload, query, category, onQueryChange, onCategoryChange, loading, notice, noticeTone, error, deleting, deleteStatus, filtered, onEdit, onToggleFeatured, onDelete, onReorderFeatured }) {
  const [listOpen, setListOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState([]);
  const [listQuery, setListQuery] = useState('');
  const [listCategory, setListCategory] = useState('');
  const [listType, setListType] = useState('all');
  const modalItems = useMemo(() => filtered.filter((item) => {
    const q = String(listQuery || '').trim().toLowerCase();
    const matchesQuery = !q || [item.title, item.category].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    const kind = String(item.mediaType || item.kind || (item.videoUrl || item.mainVideoUrl ? 'video' : 'image')).toLowerCase();
    const matchesType = listType === 'all' || kind === listType;
    const matchesCategory = !String(listCategory || '').trim() || String(item.category || '').toLowerCase().includes(String(listCategory || '').trim().toLowerCase());
    return matchesQuery && matchesType && matchesCategory;
  }), [filtered, listQuery, listCategory, listType]);
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <Badge tone="success">{liveCount} LIVE</Badge>
        <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
        <Button type="button" variant="primary" onClick={onUpload}>UPLOAD</Button>
        <Button type="button" variant="subtle" onClick={() => setQueueOpen(true)}>OPEN FEATURED QUEUE</Button>
        <Button type="button" variant="subtle" onClick={() => setListOpen(true)}>OPEN PROJECT LIST</Button>
      </div>
      <FeaturedQueueModal
        open={queueOpen}
        featuredVideos={featuredVideos}
        selectedIds={selectedFeaturedIds}
        onClose={() => setQueueOpen(false)}
        onToggleSelect={(id) => setSelectedFeaturedIds((prev) => {
          const key = String(id);
          return prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
        })}
        onMoveSelectionUp={() => setSelectedFeaturedIds((prev) => {
          const ids = [...prev];
          const current = featuredVideos.map((item) => String(item.id));
          const selected = ids.filter((id) => current.includes(id));
          if (selected.length === 0) return prev;
          const next = [...current];
          for (const id of selected) {
            const index = next.indexOf(id);
            if (index > 0) {
              const [moved] = next.splice(index, 1);
              next.splice(index - 1, 0, moved);
            }
          }
          onReorderFeatured(next);
          return prev;
        })}
        onMoveSelectionDown={() => setSelectedFeaturedIds((prev) => {
          const current = featuredVideos.map((item) => String(item.id));
          const selected = prev.filter((id) => current.includes(id));
          if (selected.length === 0) return prev;
          const next = [...current];
          for (let i = selected.length - 1; i >= 0; i -= 1) {
            const id = selected[i];
            const index = next.indexOf(id);
            if (index !== -1 && index < next.length - 1) {
              const [moved] = next.splice(index, 1);
              next.splice(index + 1, 0, moved);
            }
          }
          onReorderFeatured(next);
          return prev;
        })}
        onMoveSelectionTop={() => setSelectedFeaturedIds((prev) => {
          const current = featuredVideos.map((item) => String(item.id));
          const selected = prev.filter((id) => current.includes(id));
          if (selected.length === 0) return prev;
          const next = [...current.filter((id) => !selected.includes(id)), ...selected];
          onReorderFeatured(next);
          return prev;
        })}
      />
      <ProjectListModal
        open={listOpen}
        items={modalItems}
        onClose={() => setListOpen(false)}
        onEdit={onEdit}
        onToggleFeatured={onToggleFeatured}
        onDelete={onDelete}
        query={listQuery}
        category={listCategory}
        typeFilter={listType}
        onQueryChange={setListQuery}
        onCategoryChange={setListCategory}
        onTypeFilterChange={setListType}
      />
    </section>
  );
}
