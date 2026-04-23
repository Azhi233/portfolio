export function normalizeProjectList(response) {
  return Array.isArray(response) ? response : response?.items || response?.projects || response?.data || [];
}

export function filterFeaturedHomeItems(list) {
  return list.filter((item) => {
    const isFeatured = Boolean(item?.isFeatured);
    const isNotPrivate = String(item?.visibility || '').toLowerCase() !== 'private';
    const onHome = Array.isArray(item?.displayOn) ? item.displayOn.includes('home') : true;
    return isFeatured && isNotPrivate && onHome;
  });
}

export function splitFeaturedByMediaType(items) {
  return {
    featuredImages: items.filter((item) => String(item.mediaType || item.kind || '').toLowerCase() === 'image'),
    featuredVideos: items.filter((item) => String(item.mediaType || item.kind || '').toLowerCase() === 'video'),
  };
}
