function Table({ className = '', children }) {
  return <div className={`overflow-auto rounded-2xl border border-white/10 bg-black/20 ${className}`.trim()}>{children}</div>;
}

export default Table;
