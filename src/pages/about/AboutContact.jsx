function AboutContact() {
  return (
    <section id="contact" className="mx-auto w-full max-w-7xl px-6 pb-28 pt-20 md:px-12 md:pt-24">
      <div className="border-t border-black/8 pt-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">Contact</p>
            <h2 className="mt-3 text-[1.6rem] font-light tracking-[0.03em] text-[#141414] md:text-[2.6rem] md:leading-[1.06]">联系我</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['Email', 'moses233@qq.com'],
              ['WeChat', 'zhiazhia233'],
              ['Resume', 'PDF available'],
            ].map(([label, value]) => (
              <div key={label} className="text-[15px] text-[#141414]/62">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#8f6f52]">{label}</p>
                <p className="mt-3">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutContact;
