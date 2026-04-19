function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/60 focus:ring-2 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
