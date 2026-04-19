function EmptyStateCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500 ${className}`.trim()}>
      {children}
    </div>
  );
}

export default EmptyStateCard;
