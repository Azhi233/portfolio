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
    <main className="min-h-screen bg-[#f6f1e8] text-[#2a221c]">
      <MinimalTopNav />
      <section className="mx-auto w-full max-w-[1500px] px-5 pb-24 pt-20 md:px-10 lg:px-14">
        <header className="mx-auto flex max-w-6xl flex-col gap-8 border-b border-[#cdbda9]/50 pb-10 pt-2 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#8f7a66]">Selected Images</p>
            <h1 className="mt-4 text-5xl font-light tracking-[0.04em] text-[#6f5947] md:text-7xl">{t('images.title', 'Images')}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6e6158] md:text-base">
              {t('images.subtitle', 'A quiet public wall of curated still images.')}
            </p>
          </div>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.3em] text-[#8f7a66]">
            <span>{state.loading ? 'Loading…' : `${images.length} selected`}</span>
            <button
              type="button"
              onClick={load}
              className="transition-opacity hover:opacity-60"
            >
              Refresh
            </button>
          </div>
        </header>

        {state.error ? <p className="mt-6 text-sm text-red-700">{state.error}</p> : null}

        {!state.loading && images.length === 0 ? (
          <div className="mt-12 rounded-[1.75rem] border border-dashed border-[#cdbda9]/55 bg-white/65 px-6 py-12 text-center text-sm leading-7 text-[#6e6158] shadow-[0_18px_55px_rgba(148,120,82,0.07)]">
            还没有可显示的图片。当前页面会优先读取 <code className="rounded bg-black/5 px-1.5 py-0.5">/projects?page=images&kind=images</code>，并基于后台配置的 <code className="rounded bg-black/5 px-1.5 py-0.5">displayOn</code> / <code className="rounded bg-black/5 px-1.5 py-0.5">mediaType</code> 过滤。如果没有，再读取后台保存的 <code className="rounded bg-black/5 px-1.5 py-0.5">assets</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">featuredImagesText</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">uploadedImagesText</code> 或 <code className="rounded bg-black/5 px-1.5 py-0.5">imagesText</code>。
          </div>
        ) : null}

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:gap-7">
          {images.map((image, index) => {
            const wide = image.size === 'wide';
            return (
              <article key={image.id} className={`transition-transform duration-500 hover:-translate-y-0.5 ${wide ? 'md:col-span-2' : ''}`}>
                <div className="overflow-hidden bg-transparent">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="pt-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#8f7a66]">Image {String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-1 text-sm font-light tracking-[0.16em] text-[#3b2f27]">{image.title}</h2>
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
