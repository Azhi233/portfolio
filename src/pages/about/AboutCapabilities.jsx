const CAPABILITIES = [
  {
    title: 'Commercial Photography',
    description: '产品静物、品牌视觉与商业内容拍摄。',
  },
  {
    title: 'Video Production',
    description: '品牌视频、营销短片与会议影像输出。',
  },
  {
    title: 'Micro Imaging',
    description: '解决高精密产品的成像与细节表达问题。',
  },
  {
    title: 'Drone Shooting',
    description: '支持复杂场景下的商业航拍与空间表达。',
  },
  {
    title: 'Color Grading',
    description: '统一画面风格，增强质感与传播一致性。',
  },
  {
    title: 'Visual Planning',
    description: '把品牌目标转化为可执行的影像方案。',
  },
];

function AboutCapabilities() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-18 md:px-12 md:py-24">
      <div className="mb-8 border-t border-black/8 pt-14 md:pt-20">
        <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Capabilities</p>
        <h2 className="mt-3 text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.6rem] md:leading-[1.06]">核心能力</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {CAPABILITIES.map((item) => (
          <article key={item.title} className="px-0 py-0">
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-[#141414]">{item.title}</h3>
            <p className="mt-3 max-w-sm text-[15px] leading-8 text-[#141414]/58">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AboutCapabilities;
