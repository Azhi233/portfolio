import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function AssetSwitch({ images, phaseCopy }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=260%',
            scrub: true,
            pin: true,
          },
        });

        tl.to('.stage-raw', { opacity: 1, scale: 1, duration: 1 }, 0)
          .to('.copy-1', { opacity: 1, y: 0, duration: 0.4 }, 0.05)
          .to('.copy-1', { opacity: 0, y: -18, duration: 0.4 }, 0.95)
          .to('.stage-raw', { opacity: 0.12, scale: 0.82, duration: 0.7 }, 1)
          .to('.stage-web', { opacity: 1, scale: 1, duration: 0.7 }, 1)
          .to('.copy-2', { opacity: 1, y: 0, duration: 0.4 }, 1.08)
          .to('.copy-2', { opacity: 0, y: -18, duration: 0.4 }, 1.95)
          .to('.stage-web', { opacity: 0.2, scale: 0.88, duration: 0.75 }, 2)
          .to('.stage-print', { opacity: 1, scale: 1, duration: 0.75 }, 2)
          .to('.copy-3', { opacity: 1, y: 0, duration: 0.4 }, 2.08);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          ['.stage-raw', '.stage-web', '.stage-print'],
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          },
        );

        gsap.fromTo(
          ['.copy-1', '.copy-2', '.copy-3'],
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.12,
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 78%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: rootRef, revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} className="grid min-h-screen grid-cols-1 bg-[#05060a] md:h-screen md:grid-cols-2">
      <div className="relative min-h-[52vh] overflow-hidden border-b border-white/10 md:min-h-0 md:border-b-0 md:border-r">
        <img src={images.raw} alt="Raw visual" loading="lazy" className="stage-raw absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="stage-web absolute inset-0 opacity-0">
          <img src={images.web} alt="Web UI frame" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-[13%] rounded-2xl border border-white/20" />
        </div>
        <img src={images.print} alt="Print mockup" loading="lazy" className="stage-print absolute inset-0 h-full w-full object-cover opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-black/45" />
      </div>

      <div className="relative flex items-center px-8 py-10 md:px-14">
        <div className="space-y-5">
          <p className="text-xs tracking-[0.25em] text-zinc-500">ASSET FLOW TRANSFORMATION</p>
          <h2 className="text-3xl tracking-[0.1em] text-zinc-100 md:text-5xl">One master visual.
            <br />Three delivery systems.</h2>

          <div className="relative mt-8 min-h-[200px]">
            <article className="copy-1 absolute inset-0 translate-y-3 opacity-0 md:min-h-0">
              <p className="text-xs tracking-[0.16em] text-zinc-500">PHASE 01 / RAW</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">{phaseCopy.raw}</p>
            </article>
            <article className="copy-2 absolute inset-0 translate-y-3 opacity-0 md:min-h-0">
              <p className="text-xs tracking-[0.16em] text-zinc-500">PHASE 02 / WEB</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">{phaseCopy.web}</p>
            </article>
            <article className="copy-3 absolute inset-0 translate-y-3 opacity-0 md:min-h-0">
              <p className="text-xs tracking-[0.16em] text-zinc-500">PHASE 03 / PRINT</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">{phaseCopy.print}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AssetSwitch;
