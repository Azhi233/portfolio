function pickFirstString(...values) {
  return String(values.find((value) => String(value || '').trim()) || '').trim();
}

function maybeResolveLocalAsset(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  const localMinioMatch = value.match(/^https?:\/\/[^/]+:9000(\/.*)$/i);
  if (localMinioMatch) {
    return `${window.location.origin}${encodeURI(localMinioMatch[1])}`;
  }

  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('/api/')) return value;
  if (value.startsWith('/private-docs/') || value.startsWith('/public-assets/')) return value;
  if (value.startsWith('/')) return value;
  return value;
}

export function normalizeImageItem(item, index) {
  if (!item) return null;

  const url = maybeResolveLocalAsset(pickFirstString(
    item.coverUrl,
    item.cover_url,
    item.coverAssetUrl,
    item.cover_asset_url,
    item.thumbnailUrl,
    item.thumbnail_url,
    item.mainImageUrl,
    item.main_image_url,
    item.imageUrl,
    item.image_url,
    item.url,
  ));
  if (!url) return null;

  return {
    id: item.id || `image-${index + 1}`,
    url,
    title: item.title || item.name || item.subtitle || `Image ${String(index + 1).padStart(2, '0')}`,
    size: item.size === 'wide' || item.aspectRatio === '16:9' || item.aspect_ratio === '16:9' ? 'wide' : index % 3 === 1 ? 'wide' : 'tall',
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
