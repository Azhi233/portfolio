import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import AboutOverview from './about/AboutOverview.jsx';
import AboutProfilesGrid from './about/AboutProfilesGrid.jsx';
import { fetchJson } from '../utils/api.js';
import { getAboutProfilesLocalFallback, hasAboutProfilesServerSeed, markAboutProfilesServerSeeded, persistAboutProfilesLocalFallback, subscribeAboutProfilesUpdates } from '../utils/aboutProfiles.js';

function AboutPage() {
  const [profiles, setProfiles] = useState(getAboutProfilesLocalFallback());

  useEffect(() => {
    let mounted = true;

    const loadProfiles = async () => {
      try {
        const data = await fetchJson('/about-profiles');
        if (!mounted) return;
        const next = Array.isArray(data) ? data : [];
        if (next.length) {
          setProfiles(persistAboutProfilesLocalFallback(next));
          markAboutProfilesServerSeeded();
        } else {
          setProfiles(getAboutProfilesLocalFallback());
        }
      } catch {
        if (!mounted) return;
        setProfiles(getAboutProfilesLocalFallback());
      }
    };

    if (!hasAboutProfilesServerSeed()) {
      setProfiles(getAboutProfilesLocalFallback());
    }

    loadProfiles();
    const unsubscribe = subscribeAboutProfilesUpdates(loadProfiles);

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const visibleProfiles = profiles.filter((profile) => profile?.enabled !== false);

  return (
    <PageShell className="bg-[#faf8f4] text-[#141414]">
      <MinimalTopNav />
      <AboutOverview />
      <AboutProfilesGrid profiles={visibleProfiles} />
    </PageShell>
  );
}

export default AboutPage;
