import { Link } from 'react-router-dom';

function AboutHero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-28 md:px-12 md:pt-32">
      <div className="grid gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">About</p>
          <h1 className="mt-5 text-[3.1rem] font-light tracking-[0.03em] text-[#141414] md:text-[5.1rem] lg:text-[6.6rem]">
            王鸣笛
          </h1>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[#141414]/40">
            Visual Engineer / Commercial Photographer
          </p>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#141414]/60 md:text-[17px] md:leading-9">
            专注商业摄影、视频制作与视觉策划，将品牌需求转化为克制、准确且具有传播力的影像。
          </p>
          <div className="mt-8 flex flex-wrap gap-7 text-[10px] uppercase tracking-[0.32em] text-[#141414]/38">
            <Link to="/studio-notes" className="transition-opacity hover:opacity-55">
              Studio Notes
            </Link>
            <a href="#contact" className="transition-opacity hover:opacity-55">
              Contact
            </a>
          </div>
        </div>

        <div className="overflow-hidden bg-[#f4f0ea]">
          <img
            src="https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=1200&q=80"
            alt="Editorial still"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default AboutHero;
