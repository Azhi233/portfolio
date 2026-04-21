import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '../context/I18nContext.jsx';

const FEATURED_PROJECTS = [
  {
    id: 'atelier-no-03',
    title: 'Atelier No. 03',
    subtitle: 'Editorial motion / product stills',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sequence-07',
    title: 'Sequence 07',
    subtitle: 'Cinematic brand portrait',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'frame-study',
    title: 'Frame Study',
    subtitle: 'Quiet light / texture / rhythm',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  },
];

function PortfolioHome() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#151515]">
      <header className="fixed left-0 right-0 top-0 z-[80] grid grid-cols-[1fr_auto_1fr] items-center px-6 py-5 md:px-12 pointer-events-none">
        <Link to="/" className="pointer-events-auto justify-self-start text-[11px] uppercase tracking-[0.32em] text-[#151515]/70 transition-opacity hover:opacity-60">
          {t('home.brand', 'YOUR NAME')}
        </Link>
        <nav className="pointer-events-auto justify-self-center flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.24em] text-[#151515]/55 md:gap-x-6">
          <Link to="/images" className="transition-opacity hover:opacity-60">Images</Link>
          <Link to="/videos" className="transition-opacity hover:opacity-60">Videos</Link>
          <Link to="/about" className="transition-opacity hover:opacity-60">About</Link>
          <Link to="/client-access" className="transition-opacity hover:opacity-60">Client Deliverables</Link>
        </nav>
        <div className="justify-self-end" />
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_42%),linear-gradient(180deg,rgba(250,249,246,0.2),rgba(250,249,246,1))]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative z-10 mx-auto max-w-6xl text-center"
        >
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#151515]/45">Cinematic Visuals for Industry & Product</p>
          <h1 className="mt-5 text-5xl font-light tracking-[0.08em] md:text-8xl">
            {t('home.heroTitle', 'Your Name')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#151515]/60 md:text-base">
            A quiet visual portfolio built around large imagery, minimal text, and highly curated motion.
          </p>
        </motion.div>
      </section>

      <section id="work" className="bg-[#FAF9F6] px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#151515]/45">Selected Work</p>
              <h2 className="mt-3 text-2xl font-light tracking-[0.08em] md:text-4xl">Projects</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#151515]/55">
              Placeholder visuals are used while the backend is offline, so you can review the layout and pacing now.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {FEATURED_PROJECTS.map((project) => (
              <Link
                key={project.id}
                to="/"
                className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/5] overflow-hidden bg-black/5">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-light tracking-[0.08em] md:text-2xl">{project.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#151515]/55">{project.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 pb-10 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-black/5 pt-6 text-[11px] uppercase tracking-[0.24em] text-[#151515]/45">
          <span>© 2026</span>
          <Link to="/oldhome" className="transition-opacity hover:opacity-60">Old Home</Link>
        </div>
      </footer>
    </main>
  );
}

export default PortfolioHome;
