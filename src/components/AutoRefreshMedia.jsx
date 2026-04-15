import { useEffect, useMemo, useState } from 'react';
import { isSignedUrl, refreshSignedUrl, shouldRefreshUrl } from '../utils/signedMedia.js';

function resolveValue(value) {
  if (!value) return { url: '', path: '' };
  if (typeof value === 'string') return { url: value, path: '' };
  return {
    url: value.url || value.src || '',
    path: value.path || value.objectPath || value.key || '',
  };
}

export default function AutoRefreshMedia({ src, fallbackSrc = '', alt = '', className = '', as = 'img', ...props }) {
  const resolved = useMemo(() => resolveValue(src), [src]);
  const [currentUrl, setCurrentUrl] = useState(resolved.url || fallbackSrc);
  const [currentPath, setCurrentPath] = useState(resolved.path || '');

  useEffect(() => {
    setCurrentUrl(resolved.url || fallbackSrc);
    setCurrentPath(resolved.path || '');
  }, [resolved.url, resolved.path, fallbackSrc]);

  useEffect(() => {
    if (!currentUrl || !isSignedUrl(currentUrl)) return undefined;
    if (!currentPath) return undefined;
    if (!shouldRefreshUrl(currentUrl)) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const nextUrl = await refreshSignedUrl(currentPath);
        if (!cancelled && nextUrl) setCurrentUrl(nextUrl);
      } catch {
        // keep current URL; next visibility change or render can retry
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentUrl, currentPath]);

  if (as === 'video') {
    return <video {...props} src={currentUrl} className={className} />;
  }

  return <img {...props} src={currentUrl} alt={alt} className={className} />;
}
