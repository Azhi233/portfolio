import Card from '../Card.jsx';
import Badge from '../Badge.jsx';
import Button from '../Button.jsx';
import MediaPreview from '../MediaPreview.jsx';

export default function VideoGalleryGrid({ title, items = [], onSelect = () => {}, t = (key, fallback) => fallback }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-zinc-500">{t('videoDetail.galleryGroup', 'GROUP')}</p>
          <h3 className="mt-2 text-xl tracking-[0.08em] text-white">{title}</h3>
        </div>
        <Badge tone="warning">{items.length}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => {
          const src = String(item?.videoUrl || item?.mainVideoUrl || item?.url || '').trim();
          return (
            <Card key={item.id || `${title}-${index}`} className="overflow-hidden p-0">
              <button type="button" onClick={() => onSelect(item)} className="block w-full text-left">
                <div className="aspect-video bg-black/40">
                  <MediaPreview src={src} title={item.title || item.label || `Video ${index + 1}`} kind="video" autoPlay muted className="object-contain" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-zinc-200">{item.title || item.label || `Video ${index + 1}`}</p>
                  <p className="mt-2 text-xs text-zinc-500 break-all">{src}</p>
                </div>
              </button>
              <div className="px-4 pb-4">
                <Button type="button" variant="subtle" onClick={() => onSelect(item)}>
                  {t('videoDetail.openVideo', 'OPEN VIDEO')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
