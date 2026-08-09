import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

function extractVideoPoster(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || !src) {
      reject(new Error('Poster extraction is unavailable.'));
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const fail = (error) => {
      cleanup();
      reject(error instanceof Error ? error : new Error('Failed to extract poster frame.'));
    };

    video.addEventListener('error', () => fail(new Error('Failed to load video for poster extraction.')), { once: true });
    video.addEventListener('loadeddata', async () => {
      try {
        if (video.readyState < 2) {
          await new Promise((resolveFrame) => {
            const onFrame = () => resolveFrame();
            video.addEventListener('canplay', onFrame, { once: true });
          });
        }
        if (video.duration && Number.isFinite(video.duration) && video.duration > 0.2) {
          video.currentTime = Math.min(0.12, video.duration / 12);
          await new Promise((resolveSeek, rejectSeek) => {
            const onSeeked = () => resolveSeek();
            const onSeekError = () => rejectSeek(new Error('Failed to seek video for poster extraction.'));
            video.addEventListener('seeked', onSeeked, { once: true });
            video.addEventListener('error', onSeekError, { once: true });
          });
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, video.videoWidth || 0);
        canvas.height = Math.max(1, video.videoHeight || 0);
        const context = canvas.getContext('2d');
        if (!context) {
          fail(new Error('Canvas context unavailable.'));
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const poster = canvas.toDataURL('image/jpeg', 0.88);
        cleanup();
        resolve(poster);
      } catch (error) {
        fail(error);
      }
    }, { once: true });
  });
}

