function SectionHeader({ kicker, title, description, align = 'left', className = '' }) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className}`.trim()}>
      {kicker ? <p className="text-xs tracking-[0.28em] text-zinc-500">{kicker}</p> : null}
      <h2 className="font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">{description}</p> : null}
    </div>
  );
}

export default SectionHeader;
