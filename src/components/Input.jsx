function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/60 placeholder:text-zinc-500 focus:ring-2 ${className}`.trim()}
      {...props}
    />
  );
}

export default Input;
