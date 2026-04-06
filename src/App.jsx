import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Toys from './pages/Toys.jsx';
import Industrial from './pages/Industrial.jsx';
import Misc from './pages/Misc.jsx';
import InteractiveLab from './pages/InteractiveLab/index.jsx';
import DirectorConsole from './pages/DirectorConsole/index.jsx';
import ProjectDetail from './pages/ProjectDetail/index.jsx';
import { useConfig } from './context/ConfigContext.jsx';

function App() {
  const { scrollY } = useScroll();
  const { config } = useConfig();
  const location = useLocation();

  // 只做非常轻微的滚动呼吸变化，避免喧宾夺主
  const vignetteOpacity = useTransform(
    scrollY,
    [0, 280, 980, 1800],
    [
      config.vignetteIntensity * 0.9,
      config.vignetteIntensity * 0.98,
      config.vignetteIntensity * 0.93,
      config.vignetteIntensity,
    ],
  );

  const isLab = location.pathname.startsWith('/lab');
  const isProjectDetail = location.pathname.startsWith('/project/');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { hash } = window.location;
    if (hash.startsWith('#/')) {
      const normalizedPath = hash.slice(1);
      window.history.replaceState(null, '', normalizedPath);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <>
      {!isLab && !isProjectDetail ? (
        <motion.div
          aria-hidden
          style={{ opacity: vignetteOpacity }}
          className="pointer-events-none fixed inset-0 z-20 bg-[radial-gradient(120%_85%_at_50%_40%,rgba(0,0,0,0)_56%,rgba(0,0,0,0.22)_88%,rgba(0,0,0,0.36)_100%)] md:[background:radial-gradient(130%_92%_at_50%_42%,rgba(0,0,0,0)_54%,rgba(0,0,0,0.24)_86%,rgba(0,0,0,0.4)_100%)]"
        />
      ) : null}
      {!isProjectDetail ? <NavBar /> : null}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/toys" element={<Toys />} />
        <Route path="/industrial" element={<Industrial />} />
        <Route path="/misc" element={<Misc />} />
        <Route path="/lab/*" element={<InteractiveLab />} />
        <Route path="/console" element={<DirectorConsole />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
