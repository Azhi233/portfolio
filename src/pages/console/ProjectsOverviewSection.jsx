import { useCallback, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { FeaturedQueueModal, ProjectListModal } from './ProjectsOverviewDialogs.jsx';

export default function ProjectsOverviewSection({ liveCount, featuredVideos, onRefresh, onUpload, filtered, onEdit, onToggleFeatured, onDelete, onReorderFeatured }) {
  const [listOpen, setListOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState([]);
  const [listQuery, setListQuery] = useState('');
  const [listCategory, setListCategory] = useState('');
  const [listType, setListType] = useState('all');

  const modalItems = useMemo(() => {
    const queryValue = String(listQuery || '').trim().toLowerCase();
    const categoryValue = String(listCategory || '').trim().toLowerCase();

    return filtered.filter((item) => {
      const matchesQuery = !queryValue || [item.title, item.category].filter(Boolean).some((value) => String(value).toLowerCase().includes(queryValue));
      const kind = String(item.mediaType || item.kind || (item.videoUrl || item.mainVideoUrl ? 'video' : 'image')).toLowerCase();
      const matchesType = listType === 'all' || kind === listType;
      const matchesCategory = !categoryValue || String(item.category || '').toLowerCase().includes(categoryValue);
      return matchesQuery && matchesType && matchesCategory;
    });
  }, [filtered, listQuery, listCategory, listType]);

  const closeList = useCallback(() => setListOpen(false), []);
  const openList = useCallback(() => setListOpen(true), []);
  const closeQueue = useCallback(() => setQueueOpen(false), []);
  const openQueue = useCallback(() => setQueueOpen(true), []);

  const toggleFeaturedSelection = useCallback((id) => {
    const key = String(id);
    setSelectedFeaturedIds((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }, []);

  const moveSelection = useCallback((direction) => {
    const current = featuredVideos.map((item) => String(item.id));
    const selected = selectedFeaturedIds.filter((id) => current.includes(id));
    if (selected.length === 0) return;

    let next = [...current];
    if (direction === 'up') {
      for (const id of selected) {
        const index = next.indexOf(id);
        if (index > 0) {
          const [moved] = next.splice(index, 1);
          next.splice(index - 1, 0, moved);
        }
      }
    } else if (direction === 'down') {
      for (let i = selected.length - 1; i >= 0; i -= 1) {
        const id = selected[i];
        const index = next.indexOf(id);
        if (index !== -1 && index < next.length - 1) {
          const [moved] = next.splice(index, 1);
          next.splice(index + 1, 0, moved);
        }
      }
    } else if (direction === 'top') {
      next = [...next.filter((id) => !selected.includes(id)), ...selected];
    }

    onReorderFeatured(next);
  }, [featuredVideos, onReorderFeatured, selectedFeaturedIds]);

  const handleMoveSelectionUp = useCallback(() => moveSelection('up'), [moveSelection]);
  const handleMoveSelectionDown = useCallback(() => moveSelection('down'), [moveSelection]);
  const handleMoveSelectionTop = useCallback(() => moveSelection('top'), [moveSelection]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">PROJECTS</p>
          <h2 className="mt-2 text-2xl tracking-[0.08em] text-white">Project Modules</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">管理首页精选、项目列表和上传入口。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="success">{liveCount} LIVE</Badge>
          <Button type="button" variant="subtle" onClick={onRefresh}>REFRESH</Button>
          <Button type="button" variant="primary" onClick={onUpload}>UPLOAD</Button>
          <Button type="button" variant="subtle" onClick={openQueue}>OPEN FEATURED QUEUE</Button>
          <Button type="button" variant="subtle" onClick={openList}>OPEN PROJECT LIST</Button>
        </div>
      </div>

      <FeaturedQueueModal open={queueOpen} featuredVideos={featuredVideos} selectedIds={selectedFeaturedIds} onClose={closeQueue} onToggleSelect={toggleFeaturedSelection} onMoveSelectionUp={handleMoveSelectionUp} onMoveSelectionDown={handleMoveSelectionDown} onMoveSelectionTop={handleMoveSelectionTop} />

      <ProjectListModal open={listOpen} items={modalItems} onClose={closeList} onEdit={onEdit} onToggleFeatured={onToggleFeatured} onDelete={onDelete} />
    </section>
  );
}
