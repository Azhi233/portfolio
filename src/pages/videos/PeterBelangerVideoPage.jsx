import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../utils/api.js';
import { useI18n } from '../../context/I18nContext.jsx';
import MediaPreview from '../../components/MediaPreview.jsx';
import { normalizeVideoItem, placeholderVideos, pickHeroLayout } from './videoPageData.js';

function HeroMedia({ video, ratioMap, onDetectRatio }) {
  const ratioValue = ratioMap?.[video.id];
  const frameStyle = ratioValue ? { aspectRatio: ratioValue } : undefined;

  return (
    <Link to={`/videos/${video.id}`} className="group block">
      <div className="relative overflow-hidden bg-black shadow-[0_30px_80px_rgba(0,0,0,0.10)] transition-transform duration-500 group-hover:-translate-y-1">
        <div className={`w-full bg-black ${ratioValue ? '' : 'aspect-[16/10]'}`} style={frameStyle}>
          <MediaPreview
            src={video.videoUrl || video.poster}
            title={video.title}
            kind={video.videoUrl ? 'video' : 'image'}
            autoPlay={Boolean(video.videoUrl)}
            muted
            onVideoMetadata={({ width, height }) => onDetectRatio(video.id, width, height)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 via-black/0 to-transparent px-5 py-4 text-white opacity-90">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">Open Detail</p>
            <p className="mt-1 text-sm tracking-[0.06em]">{video.title}</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/70">View</span>
        </div>
        {!video.videoUrl ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="h-14 w-14 rounded-full border border-white/25 border-t-white/70 animate-spin" />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function TextBlock({ video, align = 'left' }) {
  return (
    <div className={`max-w-xl ${align === 'right' ? 'md:ml-auto md:text-left' : ''}`}>
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#B08C62]">
        {video.category} {video.year ? `· ${video.year}` : ''}
      </p>
      <h2 className="mt-4 text-3xl font-light tracking-[0.02em] text-[#B08C62] md:text-[40px]">
        {video.title}
      </h2>
      <p className="mt-5 text-sm leading-7 text-[#6f635a] md:text-[15px] md:leading-8">
        {video.description}
      </p>
    </div>
  );
}

function PlaceholderBanner() {
  return (
    <div className="rounded-[2rem] border border-[#cbb89e]/35 bg-white/65 px-6 py-5 text-sm leading-7 text-[#6f635a] shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm">
      后台还没有启动或 MinIO 资源暂不可用时，这里会自动使用占位内容展示版式。接入后台后，页面会优先读取上传返回的 <code className="rounded bg-black/5 px-1.5 py-0.5">videoUrl</code>、<code className="rounded bg-black/5 px-1.5 py-0.5">posterUrl</code> 等字段。
    </div>
  );
}

export default function PeterBelangerVideoPage() {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', items: [] });
  const [ratioMap, setRatioMap] = useState({});

  const topSpacing = 'px-5 pb-20 pt-20 sm:px-6 md:px-10 lg:px-14';

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetchJson('/media-assets').catch(() => []);
      const rawItems = Array.isArray(response) ? response : response?.items || response?.assets || [];
      const items = rawItems
        .filter((item) => String(item?.kind || item?.type || 'video') === 'video' || Boolean(item?.videoUrl || item?.mainVideoUrl || item?.url))
        .map(normalizeVideoItem);

      setState((prev) => ({ ...prev, loading: false, error: '', items }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error?.message || 'Failed to load videos.', items: [] }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const videos = useMemo(() => (state.items.length ? state.items : placeholderVideos), [state.items]);
  const featuredVideos = useMemo(() => videos.filter((item) => item.isFeatured), [videos]);

  const detectRatio = (id, width, height) => {
    if (!id || !width || !height) return;
    const ratio = (width / height).toFixed(4);
    setRatioMap((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#4f463f]">
      <section className={`mx-auto max-w-[1440px] ${topSpacing}`}>
        <div className="mb-6 flex items-center justify-between border-b border-[#d8c9b3]/35 pb-4 text-[10px] uppercase tracking-[0.3em] text-[#b58e62]">
          <Link to="/" className="transition-opacity hover:opacity-60">Home</Link>
          <div className="flex items-center gap-4">
            <Link to="/images" className="transition-opacity hover:opacity-60">Images</Link>
            <Link to="/videos" className="transition-opacity hover:opacity-60">Videos</Link>
          </div>
        </div>

        <header className="flex flex-col gap-4 border-b border-[#d8c9b3]/55 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#b58e62]">Peter Belanger inspired</p>
            <h1 className="mt-3 text-4xl font-light tracking-[0.04em] text-[#a97a4c] md:text-6xl">
              {t('videos.title', 'Video')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#75685b] md:text-base">
              {t('videos.subtitle', 'A refined, editorial video archive layout with modular sections, alternating media/text rhythm, and MinIO-backed video URLs.')}
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-[#b08c62]">
            {state.loading ? 'Loading…' : `${videos.length} works`}
          </div>
        </header>

        {featuredVideos.length ? (
          <div className="mt-6 rounded-[2rem] border border-[#d8c9b3]/55 bg-white/75 p-5 shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#b58e62]">Featured Videos</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {featuredVideos.map((video) => (
                <Link key={video.id} to={`/videos/${video.id}`} className="group block overflow-hidden rounded-[1.5rem] bg-black">
                  <div className="aspect-[4/5] bg-black">
                    <MediaPreview src={video.videoUrl || video.poster} title={video.title} kind={video.videoUrl ? 'video' : 'image'} autoPlay={false} muted className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-4 text-[#4f463f]">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[#b58e62]">Featured</p>
                    <h2 className="mt-2 text-base tracking-[0.04em] text-[#a97a4c]">{video.title}</h2>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <PlaceholderBanner />
        </div>

        {state.error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}

        <div className="mt-10 space-y-16 md:space-y-24">
          {videos.map((video, index) => {
            const layout = pickHeroLayout(index);
            const isHeroRight = layout === 'hero-right';
            return (
              <article key={video.id} className="grid gap-6 md:grid-cols-12 md:items-center md:gap-10">
                <div className={`md:col-span-4 ${isHeroRight ? 'md:order-1' : 'md:order-2'}`}>
                  <TextBlock video={video} align={isHeroRight ? 'left' : 'right'} />
                </div>
                <div className={`md:col-span-8 ${isHeroRight ? 'md:order-2' : 'md:order-1'}`}>
                  <HeroMedia video={video} ratioMap={ratioMap} onDetectRatio={detectRatio} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
