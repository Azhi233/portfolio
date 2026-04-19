function NoticeBox({ tone = 'warning', className = '', children }) {
  const toneClass =
    tone === 'error'
      ? 'border-rose-400/60 bg-rose-400/10 text-rose-200'
      : tone === 'warning'
        ? 'border-amber-400/60 bg-amber-400/10 text-amber-100'
        : 'border-zinc-700 bg-zinc-900/40 text-zinc-200';

  return <div className={`rounded-md border px-3 py-2 text-xs tracking-[0.1em] ${toneClass} ${className}`.trim()}>{children}</div>;
}

export default NoticeBox;
