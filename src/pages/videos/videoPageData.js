export const placeholderVideos = [
  {
    id: 'doma-home',
    title: 'Doma Home',
    description:
      'A clean editorial layout with a cinematic player area, understated typography, and generous white space inspired by Peter Belanger’s portfolio pacing.',
    category: 'Commercial',
    year: '2026',
    aspectRatio: 'video',
    poster: 'https://picsum.photos/seed/peter-belanger-video-1/1600/900',
  },
  {
    id: 'fellow-clyde-kettle',
    title: 'Fellow Clyde Electric Kettle',
    description:
      'Minimal visual structure with alternating text and media blocks to emulate the rhythm of a refined portfolio video case study.',
    category: 'Product',
    year: '2026',
    aspectRatio: 'portrait',
    poster: 'https://picsum.photos/seed/peter-belanger-video-2/1200/1500',
  },
  {
    id: 'studio-notes',
    title: 'Studio Notes',
    description:
      'A restrained narrative layout that lets motion breathe, while keeping the interface calm, spacious, and image-first.',
    category: 'Editorial',
    year: '2025',
    aspectRatio: 'wide',
    poster: 'https://picsum.photos/seed/peter-belanger-video-3/1800/1080',
  },
];

export function normalizeVideoItem(item, index = 0) {
  const videoUrl = String(item?.videoUrl || item?.mainVideoUrl || item?.url || item?.src || '').trim();
  const poster = String(item?.posterUrl || item?.thumbnailUrl || item?.coverUrl || item?.previewUrl || '').trim();
  const fallbackTitle = `Video ${String(index + 1).padStart(2, '0')}`;

  return {
    id: item?.id || `video-${index + 1}`,
    title: item?.title || item?.name || fallbackTitle,
    description: item?.description || item?.subtitle || item?.summary || 'No description available yet.',
    category: item?.category || item?.kind || 'Video',
    year: item?.year || item?.releaseYear || '',
    videoUrl,
    poster: poster || '',
    aspectRatio: item?.aspectRatio || item?.ratio || 'video',
    isFeatured: Boolean(item?.isFeatured),
  };
}

export function pickHeroLayout(index) {
  return index % 2 === 0 ? 'hero-right' : 'hero-left';
}
