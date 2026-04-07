import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext.jsx';
import { trackEvent } from '../../utils/analytics.js';

const PRIVATE_ACCESS_PREFIX = 'project.private.access.';

export function getEmbedUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  if (/\.mp4(\?.*)?$/i.test(value)) {
    return value;
  }

  const bilibiliMatch = value.match(/(?:bilibili\.com\/video\/|b23\.tv\/)(BV[0-9A-Za-z]+)/i);
  if (bilibiliMatch?.[1]) {
    const bvid = bilibiliMatch[1];
    return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0&as_wide=1`;
  }

  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    const videoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
  }

  const youtubeMatch = value.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
  );
  if (youtubeMatch?.[1]) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
  }

  return value;
}

function ProjectNotFound() {
  return (
    <main className="min-h-screen bg-black px-6 pb-16 pt-24 text-zinc-100 md:px-12">
      <section className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300 transition hover:border-zinc-500 hover:shadow-[0_0_24px_rgba(255,255,255,0.1)]"
        >
          &lt;- Back to Gallery
        </Link>

        <div className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center md:p-12">
          <p className="text-xs tracking-[0.26em] text-zinc-500">404</p>
          <h1 className="mt-3 font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">Project Not Found</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400">
            当前项目可能已被删除或链接无效。请返回作品墙，选择其他影片继续观看。
          </p>
        </div>
      </section>
    </main>
  );
}

function PrivateAccessGate({ projectTitle, onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 md:p-12">
      <p className="text-xs tracking-[0.24em] text-zinc-500">PRIVATE PROJECT</p>
      <h2 className="mt-3 font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-4xl">{projectTitle}</h2>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">该项目为私密访问，请输入密码后查看。</p>

      <form
        className="mt-6 max-w-md"
        onSubmit={(event) => {
          event.preventDefault();
          const ok = onUnlock(input);
          if (!ok) {
            setError('密码错误，请重试。');
            return;
          }
          setError('');
        }}
      >
        <input
          type="password"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (error) setError('');
          }}
          placeholder="请输入项目访问密码"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring-2"
        />

        {error ? <p className="mt-3 text-xs tracking-[0.08em] text-rose-400">{error}</p> : null}

        <button
          type="submit"
          className="mt-4 rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-300/20"
        >
          UNLOCK PROJECT
        </button>
      </form>
    </div>
  );
}

function ProjectDetail() {
  const { id } = useParams();
  const { projects } = useConfig();
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [videoStartAt, setVideoStartAt] = useState(null);

  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);

  useEffect(() => {
    if (typeof window === 'undefined' || !project?.id) return;
    const key = `${PRIVATE_ACCESS_PREFIX}${project.id}`;
    setIsPrivateUnlocked(window.sessionStorage.getItem(key) === 'true');
  }, [project?.id]);

  if (!project || project.isVisible === false) {
    return <ProjectNotFound />;
  }

  const startVideoTracking = () => {
    setVideoStartAt(Date.now());
    trackEvent('video_play_clicked', {
      projectId: project.id,
      title: project.title,
      videoUrl: project.mainVideoUrl || project.videoUrl,
    });
  };

  const stopVideoTracking = () => {
    if (!videoStartAt) return;
    const seconds = Math.max(1, Math.round((Date.now() - videoStartAt) / 1000));
    trackEvent('video_watch_duration', {
      projectId: project.id,
      title: project.title,
      seconds,
    });
    setVideoStartAt(null);
  };

  const visibility = project.visibility || project.publishStatus || 'Published';

  const isPrivate = visibility === 'Private';
  const canViewPrivate = !isPrivate || isPrivateUnlocked;

  const mainVideoUrl = project.mainVideoUrl || project.videoUrl;
  const embedUrl = getEmbedUrl(mainVideoUrl);
  const isMp4 = /\.mp4(\?.*)?$/i.test(embedUrl);
  const isEmbedIframe =
    /^https?:\/\/player\.bilibili\.com\//i.test(embedUrl) ||
    /^https?:\/\/player\.vimeo\.com\//i.test(embedUrl) ||
    /^https?:\/\/www\.youtube-nocookie\.com\//i.test(embedUrl);

  return (
    <main className="min-h-screen bg-black px-6 pb-16 pt-20 text-zinc-100 md:px-12 md:pt-24">
      <section className="mx-auto w-full max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300 transition hover:border-zinc-500 hover:shadow-[0_0_24px_rgba(255,255,255,0.1)]"
        >
          &lt;- Back to Gallery
        </Link>

        {isPrivate && !canViewPrivate ? (
          <PrivateAccessGate
            projectTitle={project.title}
            onUnlock={(input) => {
              const matched = String(input || '') === String(project.accessPassword || '');
              if (!matched) return false;

              if (typeof window !== 'undefined') {
                const key = `${PRIVATE_ACCESS_PREFIX}${project.id}`;
                window.sessionStorage.setItem(key, 'true');
              }
              setIsPrivateUnlocked(true);
              return true;
            }}
          />
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 md:p-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {isMp4 ? (
                  <video
                    src={embedUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPlay={startVideoTracking}
                    onPause={stopVideoTracking}
                    onEnded={stopVideoTracking}
                    className="h-full w-full object-cover"
                  />
                ) : isEmbedIframe ? (
                  <iframe
                    src={embedUrl}
                    title={project.title}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    onLoad={() => {
                      trackEvent('video_play_clicked', {
                        projectId: project.id,
                        title: project.title,
                        videoUrl: project.mainVideoUrl || project.videoUrl,
                        source: 'iframe',
                      });
                    }}
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm tracking-[0.08em] text-zinc-400">
                    Unsupported video URL. Please use Bilibili / Vimeo / YouTube / .mp4 link.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-8 border-t border-zinc-800 pt-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
              <div>
                <h1 className="font-serif text-4xl tracking-[0.08em] text-zinc-100 md:text-6xl">{project.title}</h1>
                <div className="mt-6 h-px w-40 bg-zinc-700" />
                <p className="mt-6 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300 md:text-base">
                  {project.description ||
                    'A cinematic project from DIRECTOR.VISION. Mood, rhythm, and materiality in motion.'}
                </p>
              </div>

              <div className="space-y-4 text-right md:text-left">
                <p className="text-xs tracking-[0.22em] text-zinc-500">CATEGORY</p>
                <p className="text-sm tracking-[0.14em] text-zinc-200">{project.category}</p>

                <p className="pt-2 text-xs tracking-[0.22em] text-zinc-500">ROLE</p>
                <p className="text-sm tracking-[0.12em] text-zinc-300">{project.role || 'DOP'}</p>

                {project.releaseDate ? (
                  <>
                    <p className="pt-2 text-xs tracking-[0.22em] text-zinc-500">RELEASE DATE</p>
                    <p className="text-sm tracking-[0.12em] text-zinc-300">{project.releaseDate}</p>
                  </>
                ) : null}

                {project.clientAgency ? (
                  <>
                    <p className="pt-2 text-xs tracking-[0.22em] text-zinc-500">CLIENT / AGENCY</p>
                    <p className="text-sm tracking-[0.12em] text-zinc-300">{project.clientAgency}</p>
                  </>
                ) : null}

                <p className="pt-2 text-xs tracking-[0.22em] text-zinc-500">CREDITS</p>
                <p className="text-sm tracking-[0.12em] text-zinc-300">{project.credits || 'DIRECTOR: DIRECTOR.VISION'}</p>
              </div>
            </div>

            {Array.isArray(project.btsMedia) && project.btsMedia.length > 0 ? (
              <section className="mt-10 border-t border-zinc-800 pt-8">
                <h2 className="text-xs tracking-[0.24em] text-zinc-500">BTS · BEHIND THE SCENES</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {project.btsMedia.map((item, index) => {
                    const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(item);
                    return (
                      <a
                        key={`${item}-${index}`}
                        href={item}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/75"
                      >
                        <div className="aspect-video w-full bg-zinc-900">
                          {isVideo ? (
                            <video src={item} muted playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <img src={item} alt={`bts-${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default ProjectDetail;
