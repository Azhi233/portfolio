function TabChip({ active = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.14em] transition ${
        active
          ? 'border-zinc-300/80 bg-zinc-100/10 text-zinc-100'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

export default TabChip;
