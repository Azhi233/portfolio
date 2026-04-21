import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';

const PLACEHOLDER_IMAGES = [
  {
    id: 'placeholder-1',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 01',
    size: 'tall',
  },
  {
    id: 'placeholder-2',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 02',
    size: 'wide',
  },
  {
    id: 'placeholder-3',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 03',
    size: 'tall',
  },
  {
    id: 'placeholder-4',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 04',
    size: 'wide',
  },
  {
    id: 'placeholder-5',
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 05',
    size: 'tall',
  },
  {
    id: 'placeholder-6',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
    title: 'Study 06',
    size: 'wide',
  },
];

function ImagesPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', images: [], usingFallback: false });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const config = await fetchJson('/config');
      const raw = String(config?.featuredImagesText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const images = raw.map((url, index) => ({
        id: `featured-${index + 1}`,
        url,
        title: `Featured ${index + 1}`,
        size: index % 3 === 1 ? 'wide' : 'tall',
      }));
      setState((prev) => ({ ...prev, loading: false, error: '', images: images.length ? images : PLACEHOLDER_IMAGES, usingFallback: images.length === 0 }));
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: '', images: PLACEHOLDER_IMAGES, usingFallback: true }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const images = useMemo(() => state.images, [state.images]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-6 pb-20 pt-24 text-[#151515] md:px-12">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#151515]/45">Selected Images</p>
          <h1 className="mt-4 text-4xl font-light tracking-[0.08em] md:text-6xl">{t('images.title', 'Images')}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#151515]/55 md:text-base">
            {t('images.subtitle', 'A quiet public wall of curated still images.')}
          </p>
        </header>

        <div className="mt-12 flex items-center justify-between gap-4 border-b border-black/5 pb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#151515]/45">
            {images.length} selected {state.usingFallback ? '· preview' : ''}
          </p>
          <button
            type="button"
            onClick={load}
            className="text-[11px] uppercase tracking-[0.2em] text-[#151515]/55 transition-opacity hover:opacity-60"
          >
            Refresh
          </button>
        </div>

        <div className="mt-12 grid grid-flow-dense gap-6 md:grid-cols-12 md:gap-7">
          {images.map((image, index) => {
            const span = image.size === 'wide' ? 'md:col-span-7' : 'md:col-span-5';
            const heightClass = image.size === 'wide' ? 'aspect-[16/11]' : 'aspect-[4/5]';
            return (
              <article key={image.id} className={`${span} group overflow-hidden bg-white`}>
                <div className={`${heightClass} overflow-hidden bg-black/5`}>
                  <img
                    src={image.url}
                    alt={image.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[#151515]/38">Image {String(index + 1).padStart(2, '0')}</p>
                    <h2 className="mt-1 text-sm font-light tracking-[0.16em]">{image.title}</h2>
                  </div>
                  <Link to="/oldhome" className="text-[10px] uppercase tracking-[0.22em] text-[#151515]/35 transition-opacity hover:opacity-60">
                    Old Home
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ImagesPage;
