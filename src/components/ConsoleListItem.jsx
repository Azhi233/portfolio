function ConsoleListItem({ children, className = '' }) {
  return <article className={`rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3 ${className}`.trim()}>{children}</article>;
}

export default ConsoleListItem;
