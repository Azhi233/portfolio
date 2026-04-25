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

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#4f463f]">
      <MinimalTopNav />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 md:px-10 lg:pt-28">
        <header className="mx-auto max-w-5xl border-b border-[#d8c9b3]/45 pb-12">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#b58e62]">Video archive</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <h1 className="max-w-xl text-[2.85rem] font-light leading-[0.94] tracking-[0.1em] text-[#a97a4c] md:text-[4.65rem]">{t('videos.title', 'Video')}</h1>
              <p className="mt-5 max-w-lg text-sm leading-8 text-[#7a6b5b]">A calm, editorial video archive inspired by Peter Belanger’s layout rhythm.</p>
            </div>
            <div className="lg:justify-self-end">
              <p className="text-[10px] uppercase tracking-[0.42em] text-[#b08c62]">{items.length} works</p>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-24 max-w-5xl">
          <div className="border-t border-[#d8c9b3]/45 pt-12">
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#b58e62]">All videos</p>
            <div className="mt-12 space-y-32">
              {items.map((video, index) => {
                const reverse = index % 2 === 1;
                return (
                  <article key={video.id} className={`grid items-start gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                    <div className={`pt-1 ${reverse ? 'lg:pl-10' : 'lg:pr-10'}`}>
                      <h3 className="max-w-xs text-[2.15rem] font-light leading-[0.96] tracking-[0.04em] text-[#a97a4c] md:text-[2.9rem]">{video.title}</h3>
                      <p className="mt-6 max-w-sm text-sm leading-8 text-[#7a6b5b]">{video.description}</p>
                    </div>
                    <Link to={`/videos/${video.id}`} className={`group block ${reverse ? 'lg:justify-self-start' : 'lg:justify-self-end'}`}>
                      <MediaPreview src={video.videoUrl || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-auto w-full object-contain" />
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
