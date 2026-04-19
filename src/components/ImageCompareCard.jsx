import { Check, ScanLine } from 'lucide-react';
import { useMemo } from 'react';
import EditableMedia from './EditableMedia.jsx';
import { canCompareAsset, getCoverSource, getImageVariantKeys } from './imageCompareUtils.js';

function ImageCompareCard({
  asset,
  className = '',
  onOpen,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const variants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};

  const variantKeys = useMemo(() => getImageVariantKeys(variants), [variants]);

  const coverSrc = getCoverSource(asset);
  const canCompare = canCompareAsset(asset, variantKeys);

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.(asset);
      return;
    }
    onOpen?.(asset);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleClick();
      }}
      className={`group relative block overflow-hidden rounded-2xl border bg-black/35 text-left outline-none ${
        isSelected ? 'border-emerald-300/80 ring-2 ring-emerald-400/40' : 'border-white/10'
      } ${className}`}
    >
      {coverSrc ? (
        <EditableMedia
          type="image"
          src={coverSrc}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onChange={(nextUrl) => {
            if (asset?.id && typeof window !== 'undefined') {
              window.localStorage.setItem(`asset.url.override.${asset.id}`, nextUrl);
            }
            onToggleSelect?.({ ...(asset || {}), url: nextUrl });
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.12em] text-zinc-500">NO IMAGE SOURCE</div>
      )}

      {canCompare ? (
        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-cyan-300/60 bg-cyan-300/15 px-2 py-1 text-[10px] tracking-[0.12em] text-cyan-100">
          <ScanLine className="h-3 w-3" />
          对比
        </div>
      ) : null}

      {isSelectionMode ? (
        <>
          <div className={`absolute inset-0 bg-black/35 transition ${isSelected ? 'opacity-100' : 'opacity-80'}`} />
          <div
            className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
              isSelected
                ? 'border-emerald-300 bg-emerald-300/20 text-emerald-200'
                : 'border-zinc-300/60 bg-zinc-900/70 text-zinc-200'
            }`}
          >
            {isSelected ? <Check className="h-4 w-4" /> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ImageCompareCard;
