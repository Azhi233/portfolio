import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';

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
        // 继续按普通字符串处理
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

function normalizeAssetImage(asset, index) {
  const url = String(asset?.url || asset?.coverUrl || asset?.thumbnailUrl || '').trim();
  if (!url) return null;
  return {
    id: asset?.id || `asset-${index + 1}`,
    url,
    title: asset?.title || asset?.name || asset?.meta?.title || `Uploaded ${String(index + 1).padStart(2, '0')}`,
    size: asset?.size === 'wide' || asset?.type === 'video' ? 'wide' : index % 3 === 1 ? 'wide' : 'tall',
  };
}

function ImagesPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', images: [] });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const [config, mediaAssets] = await Promise.all([
        fetchJson('/config').catch(() => ({})),
        fetchJson('/media-assets').catch(() => []),
      ]);

      const imagesFromConfig = parseImageSources(config?.featuredImagesText || config?.uploadedImagesText || config?.imagesText);
      const imagesFromConfigAssets = Array.isArray(config?.assets) ? config.assets.map(normalizeAssetImage).filter(Boolean) : [];
      const imagesFromMediaAssets = Array.isArray(mediaAssets)
        ? mediaAssets.filter((asset) => String(asset?.kind || 'image') === 'image').map(normalizeAssetImage).filter(Boolean)
        : [];

      const images = imagesFromConfigAssets.length ? imagesFromConfigAssets : imagesFromMediaAssets.length ? imagesFromMediaAssets : imagesFromConfig;

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
            还没有可显示的图片。当前页面会优先读取后台保存的 <code className="rounded bg-black/5 px-1.5 py-0.5">assets</code>，如果没有，再读取 <code className="rounded bg-black/5 px-1.5 py-0.5">featuredImagesText</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">uploadedImagesText</code> 或 <code className="rounded bg-black/5 px-1.5 py-0.5">imagesText</code>。每行一张，支持 <code className="rounded bg-black/5 px-1.5 py-0.5">url|标题|wide</code> 或 JSON 格式。
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
