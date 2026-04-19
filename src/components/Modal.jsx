import { useEffect } from 'react';

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/70 p-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">MODAL</p>
            <h2 className="mt-2 text-2xl tracking-[0.08em] text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.16em] text-zinc-200"
          >
            CLOSE
          </button>
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
