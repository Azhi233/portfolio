import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SpotlightBackground from '../../components/SpotlightBackground.jsx';
import ParallaxDepthEffect from '../../components/ParallaxDepthEffect.jsx';
import ColorGradeViewer from '../../components/ColorGradeViewer.jsx';
import AspectRatioToggle from '../../components/AspectRatioToggle.jsx';
import CinematicMoodBoard from '../../components/CinematicMoodBoard.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';

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

function InteractiveLab() {
  const [shutterPulseSignal, setShutterPulseSignal] = useState(0);
  const [focusTight, setFocusTight] = useState(false);
  const { config } = useConfig();
  const [hudVisible, setHudVisible] = useState(config.showHUD);
  const [hudData, setHudData] = useState({
    ratio: '4:3 古典',
    grade: 'Film Look (二级/风格化)',
    cameraMode: 'Dolly',
    pointer: { x: 0.5, y: 0.5 },
  });

  const sectionARef = useRef(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const target = sectionARef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFocusTight(entry.isIntersecting && entry.intersectionRatio > 0.35);
      },
      { threshold: [0.2, 0.35, 0.6] },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setHudVisible(config.showHUD);
  }, [config.showHUD]);

  const triggerShutterPulse = () => {
    setShutterPulseSignal((value) => value + 1);
  };

  const handleRatioChange = (ratioId) => {
    const map = {
      classic43: '4:3 古典',
      standard169: '16:9 标准',
      scope235: '2.35:1 宽银幕',
    };
    setHudData((prev) => ({ ...prev, ratio: map[ratioId] ?? ratioId }));
  };

  return (
    <div className="relative min-h-screen bg-[#040507] pt-20 text-zinc-100">
      <SpotlightBackground focusTight={focusTight} />
      <div
        className="pointer-events-none fixed inset-0 z-[2] mix-blend-soft-light [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_0.45px,transparent_0.8px)] [background-size:3px_3px]"
        style={{ opacity: config.filmGrainOpacity }}
      />

      <button
        type="button"
        onClick={() => setHudVisible((prev) => !prev)}
        className="fixed right-4 top-20 z-[80] rounded-full border border-cyan-200/35 bg-black/45 px-3 py-1.5 text-[11px] tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/60"
      >
        {hudVisible ? 'HUD OFF' : 'HUD ON'}
      </button>

      {hudVisible ? (
        <div className="pointer-events-none fixed right-4 top-32 z-[75] w-[16.5rem] rounded-2xl border border-white/15 bg-black/50 p-3 backdrop-blur-md">
          <p className="text-[10px] tracking-[0.2em] text-zinc-400">DIRECTOR MONITOR HUD</p>
          <div className="mt-2 space-y-1.5 text-xs tracking-[0.08em] text-zinc-200">
            <p>Aspect: {hudData.ratio}</p>
            <p>Grade: {hudData.grade}</p>
            <p>Camera: {hudData.cameraMode}</p>
            <p>
              Light XY: {(hudData.pointer.x * 100).toFixed(0)} / {(hudData.pointer.y * 100).toFixed(0)}
            </p>
            <p>Scroll: {(scrollYProgress.get() * 100).toFixed(0)}%</p>
          </div>
        </div>
      ) : null}

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-24 md:px-12">
        <header className="rounded-3xl border border-white/10 bg-zinc-950/45 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-md md:p-10">
          <p className="text-xs tracking-[0.26em] text-zinc-500">INTERACTIVE SHOWCASE</p>
          <h1 className="mt-4 font-serif text-3xl tracking-[0.1em] text-zinc-100 md:text-5xl">Interactive Lab</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
            一个面向电影工业感交互的实验空间。聚焦光线、景深、调色流程与画幅语言，构建“可操作的镜头感”体验。
          </p>
        </header>

        <DepthIntroText />

        <div ref={sectionARef}>
          <ParallaxDepthEffect
            className="p-6 md:p-10"
            foregroundLayer={
              <>
                <div className="absolute left-[8%] top-[14%] h-20 w-56 rounded-full bg-amber-200/20 blur-2xl" />
                <div className="absolute right-[6%] top-[22%] h-16 w-44 rounded-full bg-sky-200/20 blur-2xl" />
                <div className="absolute bottom-[10%] left-[28%] h-24 w-64 rounded-full bg-white/10 blur-3xl" />
              </>
            }
          >
            <div className="mb-6">
              <p className="text-[11px] tracking-[0.24em] text-zinc-500">SECTION A</p>
              <h2 className="mt-2 font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">
                Atmospheric Narrative (氛围叙事)
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300">
                通过多层景深与滚动错位，让镜头前后关系在滚动中“呼吸”。前景光晕模拟真实镜头眩光，强调电影化空间纵深。
              </p>
            </div>

            <CinematicMoodBoard
              onModeChange={(label) => setHudData((prev) => ({ ...prev, cameraMode: label }))}
              onPointerChange={(updater) =>
                setHudData((prev) => {
                  const nextPointer = typeof updater === 'function' ? updater(prev.pointer) : updater;
                  return { ...prev, pointer: nextPointer };
                })
              }
            />
          </ParallaxDepthEffect>
        </div>

        <ParallaxDepthEffect className="p-6 md:p-10">
          <div className="mb-6">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">SECTION B</p>
            <h2 className="mt-2 font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">
              Color Science &amp; Grading (色彩科学)
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300">
              从 Log / RAW 到风格化调色，拖拽分割线观察亮部压缩、阴影层次与色相偏移的阶段差异。
            </p>
          </div>

          <ColorGradeViewer
            shutterPulseSignal={shutterPulseSignal}
            onGradeChange={(label) => setHudData((prev) => ({ ...prev, grade: label }))}
          />
        </ParallaxDepthEffect>

        <ParallaxDepthEffect className="p-6 md:p-10">
          <div className="mb-6">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500">SECTION C</p>
            <h2 className="mt-2 font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-3xl">
              Composition &amp; Ratio (构图与画幅)
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed tracking-[0.06em] text-zinc-300">
              点击不同画幅按键，观察上下/左右黑边的实时变化，直观看到构图节奏如何随着银幕比例切换。
            </p>
          </div>

          <div className="relative">
            <AspectRatioToggle
              initialRatio="classic43"
              onShutterPulse={triggerShutterPulse}
              onRatioChange={handleRatioChange}
              lockOnMobile={false}
              autoCycle
              cycleMs={2000}
              showAutoControl
            />
          </div>
        </ParallaxDepthEffect>
      </main>
    </div>
  );
}

export default InteractiveLab;
