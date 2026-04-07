import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import CinematicMasonry from '../components/CinematicMasonry.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

const STAGE_DURATION_MS = 2000;

function Home() {
  const { projects, config } = useConfig();

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

  const visibleProjects = useMemo(
    () =>
      projects
        .filter((project) => project.isVisible !== false && project.publishStatus === 'Published')
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [projects],
  );

  const featuredProjects = useMemo(
    () => visibleProjects.filter((project) => project.isFeatured === true),
    [visibleProjects],
  );

  const wallProjects = featuredProjects.length > 0 ? featuredProjects : visibleProjects;

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
        <section className="mx-auto min-h-[58vh] w-full max-w-7xl px-6 pb-10 pt-8 md:px-12 md:pt-10">
          <div className="mb-6">
            <p className="font-serif text-2xl tracking-[0.16em] text-zinc-100 md:text-3xl">SELECTED WORKS</p>
            <p className="mt-2 text-sm tracking-[0.14em] text-zinc-500">CINEMATIC WALL · PARALLAX FLOW</p>
            <p className="mt-2 text-xs tracking-[0.14em] text-zinc-500">
              VISIBLE {visibleProjects.length} · FEATURED {featuredProjects.length}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-zinc-950/40 p-4 backdrop-blur-sm md:p-6">
            {wallProjects.length > 0 ? (
              <CinematicMasonry projects={wallProjects} columns={4} />
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
                NO VISIBLE PROJECTS. ENABLE ITEMS IN DIRECTOR CONSOLE.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-10 md:px-12 md:pt-16">
          <div className="grid gap-10 rounded-3xl border border-white/8 bg-zinc-950/35 p-8 md:grid-cols-[220px_1fr] md:gap-14 md:p-12">
            <div className="flex items-start">
              <div className="h-40 w-40 rounded-full border border-white/15 bg-gradient-to-b from-zinc-700/30 via-zinc-800/30 to-zinc-950/70" />
            </div>

            <div>
              <p className="text-xs tracking-[0.22em] text-zinc-500">ABOUT THE DIRECTOR</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[0.1em] text-zinc-100 md:text-5xl">Silence, Frame, Emotion.</h2>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
                我关注“光线如何推动叙事”，也关注“留白如何让情绪停留”。在玩具、工业与日常杂项之间，我尝试
                用统一的电影化语言去建立节奏：克制的构图、缓慢的运动、精准的色温与材质表达。每一个镜头，
                都是对时间和质感的一次再编排。
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs tracking-[0.2em] text-zinc-500">AWARDS</p>
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
                  <p className="text-xs tracking-[0.2em] text-zinc-500">EXPERIENCE</p>
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
                  <p className="text-xs tracking-[0.2em] text-zinc-500">GEAR LIST</p>
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

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs tracking-[0.12em] text-zinc-400">
                {config.contactEmail ? <p>Email: {config.contactEmail}</p> : null}
                {config.contactPhone ? <p>Phone: {config.contactPhone}</p> : null}
                {config.contactLocation ? <p>Location: {config.contactLocation}</p> : null}
              </div>
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  );
}

export default Home;
