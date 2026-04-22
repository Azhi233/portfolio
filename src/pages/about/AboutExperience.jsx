const EXPERIENCE = [
  {
    index: '01',
    title: '独立工作室主理人',
    description: '负责从创意沟通到交付落地的完整视觉流程。',
  },
  {
    index: '02',
    title: '企业内部视觉内容建设',
    description: '深入 B2B 企业场景，主导品牌与内容输出。',
  },
  {
    index: '03',
    title: '商业项目执行',
    description: '参与产品、视频、会议与航拍等多类型项目。',
  },
];

function AboutExperience() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-24">
      <div className="border-t border-black/8 pt-14 md:pt-20">
        <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Experience</p>
        <h2 className="mt-3 text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.6rem] md:leading-[1.06]">经历与背景</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          {EXPERIENCE.map((item) => (
            <article key={item.title} className="px-0 py-0">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8f6f52]">{item.index}</p>
              <h3 className="mt-3 text-[15px] tracking-[0.08em] text-[#141414]">{item.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-8 text-[#141414]/58">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutExperience;
