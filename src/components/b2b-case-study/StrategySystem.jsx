import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { b2bCaseStudyData } from '../../data/b2bCaseStudyData.js';

function StrategySystem() {
  const rootRef = useRef(null);
  const sliderRef = useRef(null);
  const quickRatioRef = useRef(null);
  const isDraggingRef = useRef(false);
  const ratioStateRef = useRef({ value: 0.55 });
  const [ratio, setRatio] = useState(0.55);
  const { strategy } = b2bCaseStudyData;
  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useGSAP(
    () => {
      gsap.from('.strategy-reveal', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 78%',
        },
      });

      quickRatioRef.current = gsap.quickTo(ratioStateRef.current, 'value', {
        duration: isReducedMotion ? 0 : 0.16,
        ease: 'power2.out',
        onUpdate: () => {
          setRatio(Math.max(0.08, Math.min(0.92, ratioStateRef.current.value)));
        },
      });
    },
    { scope: rootRef, dependencies: [isReducedMotion] },
  );

  const updateRatioFromClientX = (clientX) => {
    const el = sliderRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const next = (clientX - rect.left) / rect.width;
    const bounded = Math.max(0.08, Math.min(0.92, next));

    ratioStateRef.current.value = bounded;
    if (quickRatioRef.current) {
      quickRatioRef.current(bounded);
    } else {
      setRatio(bounded);
    }
  };

  const updateRatioDirect = (next) => {
    const bounded = Math.max(0.08, Math.min(0.92, next));
    ratioStateRef.current.value = bounded;
    if (quickRatioRef.current) {
      quickRatioRef.current(bounded);
      return;
    }
    setRatio(bounded);
  };

  return (
    <section ref={rootRef} className="bg-sterile-blue/55 py-16 md:py-24 xl:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-12">
        <div className="mb-8 space-y-3 md:mb-10">
          <p className="strategy-reveal text-[10px] tracking-[0.18em] text-slate-gray/75 md:text-xs md:tracking-[0.22em]">MODULE 02 · STRATEGY SYSTEM</p>
          <h2 className="strategy-reveal text-[28px] font-semibold text-slate-700 sm:text-3xl md:text-4xl">破局策略与系统</h2>
          <p className="strategy-reveal max-w-3xl text-[13px] leading-relaxed text-slate-gray md:text-sm">
            不仅是拍摄，更是系统。将生涩的研发参数转化为高转化的商业视觉语言。
          </p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-primary-white p-3.5 md:gap-6 md:p-6 md:grid-cols-2">
          <article className="strategy-reveal rounded-2xl border border-slate-200 bg-primary-white p-4 md:p-6">
            <p className="mb-4 text-xs tracking-[0.18em] text-slate-gray/70">{strategy.blueprintLabel}</p>
            <div className="grid gap-4">
              {strategy.blueprintImages.map((image) => (
                <img key={image.src} src={image.src} alt={image.alt} className="h-40 w-full rounded-xl object-cover md:h-48" />
              ))}
            </div>
          </article>

          <article className="strategy-reveal rounded-2xl border border-slate-200 bg-primary-white p-4 md:p-6">
            <p className="mb-2 text-[10px] tracking-[0.14em] text-slate-gray/70 md:mb-4 md:text-xs md:tracking-[0.18em]">{strategy.sliderLabel}</p>
            <p className="mb-3 text-[11px] text-slate-gray/75 md:hidden">左右拖动中线查看前后对比</p>

            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label="Before and after comparison slider"
              aria-valuemin={8}
              aria-valuemax={92}
              aria-valuenow={Math.round(ratio * 100)}
              aria-valuetext={`当前对比比例 ${Math.round(ratio * 100)}%`}
              className="relative h-[260px] w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 outline-none touch-pan-x focus-visible:ring-2 focus-visible:ring-slate-400 sm:h-[300px] md:h-[420px]"
              onPointerDown={(event) => {
                isDraggingRef.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                updateRatioFromClientX(event.clientX);
              }}
              onPointerMove={(event) => {
                if (!isDraggingRef.current) return;
                updateRatioFromClientX(event.clientX);
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
              }}
              onClick={(event) => updateRatioFromClientX(event.clientX)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  updateRatioDirect(ratio - 0.03);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  updateRatioDirect(ratio + 0.03);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  updateRatioDirect(0.08);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  updateRatioDirect(0.92);
                }
              }}
            >
              <img src={strategy.beforeImage} alt="Raw production still" className="h-full w-full object-cover" draggable="false" />

              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - ratio * 100}% 0 0)` }}>
                <img src={strategy.afterImage} alt="Color graded production still" className="h-full w-full object-cover" draggable="false" />
              </div>

              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/95"
                style={{ left: `${ratio * 100}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-primary-white px-2.5 py-1.5 text-[9px] tracking-[0.1em] text-slate-700 shadow-sm transition-all duration-200 sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]"
                style={{ left: `${ratio * 100}%` }}
              >
                DRAG
              </div>

              <div className="absolute bottom-2 left-2 rounded-md bg-primary-white/85 px-2 py-1 text-[9px] tracking-[0.1em] text-slate-700 sm:bottom-3 sm:left-3 sm:text-[10px] sm:tracking-[0.12em]">
                RAW
              </div>
              <div className="absolute bottom-2 right-2 rounded-md bg-primary-white/85 px-2 py-1 text-[9px] tracking-[0.1em] text-slate-700 sm:bottom-3 sm:right-3 sm:text-[10px] sm:tracking-[0.12em]">
                GRADED
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default StrategySystem;
