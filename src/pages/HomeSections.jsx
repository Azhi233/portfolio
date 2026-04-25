import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import MediaPreview from '../components/MediaPreview.jsx';

export function HomeHeroSection({ locale, t }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-12">
          <p className="text-[11px] tracking-[0.32em] text-zinc-500">{t('home.eyebrow')}</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.02] tracking-[0.08em] text-white md:text-7xl">{t('home.title')}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{t('home.subtitle')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/oldvideo"><Button as="span" variant="primary">{t('home.viewVideos', 'View Videos')}</Button></Link>
            <Link to="/oldImages"><Button as="span" variant="subtle">{t('home.viewImages', 'View Images')}</Button></Link>
            <Link to="/client-access"><Button as="span" variant="subtle">{t('home.clientAccess')}</Button></Link>
            <Link to="/console"><Button as="span" variant="default">{t('home.console')}</Button></Link>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_36%,rgba(0,0,0,0.22)_72%)] p-8 md:p-12 lg:border-l lg:border-t-0">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('home.navigation')}</p>
          <div className="mt-5 grid gap-3">
            {[
              ['/videos', locale === 'zh' ? '视频页' : 'VIDEO PAGE', locale === 'zh' ? '独立浏览作品视频' : 'Browse portfolio videos separately'],
              ['/images', locale === 'zh' ? '图片页' : 'IMAGE PAGE', locale === 'zh' ? '独立浏览图片文件' : 'Browse image files separately'],
              ['/client-access', t('home.navAccess'), t('home.navAccessDesc')],
              ['/about', t('home.navAbout'), t('home.navAboutDesc')],
              ['/console', t('home.navConsole'), t('home.navConsoleDesc')],
            ].map(([to, title, desc]) => (
              <Link key={to} to={to} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.05]">
                <p className="text-sm tracking-[0.12em] text-white">{title}</p>
                <p className="mt-1 text-sm leading-7 text-zinc-400">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HomeHighlightsSection({ highlights }) {
  return <div className="grid gap-4 md:grid-cols-3">{Object.values(highlights).map(([id, title, desc]) => <Card key={id} className="p-6"><p className="text-[11px] tracking-[0.22em] text-zinc-500">{id}</p><h2 className="mt-4 text-lg tracking-[0.12em] text-white">{title}</h2><p className="mt-3 text-sm leading-7 text-zinc-400">{desc}</p></Card>)}</div>;
}

export function HomeFeaturedSection({ featuredImages, featuredVideos }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="p-6 md:p-8">
        <p className="text-[11px] tracking-[0.22em] text-zinc-500">FEATURED IMAGES</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {featuredImages.length ? featuredImages.map((item) => <Link key={item.id} to="/images" className="group overflow-hidden rounded-2xl"><div className="overflow-hidden bg-transparent"><img src={item.coverUrl || item.thumbnailUrl || item.url} alt={item.title} className="h-auto w-full object-contain transition duration-700 group-hover:scale-105" /></div><div className="pt-3"><p className="text-sm tracking-[0.08em] text-white">{item.title}</p></div></Link>) : <p className="text-sm text-zinc-400">No featured images yet.</p>}
        </div>
      </Card>
      <Card className="p-6 md:p-8">
        <p className="text-[11px] tracking-[0.22em] text-zinc-500">FEATURED VIDEOS</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {featuredVideos.length ? featuredVideos.map((item) => <Link key={item.id} to="/videos" className="group overflow-hidden rounded-2xl"><div className="overflow-hidden bg-transparent"><MediaPreview src={item.videoUrl || item.mainVideoUrl || item.coverUrl || item.thumbnailUrl} title={item.title} kind="video" autoPlay={false} muted className="h-auto w-full object-contain transition duration-700 group-hover:scale-[1.01]" /></div><div className="pt-3"><p className="text-sm tracking-[0.08em] text-white">{item.title}</p></div></Link>) : <p className="text-sm text-zinc-400">No featured videos yet.</p>}
        </div>
      </Card>
    </section>
  );
}

export function HomeStructureSection({ locale, t }) {
  return <Card className="p-8 md:p-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('home.signals')}</p><h2 className="mt-3 text-2xl tracking-[0.08em] text-white">{t('home.structure')}</h2></div><Badge tone="warning">{locale === 'zh' ? '重构模式' : 'REWRITE MODE'}</Badge></div><p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300">{t('home.structureDesc')}</p></Card>;
}
