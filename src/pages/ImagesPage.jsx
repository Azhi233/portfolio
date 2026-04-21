import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

function ImagesPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', images: [] });

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
      }));
      setState((prev) => ({ ...prev, loading: false, error: '', images }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load featured images.', images: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const images = useMemo(() => state.images, [state.images]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-6 pb-20 pt-24 text-[#151515] md:px-12">
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <header className="max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#151515]/45">Selected Images</p>
          <h1 className="mt-4 text-4xl font-light tracking-[0.08em] md:text-6xl">{t('images.title', 'Images')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#151515]/55 md:text-base">
            {t('images.subtitle', 'A quiet public wall of curated still images.')}
          </p>
        </header>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#151515]/45">{images.length} selected</p>
          <Button type="button" variant="subtle" onClick={load}>
            Refresh
          </Button>
        </div>

        {state.loading ? <p className="text-sm text-[#151515]/55">Loading featured images...</p> : null}
        {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <article key={image.id} className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
              <div className="aspect-[4/5] overflow-hidden bg-black/5">
                <img
                  src={image.url}
                  alt={image.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#151515]/40">Image {index + 1}</p>
                  <h2 className="mt-2 text-lg font-light tracking-[0.08em]">{image.title}</h2>
                </div>
                <Link to="/oldhome" className="text-[11px] uppercase tracking-[0.18em] text-[#151515]/40 transition-opacity hover:opacity-60">
                  Old Home
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default ImagesPage;
