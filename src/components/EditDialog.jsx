import { AnimatePresence, motion } from 'framer-motion';

export default function EditDialog({
  open,
  title,
  label,
  children,
  onClose,
  onBackdropClick = true,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onBackdropClick ? onClose : undefined}
        >
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-cyan-300/30 bg-zinc-950 p-5 shadow-2xl"
          >
            {label ? <p className="text-xs tracking-[0.22em] text-zinc-500">{label}</p> : null}
            {title ? <h3 className="mt-3 text-lg text-white">{title}</h3> : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
