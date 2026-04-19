import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import EditableMedia from './EditableMedia.jsx';
import EditableText from './EditableText.jsx';

const NAV_ITEMS = [
  { key: 'home', to: '/' },
  { key: 'photography', to: '/photography' },
  { key: 'videography', to: '/videography' },
  { key: 'about', to: '/about' },
  { key: 'clientAccess', to: '/client-access' },
];

const HEADER_BASE_CLASS = 'fixed left-0 right-0 top-0 z-[120] transition-all duration-500 ease-out';
const HEADER_SCROLLED_CLASS =
  'border-b border-white/10 bg-[#07080c]/75 shadow-[0_10px_45px_rgba(0,0,0,0.42)] backdrop-blur-md';
const HEADER_TOP_CLASS = 'border-b border-white/0 bg-[#07080c]/42 backdrop-blur-md';

const NAV_LINK_BASE_CLASS =
  'group/nav relative inline-block text-[10px] tracking-[0.2em] transition-colors duration-500 ease-out md:text-sm';
const NAV_LINK_ACTIVE_CLASS = 'text-zinc-100';
const NAV_LINK_INACTIVE_CLASS = 'text-zinc-500 hover:text-zinc-100 focus-visible:text-zinc-100';

function ModeToggle({ viewMode, setViewMode, t }) {
  const isProjects = viewMode === 'projects';

  return (
    <button
      type="button"
      onClick={() => setViewMode(isProjects ? 'expertise' : 'projects')}
      className="group relative inline-flex h-9 w-[168px] items-center rounded-full border border-white/15 bg-zinc-900/70 p-1 text-[10px] tracking-[0.16em] text-zinc-300"
      aria-label="Switch home view mode"
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
        className={`absolute top-1 h-7 w-[78px] rounded-full border ${
          isProjects
            ? 'left-[84px] border-white/20 bg-white/14'
            : 'left-1 border-white/20 bg-white/14'
        }`}
      />
      <span className={`relative z-10 w-[78px] text-center ${isProjects ? 'text-zinc-400' : 'text-zinc-100'}`}>
        {t('nav.expertise', 'EXPERTISE')}
      </span>
      <span className={`relative z-10 w-[78px] text-center ${isProjects ? 'text-zinc-100' : 'text-zinc-400'}`}>
        {t('nav.projects', 'PROJECTS')}
      </span>
    </button>
  );
}

function NavBar({ viewMode = 'expertise', setViewMode = () => {}, logoUrl = '', logoAlt = 'DIRECTOR.VISION', onLogoDoubleClick = () => {} }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suppressLogoClick, setSuppressLogoClick] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();
  const { locale, switchLocale, t } = useI18n();
  const { isAdmin, isEditMode, config, updateConfig } = useConfig();

  const isHome = location.pathname === '/';

  const handleNav = (to) => {
    if (window.location.pathname !== to) {
      window.location.href = to;
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (navRef.current && !navRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header className={`${HEADER_BASE_CLASS} ${scrolled ? HEADER_SCROLLED_CLASS : HEADER_TOP_CLASS}`}>
      <nav
        ref={navRef}
        className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-3 md:h-16 md:px-12"
      >
        <div className="hidden min-w-[180px] md:flex">
          {isHome ? <ModeToggle viewMode={viewMode} setViewMode={setViewMode} t={t} /> : null}
        </div>

        <div className="absolute left-1/2 top-1/2 z-[125] -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onDoubleClick={() => {
              setSuppressLogoClick(true);
              window.setTimeout(() => setSuppressLogoClick(false), 250);
              onLogoDoubleClick?.();
            }}
            onClick={() => {
              if (suppressLogoClick) return;
              if (isEditMode && isAdmin) return;
              handleNav('/');
            }}
            className="group inline-flex min-h-10 min-w-[120px] items-center justify-center rounded-xl px-2 py-1"
            aria-label="Home"
          >
            {String(logoUrl || '').trim() ? (
              <span className="inline-flex items-center overflow-hidden">
                <EditableMedia
                  type="image"
                  src={logoUrl}
                  className="block h-7 w-auto max-w-[150px] object-contain md:h-8 md:max-w-[180px]"
                  onChange={(next) => updateConfig('logoImageUrl', next)}
                />
              </span>
            ) : (
              <EditableText
                as="span"
                className="select-none whitespace-nowrap text-[11px] tracking-[0.28em] text-zinc-100 md:text-xs"
                value={logoAlt || config.siteTitle || 'DIRECTOR.VISION'}
                label="NAV · LOGO TEXT"
                maxLength={40}
                onChange={(next) => updateConfig('logoAltText', next)}
              />
            )}
          </button>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ul className="flex items-center gap-4 md:gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => handleNav(item.to)}
                    className={`${NAV_LINK_BASE_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`}
                  >
                    <span className="relative z-10">{t(`nav.${item.key}`, item.key)}</span>
                    <span
                      className={`absolute -bottom-2 left-0 h-px w-full origin-left bg-white/90 transition-transform duration-500 ease-out ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isHome ? <ModeToggle viewMode={viewMode} setViewMode={setViewMode} t={t} /> : null}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="touch-manipulation inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-zinc-900/85 px-4 py-2 text-xs tracking-[0.2em] text-zinc-100 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition active:scale-[0.98]"
          >
            <span aria-hidden className="text-sm leading-none">☰</span>
            <span>{t('nav.menu', 'MENU')}</span>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-2 right-2 top-[calc(100%-2px)] z-[130] rounded-2xl border border-white/15 bg-[#080a10]/95 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
            >
              <ul className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

                  return (
                    <li key={`mobile-${item.to}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          handleNav(item.to);
                        }}
                        className={`block w-full touch-manipulation rounded-lg px-3 py-2 text-left text-xs tracking-[0.16em] transition ${
                          isActive
                            ? 'bg-white/10 text-zinc-100'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-100 active:bg-white/10'
                        }`}
                      >
                        {t(`nav.${item.key}`, item.key)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}

export default NavBar;
