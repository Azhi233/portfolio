import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const GRADE_OPTIONS = [
  {
    id: 'rec709',
    label: 'Rec.709 (一级)',
    image:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'film-look',
    label: 'Film Look (二级/风格化)',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'teal-orange',
    label: 'Teal & Orange LUT',
    image:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1920&q=80',
  },
];

const RAW_IMAGE =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80';

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function ColorGradeViewer({ shutterPulseSignal = 0, onGradeChange }) {
  const viewerRef = useRef(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeGrade, setActiveGrade] = useState(GRADE_OPTIONS[1].id);

  const activeGradeData = useMemo(
    () => GRADE_OPTIONS.find((grade) => grade.id === activeGrade) ?? GRADE_OPTIONS[0],
    [activeGrade],
  );

  useEffect(() => {
    const viewerEl = viewerRef.current;
    if (!viewerEl) return undefined;

    let dragging = false;

    const updateSliderByPointer = (clientX) => {
      const rect = viewerEl.getBoundingClientRect();
      const nextValue = ((clientX - rect.left) / rect.width) * 100;
      setSliderPosition(clampPercent(nextValue));
    };

    const handlePointerMove = (event) => {
      if (!dragging) return;
      updateSliderByPointer(event.clientX);
    };

    const handlePointerUp = () => {
      dragging = false;
    };

    const handlePointerDown = (event) => {
      dragging = true;
      updateSliderByPointer(event.clientX);
    };

    viewerEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      viewerEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleGradeChange = async (gradeId) => {
    // TODO: Play Cinematic SFX here
    setActiveGrade(gradeId);
    const gradeLabel = GRADE_OPTIONS.find((item) => item.id === gradeId)?.label ?? gradeId;
    onGradeChange?.(gradeLabel);
  };

  return (
    <motion.div
      key={shutterPulseSignal}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 0.995, 1.003, 1] }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="rounded-2xl border border-white/10 bg-zinc-950/45 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      <div
        ref={viewerRef}
        className="group relative aspect-video cursor-ew-resize overflow-hidden rounded-xl border border-white/15 bg-zinc-950 select-none touch-none [touch-action:none] [will-change:transform]"
      >
        <img
          src={RAW_IMAGE}
          alt="Log RAW reference"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover saturate-0 brightness-75 contrast-[0.92]"
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img
            src={activeGradeData.image}
            alt={activeGradeData.label}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover contrast-[1.06] saturate-[1.08]"
          />
        </div>

        <motion.div
          key={`vignette-${shutterPulseSignal}`}
          initial={{ opacity: 0.52 }}
          animate={{ opacity: [0.52, 0.66, 0.55] }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_95%_at_50%_50%,rgba(2,6,23,0)_48%,rgba(0,0,0,0.56)_100%)]"
        />

        <div className="pointer-events-none absolute inset-0 z-[19] mix-blend-soft-light opacity-[0.05] [background-image:radial-gradient(circle,rgba(255,255,255,0.95)_0.5px,transparent_0.9px)] [background-size:3px_3px]" />
        <div className="pointer-events-none absolute inset-0 z-[19] mix-blend-screen bg-[radial-gradient(90%_60%_at_50%_12%,rgba(255,166,102,0.12)_0%,rgba(255,166,102,0.04)_38%,rgba(0,0,0,0)_72%)]" />

        <motion.div
          key={`divider-${shutterPulseSignal}`}
          initial={{ opacity: 0.9, scaleY: 1 }}
          animate={{ opacity: [0.9, 1, 0.9], scaleY: [1, 1.03, 1] }}
          transition={{ duration: 0.42, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: `calc(${sliderPosition}% - 1px)` }}
        >
          <div className="h-full w-[2px] bg-white/85 shadow-[0_0_22px_rgba(255,255,255,0.55)]" />
        </motion.div>

        <motion.button
          key={`handle-${shutterPulseSignal}`}
          type="button"
          aria-label="拖拽对比滑块"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.95, 1.04, 1] }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="pointer-events-none absolute top-1/2 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-zinc-900/85 shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <span className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-[8px] -translate-y-1/2 bg-white/90" />
          <span className="absolute left-1/2 top-1/2 h-4 w-[2px] translate-x-[6px] -translate-y-1/2 bg-white/90" />
        </motion.button>

        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] tracking-[0.12em] text-zinc-200">
          LOG / RAW
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] tracking-[0.12em] text-zinc-100">
          {activeGradeData.label}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {GRADE_OPTIONS.map((grade) => {
          const isActive = grade.id === activeGrade;
          return (
            <button
              key={grade.id}
              type="button"
              onClick={() => {
                void handleGradeChange(grade.id);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs tracking-[0.08em] transition ${
                isActive
                  ? 'border-emerald-300/60 bg-emerald-100/15 text-emerald-100 shadow-[inset_0_0_14px_rgba(16,185,129,0.32),0_0_22px_rgba(16,185,129,0.22)]'
                  : 'border-white/15 bg-zinc-900/70 text-zinc-300 hover:border-white/35 hover:text-zinc-100'
              }`}
            >
              {grade.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ColorGradeViewer;
