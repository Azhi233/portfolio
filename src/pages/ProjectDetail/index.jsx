import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext.jsx';

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

function ProjectDetail() {
  const { id } = useParams();
  const { projects } = useConfig();

  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);

  if (!project || project.isVisible === false) {
    return <ProjectNotFound />;
  }

  const embedUrl = getEmbedUrl(project.videoUrl);
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 md:p-4">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            {isMp4 ? (
              <video src={embedUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : isEmbedIframe ? (
              <iframe
                src={embedUrl}
                title={project.title}
                allow="autoplay; fullscreen"
                allowFullScreen
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
              {project.description || 'A cinematic project from DIRECTOR.VISION. Mood, rhythm, and materiality in motion.'}
            </p>
          </div>

          <div className="space-y-4 text-right md:text-left">
            <p className="text-xs tracking-[0.22em] text-zinc-500">CATEGORY</p>
            <p className="text-sm tracking-[0.14em] text-zinc-200">{project.category}</p>

            <p className="pt-2 text-xs tracking-[0.22em] text-zinc-500">CREDITS</p>
            <p className="text-sm tracking-[0.12em] text-zinc-300">{project.credits || 'DIRECTOR: DIRECTOR.VISION'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProjectDetail;
