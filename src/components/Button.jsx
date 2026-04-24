function Button({ as: Tag = 'button', variant = 'default', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs tracking-[0.16em] transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60';
  const variants = {
    default: 'border border-white/10 bg-white/5 text-zinc-100 hover:border-white/25 hover:bg-white/10',
    primary: 'border border-white/10 bg-white text-black hover:bg-zinc-100',
    subtle: 'border border-white/10 bg-transparent text-zinc-200 hover:bg-white/5',
    editor: 'border border-black/10 bg-white text-black hover:bg-zinc-100 hover:border-black/20',
    success: 'border border-emerald-300/30 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20',
    danger: 'border border-rose-300/30 bg-rose-300/10 text-rose-200 hover:bg-rose-300/20',
  };

  return (
    <Tag className={`${base} ${variants[variant] || variants.default} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

export default Button;
