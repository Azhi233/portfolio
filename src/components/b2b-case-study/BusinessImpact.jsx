import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { b2bCaseStudyData } from '../../data/b2bCaseStudyData.js';

function BusinessImpact() {
  const rootRef = useRef(null);
  const { impactStats } = b2bCaseStudyData;

  useGSAP(
    () => {
      gsap.from('.impact-reveal', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 78%',
        },
      });

      gsap.utils.toArray('.impact-number').forEach((node) => {
        const el = node;
        const target = Number(el.getAttribute('data-target') || 0);
        const suffix = el.getAttribute('data-suffix') || '';
        const counter = { value: 0 };

        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`;
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="bg-sterile-blue/50 py-16 md:py-24 xl:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-12">
        <div className="mb-8 space-y-3 md:mb-10">
          <p className="impact-reveal text-[10px] tracking-[0.18em] text-slate-gray/75 md:text-xs md:tracking-[0.22em]">MODULE 04 · BUSINESS IMPACT</p>
          <h2 className="impact-reveal text-[28px] font-semibold text-slate-700 sm:text-3xl md:text-4xl">商业成效 ROI</h2>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {impactStats.map((item) => (
            <article
              key={item.id}
              className="impact-reveal rounded-2xl border border-slate-200 bg-primary-white p-4 shadow-[0_20px_50px_-36px_rgba(30,41,59,0.4)] sm:p-6"
            >
              <p className="text-[10px] tracking-[0.13em] text-slate-gray/70 sm:text-[11px] sm:tracking-[0.16em]">{item.label}</p>
              <p
                className="impact-number mt-2.5 text-3xl font-semibold text-slate-700 sm:mt-3 sm:text-4xl md:text-5xl"
                data-target={item.value}
                data-suffix={item.suffix}
              >
                0{item.suffix}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-gray sm:mt-4 sm:text-sm">{item.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BusinessImpact;
