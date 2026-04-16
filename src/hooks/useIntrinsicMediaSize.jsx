import { useCallback, useMemo, useState } from 'react';

function normalizeSize(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { width: w, height: h, aspectRatio: w / h };
}

export function useIntrinsicMediaSize(initialSize = null) {
  const [size, setSize] = useState(() => normalizeSize(initialSize?.width, initialSize?.height));

  const onImageLoad = useCallback((event) => {
    const target = event?.currentTarget;
    if (!target) return;
    const next = normalizeSize(target.naturalWidth, target.naturalHeight);
    if (next) setSize(next);
  }, []);

  const onVideoLoadedMetadata = useCallback((event) => {
    const target = event?.currentTarget;
    if (!target) return;
    const next = normalizeSize(target.videoWidth, target.videoHeight);
    if (next) setSize(next);
  }, []);

  return useMemo(
    () => ({
      size,
      aspectRatio: size?.aspectRatio || null,
      width: size?.width || null,
      height: size?.height || null,
      setSize,
      onImageLoad,
      onVideoLoadedMetadata,
    }),
    [size, onImageLoad, onVideoLoadedMetadata],
  );
}
