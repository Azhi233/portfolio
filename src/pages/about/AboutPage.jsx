import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import AboutProfilesCarousel from './about/AboutProfilesCarousel.jsx';
import { fetchJson } from '../utils/api.js';
import { getAboutProfilesLocalFallback, persistAboutProfilesLocalFallback, subscribeAboutProfilesServerUpdates } from '../utils/aboutProfiles.js';

function AboutPage() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadProfiles = async () => {
      try {
        const data = await fetchJson('/about-profiles');
        if (!mounted) return;
        const serverProfiles = Array.isArray(data) ? data : [];
        if (serverProfiles.length) {
          setProfiles(persistAboutProfilesLocalFallback(serverProfiles));
          return;
        }
        setProfiles(getAboutProfilesLocalFallback());
      } catch {
        if (mounted) setProfiles(getAboutProfilesLocalFallback());
      }
    };

    loadProfiles();
    const unsubscribe = subscribeAboutProfilesServerUpdates(loadProfiles);

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <PageShell className="bg-[#faf8f4] text-[#141414]">
      <MinimalTopNav />
      <section className="mx-auto w-full max-w-7xl px-6 pt-28 md:px-12 md:pt-32">
        <div className="grid gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="max-w-4xl">
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#8f6f52]">About</p>
            <h1 className="mt-5 text-[3.1rem] font-light tracking-[0.03em] text-[#141414] md:text-[5.1rem] lg:text-[6.6rem]">
              人员资料
            </h1>
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[#141414]/40">
              Multi Profile / Console Managed
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#141414]/60 md:text-[17px] md:leading-9">
              该页面展示后台维护的个人资料卡片，支持多人切换浏览，内容会随着后台保存自动同步更新。
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-[#f4f0ea]">
            <div className="aspect-[4/5] w-full bg-[radial-gradient(circle_at_top,_rgba(141,111,82,0.25),_transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(244,240,234,0.95))]" />
          </div>
        </div>
      </section>
      <AboutProfilesCarousel profiles={profiles} />
    </PageShell>
  );
}

export default AboutPage;
