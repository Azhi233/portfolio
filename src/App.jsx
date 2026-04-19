import { Navigate, Route, Routes } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import { useI18n } from './context/I18nContext.jsx';
import Home from './pages/Home.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ClientAccessPage from './pages/ClientAccessPage.jsx';
import ConsoleHome from './pages/console/index.jsx';

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
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/client-access" element={<ClientAccessPage />} />
        <Route path="/console" element={<ConsoleHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
