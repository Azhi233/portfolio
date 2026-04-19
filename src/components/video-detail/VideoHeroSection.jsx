import Card from '../Card.jsx';
import Badge from '../Badge.jsx';

function getPosterUrl(project = {}, fallback = '') {
  return String(project?.coverUrl || project?.thumbnailUrl || project?.posterUrl || fallback || '').trim();
}

export default function VideoHeroSection({ project, t = (key, fallback) => fallback }) {
  const posterUrl = getPosterUrl(project);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.12))] p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('videoDetail.hero', 'VIDEO / HERO')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{project?.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{project?.description || t('videoDetail.noDescription', 'No description yet.')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>{project?.category || t('videoDetail.uncategorized', 'Uncategorized')}</Badge>
            {project?.role ? <Badge tone="default">{project.role}</Badge> : null}
            {project?.isFeatured ? <Badge tone="warning">{t('videoDetail.featured', 'FEATURED')}</Badge> : null}
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('videoDetail.meta', 'VIDEO / META')}</p>
          <div className="mt-5 grid gap-4 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('videoDetail.poster', 'POSTER')}</p>
              <p className="mt-2 break-all text-xs text-zinc-400">{posterUrl || '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('videoDetail.videoCount', 'VIDEO FILES')}</p>
              <p className="mt-2">{Array.isArray(project?.btsMedia) ? project.btsMedia.length : 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('videoDetail.visibility', 'VISIBILITY')}</p>
              <p className="mt-2">{project?.isVisible === false ? t('videoDetail.hidden', 'Hidden') : t('videoDetail.live', 'Live')}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
