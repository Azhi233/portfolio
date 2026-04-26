import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

export function HomeHeroSection({ t, homeVideoUrl, homeVideoTitle }) {
  return (
    <section className="space-y-6">
      <p className="text-[11px] tracking-[0.32em] text-zinc-500">{t('home.eyebrow')}</p>
      <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-[0.08em] text-white md:text-7xl">{t('home.title')}</h1>
      {homeVideoTitle ? <p className="text-[11px] tracking-[0.22em] text-zinc-500">{homeVideoTitle}</p> : null}
      {homeVideoUrl ? (
        <video className="mt-2 h-auto w-full" src={homeVideoUrl} autoPlay loop muted playsInline controls={false} preload="metadata" />
      ) : (
        <div className="mt-2 border border-dashed border-white/15 px-6 py-16 text-sm text-zinc-400">
          No homepage video uploaded yet.
          <div className="mt-2 text-xs text-zinc-500">Upload one in Console → Config → Homepage Video.</div>
        </div>
      )}
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
