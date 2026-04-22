import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';
import { normalizeVideoItem, placeholderVideos } from './videos/videoPageData.js';

function DetailHero({ video, ratio, onDetectRatio }) {
  const frameStyle = ratio ? { aspectRatio: ratio } : undefined;

  return (
    <section className="grid gap-6 md:grid-cols-12 md:items-center md:gap-10">
      <div className="md:col-span-4">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#b58e62]">Video Detail</p>
        <h1 className="mt-3 text-4xl font-light tracking-[0.04em] text-[#a97a4c] md:text-6xl">{video.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[#75685b] md:text-base">{video.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="warning">{video.category || 'Video'}</Badge>
          {video.year ? <Badge tone="default">{video.year}</Badge> : null}
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="overflow-hidden bg-black shadow-[0_30px_80px_rgba(0,0,0,0.10)] transition-transform duration-500 hover:-translate-y-1">
          <div className={`bg-black ${ratio ? '' : 'aspect-[16/10]'}`} style={frameStyle}>
            <MediaPreview
              src={video.videoUrl || video.poster}
              title={video.title}
              kind={video.videoUrl ? 'video' : 'image'}
              autoPlay={Boolean(video.videoUrl)}
              muted
              onVideoMetadata={({ width, height }) => onDetectRatio(width, height)}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-[#d8c9b3]/55 bg-white/75 p-5 shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#b58e62]">{label}</p>
      <p className="mt-3 break-all text-sm leading-7 text-[#6f635a]">{value || '—'}</p>
    </div>
  );
}

function VideoDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [video, setVideo] = useState(null);
  const [ratio, setRatio] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [videoData, mediaAssets] = await Promise.all([
          fetchJson(`/projects/${id}`).catch(() => null),
          fetchJson('/media-assets').catch(() => []),
        ]);
        if (!mounted) return;

        const fromApi = videoData ? normalizeVideoItem(videoData, 0) : null;
        if (fromApi?.title) {
          setVideo(fromApi);
        } else {
          const assets = Array.isArray(mediaAssets) ? mediaAssets : mediaAssets?.items || mediaAssets?.assets || [];
          const matched = assets.find((item) => String(item?.id) === String(id) || String(item?.slug) === String(id));
          setVideo(normalizeVideoItem(matched || placeholderVideos[0], 0));
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || t('videoDetail.loadError', 'Failed to load video project.'));
        setVideo(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, t]);

  const fallbackVideo = useMemo(() => placeholderVideos[0], []);
  const activeVideo = video || fallbackVideo;

  const detectRatio = (width, height) => {
    if (!width || !height) return;
    const next = (width / height).toFixed(4);
    setRatio((prev) => (prev === next ? prev : next));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 pb-20 pt-20 text-[#4f463f] sm:px-6 md:px-10 lg:px-14">
        <section className="mx-auto max-w-[1440px]">
          <p className="text-sm text-[#75685b]">{t('videoDetail.loading', 'Loading video project...')}</p>
        </section>
      </main>
    );
  }

  if (error && !video) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 pb-20 pt-20 text-[#4f463f] sm:px-6 md:px-10 lg:px-14">
        <section className="mx-auto max-w-[1440px] space-y-6">
          <div className="rounded-[2rem] border border-[#d8c9b3]/55 bg-white/75 p-8 shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#b58e62]">Video Detail</p>
            <h1 className="mt-3 text-4xl font-light tracking-[0.04em] text-[#a97a4c]">{t('videoDetail.notFound', 'Video Not Found')}</h1>
            <p className="mt-4 text-sm leading-7 text-[#75685b]">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/videos">
                <Button type="button">Back to Videos</Button>
              </Link>
              <Link to="/images">
                <Button type="button" variant="subtle">Go to Images</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#4f463f]">
      <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-20 sm:px-6 md:px-10 lg:px-14">
        <div className="mb-6 flex items-center justify-between border-b border-[#d8c9b3]/35 pb-4 text-[10px] uppercase tracking-[0.3em] text-[#b58e62]">
          <Link to="/" className="transition-opacity hover:opacity-60">Home</Link>
          <div className="flex items-center gap-4">
            <Link to="/images" className="transition-opacity hover:opacity-60">Images</Link>
            <Link to="/videos" className="transition-opacity hover:opacity-60">Videos</Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-[#d8c9b3]/55 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/videos" className="text-xs uppercase tracking-[0.28em] text-[#b58e62] transition-opacity hover:opacity-60">
            ← Back to Videos
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning">{activeVideo.category || 'Video'}</Badge>
            <Badge tone={error ? 'danger' : 'success'}>{error ? 'Fallback' : 'Live'}</Badge>
          </div>
        </div>

        <div className="mt-10 space-y-8 md:mt-12 md:space-y-10">
          <DetailHero video={activeVideo} ratio={ratio} onDetectRatio={detectRatio} />

          <div className="grid gap-4 md:grid-cols-3">
            <MetaCard label="Poster" value={activeVideo.poster || '—'} />
            <MetaCard label="Video URL" value={activeVideo.videoUrl || '—'} />
            <MetaCard label="Aspect Ratio" value={activeVideo.aspectRatio || 'video'} />
          </div>

          <div className="rounded-[2rem] border border-[#d8c9b3]/55 bg-white/75 p-6 shadow-[0_18px_55px_rgba(148,120,82,0.08)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#b58e62]">Notes</p>
            <p className="mt-4 text-sm leading-7 text-[#75685b]">
              The detail view now follows the same editorial language as the new video archive: calmer spacing, softer surfaces, and a media-first focus.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default VideoDetailPage;
