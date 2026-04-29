import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';

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

const projectRowActionClass = 'inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/5 hover:opacity-80';

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
        <button type="button" onClick={() => onToggleFeatured(item)} className={projectRowActionClass} aria-label={item.isFeatured ? 'Unfeature project' : 'Feature project'}>
          <StarIcon filled={Boolean(item.isFeatured)} />
        </button>
      </td>
      <td className="w-24 py-3 pr-3">
        <button type="button" onClick={() => onEdit(item)} className={projectRowActionClass} aria-label="Edit project">
          <EditIcon />
        </button>
      </td>
      <td className="w-24 py-3 text-right">
        <button type="button" onClick={() => onDelete(item.id)} className={projectRowActionClass} aria-label="Delete project">
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}

export function ProjectListModal({ open, items, onClose, onEdit, onToggleFeatured, onDelete, query, category, typeFilter, onQueryChange, onCategoryChange, onTypeFilterChange }) {
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
            ) : (
              items.map((item, index) => <ProjectTableRow key={item.id} item={item} index={index} onEdit={onEdit} onToggleFeatured={onToggleFeatured} onDelete={onDelete} />)
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export function FeaturedQueueModal({ open, featuredVideos, selectedIds, onClose, onToggleSelect, onMoveSelectionUp, onMoveSelectionDown, onMoveSelectionTop }) {
  const hasSelection = selectedIds.length > 0;

  return (
    <Modal open={open} title="Featured Queue" onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs tracking-[0.16em] text-zinc-400">{hasSelection ? `${selectedIds.length} SELECTED` : 'SELECT ITEMS THEN REORDER'}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="subtle" disabled={!hasSelection} onClick={onMoveSelectionUp}><ArrowIcon direction="up" /></Button>
          <Button type="button" variant="subtle" disabled={!hasSelection} onClick={onMoveSelectionDown}><ArrowIcon direction="down" /></Button>
          <Button type="button" variant="subtle" disabled={!hasSelection} onClick={onMoveSelectionTop}><ArrowIcon direction="top" /></Button>
        </div>
      </div>
      <div className="overflow-hidden border-b border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              <th className="w-16 py-3 pr-3 font-normal">#</th>
              <th className="py-3 pr-4 font-normal">Project</th>
              <th className="w-28 py-3 pr-3 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {featuredVideos.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-6 text-sm text-zinc-600">No featured projects yet.</td>
              </tr>
            ) : (
              featuredVideos.map((item, index) => {
                const selected = selectedIds.includes(String(item.id));
                return (
                  <tr key={item.id} className={`border-b border-white/10 text-sm text-white last:border-b-0 ${selected ? 'bg-white/5' : ''}`}>
                    <td className="w-14 py-3 pr-3 text-[11px] text-white/60">{String(index + 1).padStart(2, '0')}</td>
                    <td className="py-3 pr-4"><p className="truncate text-sm font-medium tracking-[0.02em] text-white">{item.title}</p></td>
                    <td className="w-28 py-3 pr-3 text-right">
                      <button type="button" onClick={() => onToggleSelect(item.id)} className={projectRowActionClass} aria-label={selected ? 'Unselect featured project' : 'Select featured project'}>
                        <span className="text-[10px] tracking-[0.18em] text-zinc-400">{selected ? 'SEL' : 'ADD'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
