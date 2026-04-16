import { motion, useScroll, useTransform } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';

const Photography = lazy(() => import('./pages/Photography.jsx'));
const Videography = lazy(() => import('./pages/Videography.jsx'));
const AboutContact = lazy(() => import('./pages/AboutContact.jsx'));
const InteractiveLab = lazy(() => import('./pages/InteractiveLab/index.jsx'));
const DirectorConsole = lazy(() => import('./pages/DirectorConsole/index.jsx'));
const ClientAccess = lazy(() => import('./pages/ClientAccess/index.jsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail/index.jsx'));
const HealthCheck = lazy(() => import('./pages/HealthCheck/index.jsx'));
const ToyProjectPage = lazy(() => import('./pages/projects/ToyProjectPage.jsx'));
const IndustryProjectPage = lazy(() => import('./pages/projects/B2BCaseStudyPage.jsx'));
import { useConfig } from './context/ConfigContext.jsx';
import { trackPageView } from './utils/analytics.js';
import { logRuntimeEvent } from './utils/runtimeDiagnostics.js';

function AdminPanel() {
  const { isEditMode, isAdmin, setIsEditMode, saveConfigToServer, logout } = useConfig();

  if (!isAdmin) return null;

  return (
    <div
      className={`fixed bottom-6 right-4 z-[140] flex items-stretch transition-all duration-300 ease-out ${
        isEditMode ? 'translate-x-0' : 'translate-x-[calc(100%-260px)]'
      }`}
      aria-label="Admin edit mode panel"
    >
      <div className="group flex min-h-[180px] w-[260px] flex-col gap-3 rounded-2xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out hover:w-[360px]">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[10px] tracking-[0.22em] ${isEditMode ? 'text-cyan-200' : 'text-zinc-400'}`}>
            {isEditMode ? 'EDIT MODE ON' : 'EDIT MODE OFF'}
          </span>
          <button
            type="button"
            aria-pressed={isEditMode}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditMode((prev) => !prev);
            }}
            className="pointer-events-auto rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
          >
            {isEditMode ? '退出编辑模式' : '切换编辑模式'}
          </button>
        </div>
        {isEditMode ? (
          <button
            type="button"
            onClick={() => saveConfigToServer().catch((error) => console.error('Failed to save config:', error))}
            className="rounded-lg bg-white px-4 py-2 text-xs tracking-[0.2em] text-black transition hover:opacity-90"
          >
            保存并发布
          </button>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs tracking-[0.2em] text-zinc-300 transition hover:border-white/30 hover:text-white"
        >
          退出登录
        </button>
        <div className="mt-auto flex items-center justify-end">
          <div className="h-10 w-1 rounded-full bg-white/20 transition group-hover:bg-white/40" />
        </div>
      </div>
    </div>
  );
}

function LoginModal({ open, onClose }) {
  const { config, isAdmin, login, register } = useConfig();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setMode('login');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [open, isAdmin]);

  if (!open) return null;

  const handleLogin = async () => {
    try {
      await login(username, password);
      onClose?.();
    } catch (e) {
      setError(e.message || '登录失败');
    }
  };

  const handleRegister = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        setError('请输入用户名和密码。');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致。');
        return;
      }
      await register(username, password);
      setMode('login');
      await login(username, password);
      onClose?.();
    } catch (e) {
      setError(e.message || '注册失败');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.28em] text-zinc-500">ADMIN ACCESS</p>
            <h2 className="mt-3 font-serif text-3xl text-white">{config.loginModalTitle || '进入编辑后台'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{config.loginCloseLabel || '关闭'}</button>
        </div>
        <form className="mt-6 space-y-4" autoComplete="off" onSubmit={(event) => { event.preventDefault(); mode === 'login' ? handleLogin() : handleRegister(); }}>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={config.loginUsernamePlaceholder || '用户名'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            name="admin-username"
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={config.loginPasswordPlaceholder || '密码'}
            type="password"
            autoComplete="off"
            name="admin-password"
          />
          {mode === 'register' ? (
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={config.loginConfirmPasswordPlaceholder || '确认密码'}
              type="password"
              autoComplete="off"
              name="admin-password-confirm"
            />
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm tracking-[0.2em] text-black"
          >
            {mode === 'login' ? (config.loginButtonText || '登录') : (config.registerButtonText || '注册并登录')}
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm tracking-[0.2em] text-zinc-200"
            onClick={() => {
              setError('');
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
            }}
          >
            {mode === 'login' ? (config.loginRegisterLabel || '没有账号？去注册') : (config.loginBackLabel || '返回登录')}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const { scrollY } = useScroll();
  const { config, isAdmin, isEditMode, setIsEditMode } = useConfig();
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
  const isConsoleRoute = location.pathname.startsWith('/console');
  const [loginOpen, setLoginOpen] = useState(false);

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
    if (isAdmin || isConsoleRoute) {
      setLoginOpen(false);
    }
  }, [isAdmin, isConsoleRoute]);

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
      '/about': { title: `About & Contact | ${baseTitle}`, description: 'Business manifesto and direct engagement page.' },
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
      {isAdmin && isEditMode ? (
        <div className="pointer-events-none fixed inset-0 z-[45]">
          <div className="absolute inset-0 border border-cyan-300/15 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15),inset_0_0_50px_rgba(34,211,238,0.08)] admin-breathing-ring" />
          <div className="absolute inset-x-6 top-4 rounded-full border border-cyan-300/25 bg-black/65 px-4 py-2 text-[10px] tracking-[0.22em] text-cyan-100 backdrop-blur-md md:inset-x-auto md:left-1/2 md:top-5 md:-translate-x-1/2">
            EDIT MODE ACTIVE
          </div>
        </div>
      ) : null}
      {!isProjectDetail ? (
        <NavBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          logoUrl={config.logoImageUrl || ''}
          logoAlt={config.logoAltText || config.siteTitle || 'DIRECTOR.VISION'}
          onLogoDoubleClick={() => {
            if (isAdmin) return;
            setLoginOpen(true);
          }}
        />
      ) : null}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <AdminPanel />
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