export function HomeHeroSection({ t, homeVideoUrl, homeVideoTitle, homeVideoCaption, homeVideoPosterUrl = '' }) {
  const videoRef = useRef(null);
  const posterTaskRef = useRef(0);
  const autoplayRetryRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [posterUrl, setPosterUrl] = useState(homeVideoPosterUrl || '');
  const [posterReady, setPosterReady] = useState(Boolean(homeVideoPosterUrl));
  const captionLines = String(homeVideoCaption || '').trim();
  const captionPreview = captionLines.split('\n').slice(0, 6).join('\n');
  const captionWords = captionLines.split(/\s+/).filter(Boolean).length;
  const fontSizeClass = captionWords > 28 ? 'text-[10px] leading-5 tracking-[0.2em]' : captionWords > 16 ? 'text-[11px] leading-6 tracking-[0.22em]' : 'text-[12px] leading-7 tracking-[0.24em]';

  useEffect(() => {
    setVideoReady(false);
    setVideoFailed(false);
    setVideoPlaying(false);
    setPosterUrl(homeVideoPosterUrl || '');
    setPosterReady(Boolean(homeVideoPosterUrl));
    autoplayRetryRef.current = 0;
  }, [homeVideoUrl, homeVideoPosterUrl]);

  useEffect(() => {
    let active = true;
    const taskId = Date.now();
    posterTaskRef.current = taskId;

    if (homeVideoPosterUrl) {
      setPosterUrl(homeVideoPosterUrl);
      setPosterReady(true);
      return undefined;
    }

    setPosterUrl('');
    setPosterReady(false);

    if (!homeVideoUrl || videoFailed) return undefined;

    extractVideoPoster(homeVideoUrl)
      .then((nextPoster) => {
        if (!active || posterTaskRef.current !== taskId) return;
        setPosterUrl(nextPoster);
        setPosterReady(true);
      })
      .catch(() => {
        if (!active || posterTaskRef.current !== taskId) return;
        setPosterUrl('');
        setPosterReady(false);
      });

    return () => {
      active = false;
    };
  }, [homeVideoUrl, homeVideoPosterUrl, videoFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !homeVideoUrl || videoFailed || !videoReady) return;

    let cancelled = false;
    const startPlayback = async () => {
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        const playResult = video.play();
        if (playResult && typeof playResult.then === 'function') {
          await playResult;
        }
        if (!cancelled) {
          setVideoPlaying(true);
        }
      } catch {
        if (!cancelled) {
          setVideoPlaying(false);
        }
      }
    };

    void startPlayback();
    return () => {
      cancelled = true;
    };
  }, [homeVideoUrl, videoFailed, videoReady]);

  useEffect(() => {
    if (!homeVideoUrl || videoFailed || !videoReady || videoPlaying) return undefined;

    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      if (autoplayRetryRef.current >= 3) {
        window.clearInterval(timer);
        return;
      }
      autoplayRetryRef.current += 1;
      const playResult = video.play();
      if (playResult && typeof playResult.then === 'function') {
        playResult
          .then(() => setVideoPlaying(true))
          .catch(() => {});
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [homeVideoUrl, videoFailed, videoReady, videoPlaying]);

  const showFallback = !homeVideoUrl || videoFailed;
  const showVideo = Boolean(homeVideoUrl) && !videoFailed && (videoReady || videoPlaying);
  const showPoster = Boolean(homeVideoUrl) && !videoFailed && !showVideo && posterReady && posterUrl;

  return (
    <section className="space-y-6">
      <p className="text-[11px] tracking-[0.32em] text-zinc-500">{t('home.eyebrow')}</p>
      <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-[0.08em] text-white md:text-7xl">{t('home.title')}</h1>
      {homeVideoTitle ? <p className="text-[11px] tracking-[0.22em] text-zinc-500">{homeVideoTitle}</p> : null}
      <div className="relative mt-2 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%),linear-gradient(180deg,rgba(18,18,22,0.9),rgba(6,6,8,0.96))]">
        <div className="relative aspect-[16/9] w-full min-h-[26rem] max-h-[72vh]">
          {showPoster ? (
            <img
              src={posterUrl}
              alt="Homepage video poster"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setPosterReady(true)}
              onError={() => setPosterReady(false)}
            />
          ) : null}

          {homeVideoUrl ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
              src={homeVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="auto"
              poster={posterUrl || undefined}
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onPlay={() => setVideoPlaying(true)}
              onError={() => setVideoFailed(true)}
            />
          ) : null}

          {showFallback ? (
            <div className={`absolute inset-0 flex flex-col justify-between bg-[radial-gradient(circle_at_top,_rgba(141,111,82,0.24),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.34))] p-6 text-white/80 transition-opacity duration-500 sm:p-8 md:p-10 ${showVideo || showPoster ? 'opacity-0' : 'opacity-100'}`}>
              <div className="max-w-xl space-y-3">
                <p className="text-[10px] uppercase tracking-[0.34em] text-white/45">Homepage visual</p>
                <p className="text-sm leading-7 text-white/70">
                  {homeVideoUrl ? '视频正在自动播放中，部分设备会先显示首帧封面，避免黑屏。' : '当前没有配置首页视频。'}
                </p>
                {homeVideoUrl && videoFailed ? (
                  <p className="text-xs tracking-[0.18em] text-amber-200/80">
                    该设备可能不支持当前视频格式或网络未能拉取资源，已自动降级为静态占位。
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-[8px]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Status</p>
                  <p className="mt-2 text-sm tracking-[0.08em] text-white/85">{homeVideoUrl ? 'Autoplaying visual' : 'No video set'}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-[8px]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Fallback</p>
                  <p className="mt-2 text-sm tracking-[0.08em] text-white/85">Safe gradient layer</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 backdrop-blur-[8px]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Compatibility</p>
                  <p className="mt-2 text-sm tracking-[0.08em] text-white/85">More stable on mobile webviews</p>
                </div>
              </div>
            </div>
          ) : null}

          {captionLines ? (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start p-4 sm:p-6 md:p-8">
                <div className="max-w-[30rem] rounded-[1.5rem] border border-white/10 bg-black/42 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[6px] sm:px-5 sm:py-5">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Left bottom copy</p>
                  <p className={`mt-3 whitespace-pre-line text-white/88 ${fontSizeClass}`}>
                    {captionPreview}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <p className="max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{t('home.subtitle')}</p>
      <div className="flex flex-wrap gap-3">
        <Link to="/videos"><Button as="span" variant="primary">{t('home.viewVideos', 'View Videos')}</Button></Link>
        <Link to="/images"><Button as="span" variant="subtle">{t('home.viewImages', 'View Images')}</Button></Link>
        <Link to="/client-access"><Button as="span" variant="subtle">{t('home.clientAccess')}</Button></Link>
        <Link to="/console"><Button as="span" variant="default">{t('home.console')}</Button></Link>
      </div>
    </section>
  );
}

export function HomeHighlightsSection({ highlights }) {
  return <div className="grid gap-4 md:grid-cols-3">{Object.values(highlights).map(([id, title, desc]) => <div key={id} className="p-6"><p className="text-[11px] tracking-[0.22em] text-zinc-500">{id}</p><h2 className="mt-4 text-lg tracking-[0.12em] text-white">{title}</h2><p className="mt-3 text-sm leading-7 text-zinc-400">{desc}</p></div>)}</div>;
}

export function HomeFeaturedSection({ featuredImages, featuredVideos }) {
  return (
    <section className="space-y-12">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-zinc-500">FEATURED IMAGES</p>
        <div className="mt-4 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featuredImages.length ? featuredImages.map((item) => (
            <Link key={item.id} to="/images" className="group block">
              <img src={item.coverUrl || item.thumbnailUrl || item.url} alt={item.title} className="h-auto w-full object-contain transition duration-700 group-hover:scale-105" />
              <div className="pt-3">
                <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
              </div>
            </Link>
          )) : <p className="text-sm text-zinc-400">No featured images yet.</p>}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.22em] text-zinc-500">FEATURED VIDEOS</p>
        <div className="mt-4 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featuredVideos.length ? featuredVideos.map((item) => (
            <Link key={item.id} to="/videos" className="group block">
              <MediaPreview src={item.videoUrl || item.mainVideoUrl || item.coverUrl || item.thumbnailUrl} title={item.title} kind="video" autoPlay={false} muted className="h-auto w-full object-contain transition duration-700 group-hover:scale-[1.01]" />
              <div className="pt-3">
                <p className="text-sm tracking-[0.08em] text-white">{item.title}</p>
              </div>
            </Link>
          )) : <p className="text-sm text-zinc-400">No featured videos yet.</p>}
        </div>
      </div>
    </section>
  );
}

export function HomeStructureSection({ locale, t }) {
  return <div className="p-8 md:p-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('home.signals')}</p><h2 className="mt-3 text-2xl tracking-[0.08em] text-white">{t('home.structure')}</h2></div><Badge tone="warning">{locale === 'zh' ? '重构模式' : 'REWRITE MODE'}</Badge></div><p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300">{t('home.structureDesc')}</p></div>;
}
