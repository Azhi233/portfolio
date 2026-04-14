import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { b2bCaseStudyData } from '../../data/b2bCaseStudyData.js';

function MediaFallback({ title, compact = false }) {
  const fallbackCopies = useMemo(
    () => [
      {
        headline: '素材正在摸鱼中…',
        body: '别慌，视觉资产只是去喝了杯咖啡，马上回来。',
      },
      {
        headline: '画面临时出差中…',
        body: '它去跟甲方开会了，预计很快带着笑容返场。',
      },
      {
        headline: '镜头信号迷路了…',
        body: '请给它 3 秒钟导航，它正沿着光纤狂奔回来。',
      },
    ],
    [],
  );

  const selectedCopy = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * fallbackCopies.length);
    return fallbackCopies[randomIndex];
  }, [fallbackCopies]);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sterile-blue to-primary-white px-4 text-center text-slate-gray ${compact ? 'gap-1.5' : 'gap-2.5'}`}
    >
      <p className={`${compact ? 'text-[10px]' : 'text-xs'} tracking-[0.14em] text-slate-gray/70`}>MEDIA OFFLINE</p>
      <p className={`${compact ? 'text-[13px]' : 'text-sm'} font-medium text-slate-700`}>{selectedCopy.headline}</p>
      <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-slate-gray/80`}>{title}</p>
      <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-gray/70`}>{selectedCopy.body}</p>
    </div>
  );
}

function AssetGallery() {
  const rootRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [failedMedia, setFailedMedia] = useState({});
  const items = b2bCaseStudyData.gallery;

  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  useGSAP(
    () => {
      gsap.from('.asset-reveal', {
        y: 14,
        opacity: 0,
        duration: isReducedMotion ? 0.01 : 0.6,
        stagger: isReducedMotion ? 0 : 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 80%',
        },
      });
    },
    { scope: rootRef, dependencies: [isReducedMotion] },
  );

  useEffect(() => {
    if (!activeItem) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(-1);
      if (event.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      if (event.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % items.length);
    };

    window.addEventListener('keydown', onKeyDown);

    requestAnimationFrame(() => {
      if (!overlayRef.current || !panelRef.current) return;
      if (isReducedMotion) {
        gsap.set(overlayRef.current, { opacity: 1 });
        gsap.set(panelRef.current, { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 12, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' },
      );
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeItem, isReducedMotion, items.length]);

  const markFailed = (id, kind) => {
    setFailedMedia((prev) => ({ ...prev, [`${id}-${kind}`]: true }));
  };

  return (
    <section ref={rootRef} className="bg-primary-white py-16 md:py-24 xl:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-12">
        <div className="mb-8 space-y-3 md:mb-10">
          <p className="asset-reveal text-[10px] tracking-[0.18em] text-slate-gray/75 md:text-xs md:tracking-[0.22em]">MODULE 03 · ASSET GALLERY</p>
          <h2 className="asset-reveal text-[28px] font-semibold text-slate-700 sm:text-3xl md:text-4xl">核心交付资产</h2>
        </div>

        <div className="grid auto-rows-[190px] grid-cols-1 gap-3 sm:auto-rows-[210px] sm:grid-cols-2 sm:gap-4 lg:auto-rows-[220px] lg:grid-cols-4">
          {items.map((item, index) => {
            const cardFailed = failedMedia[`${item.id}-card`];

            return (
              <button
                key={item.id}
                type="button"
                className={`asset-reveal group relative overflow-hidden rounded-2xl border border-slate-200 bg-sterile-blue/35 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-30px_rgba(30,41,59,0.38)] ${item.span}`}
                onClick={() => setActiveIndex(index)}
              >
                {cardFailed ? (
                  <MediaFallback title={item.title} compact />
                ) : item.type === 'video' ? (
                  <video
                    src={item.media}
                    poster={item.thumb}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={() => markFailed(item.id, 'card')}
                    onMouseEnter={(e) => {
                      if (!window.matchMedia('(hover: hover)').matches) return;
                      void e.currentTarget.play();
                    }}
                    onMouseLeave={(e) => {
                      if (!window.matchMedia('(hover: hover)').matches) return;
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={item.thumb}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    onError={() => markFailed(item.id, 'card')}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-primary-white sm:p-4">
                  <p className="text-[10px] tracking-[0.13em] text-primary-white/80 sm:text-[11px] sm:tracking-[0.16em]">{item.category}</p>
                  <p className="mt-1.5 text-[13px] font-medium sm:mt-2 sm:text-sm">{item.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeItem ? (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/86 p-2.5 backdrop-blur-sm sm:p-4"
          role="presentation"
          onClick={() => setActiveIndex(-1)}
        >
          <div
            ref={panelRef}
            className="relative max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200/20 bg-black sm:max-h-[92vh] sm:rounded-2xl"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-20 rounded-md bg-primary-white px-2.5 py-1 text-[10px] tracking-[0.1em] text-slate-700 sm:right-3 sm:top-3 sm:px-3 sm:text-xs sm:tracking-[0.12em]"
              onClick={() => setActiveIndex(-1)}
            >
              CLOSE
            </button>

            <button
              type="button"
              aria-label="Previous media"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-primary-white/95 px-2 py-1.5 text-[10px] tracking-[0.1em] text-slate-700 sm:left-3 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
              onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
            >
              PREV
            </button>
            <button
              type="button"
              aria-label="Next media"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-primary-white/95 px-2 py-1.5 text-[10px] tracking-[0.1em] text-slate-700 sm:right-3 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
              onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
            >
              NEXT
            </button>

            {failedMedia[`${activeItem.id}-lightbox`] ? (
              <MediaFallback title={activeItem.title} />
            ) : activeItem.type === 'video' ? (
              <video
                src={activeItem.media}
                controls
                autoPlay
                muted
                playsInline
                className="max-h-[94vh] w-full object-contain sm:max-h-[92vh]"
                onError={() => markFailed(activeItem.id, 'lightbox')}
              />
            ) : (
              <img
                src={activeItem.media}
                alt={activeItem.title}
                className="max-h-[94vh] w-full object-contain sm:max-h-[92vh]"
                onError={() => markFailed(activeItem.id, 'lightbox')}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AssetGallery;
