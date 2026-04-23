export function normalizeImageItem(item, index) {
  if (!item) return null;

  const url = String(item.coverUrl || item.coverAssetUrl || item.thumbnailUrl || item.mainImageUrl || item.imageUrl || item.url || '').trim();
  if (!url) return null;

  return {
    id: item.id || `image-${index + 1}`,
    url,
    title: item.title || item.name || item.subtitle || `Image ${String(index + 1).padStart(2, '0')}`,
    size: item.size === 'wide' || item.aspectRatio === '16:9' ? 'wide' : index % 3 === 1 ? 'wide' : 'tall',
  };
}

export function parseImageSources(rawValue) {
  const source = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split('\n');
  return source
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((value, index) => {
      try {
        const parsed = JSON.parse(value);
        const url = typeof parsed === 'string' ? parsed : parsed?.url || parsed?.src || parsed?.imageUrl || '';
        if (url) {
          return {
            id: parsed?.id || `featured-${index + 1}`,
            url,
            title: parsed?.title || parsed?.name || `Featured ${String(index + 1).padStart(2, '0')}`,
            size: parsed?.size === 'wide' ? 'wide' : 'tall',
          };
        }
      } catch {
        // continue with plain string parsing
      }

      const [url, title, size] = value.split('|').map((part) => part.trim());
      return {
        id: `featured-${index + 1}`,
        url,
        title: title || `Featured ${String(index + 1).padStart(2, '0')}`,
        size: size === 'wide' ? 'wide' : 'tall',
      };
    })
    .filter((image) => Boolean(image.url));
}
