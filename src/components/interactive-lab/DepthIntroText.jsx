import { motion, useScroll, useTransform } from 'framer-motion';

function DepthIntroText() {
  const { scrollY } = useScroll();

  const farY = useTransform(scrollY, [0, 900], [0, 80]);
  const midY = useTransform(scrollY, [0, 900], [0, 150]);
  const nearY = useTransform(scrollY, [0, 900], [0, 240]);

  const farScale = useTransform(scrollY, [0, 900], [0.9, 0.98]);
  const midScale = useTransform(scrollY, [0, 900], [1, 1.06]);
  const nearScale = useTransform(scrollY, [0, 900], [1.12, 1.24]);

  return (
    <section className="px-1 py-2 md:py-4">
      <p className="text-xs tracking-[0.26em] text-zinc-500">DEPTH DEMO · SCROLL TEST</p>
      <div className="relative mt-4 h-64 overflow-hidden md:h-[30rem]">
        <motion.p
          style={{ y: farY, scale: farScale }}
          className="absolute left-0 top-8 font-serif text-xl tracking-[0.08em] text-zinc-600 md:text-3xl"
        >
          FAR FIELD / 远景层（慢速 · 小）
        </motion.p>

        <motion.p
          style={{ y: midY, scale: midScale }}
          className="absolute left-4 top-24 font-serif text-3xl tracking-[0.08em] text-zinc-300 md:left-12 md:text-5xl"
        >
          MID SUBJECT / 中景层（中速 · 中）
        </motion.p>

        <motion.p
          style={{ y: nearY, scale: nearScale }}
          className="absolute left-8 top-44 font-serif text-4xl tracking-[0.08em] text-zinc-100 md:left-24 md:text-7xl"
        >
          NEAR FOREGROUND / 前景层（快速 · 大）
        </motion.p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        向下滚动时，三行文字将以不同速度与尺度变化运动，直观看到“近大远小 + 速度差”的景深层级关系。
      </p>
    </section>
  );
}

export default DepthIntroText;
