import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function PortfolioHero({ t, layout }) {
  const slots = Array.isArray(layout?.slots) ? layout.slots : [];
  const heroTitleSlot = slots.find((slot) => slot.id === 'hero-title') || slots.find((slot) => String(slot.id || '').includes('hero')) || null;
  const heroBackgroundSlot = slots.find((slot) => slot.id === 'hero-background') || null;
  const heroSecondarySlot = slots.find((slot) => slot.id === 'hero-secondary') || null;
  const eyebrow = heroTitleSlot?.eyebrow || 'Cinematic Visuals for Industry & Product';
  const title = heroTitleSlot?.title || t('home.heroTitle', 'Your Name');
  const subtitle = heroTitleSlot?.text || 'A quiet visual portfolio built around large imagery, minimal text, and highly curated motion.';
  const mediaUrl = heroBackgroundSlot?.mediaUrl || '';

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-10 md:px-12 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_42%),linear-gradient(180deg,rgba(250,249,246,0.2),rgba(250,249,246,1))]" />
      {mediaUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-18">
          <img src={mediaUrl} alt="Hero background" className="h-full w-full object-cover" style={{ objectPosition: `${heroSlot?.cropX || 50}% ${heroSlot?.cropY || 50}%`, transform: `scale(${heroSlot?.scale || 1})` }} />
        </div>
      ) : null}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative z-10 mx-auto grid max-w-6xl gap-6 text-center md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
        <div className="hidden md:block" />
        <div className="flex flex-col items-center md:items-start">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#151515]/45">{eyebrow}</p>
          <h1 className="mt-5 text-5xl font-light tracking-[0.08em] md:text-8xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#151515]/60 md:mx-0 md:text-base">{subtitle}</p>
        </div>
        <div className="flex justify-center md:justify-end">
          {heroSecondarySlot?.mediaUrl ? (
            <div className="w-full max-w-[240px] overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <img src={heroSecondarySlot.mediaUrl} alt={heroSecondarySlot.title || 'Hero secondary'} className="h-full w-full object-cover" style={{ objectPosition: `${heroSecondarySlot.cropX || 50}% ${heroSecondarySlot.cropY || 50}%`, transform: `scale(${heroSecondarySlot.scale || 1})` }} />
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}

export function PortfolioWorkSection({ projects }) {
  return (
    <section id="work" className="bg-[#FAF9F6] px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#151515]/45">Selected Work</p>
            <h2 className="mt-3 text-2xl font-light tracking-[0.08em] md:text-4xl">Projects</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#151515]/55">Placeholder visuals are used while the backend is offline, so you can review the layout and pacing now.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <a key={project.id} href="/" className="pointer-events-auto group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1">
              <div className="aspect-[4/5] overflow-hidden bg-black/5"><img src={project.image} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
              <div className="p-6 md:p-8"><h3 className="text-xl font-light tracking-[0.08em] md:text-2xl">{project.title}</h3><p className="mt-2 text-sm leading-7 text-[#151515]/55">{project.subtitle}</p></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PortfolioFooter() {
  return <footer className="px-6 pb-10 md:px-12"><div className="mx-auto flex max-w-7xl items-center justify-between border-t border-black/5 pt-6 text-[11px] uppercase tracking-[0.24em] text-[#151515]/45"><span>© 2026</span><Link to="/oldhome" className="transition-opacity hover:opacity-60">Old Home</Link></div></footer>;
}
