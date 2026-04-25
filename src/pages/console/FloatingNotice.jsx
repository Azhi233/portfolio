export default function FloatingNotice({ open, tone = 'success', children }) {
  if (!open) return null;

  const toneClasses =
    tone === 'danger'
      ? 'border-rose-400/30 bg-rose-950/85 text-rose-100'
      : tone === 'info'
        ? 'border-zinc-300/20 bg-zinc-950/85 text-zinc-100'
        : 'border-emerald-400/30 bg-emerald-950/85 text-emerald-100';

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 animate-[fadeFloat_2.2s_ease-in-out_forwards]">
      <div className={`max-w-[calc(100vw-2rem)] rounded-full border px-4 py-2 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur ${toneClasses}`}>
        {children}
      </div>
    </div>
  );
}
