import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { b2bCaseStudyData } from '../../data/b2bCaseStudyData.js';

function HeroSection() {
  const rootRef = useRef(null);
  const { hero } = b2bCaseStudyData;
  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-kicker', { y: 18, opacity: 0, duration: 0.5 })
        .from('.hero-title', { y: 34, opacity: 0, duration: 0.65 }, '-=0.25')
        .from('.hero-challenge', { y: 18, opacity: 0, duration: 0.55 }, '-=0.3')
        .from('.hero-sub', { y: 14, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-metric', { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.3');

      if (isReducedMotion) return;

      gsap.fromTo(
        '.hero-bg',
        { scale: 1.03 },
        {
          scale: 1.1,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      );

      gsap.to('.hero-bg', {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.hero-grain', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.hero-foreground', {
        yPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: rootRef, dependencies: [isReducedMotion] },
  );

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-primary-white py-20 pt-28 text-slate-gray md:min-h-screen md:py-0 md:pt-0"
    >
      <div className="hero-bg absolute inset-0">
        <img src={hero.backgroundImage} alt="Sterile cleanroom macro visual" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-white/68 via-primary-white/50 to-sterile-blue/78" />
      </div>

      <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.55)_1px,transparent_0)] [background-size:10px_10px] md:opacity-[0.06]" />
      <div className="hero-foreground pointer-events-none absolute -bottom-24 right-[-35%] h-[220px] w-[280px] rounded-full bg-sterile-blue/55 blur-3xl md:-bottom-20 md:right-[-10%] md:h-[420px] md:w-[520px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-12">
        <div className="grid gap-7 md:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-5 md:space-y-6">
            <p className="hero-kicker text-[10px] tracking-[0.2em] text-slate-gray/80 md:text-xs md:tracking-[0.24em]">{hero.kicker}</p>
            <h1 className="hero-title text-[30px] font-semibold leading-[1.15] text-slate-700 sm:text-4xl md:text-6xl">{hero.title}</h1>

            <div className="grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {hero.metrics.map((metric) => (
                <div key={metric.label} className="hero-metric rounded-xl border border-slate-200/80 bg-primary-white/70 px-3.5 py-3 backdrop-blur-sm md:px-4">
                  <p className="text-[10px] tracking-[0.14em] text-slate-gray/70">{metric.label}</p>
                  <p className="mt-1 text-[13px] font-medium text-slate-700 md:text-sm">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-primary-white/74 p-4 backdrop-blur-sm md:space-y-4 md:p-6">
            <p className="hero-sub text-[10px] tracking-[0.16em] text-slate-gray/75 md:text-xs md:tracking-[0.2em]">{hero.challengeLabel}</p>
            <p className="hero-challenge text-[15px] leading-relaxed text-slate-700 md:text-lg">{hero.challenge}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
