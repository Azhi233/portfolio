import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MediaFrame from '../components/MediaFrame.jsx';
import Button from '../components/Button.jsx';

function HomeVideoLoop({ title, url }) {
  if (!url) return null;
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video className="h-full w-full object-cover scale-[1.03]" src={url} autoPlay loop muted playsInline controls={false} preload="metadata" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/8 via-transparent to-black/28" />
      {title ? <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/15 bg-black/16 px-3.5 py-1.5 text-[9px] uppercase tracking-[0.22em] text-white/78 backdrop-blur-sm">{title}</div> : null}
    </div>
  );
}

export function PortfolioHero({ t, layout, homeVideo }) {
  const slots = Array.isArray(layout?.slots) ? layout.slots : [];
  const heroBackgroundSlot = slots.find((slot) => slot.id === 'hero-background') || null;
  const heroVideoSlot = slots.find((slot) => slot.id === 'hero-video') || null;
  const videoUrl = homeVideo?.url || heroVideoSlot?.mediaUrl || '';
  const videoTitle = homeVideo?.title || heroVideoSlot?.title || '';

  return (
    <section className="relative min-h-screen overflow-hidden bg-black p-0">
      {videoUrl ? (
        <div className="absolute inset-0">
          <HomeVideoLoop title={videoTitle} url={videoUrl} />
        </div>
      ) : heroBackgroundSlot?.mediaUrl ? (
        <div className="absolute inset-0">
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

      <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-transparent to-black/42" />
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/72">MDWANG</div>
        <nav className="hidden gap-6 text-[10px] uppercase tracking-[0.18em] text-white/40 md:flex">
          <a href="#work" className="transition hover:text-white">Projects</a>
          <Link to="/videos" className="transition hover:text-white">Videos</Link>
          <Link to="/studio-notes" className="transition hover:text-white">Studio Notes</Link>
          <Link to="/about" className="transition hover:text-white">About</Link>
          <Link to="/client-access" className="transition hover:text-white">Client Deliverables</Link>
        </nav>
      </header>

      <div className="absolute left-5 bottom-5 z-20 max-w-[240px] text-[10px] uppercase tracking-[0.24em] text-white/42 md:left-8 md:bottom-8">
        <p>Cinematic Visuals for Industry & Product</p>
        <p className="mt-2 max-w-[180px] text-[9px] leading-5 text-white/28">A quiet visual portfolio built around large imagery, minimal text, and highly curated motion.</p>
      </div>
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
