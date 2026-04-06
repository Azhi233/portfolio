import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'HOME', to: '/' },
  { label: 'TOYS', to: '/toys' },
  { label: 'INDUSTRIAL', to: '/industrial' },
  { label: 'MISC', to: '/misc' },
  { label: 'INTERACTIVE LAB', to: '/lab' },
];

const HEADER_BASE_CLASS = 'fixed left-0 right-0 top-0 z-[120] transition-all duration-500 ease-out';
const HEADER_SCROLLED_CLASS =
  'border-b border-white/10 bg-[#07080c]/75 shadow-[0_10px_45px_rgba(0,0,0,0.42)] backdrop-blur-md';
const HEADER_TOP_CLASS = 'border-b border-white/0 bg-[#07080c]/42 backdrop-blur-md';

const NAV_LINK_BASE_CLASS =
  'group/nav relative inline-block text-[10px] tracking-[0.2em] transition-colors duration-500 ease-out md:text-sm';
const NAV_LINK_ACTIVE_CLASS = 'text-zinc-100';
const NAV_LINK_INACTIVE_CLASS = 'text-zinc-500 hover:text-zinc-100 focus-visible:text-zinc-100';


function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();


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
    if (!mobileOpen) {
      return undefined;
    }

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
        className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-end px-3 md:h-16 md:justify-center md:px-12"
      >
        <div className="hidden md:flex">
          <ul className="flex items-center gap-4 md:gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={`${NAV_LINK_BASE_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <span
                      className={`absolute -bottom-2 left-0 h-px w-full origin-left bg-white/90 transition-transform duration-500 ease-out ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                      }`}
                    />
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="touch-manipulation inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-zinc-900/85 px-4 py-2 text-xs tracking-[0.2em] text-zinc-100 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition active:scale-[0.98]"
          >
            <span aria-hidden className="text-sm leading-none">☰</span>
            <span>MENU</span>
          </button>
        </div>

        {mobileOpen ? (
          <div className="absolute left-2 right-2 top-[calc(100%-2px)] z-[130] rounded-2xl border border-white/15 bg-[#080a10]/95 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden">
            <ul className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

                return (
                  <li key={`mobile-${item.to}`}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={`block w-full touch-manipulation rounded-lg px-3 py-2 text-left text-xs tracking-[0.16em] transition ${
                        isActive
                          ? 'bg-white/10 text-zinc-100'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-100 active:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </nav>
    </header>
  );
}

export default NavBar;
