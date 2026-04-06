import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'HOME', to: '/' },
  { label: 'TOYS', to: '/toys' },
  { label: 'INDUSTRIAL', to: '/industrial' },
  { label: 'MISC', to: '/misc' },
];

const HEADER_BASE_CLASS = 'fixed left-0 right-0 top-0 z-[120] transition-all duration-500 ease-out';
const HEADER_SCROLLED_CLASS =
  'border-b border-white/10 bg-[#07080c]/75 shadow-[0_10px_45px_rgba(0,0,0,0.42)] backdrop-blur-md';
const HEADER_TOP_CLASS = 'border-b border-white/0 bg-[#07080c]/42 backdrop-blur-md';

const NAV_LINK_BASE_CLASS =
  'group/nav relative inline-block text-[10px] tracking-[0.2em] transition-colors duration-500 ease-out md:text-sm';
const NAV_LINK_ACTIVE_CLASS = 'text-zinc-100';
const NAV_LINK_INACTIVE_CLASS = 'text-zinc-500 hover:text-zinc-100 focus-visible:text-zinc-100';

const LAB_BUTTON_BASE_CLASS =
  'group/lab relative overflow-hidden rounded-full border px-3 py-1.5 text-[10px] tracking-[0.14em] transition-all duration-500 ease-out md:px-4 md:py-2 md:text-xs';
const LAB_BUTTON_ACTIVE_CLASS =
  'border-cyan-300/70 bg-cyan-100/20 text-cyan-100 shadow-[0_0_0_1px_rgba(186,230,253,0.35),inset_0_0_18px_rgba(56,189,248,0.25),0_0_26px_rgba(14,116,144,0.35)]';
const LAB_BUTTON_INACTIVE_CLASS =
  'border-cyan-200/35 bg-cyan-500/10 text-cyan-100/90 hover:border-cyan-200/60 hover:bg-cyan-300/15 hover:text-cyan-50 hover:shadow-[inset_0_0_12px_rgba(34,211,238,0.18),0_0_24px_rgba(6,182,212,0.22)]';

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isLabActive = location.pathname.startsWith('/lab');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${HEADER_BASE_CLASS} ${scrolled ? HEADER_SCROLLED_CLASS : HEADER_TOP_CLASS}`}>
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-12">
        <p className="font-serif text-sm tracking-[0.22em] text-zinc-100 md:text-base">DIRECTOR.VISION</p>

        <div className="flex items-center gap-3 md:gap-5">
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

          <NavLink
            to="/lab"
            className={`${LAB_BUTTON_BASE_CLASS} ${isLabActive ? LAB_BUTTON_ACTIVE_CLASS : LAB_BUTTON_INACTIVE_CLASS}`}
          >
            <span
              className={`pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(90%_140%_at_50%_50%,rgba(103,232,249,0.28)_0%,rgba(6,182,212,0.05)_56%,rgba(0,0,0,0)_100%)] transition-opacity duration-500 ${
                isLabActive ? 'opacity-100' : 'opacity-70 group-hover/lab:opacity-100'
              }`}
            />
            <span className="relative z-10 flex items-center gap-2">
              <span>📽️ Interactive Lab</span>
              <span className="relative inline-flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-cyan-300/70 ${
                    isLabActive ? 'animate-ping' : 'animate-pulse'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isLabActive ? 'bg-cyan-100' : 'bg-cyan-300/80'
                  }`}
                />
              </span>
            </span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
