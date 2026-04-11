import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const PHOTO_TAGS = [
  { id: 'all', label: '全部 All' },
  { id: 'commercial', label: '商业产品 Commercial' },
  { id: 'industrial', label: '工业纪实 Industrial' },
  { id: 'events', label: '公关活动 Events' },
];

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';

function resolvePhotoTag(project) {
  const text = `${project.title || ''} ${project.description || ''} ${project.credits || ''}`.toLowerCase();

  if (project.category === 'Toys') return 'commercial';
  if (project.category === 'Industrial') return 'industrial';

  if (/木|wood|metal|金属|产品|白底|packshot|commercial/.test(text)) return 'commercial';
  if (/工厂|产线|生产线|车间|industrial|manufactur|process|工艺/.test(text)) return 'industrial';
  if (/会议|展会|event|expo|summit|论坛|发布会/.test(text)) return 'events';

  return 'events';
}

function getAltTags(project, tag) {
  const base = [project.title || '摄影作品'];
  if (tag === 'commercial') base.push('商业产品', '木制/金属产品可适配', '白底图');
  if (tag === 'industrial') base.push('工业纪实', '工艺流程', '生产线');
  if (tag === 'events') base.push('公关活动', '会议/展会', '现场纪实');
  return base.join(' · ');
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    filter: 'blur(3px)',
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};

function Photography() {
  const { projects } = useConfig();
  const [activeTag, setActiveTag] = useState('all');

  const photoProjects = useMemo(
    () =>
      projects
        .filter((project) => project.isVisible !== false && project.publishStatus === 'Published')
        .map((project) => ({ ...project, photoTag: resolvePhotoTag(project) }))
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (activeTag === 'all') return photoProjects;
    return photoProjects.filter((project) => project.photoTag === activeTag);
  }, [photoProjects, activeTag]);

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <p className="text-xs tracking-[0.2em] text-zinc-500">CATEGORY</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl">PHOTOGRAPHY</h1>
        <p className="mt-3 text-xs tracking-[0.14em] text-zinc-500">STATIC IMAGE WORKS · {filteredProjects.length}</p>

        <motion.div layout className="mt-7 flex flex-wrap gap-2 md:gap-3">
          {PHOTO_TAGS.map((tag) => {
            const active = activeTag === tag.id;
            return (
              <motion.button
                key={tag.id}
                type="button"
                onClick={() => setActiveTag(tag.id)}
                whileTap={{ scale: 0.97 }}
                className={`rounded-full border px-4 py-2 text-xs tracking-[0.12em] transition ${
                  active
                    ? 'border-zinc-100 bg-zinc-100/10 text-zinc-100'
                    : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {tag.label}
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mt-8 rounded-3xl border border-white/8 bg-zinc-950/35 p-4 backdrop-blur-sm md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTag}
              layout
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
            >
              {filteredProjects.map((project) => (
                <motion.figure
                  key={project.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={project.coverUrl || FALLBACK_COVER}
                      alt={getAltTags(project, project.photoTag)}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_COVER;
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/5" />
                  </div>
                  <figcaption className="p-3">
                    <p className="font-serif text-sm tracking-[0.08em] text-zinc-100">{project.title}</p>
                    <p className="mt-1 text-[10px] tracking-[0.16em] text-zinc-500">{project.photoTag.toUpperCase()}</p>
                  </figcaption>
                </motion.figure>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProjects.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
              NO MATCHING PHOTOGRAPHY WORKS IN THIS FILTER.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default Photography;
