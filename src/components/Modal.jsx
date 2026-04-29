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
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-black/80 p-0 backdrop-blur-xl sm:p-2 md:p-3 lg:p-4 xl:p-5">
      <div className="flex h-[100dvh] w-[100vw] flex-col overflow-hidden rounded-none border border-white/10 bg-[#09090b] p-4 shadow-[0_35px_120px_rgba(0,0,0,0.6)] sm:h-[calc(100dvh-1rem)] sm:w-[calc(100vw-1rem)] sm:rounded-[1.5rem] sm:p-5 md:h-[calc(100dvh-1.5rem)] md:w-[calc(100vw-1.5rem)] md:p-6 lg:h-[calc(100dvh-2rem)] lg:w-[min(100vw-2rem,2800px)] xl:w-[min(100vw-2rem,3200px)] 2xl:w-[min(100vw-2rem,3600px)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">MODAL</p>
            <h2 className="mt-2 truncate text-2xl tracking-[0.08em] text-white sm:text-[1.75rem]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.16em] text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
          >
            CLOSE
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1 sm:py-5 md:pr-2 lg:pr-3">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
