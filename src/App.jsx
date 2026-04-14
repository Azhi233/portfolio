import { motion, useScroll, useTransform } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';

const Photography = lazy(() => import('./pages/Photography.jsx'));
const Videography = lazy(() => import('./pages/Videography.jsx'));
const AboutContact = lazy(() => import('./pages/AboutContact.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const InteractiveLab = lazy(() => import('./pages/InteractiveLab/index.jsx'));
const DirectorConsole = lazy(() => import('./pages/DirectorConsole/index.jsx'));
const ClientAccess = lazy(() => import('./pages/ClientAccess/index.jsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail/index.jsx'));
const HealthCheck = lazy(() => import('./pages/HealthCheck/index.jsx'));
const ToyProjectPage = lazy(() => import('./pages/projects/ToyProjectPage.jsx'));
const IndustryProjectPage = lazy(() => import('./pages/projects/B2BCaseStudyPage.jsx'));
const Testimonials = lazy(() => import('./pages/Testimonials.jsx'));
import { useConfig } from './context/ConfigContext.jsx';
import { trackPageView } from './utils/analytics.js';
import { logRuntimeEvent } from './utils/runtimeDiagnostics.js';

function App() {
  const { scrollY } = useScroll();
  const { config } = useConfig();
  const location = useLocation();
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'expertise';
    const stored = window.localStorage.getItem('home.viewMode');
    return stored === 'projects' ? 'projects' : 'expertise';
  });

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
  const isProjectDetail =
    location.pathname.startsWith('/project/') &&
    !location.pathname.startsWith('/project/toy') &&
    !location.pathname.startsWith('/project/industry');

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
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('home.viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const onError = (event) => {
      logRuntimeEvent('window_error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const onUnhandledRejection = (event) => {
      logRuntimeEvent('unhandled_rejection', {
        reason: String(event.reason || 'unknown'),
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const baseTitle = config.siteTitle?.trim() || 'DIRECTOR.VISION';
    const baseDescription =
      config.siteDescription?.trim() ||
      'Cinematic portfolio showcasing toys, industrial, and experimental visual storytelling.';

    const routeMetaMap = {
      '/': { title: baseTitle, description: baseDescription },
      '/photography': { title: `Photography | ${baseTitle}`, description: 'Commercial and cinematic photography portfolio.' },
      '/videography': { title: `Videography | ${baseTitle}`, description: 'Narrative and commercial video direction showcase.' },
      '/about': { title: `About & Contact | ${baseTitle}`, description: 'Background, collaborations and contact details.' },
      '/services': { title: `Services | ${baseTitle}`, description: 'Service packages, scope, timeline and deliverables.' },
      '/testimonials': { title: `Testimonials | ${baseTitle}`, description: 'Client voices and project feedback wall.' },
      '/project/toy': { title: `Toy Project | ${baseTitle}`, description: 'Case study for toy industry visual production pipeline.' },
      '/project/industry': { title: `Industry Project | ${baseTitle}`, description: 'Case study for industrial B2B visual communication.' },
    };

    const pathname = location.pathname;
    const matched = routeMetaMap[pathname] || {
      title: pathname.startsWith('/project/') ? `Project Detail | ${baseTitle}` : baseTitle,
      description: baseDescription,
    };

    document.title = matched.title;

    const ensureMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
      }
      return el;
    };

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    ensureMeta('meta[name="description"]', { name: 'description' }).setAttribute('content', matched.description);
    ensureMeta('meta[property="og:title"]', { property: 'og:title' }).setAttribute('content', matched.title);
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }).setAttribute('content', matched.description);
    ensureMeta('meta[property="og:image"]', { property: 'og:image' }).setAttribute('content', config.ogImage?.trim() || '');
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }).setAttribute('content', currentUrl);
    ensureMeta('meta[property="og:type"]', { property: 'og:type' }).setAttribute('content', 'website');
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }).setAttribute('content', 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' }).setAttribute('content', matched.title);
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' }).setAttribute('content', matched.description);
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image' }).setAttribute('content', config.ogImage?.trim() || '');
  }, [config.siteTitle, config.siteDescription, config.ogImage, location.pathname]);

  return (
    <ErrorBoundary>
      {!isLab && !isProjectDetail ? (
        <motion.div
          aria-hidden
          style={{ opacity: vignetteOpacity }}
          className="vignette-overlay pointer-events-none fixed inset-0 z-20"
        />
      ) : null}
      {!isProjectDetail ? <NavBar viewMode={viewMode} setViewMode={setViewMode} /> : null}
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#050507] text-xs tracking-[0.2em] text-zinc-500">
            LOADING...
          </div>
        }
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home viewMode={viewMode} />} />
          <Route path="/photography" element={<Photography />} />
          <Route path="/videography" element={<Videography />} />
          <Route path="/about" element={<AboutContact />} />
          <Route path="/services" element={<Services />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/lab/*" element={<InteractiveLab />} />
          <Route path="/console" element={<DirectorConsole />} />
          <Route path="/client-access" element={<ClientAccess />} />
          <Route path="/project/toy" element={<ToyProjectPage />} />
          <Route path="/project/industry" element={<IndustryProjectPage />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
