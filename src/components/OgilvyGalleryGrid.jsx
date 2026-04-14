import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const imageLikePattern = /\.(avif|webp|png|jpe?g|gif|svg)(\?.*)?$/i;

function isImageLike(url = '') {
  return /^https?:\/\//i.test(url) && imageLikePattern.test(url);
}

function getNumericRatio(item) {
  const direct = Number(item?.aspectRatio);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const width = Number(item?.width);
  const height = Number(item?.height);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return width / height;
  }

  return null;
}

function getAspectClass(item, index) {
  const hint = String(item?.orientation || item?.ratio || '').toLowerCase();
  const ratio = getNumericRatio(item);

  if (ratio) {
    if (ratio >= 1.35) return 'aspect-[16/10]';
    if (ratio <= 0.85) return 'aspect-[4/5]';
    return 'aspect-[4/3]';
  }

  if (hint.includes('portrait') || hint.includes('vertical') || hint === 'v') return 'aspect-[4/5]';
  if (hint.includes('landscape') || hint.includes('horizontal') || hint === 'h') return 'aspect-[16/10]';

  if (item?.span === 'wide') return 'aspect-[16/10]';
  if (item?.span === 'tall') return 'aspect-[4/5]';

  return index % 5 === 0 ? 'aspect-[4/5]' : index % 3 === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]';
}

function getPriorityClass(item, index) {
  const priority = Number(item?.priority ?? 0);
  if (item?.span === 'wide' || priority >= 90 || index === 0) return 'md:col-span-2 md:row-span-2';
  if (item?.span === 'tall' || priority >= 70) return 'md:row-span-2';
  if (item?.span === 'wide-soft' || priority >= 45) return 'md:col-span-2';
  return '';
}

function OgilvyGalleryGrid({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
        NO PORTFOLIO ITEMS FOUND.
      </div>
    );
  }

  return (
    <div className="columns-2 gap-1 md:columns-3 lg:columns-4">
      {items.map((item, index) => {
        const hasCover = isImageLike(item.coverUrl);
        const aspectClass = getAspectClass(item, index);
        const priorityClass = getPriorityClass(item, index);

        return (
          <Link
            key={item.id}
            to={item.to || '/'}
            className={`group mb-1 block break-inside-avoid overflow-hidden bg-zinc-900 ${priorityClass}`}
            aria-label={`${item.title} case study`}
          >
            <div className={`relative w-full overflow-hidden ${aspectClass}`}>
              {hasCover ? (
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 px-4 text-center text-xs tracking-[0.16em] text-zinc-300">
                  PREVIEW COMING SOON
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent md:hidden" />
              <div className="absolute inset-0 hidden bg-slate-900/95 transition-opacity duration-300 md:block md:opacity-0 md:group-hover:opacity-100" />

              <motion.div
                className="absolute inset-x-0 bottom-0 p-3 text-white md:p-4"
                initial={false}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="md:hidden">
                  <p className="text-[11px] tracking-[0.12em] text-white/85">{item.category?.toUpperCase()}</p>
                  <p className="mt-1 text-sm font-medium leading-tight">{item.title}</p>
                </div>

                <div className="hidden translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
                  <p className="text-[11px] tracking-[0.14em] text-white/80">{item.category?.toUpperCase()}</p>
                  <h3 className="mt-1 text-base font-medium leading-tight">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/75">{item.tagline}</p>
                </div>
              </motion.div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default OgilvyGalleryGrid;
