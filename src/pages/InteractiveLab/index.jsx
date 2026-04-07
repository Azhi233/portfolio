import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll } from 'framer-motion';
import { ChevronUp, Cpu } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import SpotlightBackground from '../../components/SpotlightBackground.jsx';
import BreakdownTab from '../../components/interactive-lab/BreakdownTab.jsx';
import PreprodTab from '../../components/interactive-lab/PreprodTab.jsx';
import AnalysisTab from '../../components/interactive-lab/AnalysisTab.jsx';
import DepthIntroText from '../../components/interactive-lab/DepthIntroText.jsx';
import { MASTERCLASS_TABS } from '../../components/interactive-lab/constants.js';
import ParallaxDepthEffect from '../../components/ParallaxDepthEffect.jsx';
import ColorGradeViewer from '../../components/ColorGradeViewer.jsx';
import AspectRatioToggle from '../../components/AspectRatioToggle.jsx';
import CinematicMoodBoard from '../../components/CinematicMoodBoard.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);



function InteractiveLab() {
  const [shutterPulseSignal, setShutterPulseSignal] = useState(0);
  const [focusTight, setFocusTight] = useState(false);
  const { config } = useConfig();
  const [hudVisible, setHudVisible] = useState(config.showHUD);
  const [showConsoleFab, setShowConsoleFab] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTab, setActiveTab] = useState('breakdown');
  const [sliderPos, setSliderPos] = useState(50);
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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowConsoleFab(y > 280);
      setShowBackToTop(y > 620);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

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

  const radarData = useMemo(
    () => ({
      labels: ['机器操作/执行', '视觉审美', '后期工业化', '项目统筹', '前期策划/叙事'],
      datasets: [
        {
          label: '高阶架构 (The Director)',
          data: [90, 95, 85, 80, 90],
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 1)',
          pointBackgroundColor: 'rgba(255, 255, 255, 1)',
          borderWidth: 2,
        },
        {
          label: '传统视频展示 (The Operator)',
          data: [85, 85, 50, 40, 45],
          backgroundColor: 'rgba(100, 100, 100, 0.2)',
          borderColor: 'rgba(100, 100, 100, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5],
        },
      ],
    }),
    [],
  );

  const radarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: { size: 12, family: 'serif' },
          },
          ticks: { display: false, min: 0, max: 100 },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20,
            font: { family: 'serif' },
          },
        },
      },
    }),
    [],
  );

  const masterclassTabs = [
    { id: 'breakdown', label: '01. 交互式拉片室 (Breakdown)' },
    { id: 'preprod', label: '02. 导演前制台 (Pre-Prod)' },
    { id: 'analysis', label: '03. 核心竞争力矩阵 (Analysis)' },
  ];

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

        {/* =========================================
            新增模块：高阶能力 Tab 导航
           ========================================= */}
        <section className="mt-40 border-t border-gray-800 pt-16">
          <div className="mb-12">
            <h2 className="font-serif text-3xl text-white md:text-4xl">The Masterclass</h2>
            <p className="text-gray-400">超越单纯的视频展示。向面试官立体地展示你的底层逻辑、前制能力与工业化水准。</p>
          </div>

          {/* Tab 导航 */}
          <nav className="hide-scrollbar mb-12 flex gap-8 overflow-x-auto border-b border-gray-800 pb-px md:gap-12">
            {masterclassTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-4 font-serif text-lg transition-colors duration-300 md:text-xl ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-600 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab 内容区 */}
          <div className="min-h-[500px]">
            {/* 1. 拉片室 */}
            {activeTab === 'breakdown' && <BreakdownTab sliderPos={sliderPos} setSliderPos={setSliderPos} />}

            {/* 2. 前制台 */}
            {activeTab === 'preprod' && <PreprodTab />}

            {/* 3. 竞争力雷达图 */}
            {activeTab === 'analysis' && <AnalysisTab radarData={radarData} radarOptions={radarOptions} />}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showConsoleFab ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.94, filter: 'blur(4px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 left-5 z-[90]"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 18px rgba(34,211,238,0.22)', '0 0 0 rgba(34,211,238,0)'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full"
            >
              <button
                type="button"
                onClick={() => window.location.assign('/console')}
                aria-label="前往后端控制台"
                className="pointer-events-auto touch-manipulation inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100/25 bg-zinc-900/78 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cyan-100/45 hover:bg-zinc-800/88 hover:text-white"
              >
                <Cpu size={16} strokeWidth={2.1} />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-5 right-5 z-[90] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-zinc-200 shadow-[0_10px_26px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:scale-105 hover:border-white/35 hover:text-white"
            aria-label="返回顶部"
          >
            <ChevronUp size={16} strokeWidth={2.2} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[95] h-[2px] origin-left bg-gradient-to-r from-cyan-300/85 via-sky-300/75 to-indigo-300/80"
      />
    </div>
  );
}

export default InteractiveLab;
