import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useIntrinsicMediaSize } from '../hooks/useIntrinsicMediaSize.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function SocialGrid({
  items = [],
  heading = 'SOCIAL MATRIX DISTRIBUTION',
  subheading = 'Short-form assets, engineered for feed dominance.',
  statusLabel = '',
}) {
  const rootRef = useRef(null);
  const videoRefs = useRef({});
  const [activeId, setActiveId] = useState(null);

  const cards = useMemo(() => items.slice(0, 4), [items]);
  const intrinsic = useIntrinsicMediaSize();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        gsap.fromTo(
          '.social-card',
          {
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 0.2,
            scale: 0.85,
          },
          {
            x: (i) => [-280, -90, 90, 280][i] ?? 0,
            y: (i) => [20, -26, 24, -18][i] ?? 0,
            rotation: (i) => [-8, -3, 3, 8][i] ?? 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: 'power3.out',
            stagger: 0.05,
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 76%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          '.social-card',
          { y: 18, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 84%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });

      const triggers = cards
        .map((card) => {
          const video = videoRefs.current[card.id];
          if (!video || card.type !== 'video') return null;

          const warmup = () => {
            if (video.preload !== 'metadata') {
              video.preload = 'metadata';
              video.load();
            }
          };

          return ScrollTrigger.create({
            trigger: video,
            start: 'top 90%',
            end: 'bottom 10%',
            onEnter: warmup,
            onEnterBack: warmup,
            onLeave: () => {
              video.pause();
            },
            onLeaveBack: () => {
              video.pause();
            },
          });
        })
        .filter(Boolean);

      return () => {
        triggers.forEach((t) => t.kill());
        mm.revert();
      };
    },
    { scope: rootRef, dependencies: [cards], revertOnUpdate: true },
  );

  const onHover = (id) => {
    setActiveId(id);
    const target = videoRefs.current[id];
    if (!target) return;
    const p = target.play();
    if (p?.catch) p.catch(() => {});
  };

  const onLeave = (id) => {
    setActiveId(null);
    const target = videoRefs.current[id];
    if (!target) return;
    target.pause();
    target.currentTime = 0;
  };

  return (
    <section ref={rootRef} className="bg-[#07090f] px-6 py-28 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <p className="text-center text-xs tracking-[0.26em] text-zinc-500">{heading}</p>
          {statusLabel ? (
            <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-[10px] tracking-[0.12em] text-sky-200">
              {statusLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 text-center text-3xl tracking-[0.12em] text-zinc-100 md:text-5xl">{subheading}</h2>

        <div className="relative mt-14 grid grid-cols-2 gap-4 md:flex md:min-h-[62vh] md:items-center md:justify-center" style={intrinsic.aspectRatio ? { transform: `scale(${intrinsic.aspectRatio > 1 ? 1 : 1})` } : undefined}>
          {cards.map((item) => (
            <article
              key={item.id}
              className={`social-card md:absolute aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 bg-black/35 shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition duration-300 md:w-[210px] ${
                activeId && activeId !== item.id ? 'opacity-50' : 'opacity-100'
              } ${activeId === item.id ? 'z-20 scale-105' : 'z-10 scale-100'}`}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onLeave(item.id)}
            >
              {item.type === 'video' ? (
                <video
                  ref={(el) => {
                    videoRefs.current[item.id] = el;
                  }}
                  src={item.url}
                  poster={item.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img src={item.url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-[11px] tracking-[0.14em] text-zinc-200">{item.title}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialGrid;
