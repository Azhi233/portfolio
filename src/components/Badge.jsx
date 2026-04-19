function Badge({ tone = 'default', className = '', children }) {
  const tones = {
    default: 'border-white/10 bg-white/5 text-zinc-200',
    success: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    warning: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    danger: 'border-rose-300/30 bg-rose-300/10 text-rose-200',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] tracking-[0.14em] ${tones[tone] || tones.default} ${className}`.trim()}>
      {children}
    </span>
  );
}

export default Badge;
