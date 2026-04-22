import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';

function normalizeImageItem(item, index) {
  if (!item) return null;

  const url = String(item.coverUrl || item.coverAssetUrl || item.thumbnailUrl || item.mainImageUrl || item.imageUrl || item.url || '').trim();
  if (!url) return null;

  return {
    id: item.id || `image-${index + 1}`,
    url,
    title: item.title || item.name || item.subtitle || `Image ${String(index + 1).padStart(2, '0')}`,
    size: item.size === 'wide' || item.aspectRatio === '16:9' ? 'wide' : index % 3 === 1 ? 'wide' : 'tall',
  };
}

function parseImageSources(rawValue) {
  const source = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split('\n');
  return source
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((value, index) => {
      try {
        const parsed = JSON.parse(value);
        const url = typeof parsed === 'string' ? parsed : parsed?.url || parsed?.src || parsed?.imageUrl || '';
        if (url) {
          return {
            id: parsed?.id || `featured-${index + 1}`,
            url,
            title: parsed?.title || parsed?.name || `Featured ${String(index + 1).padStart(2, '0')}`,
            size: parsed?.size === 'wide' ? 'wide' : 'tall',
          };
        }
      } catch {
        // continue with plain string parsing
      }

      const [url, title, size] = value.split('|').map((part) => part.trim());
      return {
        id: `featured-${index + 1}`,
        url,
        title: title || `Featured ${String(index + 1).padStart(2, '0')}`,
        size: size === 'wide' ? 'wide' : 'tall',
      };
    })
    .filter((image) => Boolean(image.url));
}

function ImagesPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', images: [] });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const [projectsResponse, config, mediaAssets] = await Promise.all([
        fetchJson('/projects?page=images&kind=images').catch(() => []),
        fetchJson('/config').catch(() => ({})),
        fetchJson('/media-assets').catch(() => []),
      ]);

      const projectItems = Array.isArray(projectsResponse)
        ? projectsResponse
        : projectsResponse?.items || projectsResponse?.projects || projectsResponse?.data || [];
      const imagesFromProjects = projectItems
        .filter((item) => (Array.isArray(item?.displayOn) && item.displayOn.length ? item.displayOn.includes('images') : true))
        .map(normalizeImageItem)
        .filter(Boolean);
      const imagesFromConfig = parseImageSources(config?.featuredImagesText || config?.uploadedImagesText || config?.imagesText);
      const imagesFromConfigAssets = Array.isArray(config?.assets) ? config.assets.map(normalizeImageItem).filter(Boolean) : [];
      const imagesFromMediaAssets = Array.isArray(mediaAssets)
        ? mediaAssets.filter((asset) => String(asset?.kind || 'image') === 'image').map(normalizeImageItem).filter(Boolean)
        : [];

      const images =
        imagesFromProjects.length ? imagesFromProjects : imagesFromConfigAssets.length ? imagesFromConfigAssets : imagesFromMediaAssets.length ? imagesFromMediaAssets : imagesFromConfig;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: '',
        images,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error?.message || 'Failed to load images.', images: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const images = useMemo(() => state.images, [state.images]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-6 pb-20 pt-20 text-[#151515] md:px-12">
      <MinimalTopNav />
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
            {state.loading ? 'Loading…' : `${images.length} selected`}
          </p>
          <button
            type="button"
            onClick={load}
            className="text-[11px] uppercase tracking-[0.2em] text-[#151515]/55 transition-opacity hover:opacity-60"
          >
            Refresh
          </button>
        </div>

        {state.error ? <p className="mt-6 text-sm text-red-500">{state.error}</p> : null}

        {!state.loading && images.length === 0 ? (
          <div className="mt-12 rounded-[1.5rem] border border-dashed border-black/10 bg-white px-6 py-10 text-center text-sm text-[#151515]/55">
            还没有可显示的图片。当前页面会优先读取 <code className="rounded bg-black/5 px-1.5 py-0.5">/projects?page=images&kind=images</code>，并基于后台配置的 <code className="rounded bg-black/5 px-1.5 py-0.5">displayOn</code> / <code className="rounded bg-black/5 px-1.5 py-0.5">mediaType</code> 过滤。如果没有，再读取后台保存的 <code className="rounded bg-black/5 px-1.5 py-0.5">assets</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">featuredImagesText</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">uploadedImagesText</code> 或 <code className="rounded bg-black/5 px-1.5 py-0.5">imagesText</code>。
          </div>
        ) : null}

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
                    loading="lazy"
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
