import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MediaFrame from '../components/MediaFrame.jsx';
import Button from '../components/Button.jsx';

function HomeVideoLoop({ title, url }) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
      <video className="h-full w-full object-cover" src={url} autoPlay loop muted playsInline controls={false} preload="metadata" />
      {title ? <div className="border-t border-black/5 px-5 py-4 text-left text-xs uppercase tracking-[0.24em] text-[#151515]/55">{title}</div> : null}
    </div>
  );
}

export function PortfolioHero({ t, layout, homeVideo }) {
  const slots = Array.isArray(layout?.slots) ? layout.slots : [];
  const heroTitleSlot = slots.find((slot) => slot.id === 'hero-title') || null;
  const heroBackgroundSlot = slots.find((slot) => slot.id === 'hero-background') || null;
  const heroSecondarySlot = slots.find((slot) => slot.id === 'hero-secondary') || null;
  const eyebrow = heroTitleSlot?.eyebrow || 'Cinematic Visuals for Industry & Product';
  const title = heroTitleSlot?.title || t('home.heroTitle', 'Your Name');
  const subtitle = heroTitleSlot?.text || 'A quiet visual portfolio built around large imagery, minimal text, and highly curated motion.';

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-10 md:px-12 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_42%),linear-gradient(180deg,rgba(250,249,246,0.2),rgba(250,249,246,1))]" />
      {heroBackgroundSlot?.mediaUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-18">
          <MediaFrame
            src={heroBackgroundSlot.mediaUrl}
            alt="Hero background"
            type={heroBackgroundSlot.mediaType || 'image'}
            aspectRatio="16 / 9"
            cropX={heroBackgroundSlot.cropX || 50}
            cropY={heroBackgroundSlot.cropY || 50}
            scale={heroBackgroundSlot.scale || 1}
            className="h-full w-full"
          />
        </div>
      ) : null}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative z-10 mx-auto grid max-w-6xl gap-8 text-center md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
        <div className="hidden md:block" />
        <div className="flex flex-col items-center md:items-start">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#151515]/45">{eyebrow}</p>
          <h1 className="mt-5 text-5xl font-light tracking-[0.08em] md:text-8xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#151515]/60 md:mx-0 md:text-base">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as="span" variant="primary">
              <a href="#work">View Work</a>
            </Button>
            <Button as="span" variant="subtle">
              <Link to="/client-access">Client Access</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          {homeVideo?.url ? (
            <div className="w-full max-w-[420px]">
              <HomeVideoLoop title={homeVideo.title} url={homeVideo.url} />
            </div>
          ) : heroSecondarySlot?.mediaUrl ? (
            <div className="w-full max-w-[240px] overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <MediaFrame
                src={heroSecondarySlot.mediaUrl}
                alt={heroSecondarySlot.title || 'Hero secondary'}
                type={heroSecondarySlot.mediaType || 'image'}
                aspectRatio={heroSecondarySlot.aspectRatio || '3 / 4'}
                cropX={heroSecondarySlot.cropX || 50}
                cropY={heroSecondarySlot.cropY || 50}
                scale={heroSecondarySlot.scale || 1}
                className="h-full w-full"
              />
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}

export function PortfolioWorkSection({ projects, layout }) {
  const slots = Array.isArray(layout?.slots) ? layout.slots : [];
  const featuredProjects = [...projects].filter((project) => Boolean(project?.isFeatured));
  const sortedProjects = featuredProjects.sort((a, b) => {
    const aOrder = Number.isFinite(Number(a?.featuredOrder)) ? Number(a.featuredOrder) : Number.POSITIVE_INFINITY;
    const bOrder = Number.isFinite(Number(b?.featuredOrder)) ? Number(b.featuredOrder) : Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.title || '').localeCompare(String(b?.title || ''));
  });

  const wideVideoSlot = slots.find((slot) => slot.id === 'projects-video') || null;

  return (
    <section id="work" className="bg-[#FAF9F6] px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        {wideVideoSlot?.mediaUrl ? (
          <div className="mb-12 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.05)]">
            <MediaFrame
              src={wideVideoSlot.mediaUrl}
              alt={wideVideoSlot.title || 'Projects video'}
              type={wideVideoSlot.mediaType || 'video'}
              aspectRatio={wideVideoSlot.aspectRatio || '21 / 9'}
              cropX={wideVideoSlot.cropX || 50}
              cropY={wideVideoSlot.cropY || 50}
              scale={wideVideoSlot.scale || 1}
              className="h-full w-full"
              autoPlay
              muted
              loop
            />
            {wideVideoSlot.title ? <div className="border-t border-black/5 px-6 py-4 text-xs uppercase tracking-[0.24em] text-[#151515]/55">{wideVideoSlot.title}</div> : null}
          </div>
        ) : null}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#151515]/45">Selected Work</p>
            <h2 className="mt-3 text-2xl font-light tracking-[0.08em] md:text-4xl">Projects</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#151515]/55">Only featured projects appear here. Unfeatured projects stay out of this section.</p>
        </div>
        {sortedProjects.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-white p-8 text-sm text-[#151515]/55 shadow-[0_30px_80px_rgba(0,0,0,0.05)]">
            No featured projects yet.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {sortedProjects.map((project) => {
              const media = {
                mediaUrl: project.coverUrl || project.thumbnailUrl || project.mainVideoUrl || project.videoUrl || '',
                mediaType: project.mainVideoUrl || project.videoUrl ? 'video' : 'image',
                aspectRatio: '4 / 5',
                cropX: 50,
                cropY: 50,
                scale: 1,
              };
              if (!media.mediaUrl) return null;
              return (
                <a key={project.id} href={`/projects/${project.id}`} className="pointer-events-auto group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1">
                  <MediaFrame
                    src={media.mediaUrl}
                    alt={project.title}
                    type={media.mediaType}
                    aspectRatio={media.aspectRatio}
                    cropX={media.cropX}
                    cropY={media.cropY}
                    scale={media.scale}
                    className="bg-black/5"
                  />
                  <div className="p-6 md:p-8"><h3 className="text-xl font-light tracking-[0.08em] md:text-2xl">{project.title}</h3><p className="mt-2 text-sm leading-7 text-[#151515]/55">{project.subtitle}</p></div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function PortfolioFooter() {
  return <footer className="px-6 pb-10 md:px-12"><div className="mx-auto flex max-w-7xl items-center justify-between border-t border-black/5 pt-6 text-[11px] uppercase tracking-[0.24em] text-[#151515]/45"><span>© 2026</span><Link to="/oldhome" className="transition-opacity hover:opacity-60">Old Home</Link></div></footer>;
}
