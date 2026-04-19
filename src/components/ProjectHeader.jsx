function ProjectHeader({ kicker, title, description, meta, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {kicker ? <p className="text-xs tracking-[0.22em] text-zinc-500">{kicker}</p> : null}
      <h1 className="font-serif text-4xl tracking-[0.08em] text-zinc-100 md:text-6xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300 md:text-base">{description}</p> : null}
      {meta ? <div className="text-xs tracking-[0.14em] text-zinc-500">{meta}</div> : null}
    </div>
  );
}

export default ProjectHeader;
