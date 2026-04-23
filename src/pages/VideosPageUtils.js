export function normalizeVideoItem(item, index) {
  const videoUrl = String(
    item?.mainVideoUrl ||
      item?.videoUrl ||
      item?.url ||
      item?.src ||
      item?.video ||
      item?.mediaUrl ||
      item?.coverUrl ||
      item?.coverAssetUrl ||
      item?.thumbnailUrl ||
      item?.posterUrl ||
      ''
  ).trim();

  const coverUrl = String(item?.coverUrl || item?.coverAssetUrl || item?.thumbnailUrl || item?.posterUrl || '').trim();
  if (!videoUrl && !coverUrl) return null;

  return {
    id: item?.id || `video-${index + 1}`,
    title: item?.title || item?.name || `Video ${String(index + 1).padStart(2, '0')}`,
    url: videoUrl || coverUrl,
    coverUrl,
    isFeatured: Boolean(item?.isFeatured),
  };
}

export function filterVideoProjects(list) {
  return list.filter((item) => {
    const displayOn = Array.isArray(item?.displayOn) ? item.displayOn : [];
    const mediaType = String(item?.mediaType || item?.kind || '').toLowerCase();
    return (displayOn.length ? displayOn.includes('videos') : true) && (mediaType ? mediaType === 'video' : true);
  });
}
