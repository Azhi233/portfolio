import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function MediaCompareModalShell({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-[120] bg-black/95"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 z-20 rounded-full border border-zinc-600 bg-zinc-900/80 p-2 text-zinc-200 transition hover:border-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>

          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
