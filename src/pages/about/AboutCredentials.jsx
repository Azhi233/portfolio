const CREDENTIALS = [
  'CAAC 中型无人机机长执照',
  '超视距运行能力',
  '达芬奇调色与后期流程',
  '产品与工业影像经验',
];

function AboutCredentials() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-24">
      <div className="border-t border-black/8 pt-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Credentials</p>
            <h2 className="mt-3 text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.6rem] md:leading-[1.06]">资质与证明</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CREDENTIALS.map((item) => (
              <div key={item} className="text-[15px] tracking-[0.02em] text-[#141414]/62">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutCredentials;
