function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`min-h-[140px] w-full rounded-[1.25rem] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 text-zinc-100 outline-none ring-cyan-400/60 placeholder:text-zinc-500 focus:ring-2 ${className}`.trim()}
      {...props}
    />
  );
}

export default Textarea;
