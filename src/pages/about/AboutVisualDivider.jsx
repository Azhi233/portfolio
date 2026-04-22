function AboutVisualDivider() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
      <div className="border-t border-black/8 pt-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Approach</p>
            <h2 className="mt-3 max-w-3xl text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.6rem] md:leading-[1.06]">
              克制、准确、干净。
            </h2>
          </div>
          <p className="max-w-xl text-[15px] leading-8 text-[#141414]/55 md:text-[16px] md:leading-9">
            页面尽量减少装饰和多余信息，把空间、字体和层级留给作品与内容本身。
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutVisualDivider;
