import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const RATIOS = [
  { id: 'classic43', label: '4:3 古典', value: 4 / 3, caption: 'Academy / 1.33:1' },
  { id: 'standard169', label: '16:9 标准', value: 16 / 9, caption: 'Digital / 1.77:1' },
  { id: 'scope235', label: '2.35:1 宽银幕', value: 2.35, caption: 'Cinemascope / 2.35:1' },
];

const BASE_ASPECT = 16 / 9;

function buildMaskSize(targetAspect) {
  if (targetAspect > BASE_ASPECT) {
    const normalizedWidth = 160;
    const normalizedHeight = 90;
    const visibleHeight = normalizedWidth / targetAspect;
    const barHeightPercent = ((normalizedHeight - visibleHeight) / 2 / normalizedHeight) * 100;

    return {
      top: Math.max(0, barHeightPercent),
      bottom: Math.max(0, barHeightPercent),
      left: 0,
      right: 0,
    };
  }

  if (targetAspect < BASE_ASPECT) {
    const normalizedWidth = 160;
    const normalizedHeight = 90;
    const visibleWidth = normalizedHeight * targetAspect;
    const barWidthPercent = ((normalizedWidth - visibleWidth) / 2 / normalizedWidth) * 100;

    return {
      top: 0,
      bottom: 0,
      left: Math.max(0, barWidthPercent),
      right: Math.max(0, barWidthPercent),
    };
  }

  return { top: 0, bottom: 0, left: 0, right: 0 };
}

function AspectRatioToggle({
  initialRatio = 'scope235',
  onRatioChange,
  onShutterPulse,
  lockOnMobile = true,
  autoCycle = false,
  cycleMs = 2000,
  showAutoControl = true,
}) {
  const [activeRatio, setActiveRatio] = useState(initialRatio);
  const [isMobileLocked, setIsMobileLocked] = useState(false);
  const [switchTick, setSwitchTick] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(autoCycle);

  useEffect(() => {
    setIsAutoCycling(autoCycle);
  }, [autoCycle]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const applyScreenMode = (matched) => {
      const shouldLock = lockOnMobile && matched;
      setIsMobileLocked(shouldLock);
      if (shouldLock) {
        setActiveRatio('standard169');
        onRatioChange?.('standard169');
      }
    };

    applyScreenMode(mediaQuery.matches);

    const handleChange = (event) => {
      applyScreenMode(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [lockOnMobile, onRatioChange]);

  const activeConfig = useMemo(() => RATIOS.find((item) => item.id === activeRatio) ?? RATIOS[2], [activeRatio]);
  const maskSize = useMemo(() => buildMaskSize(activeConfig.value), [activeConfig.value]);

  useEffect(() => {
    if (!isAutoCycling || isMobileLocked) return undefined;

    const timer = window.setInterval(() => {
      setActiveRatio((current) => {
        const currentIndex = RATIOS.findIndex((item) => item.id === current);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % RATIOS.length;
        const nextRatioId = RATIOS[nextIndex].id;

        setSwitchTick((value) => value + 1);
        onRatioChange?.(nextRatioId);
        onShutterPulse?.();

        return nextRatioId;
      });
    }, cycleMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [cycleMs, isAutoCycling, isMobileLocked, onRatioChange, onShutterPulse]);

  const handleSwitchRatio = async (ratioId) => {
    if (isMobileLocked || ratioId === activeRatio) return;
    // TODO: Play Cinematic SFX here
    setIsAutoCycling(false);
    setActiveRatio(ratioId);
    setSwitchTick((value) => value + 1);
    onRatioChange?.(ratioId);
    onShutterPulse?.();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/45 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <motion.div
        key={switchTick}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.988, 1.01, 1] }}
        transition={{ duration: 0.62, ease: 'easeInOut' }}
        className="relative aspect-video overflow-hidden rounded-xl border border-white/15 bg-black [will-change:transform]"
      >
        <img
          src="https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1920&q=80"
          alt="Cinematic frame preview"
          draggable={false}
          className="h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(115%_95%_at_50%_48%,rgba(0,0,0,0)_56%,rgba(0,0,0,0.56)_100%)]" />

        <div
          className="pointer-events-none absolute left-0 top-0 z-30 w-full bg-black transition-all duration-700 ease-in-out [will-change:height]"
          style={{ height: `${maskSize.top}%`, backgroundColor: '#000000' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-30 w-full bg-black transition-all duration-700 ease-in-out [will-change:height]"
          style={{ height: `${maskSize.bottom}%`, backgroundColor: '#000000' }}
        />
        <div
          className="pointer-events-none absolute left-0 top-0 z-30 h-full bg-black transition-all duration-700 ease-in-out [will-change:width]"
          style={{ width: `${maskSize.left}%`, backgroundColor: '#000000' }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-30 h-full bg-black transition-all duration-700 ease-in-out [will-change:width]"
          style={{ width: `${maskSize.right}%`, backgroundColor: '#000000' }}
        />

        <div className="pointer-events-none absolute left-3 top-3 z-40 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] tracking-[0.12em] text-zinc-100">
          {isMobileLocked ? 'MOBILE LOCK · 16:9' : activeConfig.caption}
        </div>
      </motion.div>

      {showAutoControl ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <p className="text-[11px] tracking-[0.12em] text-zinc-400">AUTO CYCLE DEMO</p>
          <button
            type="button"
            onClick={() => setIsAutoCycling((prev) => !prev)}
            disabled={isMobileLocked}
            className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.12em] transition ${
              isAutoCycling
                ? 'border-cyan-300/60 bg-cyan-100/15 text-cyan-100 shadow-[inset_0_0_10px_rgba(34,211,238,0.35)]'
                : 'border-white/20 bg-zinc-900/70 text-zinc-300 hover:border-white/40 hover:text-zinc-100'
            } ${isMobileLocked ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isAutoCycling ? 'STOP' : 'START'}
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {RATIOS.map((ratio) => {
          const isActive = ratio.id === activeRatio;
          return (
            <motion.button
              key={ratio.id}
              type="button"
              onClick={() => handleSwitchRatio(ratio.id)}
              disabled={isMobileLocked}
              whileTap={isMobileLocked ? undefined : { scale: 0.97 }}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? 'border-amber-300/65 bg-amber-100/15 text-amber-100 shadow-[inset_0_0_12px_rgba(251,191,36,0.3),0_0_16px_rgba(251,191,36,0.18)]'
                  : 'border-white/15 bg-zinc-900/70 text-zinc-300 hover:border-white/35 hover:text-zinc-100'
              } ${isMobileLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <p className="text-xs tracking-[0.08em]">{ratio.label}</p>
              <p className="mt-1 text-[10px] tracking-[0.08em] text-zinc-400">{ratio.caption}</p>
              <div className="mt-2 h-6 w-full rounded-md border border-white/20 bg-black p-[2px]">
                <div
                  className="h-full bg-white/80 transition-all duration-500"
                  style={{
                    width: `${Math.min((ratio.value / 2.35) * 100, 100)}%`,
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default AspectRatioToggle;
