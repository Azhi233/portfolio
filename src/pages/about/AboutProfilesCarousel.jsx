import { useEffect, useMemo, useRef, useState } from 'react';
import CarouselDots from '../../components/CarouselDots.jsx';
import AboutProfileCard from './AboutProfileCard.jsx';

function AboutProfilesCarousel({ profiles = [] }) {
  const visibleProfiles = useMemo(() => profiles.filter((profile) => profile?.enabled !== false), [profiles]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    setActiveIndex((current) => {
      if (!visibleProfiles.length) return 0;
      return current >= visibleProfiles.length ? 0 : current;
    });
  }, [visibleProfiles.length]);

  const goTo = (index) => {
    if (!visibleProfiles.length) return;
    const clamped = Math.max(0, Math.min(index, visibleProfiles.length - 1));
    setActiveIndex(clamped);
    const scroller = listRef.current;
    if (!scroller) return;
    const child = scroller.children?.[clamped];
    if (child?.scrollIntoView) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  if (!visibleProfiles.length) {
    return (
      <section className="mx-auto w-full max-w-7xl px-6 pt-8 md:px-12 md:pt-12">
        <div className="rounded-[2rem] border border-dashed border-[#141414]/10 bg-white/60 p-8 text-center text-sm text-[#141414]/55">
          暂无可显示的个人资料，请先在后台添加。
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-8 md:px-12 md:pt-12">
      <div className="mb-5 flex flex-col gap-4 border-b border-[#141414]/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Profiles</p>
          <h2 className="mt-3 text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.2rem]">团队摄影师档案</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-8 text-[#141414]/58">
            这里展示三位摄影师的独立资料。页面采用统一卡片体系，确保在人数增加后依然保持整洁、克制和可扩展。
          </p>
        </div>
        <div className="self-start md:self-auto">
          <CarouselDots count={visibleProfiles.length} activeIndex={activeIndex} onSelect={goTo} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3" ref={listRef}>
        {visibleProfiles.map((profile, index) => (
          <div key={profile.id} className="min-w-0">
            <AboutProfileCard profile={profile} active={index === activeIndex} variant={visibleProfiles.length > 3 ? 'compact' : 'default'} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#141414]/38">
          {activeIndex + 1} / {visibleProfiles.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex <= 0}
            className="rounded-full border border-[#141414]/10 px-4 py-2 text-xs tracking-[0.16em] text-[#141414]/70 transition hover:bg-[#141414]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= visibleProfiles.length - 1}
            className="rounded-full border border-[#141414]/10 px-4 py-2 text-xs tracking-[0.16em] text-[#141414]/70 transition hover:bg-[#141414]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default AboutProfilesCarousel;
