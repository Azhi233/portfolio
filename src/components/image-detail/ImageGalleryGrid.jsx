import Card from '../Card.jsx';

function ImageTile({ item, index, onSelect, label }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-white/20 hover:bg-white/5"
    >
      <div className="aspect-[4/3] bg-black/40">
        <img src={item.url} alt={item.title || item.label || `Image ${index + 1}`} className="h-full w-full object-cover" />
      </div>
      <div className="p-3">
        <p className="text-sm text-zinc-200">{item.title || item.label || `${label} ${index + 1}`}</p>
      </div>
    </button>
  );
}

export default function ImageGalleryGrid({ items = [], onSelect = () => {}, label = 'Asset' }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <Card className="p-6 md:p-8">
      <p className="text-[11px] tracking-[0.24em] text-zinc-500">IMAGE / GALLERY</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item, index) => (
          <ImageTile key={item.id || `image-${index}`} item={item} index={index} onSelect={onSelect} label={label} />
        ))}
      </div>
    </Card>
  );
}
