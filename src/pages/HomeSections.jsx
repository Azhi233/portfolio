import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

export function HomeHeroSection({ t, homeVideoUrl, homeVideoTitle, homeVideoCaption }) {
  const captionLines = String(homeVideoCaption || '').trim();
  const captionPreview = captionLines.split('\n').slice(0, 6).join('\n');
  const captionWords = captionLines.split(/\s+/).filter(Boolean).length;
  const fontSizeClass = captionWords > 28 ? 'text-[10px] leading-5 tracking-[0.2em]' : captionWords > 16 ? 'text-[11px] leading-6 tracking-[0.22em]' : 'text-[12px] leading-7 tracking-[0.24em]';

  return (
    <section className="space-y-6">
      <p className="text-[11px] tracking-[0.32em] text-zinc-500">{t('home.eyebrow')}</p>
      <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-[0.08em] text-white md:text-7xl">{t('home.title')}</h1>
      {homeVideoTitle ? <p className="text-[11px] tracking-[0.22em] text-zinc-500">{homeVideoTitle}</p> : null}
      <div className="relative mt-2 overflow-hidden rounded-[2rem] border border-white/10 bg-black/25">
        {homeVideoUrl ? (
          <video className="h-auto w-full max-h-[72vh] object-cover" src={homeVideoUrl} autoPlay loop muted playsInline controls={false} preload="metadata" />
        ) : (
          <div className="border border-dashed border-white/15 px-6 py-16 text-sm text-zinc-400">
            No homepage video uploaded yet.
            <div className="mt-2 text-xs text-zinc-500">Upload one in Console → Homepage Copy → Homepage Video.</div>
          </div>
        )}
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
