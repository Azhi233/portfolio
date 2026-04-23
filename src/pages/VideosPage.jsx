import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

function normalizeVideoItem(item, index) {
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

export default function VideosPage() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchJson('/projects?page=videos&kind=videos')
      .then((response) => {
        const list = Array.isArray(response) ? response : response?.items || response?.projects || response?.data || [];
        const normalized = list
          .filter((item) => {
            const displayOn = Array.isArray(item?.displayOn) ? item.displayOn : [];
            const mediaType = String(item?.mediaType || item?.kind || '').toLowerCase();
            return (displayOn.length ? displayOn.includes('videos') : true) && (mediaType ? mediaType === 'video' : true);
          })
          .map(normalizeVideoItem)
          .filter(Boolean);

        setItems(normalized);
      })
      .catch(() => setItems([]));
  }, []);

  const featured = useMemo(() => items.filter((item) => item.isFeatured), [items]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#4f463f]">
      <MinimalTopNav />
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-24 md:px-10">
        <header className="flex items-end justify-between gap-4 border-b border-[#d8c9b3]/55 pb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#b58e62]">Video archive</p>
            <h1 className="mt-3 text-4xl font-light tracking-[0.04em] text-[#a97a4c] md:text-6xl">{t('videos.title', 'Video')}</h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b08c62]">{items.length} works</p>
        </header>

        {featured.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {featured.map((video) => (
              <Link key={video.id} to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.5rem] bg-black">
                <div className="aspect-video bg-black">
                  <MediaPreview src={video.url || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="p-4 text-[#4f463f]">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#b58e62]">Featured</p>
                  <h2 className="mt-2 text-base tracking-[0.04em] text-[#a97a4c]">{video.title}</h2>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((video) => (
            <Link key={video.id} to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_55px_rgba(148,120,82,0.08)]">
              <div className="aspect-video bg-black">
                <MediaPreview src={video.url || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
              <div className="p-4">
                <h2 className="text-base tracking-[0.04em] text-[#a97a4c]">{video.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
