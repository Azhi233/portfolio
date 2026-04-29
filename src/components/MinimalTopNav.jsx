import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Images', to: '/images' },
  { label: 'Videos', to: '/videos' },
  { label: 'Studio Notes', to: '/studio-notes' },
  { label: 'About', to: '/about' },
  { label: 'Client Deliverables', to: '/client-access' },
];

function MinimalTopNav({ items = NAV_ITEMS }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item) => {
    if (item.hash) {
      document.querySelector(item.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(item.to || '/');
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[80] bg-[#FAF9F6]/90 px-6 py-4 backdrop-blur-[1px] md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[10px] uppercase tracking-[0.34em] text-[#B28F6B] transition-opacity hover:opacity-75 md:text-[11px]"
        >
          MDWANG
        </button>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-[#151515]/40 md:gap-x-6 md:text-[11px]">
          {items.map((item) => {
            const key = item.to || item.hash || item.label;
            const isActive = item.to ? (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)) : false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleNav(item)}
                className={`transition-opacity hover:opacity-70 ${isActive ? 'text-[#151515]/90' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="w-[72px]" />
      </div>
    </header>
  );
}

export default MinimalTopNav;
