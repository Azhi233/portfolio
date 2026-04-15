import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';
import AutoRefreshMedia from './AutoRefreshMedia.jsx';

function ProjectShowcase() {
  const { projectData } = useConfig();

  const projectCards = [projectData.toy_project, projectData.industry_project].filter(Boolean).map((item) => ({
    to: item.id === 'industry_project' ? '/project/industry' : '/project/toy',
    title: item.title,
    subtitle: item.subtitle,
    image: item.coverUrl,
  }));

  return (
    <section className="mx-auto min-h-[58vh] w-full max-w-7xl px-6 pb-10 pt-8 md:px-12 md:pt-10">
      <div className="mb-6">
        <p className="font-serif text-2xl tracking-[0.16em] text-zinc-100 md:text-3xl">PROJECT SHOWCASE</p>
        <p className="mt-2 text-sm tracking-[0.14em] text-zinc-500">BUSINESS CASE STUDIES · STRATEGY TO EXECUTION</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projectCards.map((card, index) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={card.to}
              className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/45 shadow-[0_22px_64px_rgba(0,0,0,0.62)]"
            >
              <div className="aspect-[16/11] w-full overflow-hidden">
                <AutoRefreshMedia
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                <p className="font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">{card.title}</p>
                <p className="mt-2 text-sm tracking-[0.08em] text-zinc-300">{card.subtitle}</p>
              </div>
              <div className="pointer-events-none absolute inset-0 border border-white/5 transition-colors duration-500 group-hover:border-white/20" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default ProjectShowcase;
