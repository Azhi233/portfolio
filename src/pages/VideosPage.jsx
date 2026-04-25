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
              <h1 className="text-[3.35rem] font-light leading-none tracking-[0.08em] text-[#a97a4c] md:text-[5.25rem]">{t('videos.title', 'Video')}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[#7a6b5b]">A calm, editorial video archive inspired by Peter Belanger’s layout rhythm.</p>
            </div>
            <div className="lg:justify-self-end">
              <p className="text-[10px] uppercase tracking-[0.42em] text-[#b08c62]">{items.length} works</p>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-24 max-w-5xl">
          <div className="border-t border-[#d8c9b3]/45 pt-12">
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#b58e62]">All videos</p>
            <div className="mt-10 space-y-24">
              {items.map((video, index) => {
                const reverse = index % 2 === 1;
                return (
                  <article key={video.id} className={`grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                    <div className={`pt-2 ${reverse ? 'lg:pl-6' : 'lg:pr-6'}`}>
                      <h3 className="max-w-sm text-[2.7rem] font-light leading-[0.96] tracking-[0.04em] text-[#a97a4c] md:text-[3.4rem]">{video.title}</h3>
                      <p className="mt-6 max-w-md text-sm leading-8 text-[#7a6b5b]">{video.description}</p>
                    </div>
                    <Link to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.9rem] bg-white shadow-[0_18px_55px_rgba(148,120,82,0.08)]">
                      <div className="overflow-hidden rounded-[1.35rem] bg-[#f6f1e8] p-1 md:p-2 lg:p-3">
                        <MediaPreview src={video.videoUrl || video.coverUrl} title={video.title} kind="video" autoPlay={false} muted className="h-auto w-full object-contain" />
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
