function StatusBadge({ children, className = '' }) {
  return (
    <span className={`rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] tracking-[0.12em] text-zinc-400 ${className}`.trim()}>
      {children}
    </span>
  );
}

export default StatusBadge;
