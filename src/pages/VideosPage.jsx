import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import MediaPreview from '../components/MediaPreview.jsx';
import { normalizeVideoItem } from './videos/videoPageData.js';

export default function VideosPage() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchJson('/projects?page=videos&kind=videos')
      .then((response) => {
        const list = Array.isArray(response) ? response : response?.items || response?.projects || response?.data || [];
        const normalized = list.map(normalizeVideoItem).filter((item) => Boolean(item?.videoUrl || item?.coverUrl));

        setItems(normalized);
      })
      .catch(() => setItems([]));
  }, []);

  const featured = useMemo(() => items.filter((item) => item.isFeatured), [items]);

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#4f463f]">
      <MinimalTopNav />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 md:px-10 lg:pt-28">
        <header className="mx-auto max-w-5xl border-b border-[#d8c9b3]/45 pb-10">
          <p className="text-[10px] uppercase tracking-[0.44em] text-[#b58e62]">Video archive</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-light tracking-[0.06em] text-[#a97a4c] md:text-6xl">{t('videos.title', 'Video')}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#7a6b5b]">A calm, editorial video archive inspired by Peter Belanger’s layout rhythm.</p>
            </div>
            <div className="lg:justify-self-end">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#b08c62]">{items.length} works</p>
            </div>
          </div>
        </header>

        {featured.length ? (
          <div className="mx-auto mt-16 max-w-5xl space-y-20">
            {featured.map((video, index) => {
              const reverse = index % 2 === 1;
              return (
                <article key={video.id} className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-14 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                  <div className={`pt-2 ${reverse ? 'lg:pl-4' : 'lg:pr-4'}`}>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[#b58e62]">Featured</p>
                    <h2 className="mt-4 text-3xl font-light tracking-[0.04em] text-[#a97a4c] md:text-4xl">{video.title}</h2>
                    <p className="mt-5 max-w-md text-sm leading-7 text-[#7a6b5b]">{video.description}</p>
                  </div>
                  <Link to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(148,120,82,0.08)]">
                    <div className="aspect-[16/10] bg-black">
                      <MediaPreview src={video.videoUrl || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}

        <div className="mx-auto mt-20 max-w-5xl">
          <div className="border-t border-[#d8c9b3]/45 pt-10">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#b58e62]">All videos</p>
            <div className="mt-8 space-y-20">
              {items.map((video, index) => {
                const reverse = index % 2 === 1;
                return (
                  <article key={video.id} className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-14 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                    <div className={`pt-2 ${reverse ? 'lg:pl-4' : 'lg:pr-4'}`}>
                      <h3 className="text-3xl font-light tracking-[0.04em] text-[#a97a4c] md:text-4xl">{video.title}</h3>
                      <p className="mt-5 max-w-md text-sm leading-7 text-[#7a6b5b]">{video.description}</p>
                    </div>
                    <Link to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(148,120,82,0.08)]">
                      <div className="aspect-[16/10] bg-black">
                        <MediaPreview src={video.videoUrl || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
