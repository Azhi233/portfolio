import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

function ParallaxDepthEffect({
  children,
  className = '',
  backgroundLayer,
  foregroundLayer,
}) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-5%', '12%']);
  const subjectY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const foregroundY = useTransform(scrollYProgress, [0, 1], ['10%', '-22%']);

  const backgroundBlur = useTransform(scrollYProgress, [0, 0.5, 1], [5, 2.5, 1.5]);
  const foregroundBlur = useTransform(scrollYProgress, [0, 0.5, 1], [14, 9, 5]);

  return (
    <section
      ref={sectionRef}
      className={`relative isolate overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_25px_80px_rgba(0,0,0,0.45)] ${className}`}
    >
      <motion.div
        aria-hidden
        style={{
          y: backgroundY,
          filter: useTransform(backgroundBlur, (v) => `blur(${v}px)`),
        }}
        className="pointer-events-none absolute -inset-10 z-0 [will-change:transform,filter]"
      >
        {backgroundLayer ?? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(75%_55%_at_50%_24%,rgba(148,163,184,0.2)_0%,rgba(15,23,42,0.12)_42%,rgba(2,6,23,0)_78%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(71,85,105,0.24)_0%,rgba(9,12,24,0.06)_50%,rgba(2,6,23,0.36)_100%)]" />
          </>
        )}
      </motion.div>

      <motion.div
        aria-hidden
        style={{ y: subjectY }}
        className="pointer-events-none absolute inset-0 z-10 [will-change:transform]"
      >
        <div className="absolute inset-y-0 left-[-12%] w-[36%] bg-[linear-gradient(115deg,rgba(236,253,245,0.06)_0%,rgba(6,78,59,0.02)_45%,rgba(2,6,23,0)_100%)]" />
        <div className="absolute inset-y-0 right-[-10%] w-[30%] bg-[linear-gradient(245deg,rgba(191,219,254,0.07)_0%,rgba(30,41,59,0.03)_46%,rgba(2,6,23,0)_100%)]" />
      </motion.div>

      <motion.div style={{ y: subjectY }} className="relative z-20 [will-change:transform]">
        {children}
      </motion.div>

      <motion.div
        aria-hidden
        style={{
          y: foregroundY,
          filter: useTransform(foregroundBlur, (v) => `blur(${v}px)`),
        }}
        className="pointer-events-none absolute inset-0 z-30 [will-change:transform,filter]"
      >
        {foregroundLayer ?? (
          <>
            <div className="absolute -bottom-6 left-[-8%] h-24 w-[42%] rounded-full bg-white/10 opacity-45" />
            <div className="absolute right-[-4%] top-[18%] h-16 w-[28%] rounded-full bg-sky-200/15 opacity-60" />
          </>
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-40 rounded-3xl shadow-[inset_0_0_120px_rgba(0,0,0,0.45)]" />
    </section>
  );
}

export default ParallaxDepthEffect;
