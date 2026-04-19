import { useMemo } from 'react';
import Card from '../Card.jsx';
import Badge from '../Badge.jsx';
import Button from '../Button.jsx';
import PaginationBar from '../PaginationBar.jsx';
import MediaPreview from '../MediaPreview.jsx';

const PAGE_SIZE = 6;

export default function ImageCategorySection({
  title,
  coverUrl = '',
  items = [],
  onOpen = () => {},
  t = (key, fallback) => fallback,
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('images.category', 'CATEGORY')}</p>
          <h3 className="text-xl tracking-[0.08em] text-white">{title}</h3>
        </div>
        <Badge tone="warning">{items.length}</Badge>
      </div>

      <Card className="overflow-hidden p-0">
        <button type="button" onClick={() => onOpen(items[0])} className="block w-full text-left">
          <div className="aspect-[16/9] bg-black/40">
            <MediaPreview src={coverUrl || items[0]?.coverUrl || items[0]?.thumbnailUrl || ''} title={title} kind="image" />
          </div>
          <div className="p-4">
            <p className="text-[11px] tracking-[0.18em] text-zinc-500">{t('images.groupCover', 'GROUP COVER')}</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{items[0]?.description || t('images.noDescription', 'No description yet.')}</p>
          </div>
        </button>
      </Card>
    </section>
  );
}
