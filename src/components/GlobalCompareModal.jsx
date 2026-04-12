import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const VARIANT_ORDER = ['raw', 'graded', 'styled'];
const VARIANT_LABELS = {
  raw: 'RAW',
  graded: 'GRADED',
  styled: 'STYLED',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getVariantKeys(asset) {
  const variants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};
  const known = VARIANT_ORDER.filter((key) => typeof variants[key] === 'string' && variants[key].trim());
  const extra = Object.keys(variants).filter(
    (key) => !known.includes(key) && typeof variants[key] === 'string' && variants[key].trim(),
  );
  return [...known, ...extra];
}

function pickDefaultKey(asset, keys) {
  const variants = asset?.variants || {};
  if (keys.includes('graded') && variants.graded) return 'graded';
  if (keys.includes('raw') && variants.raw) return 'raw';
  if (keys.includes('styled') && variants.styled) return 'styled';
  return keys[0] || 'default';
}

function GlobalCompareModal({ isOpen, asset, onClose }) {
  const variantKeys = useMemo(() => getVariantKeys(asset), [asset]);
  const defaultKey = useMemo(() => pickDefaultKey(asset, variantKeys), [asset, variantKeys]);
  const [activeKey, setActiveKey] = useState(defaultKey);
  const [slider, setSlider] = useState(50);
  const canvasRef = useRef(null);

  const variants = asset?.variants || {};
  const baseUrl = asset?.url || variants.graded || variants.raw || variants.styled || '';
  const activeSrc = variants[activeKey] || baseUrl;
  const compareKey = variantKeys.find((key) => key !== activeKey) || null;
  const compareSrc = compareKey ? variants[compareKey] : '';
  const hasCompare = Boolean(compareSrc && compareSrc !== activeSrc);

  useEffect(() => {
    if (!isOpen) return;
    setActiveKey(defaultKey);
    setSlider(50);
  }, [isOpen, defaultKey]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && variantKeys.length > 1) {
        const currentIndex = variantKeys.indexOf(activeKey);
        if (currentIndex === -1) return;
        const nextIndex =
          event.key === 'ArrowRight'
            ? (currentIndex + 1) % variantKeys.length
            : (currentIndex - 1 + variantKeys.length) % variantKeys.length;
        setActiveKey(variantKeys[nextIndex]);
        setSlider(50);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, variantKeys, activeKey]);

  const updateSliderFromPointer = (clientX) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setSlider(clamp(ratio, 0, 100));
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-[120] bg-black/95"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 z-20 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 transition hover:border-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex h-full w-full items-center justify-center p-6 pt-16">
            <div
              ref={canvasRef}
              className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black"
              onPointerMove={(event) => {
                if (!hasCompare || event.buttons !== 1) return;
                updateSliderFromPointer(event.clientX);
              }}
              onTouchMove={(event) => {
                if (!hasCompare) return;
                const touch = event.touches?.[0];
                if (!touch) return;
                updateSliderFromPointer(touch.clientX);
              }}
            >
              {activeSrc ? (
                <>
                  <img src={activeSrc} alt={asset?.title || 'asset'} className="h-full w-full object-contain" />

                  {hasCompare ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                      >
                        <img src={compareSrc} alt="comparison" className="h-full w-full object-contain" />
                      </div>
                      <div
                        className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/80"
                        style={{ left: `${slider}%` }}
                      >
                        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-black/60 shadow-[0_0_20px_rgba(255,255,255,0.25)]" />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={slider}
                        onChange={(event) => setSlider(Number(event.target.value))}
                        className="absolute inset-x-10 bottom-6 z-10 accent-white"
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm tracking-[0.12em] text-zinc-500">
                  NO IMAGE SOURCE
                </div>
              )}
            </div>
          </div>

          {variantKeys.length > 0 ? (
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 p-1.5">
              {variantKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveKey(key);
                    setSlider(50);
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.14em] transition ${
                    activeKey === key
                      ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-200'
                      : 'border-zinc-600 bg-zinc-900 text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {VARIANT_LABELS[key] || key.toUpperCase()}
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default GlobalCompareModal;
