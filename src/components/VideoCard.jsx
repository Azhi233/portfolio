import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';

function resolveProjectRoute(category) {
  if (category === 'Toys') return '/toys';
  if (category === 'Industrial') return '/industrial';
  if (category === 'Misc') return '/misc';
  return '/';
}

/**
 * 可复用视频卡片（电影级占位与交互）
 * - 支持 CMS projects 字段：title / coverUrl / videoUrl / category
 * - hover: 卡片高级放大、暗色辉光
 * - 非 hover 卡片由父级 group 容器降低 opacity
 * - click: 优先跳转 item.to，否则按 category 跳转
 */
function VideoCard({ item, onHoverStart, onHoverEnd }) {
  const navigate = useNavigate();

  const title = item?.title || 'PROJECT TITLE';
  const tagline = item?.tagline || (item?.isFeatured ? 'FEATURED PROJECT' : "DIRECTOR'S CUT");
  const coverUrl = item?.coverUrl || FALLBACK_COVER;
  const targetRoute = item?.id ? `/project/${item.id}` : item?.to || resolveProjectRoute(item?.category);

  const handleClick = () => {
    navigate(targetRoute);
  };

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty('--mx', `${x.toFixed(2)}%`);
    event.currentTarget.style.setProperty('--my', `${y.toFixed(2)}%`);
  };

  const handleMouseLeave = (event) => {
    event.currentTarget.style.setProperty('--mx', '50%');
    event.currentTarget.style.setProperty('--my', '50%');
    onHoverEnd?.();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onHoverStart={onHoverStart}
      onHoverEnd={handleMouseLeave}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.988 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ '--mx': '50%', '--my': '50%' }}
      className="group/card relative w-full overflow-hidden rounded-2xl border border-white/5 bg-[#050507] text-left shadow-[0_22px_64px_rgba(0,0,0,0.62)] outline-none transition-shadow duration-500 ease-out hover:shadow-[0_28px_96px_rgba(0,0,0,0.82),0_0_120px_rgba(18,18,22,0.55)] focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_COVER;
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(168deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_20%,rgba(255,255,255,0)_42%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/card:opacity-100"
        style={{
          background:
            'radial-gradient(460px circle at var(--mx) var(--my), rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0.00) 62%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/26 to-transparent" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.55),inset_0_0_80px_rgba(0,0,0,0.6)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_45%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.22)_48%,rgba(0,0,0,0.55)_100%)]" />

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
        <p className="font-serif text-[1rem] tracking-[0.1em] text-zinc-100 md:text-[1.08rem]">{title}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-zinc-400/95 md:text-[11px]">{tagline}</p>
      </div>

      <div className="pointer-events-none absolute inset-0 border border-white/5 transition-colors duration-500 group-hover/card:border-white/15" />
    </motion.button>
  );
}

export default VideoCard;
