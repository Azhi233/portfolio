import { motion, useMotionTemplate, useMotionValue, useSpring, useTime, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const CAMERA_MODES = [
  { id: 'locked', label: 'Locked-off', desc: '稳定凝视', depthFactor: 0.55, jitterAmp: 0.6 },
  { id: 'dolly', label: 'Dolly', desc: '平滑推进', depthFactor: 0.95, jitterAmp: 1.2 },
  { id: 'handheld', label: 'Handheld', desc: '呼吸手持', depthFactor: 1.25, jitterAmp: 3.2 },
];

function CinematicMoodBoard({ onModeChange, onPointerChange }) {
  const boardRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mode, setMode] = useState('dolly');

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 24, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 24, mass: 0.4 });

  const activeMode = useMemo(() => CAMERA_MODES.find((item) => item.id === mode) ?? CAMERA_MODES[1], [mode]);

  const baseFarX = useTransform(smoothX, [0, 1], [-14, 14]);
  const baseFarY = useTransform(smoothY, [0, 1], [-10, 10]);
  const baseMidX = useTransform(smoothX, [0, 1], [-22, 22]);
  const baseMidY = useTransform(smoothY, [0, 1], [-14, 14]);
  const baseNearX = useTransform(smoothX, [0, 1], [-32, 32]);
  const baseNearY = useTransform(smoothY, [0, 1], [-20, 20]);

  const time = useTime();
  const jitterX = useTransform(time, (t) => Math.sin(t / 250) * activeMode.jitterAmp);
  const jitterY = useTransform(time, (t) => Math.cos(t / 310) * activeMode.jitterAmp * 0.8);

  const farLayerX = useTransform(baseFarX, (v) => v * activeMode.depthFactor);
  const farLayerY = useTransform(baseFarY, (v) => v * activeMode.depthFactor);
  const midLayerX = useTransform(baseMidX, (v) => v * activeMode.depthFactor + (activeMode.id === 'handheld' ? 0.5 : 0));
  const midLayerY = useTransform(baseMidY, (v) => v * activeMode.depthFactor);
  const nearLayerX = useTransform(baseNearX, (v) => v * activeMode.depthFactor);
  const nearLayerY = useTransform(baseNearY, (v) => v * activeMode.depthFactor);

  const midCompositeX = useTransform([midLayerX, jitterX], ([a, b]) => a + b);
  const midCompositeY = useTransform([midLayerY, jitterY], ([a, b]) => a + b);
  const nearCompositeX = useTransform([nearLayerX, jitterX], ([a, b]) => a + b * 1.2);
  const nearCompositeY = useTransform([nearLayerY, jitterY], ([a, b]) => a + b * 1.2);

  const lightX = useTransform(smoothX, (v) => `${(v * 100).toFixed(2)}%`);
  const lightY = useTransform(smoothY, (v) => `${(v * 100).toFixed(2)}%`);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${lightX} ${lightY}, rgba(186,230,253,0.22) 0%, rgba(56,189,248,0.1) 30%, rgba(2,6,23,0) 65%)`;

  useEffect(() => {
    onModeChange?.(activeMode.label);
  }, [activeMode.label, onModeChange]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return undefined;

    const handleMove = (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerX.set(Math.max(0, Math.min(1, x)));
      pointerY.set(Math.max(0, Math.min(1, y)));
    };

    el.addEventListener('pointermove', handleMove);

    return () => {
      el.removeEventListener('pointermove', handleMove);
    };
  }, [pointerX, pointerY]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CAMERA_MODES.map((item) => {
          const isActive = item.id === mode;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs tracking-[0.08em] transition ${
                isActive
                  ? 'border-fuchsia-300/70 bg-fuchsia-100/15 text-fuchsia-100 shadow-[inset_0_0_12px_rgba(232,121,249,0.32),0_0_16px_rgba(192,38,211,0.25)]'
                  : 'border-white/15 bg-zinc-900/70 text-zinc-300 hover:border-white/35 hover:text-zinc-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        ref={boardRef}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => setIsHovering(false)}
        className="relative h-[21rem] overflow-hidden rounded-2xl border border-white/10 bg-black md:h-[26rem]"
      >
        <img
          src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1920&q=80"
          alt="cinematic landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />

        <motion.div style={{ background: spotlight }} className="pointer-events-none absolute inset-0 z-20" />

        <motion.div style={{ x: farLayerX, y: farLayerY }} className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-[7%] top-[10%] h-16 w-64 rounded-full bg-slate-300/15 blur-3xl" />
          <div className="absolute right-[8%] top-[24%] h-12 w-48 rounded-full bg-zinc-100/10 blur-2xl" />
        </motion.div>

        <motion.div style={{ x: midCompositeX, y: midCompositeY }} className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute bottom-[20%] left-[14%] rounded-md border border-white/20 bg-black/35 px-3 py-1 text-[10px] tracking-[0.2em] text-zinc-200">
            EXPOSURE +0.3
          </div>
          <div className="absolute bottom-[20%] right-[12%] rounded-md border border-white/20 bg-black/35 px-3 py-1 text-[10px] tracking-[0.2em] text-zinc-200">
            SHUTTER 1/48
          </div>
        </motion.div>

        <motion.div style={{ x: nearCompositeX, y: nearCompositeY }} className="pointer-events-none absolute inset-0 z-40">
          <div className="absolute left-[26%] top-[16%] h-28 w-72 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute right-[20%] bottom-[18%] h-24 w-64 rounded-full bg-cyan-200/18 blur-3xl" />
        </motion.div>

        <div className="pointer-events-none absolute inset-0 z-50 bg-[radial-gradient(120%_95%_at_50%_50%,rgba(0,0,0,0)_48%,rgba(0,0,0,0.62)_100%)]" />

        <motion.div
          animate={{ opacity: isHovering ? 1 : 0.75 }}
          className="pointer-events-none absolute bottom-4 left-4 z-[60] rounded-xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-sm"
        >
          <p className="text-[10px] tracking-[0.2em] text-zinc-400">DIRECTOR INTERACTION</p>
          <p className="mt-1 text-xs tracking-[0.08em] text-zinc-200">{activeMode.label} · {activeMode.desc}</p>
        </motion.div>
      </div>
    </div>
  );
}

export default CinematicMoodBoard;
