import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';

const VIDEO_SECTIONS = [
  {
    id: 'brand',
    title: '品牌展示 Brand & Cinematic',
    subtitle: '横屏高级感产品演示 / 玩具展示视频',
  },
  {
    id: 'social',
    title: '社交媒体 Social Media',
    subtitle: '竖屏信息流产品演示 / 短平快拼装视频',
  },
  {
    id: 'corporate',
    title: '企业/科普 Corporate & Explainer',
    subtitle: '工艺流程科普、企业流程与 3 分钟长视频',
  },
];

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';

function resolveVideoSection(project) {
  const text = `${project.title || ''} ${project.description || ''} ${project.credits || ''}`.toLowerCase();

  if (project.category === 'Toys') return 'brand';
  if (project.category === 'Industrial') return 'corporate';

  if (/social|reel|short|shorts|vertical|竖屏|信息流|短视频/.test(text)) return 'social';
  if (/explainer|corporate|工艺|流程|科普|factory|manufactur|production/.test(text)) return 'corporate';

  return 'brand';
}

const sectionVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  show: (idx) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: Math.min(idx * 0.04, 0.2), ease: 'easeOut' },
  }),
};

function Videography() {
  const { projects } = useConfig();

  const visibleVideos = useMemo(
    () =>
      projects
        .filter((project) => project.isVisible !== false && project.publishStatus === 'Published')
        .map((project) => ({ ...project, videoSection: resolveVideoSection(project) }))
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [projects],
  );

  const grouped = useMemo(() => {
    return VIDEO_SECTIONS.map((section) => ({
      ...section,
      items: visibleVideos.filter((project) => project.videoSection === section.id),
    }));
  }, [visibleVideos]);

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <p className="text-xs tracking-[0.2em] text-zinc-500">CATEGORY</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl">VIDEOGRAPHY</h1>
        <p className="mt-3 text-xs tracking-[0.14em] text-zinc-500">MOTION WORKS · {visibleVideos.length}</p>

        <div className="mt-8 space-y-8">
          {grouped.map((section) => (
            <motion.section
              key={section.id}
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="rounded-3xl border border-white/8 bg-zinc-950/35 p-4 backdrop-blur-sm md:p-6"
            >
              <div className="mb-4">
                <h2 className="font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">{section.title}</h2>
                <p className="mt-2 text-xs tracking-[0.12em] text-zinc-500">{section.subtitle}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((project, index) => (
                  <motion.article
                    key={project.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={project.coverUrl || FALLBACK_COVER}
                        alt={`${project.title} · ${section.title}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_COVER;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-serif text-base tracking-[0.08em] text-zinc-100">{project.title}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed tracking-[0.08em] text-zinc-400">
                        {project.description || 'Cinematic motion work.'}
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`/project/${project.id}`}
                          className="inline-flex rounded-md border border-zinc-500/70 bg-zinc-900/70 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200 transition hover:border-zinc-300"
                        >
                          VIEW DETAILS
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {section.items.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                  NO ITEMS IN THIS VIDEO SECTION YET.
                </div>
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-5 rounded-2xl border border-dashed border-zinc-700/80 bg-black/25 p-4"
              >
                <p className="text-[11px] tracking-[0.14em] text-zinc-500">EMBED CONTAINER RESERVED (iframe / Bilibili / 新片场)</p>
                <div className="mt-2 aspect-video w-full rounded-xl border border-zinc-700/70 bg-zinc-950/70" aria-label="video embed container placeholder" />
              </motion.div>
            </motion.section>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Videography;
