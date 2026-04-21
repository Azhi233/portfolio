import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

function OldImagesPage() {
  const { locale, t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', items: [] });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetchJson('/projects?kind=photos');
      const items = Array.isArray(response) ? response : response?.items || response?.projects || [];
      setState((prev) => ({ ...prev, loading: false, error: '', items }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load images.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => state.items, [state.items]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-12">
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <header className="max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{locale === 'zh' ? '旧图片页' : 'OLD IMAGE ARCHIVE'}</p>
          <h1 className="mt-4 text-4xl font-serif tracking-[0.08em] md:text-6xl">{t('images.title', 'Images')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            {t('images.subtitle', 'Legacy image archive and older list-based browsing view.')}
          </p>
        </header>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{items.length} items</p>
          <Button type="button" variant="subtle" onClick={load}>
            Refresh
          </Button>
        </div>

        {state.loading ? <p className="text-sm text-zinc-400">Loading old images...</p> : null}
        {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const imageUrl = item.coverUrl || item.thumbnailUrl || item.mainImageUrl || item.imageUrl || item.url;
            return (
              <Card key={item.id || index} className="overflow-hidden p-0">
                <div className="aspect-[4/5] bg-black/20">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.title || `Image ${index + 1}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Image {index + 1}</p>
                  <h2 className="mt-2 text-lg tracking-[0.08em] text-white">{item.title || 'Untitled'}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{item.subtitle || item.description || 'Archive item'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link to="/oldhome" className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 transition-opacity hover:opacity-60">
                      Old Home
                    </Link>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">{item.year || '—'}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default OldImagesPage;
