import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function HeroReveal({
  images,
  kicker = 'PRECISION VISUAL SYSTEM',
  title = 'COMMERCIAL IMPACT',
}) {
  const rootRef = useRef(null);
  const leftImage = images?.left;
  const rightImage = images?.right;
  const mergedImage = images?.merged;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=220%',
            scrub: 1,
            pin: true,
          },
        });

        tl.to('.hero-left', { x: '38vw', scale: 0.42, ease: 'none' }, 0)
          .to('.hero-right', { x: '-38vw', scale: 0.42, ease: 'none' }, 0)
          .to('.hero-kicker', { opacity: 0, y: -20, ease: 'none' }, 0.15)
          .to('.hero-object', { opacity: 1, scale: 1, ease: 'none' }, 0.35)
          .to('.hero-object', { x: '44vw', opacity: 0, ease: 'none' }, 1)
          .to('.hero-title', { opacity: 1, scale: 8.5, ease: 'none' }, 1)
          .to('.hero-title', { opacity: 0.06, ease: 'none' }, 1.2);
      });

      mm.add('(max-width: 767px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 70%',
            end: 'bottom top',
            scrub: true,
          },
        });

        tl.to('.hero-left', { x: '18vw', scale: 0.74, ease: 'none' }, 0)
          .to('.hero-right', { x: '-18vw', scale: 0.74, ease: 'none' }, 0)
          .to('.hero-kicker', { opacity: 0, y: -12, ease: 'none' }, 0.08)
          .to('.hero-object', { opacity: 1, ease: 'none' }, 0.15)
          .to('.hero-title', { opacity: 1, scale: 3.2, ease: 'none' }, 0.45);
      });

      return () => mm.revert();
    },
    { scope: rootRef, revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} className="relative h-screen overflow-hidden bg-black">
      <img
        src={leftImage}
        alt="Left detail"
        loading="lazy"
        className="hero-left absolute left-[-20vw] top-0 h-full w-[62vw] object-cover opacity-90"
      />
      <img
        src={rightImage}
        alt="Right detail"
        loading="lazy"
        className="hero-right absolute right-[-20vw] top-0 h-full w-[62vw] object-cover opacity-90"
      />

      <div className="hero-object pointer-events-none absolute inset-0 opacity-0">
        <img src={mergedImage} alt="Merged object" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/65" />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <p className="hero-kicker text-center text-xs tracking-[0.5em] text-zinc-300 md:text-sm">{kicker}</p>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
        <h1 className="hero-title scale-[0.2] text-center text-5xl font-semibold tracking-[0.2em] text-white opacity-0 md:text-8xl">
          {title}
        </h1>
      </div>
    </section>
  );
}

export default HeroReveal;
