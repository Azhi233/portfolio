import { useEffect, useMemo, useState } from 'react';

const VARIANT_LABELS = {
  raw: 'RAW',
  graded: 'GRADED',
  styled: 'STYLED',
};

const VARIANT_ORDER = ['raw', 'graded', 'styled'];

function isValidUrl(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pickDefaultVariant(variants = {}, keys = []) {
  if (keys.includes('graded') && isValidUrl(variants.graded)) return 'graded';
  if (keys.includes('raw') && isValidUrl(variants.raw)) return 'raw';
  if (keys.includes('styled') && isValidUrl(variants.styled)) return 'styled';
  return keys[0] || null;
}

function ImageCompareCard({ asset, className = '' }) {
  const variants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};

  const variantKeys = useMemo(() => {
    const known = VARIANT_ORDER.filter((key) => isValidUrl(variants[key]));
    const extra = Object.keys(variants).filter((key) => !known.includes(key) && isValidUrl(variants[key]));
    return [...known, ...extra];
  }, [variants]);

  const fallbackUrl = asset?.url || variants.graded || variants.raw || variants.styled || '';
  const fallbackKey = variantKeys[0] || 'default';

  const [activeKey, setActiveKey] = useState(() => pickDefaultVariant(variants, variantKeys) || fallbackKey);
  const [slider, setSlider] = useState(50);

  useEffect(() => {
    const next = pickDefaultVariant(variants, variantKeys) || fallbackKey;
    setActiveKey(next);
    setSlider(50);
  }, [variants, variantKeys, fallbackKey]);

  const type = asset?.type;
  const hasComparisonByVariants = variantKeys.length >= 2;
  const isComparisonAsset = type === 'image-comparison' || hasComparisonByVariants;

  if (!isComparisonAsset || variantKeys.length <= 1) {
    const src = variantKeys[0] ? variants[variantKeys[0]] : fallbackUrl;
    return (
      <article className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 ${className}`}>
        {src ? (
          <img
            src={src}
            alt={asset?.title || 'image'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.12em] text-zinc-500">
            NO IMAGE SOURCE
          </div>
        )}
      </article>
    );
  }

  const activeSrc = variants[activeKey] || fallbackUrl;
  const compareCandidates = variantKeys.filter((key) => key !== activeKey);
  const compareKey = compareCandidates.includes('raw') ? 'raw' : compareCandidates[0];
  const compareSrc = variants[compareKey] || activeSrc;

  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 ${className}`}>
      <div className="relative h-full w-full">
        <img src={activeSrc} alt={`${asset?.title || 'asset'}-${activeKey}`} className="h-full w-full object-cover" />

        {compareSrc && compareSrc !== activeSrc ? (
          <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
            <img src={compareSrc} alt={`${asset?.title || 'asset'}-${compareKey}`} className="h-full w-full object-cover" />
          </div>
        ) : null}

        {compareSrc && compareSrc !== activeSrc ? (
          <>
            <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/80" style={{ left: `${slider}%` }} />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={slider}
              onChange={(event) => setSlider(Number(event.target.value))}
              className="absolute inset-x-3 bottom-14 z-10 accent-zinc-100"
              aria-label="Slide to compare variants"
            />
          </>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/80 to-transparent p-3">
        {variantKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveKey(key);
              setSlider(50);
            }}
            className={`rounded-full border px-2 py-1 text-[10px] tracking-[0.14em] transition ${
              activeKey === key
                ? 'border-zinc-200/80 bg-zinc-100/20 text-zinc-100'
                : 'border-zinc-500/80 bg-black/35 text-zinc-300 hover:border-zinc-300 hover:text-zinc-100'
            }`}
          >
            {VARIANT_LABELS[key] || key.toUpperCase()}
          </button>
        ))}
      </div>
    </article>
  );
}

export default ImageCompareCard;
