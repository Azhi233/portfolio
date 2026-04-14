import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import OgilvyGalleryGrid from '../components/OgilvyGalleryGrid.jsx';
import ProjectShowcase from '../components/ProjectShowcase.jsx';
import EditableText from '../components/EditableText.jsx';
import EditableMedia from '../components/EditableMedia.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

const STAGE_DURATION_MS = 2000;

function Home({ viewMode = 'expertise' }) {
  const { assets, config } = useConfig();
  const [expertiseCategoryFilter, setExpertiseCategoryFilter] = useState('all');

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('introSeen') !== 'true';
  });

  useEffect(() => {
    if (!showIntro) return undefined;

    const timer = window.setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('introSeen', 'true');
    }, STAGE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [showIntro]);

  const expertiseItems = useMemo(
    () =>
      assets
        .filter((asset) => asset?.views?.expertise?.isActive)
        .filter((asset) =>
          expertiseCategoryFilter === 'all' ? true : asset?.views?.expertise?.category === expertiseCategoryFilter,
        )
        .map((asset, index) => ({
          id: asset.id,
          title: asset.title,
          coverUrl: asset.url,
          tagline: asset.views.expertise.description || `EXPERTISE · ${asset.views.expertise.category}`,
          category:
            asset.views.expertise.category === 'industrial'
              ? 'Industrial'
              : asset.views.expertise.category === 'events'
                ? 'Misc'
                : 'Toys',
          sortOrder: index,
          to:
            asset.views.project?.projectId === 'industry_project'
              ? '/project/industry'
              : '/project/toy',
        })),
    [assets, expertiseCategoryFilter],
  );

  const awards = useMemo(
    () =>
      String(config.resumeAwardsText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [config.resumeAwardsText],
  );

  const experiences = useMemo(
    () =>
      String(config.resumeExperienceText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [config.resumeExperienceText],
  );

  const gearList = useMemo(
    () =>
      String(config.resumeGearText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [config.resumeGearText],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] pt-16 text-zinc-100">
      <AnimatePresence>
        {showIntro ? (
          <motion.section
            key="stage-light"
            className="absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeInOut' } }}
          >
            <motion.div
              initial={{ opacity: 0.2, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute left-1/2 top-1/2 h-[52vh] w-[52vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,rgba(116,116,136,0.07)_38%,rgba(5,5,7,0)_72%)] blur-2xl" />
              <h1 className="relative px-6 text-center font-serif text-3xl tracking-[0.18em] text-zinc-100 md:text-5xl">
                DIRECTOR.VISION
              </h1>
            </motion.div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.main
        initial={showIntro ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: showIntro ? 0.9 : 0.35, ease: 'easeOut' }}
        className="relative z-10"
      >
        {viewMode === 'projects' ? (
          <ProjectShowcase />
        ) : (
          <section className="mx-auto min-h-[58vh] w-full max-w-7xl px-6 pb-10 pt-8 md:px-12 md:pt-10">
            <div className="mb-6">
              <EditableText as="p" className="font-serif text-2xl tracking-[0.16em] text-zinc-100 md:text-3xl" value="SELECTED WORKS" />
              <EditableText as="p" className="mt-2 text-sm tracking-[0.14em] text-zinc-500" value="EXPERTISE VIEW · TECHNICAL EXECUTION" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'commercial', label: 'COMMERCIAL' },
                  { id: 'industrial', label: 'INDUSTRIAL' },
                  { id: 'events', label: 'EVENTS' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExpertiseCategoryFilter(item.id)}
                    className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.14em] transition ${
                      expertiseCategoryFilter === item.id
                        ? 'border-zinc-300/70 bg-zinc-100/10 text-zinc-100'
                        : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs tracking-[0.14em] text-zinc-500">ASSETS {expertiseItems.length}</p>
            </div>

            <div className="relative">
              <OgilvyGalleryGrid items={expertiseItems} />
            </div>
          </section>
        )}

        <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-10 md:px-12 md:pt-16">
          <div className="grid gap-10 rounded-3xl border border-white/8 bg-zinc-950/35 p-8 md:grid-cols-[220px_1fr] md:gap-14 md:p-12">
            <div className="flex items-start">
              <EditableMedia
                type="image"
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
                className="h-40 w-40 rounded-full object-cover"
                onChange={() => {}}
              />
            </div>

            <div>
              <EditableText as="p" className="text-xs tracking-[0.22em] text-zinc-500" value="ABOUT THE DIRECTOR" />
              <EditableText as="h2" className="mt-3 font-serif text-3xl tracking-[0.1em] text-zinc-100 md:text-5xl" value="Silence, Frame, Emotion." />

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value="AWARDS" />
                  {awards.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-300">
                      {awards.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">No awards data yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value="EXPERIENCE" />
                  {experiences.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-300">
                      {experiences.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">No experience data yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value="GEAR LIST" />
                  {gearList.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-300">
                      {gearList.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">No gear data yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  );
}

export default Home;
