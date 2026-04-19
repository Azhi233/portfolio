import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import { useI18n } from './context/I18nContext.jsx';
import { fetchJson } from './utils/api.js';
import Home from './pages/Home.jsx';
import VideosPage from './pages/ProjectsPage.jsx';
import ImagesPage from './pages/ImagesPage.jsx';
import ImageDetailPage from './pages/ImageDetailPage.jsx';
import VideoDetailPage from './pages/VideoDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ClientAccessPage from './pages/ClientAccessPage.jsx';
import ConsoleHome from './pages/console/index.jsx';

function ProjectRedirect() {
  const { id } = useParams();
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const project = await fetchJson(`/projects/${id}`);
        if (!mounted) return;
        const hasVideo = Boolean(project?.mainVideoUrl || project?.videoUrl);
        setTarget(hasVideo ? `/videos/${id}` : `/images/${id}`);
      } catch {
        if (mounted) setTarget(`/videos/${id}`);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!target) return null;
  return <Navigate to={target} replace />;
}

function App() {
  const { locale, switchLocale } = useI18n();

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[220] flex justify-end px-3 pt-3 md:px-6">
        <LanguageSwitcher
          locale={locale}
          onChange={switchLocale}
          className="rounded-full border border-white/25 bg-black/55 px-1 text-xs tracking-[0.14em] text-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md"
        />
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/projects" element={<Navigate to="/videos" replace />} />
        <Route path="/images" element={<ImagesPage />} />
        <Route path="/images/:id" element={<ImageDetailPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
        <Route path="/project/:id" element={<ProjectRedirect />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/client-access" element={<ClientAccessPage />} />
        <Route path="/console" element={<ConsoleHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
