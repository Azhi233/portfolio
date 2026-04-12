import { motion } from 'framer-motion';
import reviews from '../data/reviews.json';

function hashSeed(input) {
  const text = String(input || 'seed');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function FloatingComment({ projectId }) {
  const items = (reviews || []).filter((item) => item.projectId === projectId && item.isFeatured);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      {items.map((item, index) => {
        const seed = hashSeed(item.id);
        const sideLeft = index % 2 === 0;
        const top = 12 + (seed % 68);
        const drift = 8 + (seed % 14);
        const duration = 4 + (seed % 4);

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: [0, -drift, 0] }}
            transition={{
              opacity: { duration: 0.6, ease: 'easeOut' },
              y: { duration, repeat: Infinity, ease: 'easeInOut' },
            }}
            className={`absolute max-w-[240px] rounded-xl border border-white/15 bg-white/8 p-3 backdrop-blur-md ${
              sideLeft ? 'left-4' : 'right-4'
            }`}
            style={{ top: `${top}%` }}
          >
            <p className="text-[11px] leading-relaxed text-zinc-200">“{item.content}”</p>
            <p className="mt-2 text-[10px] tracking-[0.14em] text-zinc-400">— {item.clientName}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export default FloatingComment;
